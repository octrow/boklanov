/**
 * backup-r2-to-git.ts
 *
 * Mirrors the R2 bucket → `public/` for the allowlisted editor-managed
 * prefixes (productions/, about/, uploads/). Two-way:
 *   1. Downloads R2-only objects so additions land in git.
 *   2. Removes public/ files no longer in R2 so editor "Remove" clicks
 *      propagate into git as the next backup commit.
 *
 * Used by `.github/workflows/backup-r2-to-git.yml`. Rationale:
 * `.design/boklanov-rewrite/KEYSTATIC_R2_ONLY_PLAN.md`.
 *
 * Required env vars (Vercel / GitHub Actions secrets):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET (optional, default 'boklanov-content')
 *
 * Usage:
 *   npm run backup-r2-to-git              # apply adds + deletes
 *   npm run backup-r2-to-git -- --dry-run # list what would change
 *
 * Exit codes:
 *   0  normal — workflow inspects working tree afterwards to decide whether
 *      to commit
 *   1  missing env vars, R2 / disk error, or safety threshold tripped
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'fs'
import { dirname, extname, join, relative } from 'path'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const BUCKET = process.env.R2_BUCKET ?? 'boklanov-content'
const KEY_ID = process.env.R2_ACCESS_KEY_ID
const KEY_SECRET = process.env.R2_SECRET_ACCESS_KEY

if (!ACCOUNT_ID || !KEY_ID || !KEY_SECRET) {
  console.error(
    '[backup-r2-to-git] missing env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
  )
  process.exit(1)
}

const PUBLIC_ROOT = join(process.cwd(), 'public')
const dryRun = process.argv.includes('--dry-run')

// Only mirror these prefixes back into git. R2 also holds runtime caches
// (`cache/preview/`, `cache/recordmap/`) and any future ephemeral data
// that we explicitly do NOT want in `public/`. New editor-upload prefixes
// must be added here when they appear in keystatic.config.ts.
const ALLOWED_PREFIXES = ['productions/', 'about/', 'uploads/']

// Defensive second filter — the keystatic-asset route only accepts these
// extensions, so anything else in R2 under an allowed prefix is suspicious
// and we skip it rather than commit it.
const ALLOWED_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif'
])

function isBackupCandidate(key: string): boolean {
  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) return false
  const dot = key.lastIndexOf('.')
  if (dot === -1) return false
  return ALLOWED_EXT.has(key.slice(dot).toLowerCase())
}

// Cap on how many files a single run is allowed to delete from public/.
// Real editor flows produce 1–3 deletions per backup-triggering save;
// anything wildly past that is more likely an R2 outage / mis-config than
// genuine editor activity, and we'd rather fail loud than silently wipe
// `public/`. Override with BACKUP_DELETE_LIMIT for one-off catch-up runs.
const DELETE_LIMIT = Number(process.env.BACKUP_DELETE_LIMIT ?? 50)

function walkImageFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkImageFiles(full))
    else if (ALLOWED_EXT.has(extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: KEY_ID, secretAccessKey: KEY_SECRET },
  forcePathStyle: true
})

type RemoteObject = { Key: string; Size: number }

async function listAll(): Promise<RemoteObject[]> {
  const out: RemoteObject[] = []
  let token: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken: token
      })
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Size != null)
        out.push({ Key: obj.Key, Size: obj.Size })
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return out
}

async function download(key: string, target: string): Promise<void> {
  const res = await client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  )
  const body = res.Body
  if (!body) throw new Error(`empty body for ${key}`)
  const chunks: Buffer[] = []
  for await (const chunk of body as AsyncIterable<Buffer | Uint8Array>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, Buffer.concat(chunks))
}

async function main() {
  console.log(
    `[backup-r2-to-git] listing s3://${BUCKET}/${dryRun ? ' (dry-run)' : ''}`
  )
  const remote = await listAll()
  console.log(`[backup-r2-to-git] ${remote.length} object(s) in R2`)

  let added = 0
  let mismatched = 0
  let skipped = 0
  let filtered = 0

  for (const { Key, Size } of remote) {
    if (!isBackupCandidate(Key)) {
      filtered++
      continue
    }
    const target = join(PUBLIC_ROOT, Key)
    if (existsSync(target)) {
      const localSize = statSync(target).size
      if (localSize === Size) {
        skipped++
        continue
      }
      console.log(
        `[backup-r2-to-git] size mismatch ${Key} (local ${localSize}B, remote ${Size}B)`
      )
      mismatched++
    } else {
      console.log(`[backup-r2-to-git] new   ${Key} (${Size}B)`)
      added++
    }

    if (!dryRun) await download(Key, target)
  }

  // ── Orphan deletion ──────────────────────────────────────────────────────
  // Walk public/ under each allowed prefix. Any image file there that is
  // NOT present in R2 was either (a) edited out via the Keystatic Remove
  // button [DELETE /api/keystatic-asset], or (b) a stale upload from before
  // an out-of-band R2 cleanup. Either way, we mirror R2 by removing it.
  const remoteKeys = new Set(remote.map((o) => o.Key))
  const orphans: string[] = []

  for (const prefix of ALLOWED_PREFIXES) {
    const prefixRoot = join(PUBLIC_ROOT, prefix.replace(/\/$/, ''))
    for (const localPath of walkImageFiles(prefixRoot)) {
      const key = relative(PUBLIC_ROOT, localPath).replace(/\\/g, '/')
      if (!remoteKeys.has(key)) orphans.push(localPath)
    }
  }

  if (orphans.length > DELETE_LIMIT) {
    console.error(
      `[backup-r2-to-git] safety abort: ${orphans.length} proposed deletion(s) exceeds limit ${DELETE_LIMIT}.`
    )
    console.error(
      '[backup-r2-to-git] this usually means R2 is unexpectedly empty / mis-listed, NOT genuine editor activity.'
    )
    console.error(
      '[backup-r2-to-git] override with BACKUP_DELETE_LIMIT=<n> if this is intentional.'
    )
    process.exit(1)
  }

  let removed = 0
  for (const localPath of orphans) {
    const rel = relative(PUBLIC_ROOT, localPath)
    console.log(`[backup-r2-to-git] orphan ${rel}`)
    if (!dryRun) unlinkSync(localPath)
    removed++
  }

  console.log(
    `[backup-r2-to-git] summary: added ${added}, overwritten ${mismatched}, skipped ${skipped}, filtered ${filtered}, removed ${removed}`
  )
}

main().catch((err) => {
  console.error('[backup-r2-to-git] failed:', err)
  process.exit(1)
})
