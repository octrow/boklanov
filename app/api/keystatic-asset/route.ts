/**
 * Asset uploader + remover for the Keystatic admin UI.
 *
 * POST   — upload an image to R2 (and disk in dev).
 * DELETE — remove an image from R2 (and disk in dev).
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
 *     truth (see .design/boklanov-rewrite/KEYSTATIC_R2_ONLY_PLAN.md). The
 *     same workflow also removes public/ files no longer in R2, so an
 *     editor remove-then-save propagates into git asynchronously.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET (optional, default: boklanov-content)
 */

import { NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'node:fs/promises'
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
// Mirror of scripts/backup-r2-to-git.ts. Limits which prefixes the editor
// can write to and (more importantly) delete from, so a malformed src
// can't reach into anything outside the editor-managed media tree.
const ALLOWED_DELETE_PREFIXES = ['productions/', 'about/', 'uploads/']
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

async function deleteFromR2(key: string): Promise<void> {
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET ?? 'boklanov-content'
  const keyId = process.env.R2_ACCESS_KEY_ID
  const keySecret = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !keyId || !keySecret) {
    throw new Error(
      'R2 credentials not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)'
    )
  }

  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: keySecret },
    forcePathStyle: true
  })

  // R2 DeleteObject is free per docs/r2-operations.md, and is idempotent:
  // it returns 204 even if the key doesn't exist, which matches our
  // "ensure absent" semantics for the editor remove flow.
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

// ---------------------------------------------------------------------------
// Helpers shared by POST and DELETE
// ---------------------------------------------------------------------------

/**
 * Decompose `/uploads/foo.webp` (the YAML-stored form) into
 * `{ directory: 'uploads', filename: 'foo.webp', r2Key: 'uploads/foo.webp' }`,
 * sanitising both halves and refusing anything that escapes
 * ALLOWED_DELETE_PREFIXES.
 */
function decomposeSrc(
  src: string
): { directory: string; filename: string; r2Key: string } | null {
  const trimmed = src.trim().replace(/^\/+/, '')
  if (!trimmed) return null
  const lastSlash = trimmed.lastIndexOf('/')
  if (lastSlash <= 0) return null
  const directory = sanitizeDirectory(trimmed.slice(0, lastSlash))
  const filename = sanitizeSegment(trimmed.slice(lastSlash + 1))
  if (!directory || !filename) return null
  const ext = path.extname(filename).toLowerCase()
  if (!ALLOWED_EXT.has(ext)) return null
  const r2Key = `${directory}/${filename}`
  if (!ALLOWED_DELETE_PREFIXES.some((p) => r2Key.startsWith(p))) return null
  return { directory, filename, r2Key }
}

// ---------------------------------------------------------------------------
// Route handlers
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

export async function DELETE(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'expected JSON body' }, { status: 400 })
  }

  const srcRaw = (body as { src?: unknown })?.src
  if (typeof srcRaw !== 'string') {
    return NextResponse.json({ error: 'missing src' }, { status: 400 })
  }

  const parts = decomposeSrc(srcRaw)
  if (!parts) {
    return NextResponse.json(
      { error: 'invalid src (must be /<allowed-prefix>/<image>)' },
      { status: 400 }
    )
  }
  const { directory, filename, r2Key } = parts
  const src = `/${r2Key}`

  // ── Production ────────────────────────────────────────────────────────────
  // R2 only. The backup-r2-to-git workflow notices the orphan in public/
  // (file present in git, no matching key in R2) and removes it on its
  // next run, so the deletion lands in git asynchronously.
  if (process.env.NODE_ENV === 'production') {
    try {
      await deleteFromR2(r2Key)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json({ src, removed: true })
  }

  // ── Development ───────────────────────────────────────────────────────────
  // Best-effort R2 delete + best-effort disk delete. Either may already be
  // absent (e.g. dev tree without R2 creds, or a re-click after success);
  // both are no-ops in that case.
  let r2Warning: string | undefined
  try {
    await deleteFromR2(r2Key)
  } catch (err) {
    r2Warning = err instanceof Error ? err.message : String(err)
  }

  const targetPath = path.join(PUBLIC_ROOT, directory, filename)
  const rel = path.relative(PUBLIC_ROOT, targetPath)
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
    try {
      await unlink(targetPath)
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code !== 'ENOENT') throw err
    }
  }

  return NextResponse.json({
    src,
    removed: true,
    ...(r2Warning ? { r2Warning } : {})
  })
}
