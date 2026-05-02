/**
 * upload-images.ts
 *
 * Uploads production images from public/productions/ to Cloudflare R2.
 * Uses the S3-compatible API.
 *
 * Required env vars (set in .env.local):
 *   R2_ACCESS_KEY_ID     — from Cloudflare R2 API token
 *   R2_SECRET_ACCESS_KEY — from Cloudflare R2 API token
 *   R2_ACCOUNT_ID        — Cloudflare account ID
 *   R2_BUCKET            — bucket name (default: boklanov-content)
 *
 * Usage:
 *   npm run upload-images              # upload all changed files
 *   npm run upload-images -- --slug lina-marlina   # one production only
 *   npm run upload-images -- --dry-run  # list files without uploading
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { createReadStream, statSync, readdirSync } from 'fs'
import { join, extname, relative } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const BUCKET     = process.env.R2_BUCKET ?? 'boklanov-content'
const KEY_ID     = process.env.R2_ACCESS_KEY_ID
const KEY_SECRET = process.env.R2_SECRET_ACCESS_KEY

if (!ACCOUNT_ID || !KEY_ID || !KEY_SECRET) {
  console.error('Missing env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: KEY_ID, secretAccessKey: KEY_SECRET },
})

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

const SOURCE_DIR = join(process.cwd(), 'public', 'productions')

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

async function exists(key: string, size: number): Promise<boolean> {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return head.ContentLength === size
  } catch {
    return false
  }
}

async function upload(localPath: string, dryRun: boolean) {
  const key = 'productions/' + relative(SOURCE_DIR, localPath).replace(/\\/g, '/')
  const size = statSync(localPath).size
  const mime = MIME[extname(localPath).toLowerCase()] ?? 'application/octet-stream'

  if (dryRun) {
    console.log(`[dry] ${key}  (${(size / 1024).toFixed(0)} KB)`)
    return
  }

  if (await exists(key, size)) {
    console.log(`skip  ${key}`)
    return
  }

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: createReadStream(localPath),
    ContentType: mime,
    ContentLength: size,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
  console.log(`✓     ${key}`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const slugIdx = args.indexOf('--slug')
  const onlySlug = slugIdx !== -1 ? args[slugIdx + 1] : null

  const files = allFiles(SOURCE_DIR).filter(f =>
    onlySlug ? f.includes(`/productions/${onlySlug}/`) : true
  )

  console.log(`Uploading ${files.length} files to R2 bucket "${BUCKET}"${dryRun ? ' [DRY RUN]' : ''}`)

  for (const f of files) {
    await upload(f, dryRun)
  }

  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
