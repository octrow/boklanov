/**
 * upload-images.ts
 *
 * Syncs public/productions/ and public/about/ to Cloudflare R2.
 * Uses the S3-compatible API.
 *
 * Required env vars (set in .env.local or GitHub Actions secrets):
 *   R2_ACCESS_KEY_ID     - from Cloudflare R2 API token
 *   R2_SECRET_ACCESS_KEY - from Cloudflare R2 API token
 *   R2_ACCOUNT_ID        - Cloudflare account ID
 *   R2_BUCKET            - bucket name (default: boklanov-content)
 *
 * Usage:
 *   npm run upload-images              # sync all changed files
 *   npm run upload-images -- --slug lina-marlina   # one production only
 *   npm run upload-images -- --dry-run  # list files without uploading
 */

import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { createReadStream, statSync, readdirSync } from 'fs'
import { join, extname, relative } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const BUCKET = process.env.R2_BUCKET ?? 'boklanov-content'
const KEY_ID = process.env.R2_ACCESS_KEY_ID
const KEY_SECRET = process.env.R2_SECRET_ACCESS_KEY

if (!ACCOUNT_ID || !KEY_ID || !KEY_SECRET) {
  console.error(
    'Missing env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
  )
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: KEY_ID, secretAccessKey: KEY_SECRET }
})

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif'
}

const PUBLIC_DIR = join(process.cwd(), 'public')

type SyncDir = { localDir: string; prefix: string }

const SYNC_DIRS: SyncDir[] = [
  { localDir: join(PUBLIC_DIR, 'productions'), prefix: 'productions/' },
  { localDir: join(PUBLIC_DIR, 'about'),       prefix: 'about/' },
]

import { existsSync } from 'fs'

function allFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...allFiles(full))
    } else if (MIME[extname(entry.name).toLowerCase()]) {
      results.push(full)
    }
  }
  return results
}

/** One ListObjectsV2 scan → map of key → size (replaces per-file HeadObject). */
async function fetchRemoteSizes(prefix: string): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  let token: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token })
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key != null && obj.Size != null) map.set(obj.Key, obj.Size)
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return map
}

async function syncDir(
  { localDir, prefix }: SyncDir,
  dryRun: boolean,
  onlySlug: string | null
) {
  if (!existsSync(localDir)) return

  const files = allFiles(localDir).filter((f) =>
    onlySlug && prefix === 'productions/' ? f.includes(`/productions/${onlySlug}/`) : true
  )

  if (files.length === 0) return

  const remote = dryRun ? new Map<string, number>() : await fetchRemoteSizes(prefix)

  let uploaded = 0
  let skipped = 0

  for (const localPath of files) {
    const key = prefix + relative(localDir, localPath).replace(/\\/g, '/')
    const size = statSync(localPath).size
    const mime = MIME[extname(localPath).toLowerCase()] ?? 'application/octet-stream'

    if (dryRun) {
      console.log(`[dry] ${key}  (${(size / 1024).toFixed(0)} KB)`)
      continue
    }

    if (remote.get(key) === size) {
      console.log(`skip  ${key}`)
      skipped++
      continue
    }

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: createReadStream(localPath),
        ContentType: mime,
        ContentLength: size,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    )
    console.log(`✓     ${key}`)
    uploaded++
  }

  console.log(`${prefix}  ${uploaded} uploaded, ${skipped} skipped`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const slugIdx = args.indexOf('--slug')
  const onlySlug = slugIdx !== -1 ? args[slugIdx + 1] : null

  console.log(`R2 bucket: "${BUCKET}"${dryRun ? '  [DRY RUN]' : ''}`)

  for (const dir of SYNC_DIRS) {
    await syncDir(dir, dryRun, onlySlug)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
