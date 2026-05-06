/**
 * Asset uploader for the Keystatic admin UI.
 *
 * Goal (both dev and prod):
 *   1. Upload the file to Cloudflare R2 at <directory>/<filename> so the
 *      Keystatic preview thumbnail and the live page can render it via
 *      cdnUrl() immediately.
 *   2. (YAML linking is done by the editor saving in Keystatic — separate
 *      bot commit, single commit per save.)
 *
 * Dev (localhost): writes to public/ on disk AND uploads to R2.
 *   - Disk write makes the file available on the dev server even if R2
 *     credentials aren't configured locally.
 *   - R2 upload is best-effort: if creds are absent it's silently skipped
 *     and the response includes an `r2Warning`.
 *   - Overwrites are allowed (dev experiments are ephemeral).
 *
 * Prod (Vercel): R2 upload only.
 *   - Binaries no longer land in the GitHub repo synchronously. The
 *     .github/workflows/backup-r2-to-git.yml workflow mirrors R2 -> public/
 *     on a schedule + content-push so git stays the eventual source of
 *     truth (see .design/boklanov-rewrite/KEYSTATIC_R2_ONLY_PLAN.md).
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET (optional, default: boklanov-content)
 */

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const ALLOWED_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif'
])
const PUBLIC_ROOT = path.resolve(process.cwd(), 'public')
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeSegment(s: string): string {
  return s.replace(/[^a-z0-9._-]/gi, '-')
}

function sanitizeDirectory(dir: string): string | null {
  const trimmed = dir.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return null
  const parts = trimmed.split('/')
  if (parts.some((p) => p === '' || p === '..' || p === '.')) return null
  return parts.map(sanitizeSegment).join('/')
}

// ---------------------------------------------------------------------------
// R2
// ---------------------------------------------------------------------------

async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<void> {
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET ?? 'boklanov-content'
  const keyId = process.env.R2_ACCESS_KEY_ID
  const keySecret = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !keyId || !keySecret) {
    throw new Error(
      'R2 credentials not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)'
    )
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: keySecret },
    // Account-level endpoint requires path-style; virtual-hosted style causes
    // a signature mismatch because the bucket is prepended to the hostname.
    forcePathStyle: true
  })

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.byteLength,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  )
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'expected multipart/form-data' },
      { status: 400 }
    )
  }

  const file = form.get('file')
  const directoryRaw = form.get('directory')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing file' }, { status: 400 })
  }
  if (typeof directoryRaw !== 'string') {
    return NextResponse.json({ error: 'missing directory' }, { status: 400 })
  }

  const directory = sanitizeDirectory(directoryRaw)
  if (!directory) {
    return NextResponse.json({ error: 'invalid directory' }, { status: 400 })
  }

  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: `extension ${ext} not allowed` },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file too large' }, { status: 413 })
  }

  const filename = sanitizeSegment(file.name) || `upload${ext}`
  const src = `/${directory}/${filename}`
  const r2Key = `${directory}/${filename}`
  const contentType = MIME[ext] ?? 'application/octet-stream'
  const buffer = Buffer.from(await file.arrayBuffer())

  // ── Production ────────────────────────────────────────────────────────────
  // R2 only. The new .github/workflows/backup-r2-to-git.yml workflow is the
  // path that gets the binary into git, asynchronously and batched.
  if (process.env.NODE_ENV === 'production') {
    try {
      await uploadToR2(buffer, r2Key, contentType)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json({ src, bytes: buffer.byteLength })
  }

  // ── Development ───────────────────────────────────────────────────────────
  // 1. Write to public/ on disk (overwrite OK — dev experiments are ephemeral).
  const targetDir = path.join(PUBLIC_ROOT, directory)
  const targetPath = path.join(targetDir, filename)

  const rel = path.relative(PUBLIC_ROOT, targetPath)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return NextResponse.json({ error: 'path escapes public/' }, { status: 400 })
  }

  await mkdir(targetDir, { recursive: true })
  await writeFile(targetPath, buffer)

  // 2. Upload to R2 (best-effort — skip gracefully if credentials absent).
  let r2Warning: string | undefined
  try {
    await uploadToR2(buffer, r2Key, contentType)
  } catch (err) {
    r2Warning = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json({
    src,
    bytes: buffer.byteLength,
    ...(r2Warning ? { r2Warning } : {})
  })
}
