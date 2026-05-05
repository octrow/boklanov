/**
 * Asset uploader for the Keystatic admin.
 *
 * Keystatic's `fields.image` doesn't show thumbnails for files placed
 * manually under `public/`, and we keep image references as `fields.text`
 * paths so the YAML is human-editable. This route lets the admin UI upload
 * an image so the editor can pick a file without leaving Keystatic.
 *
 * In development: writes directly to public/<directory>/<filename> on disk.
 *
 * In production: uploads to Cloudflare R2 (same bucket as npm run
 * upload-images) at key <directory>/<filename>. Requires R2_ACCOUNT_ID,
 * R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and optionally R2_BUCKET (defaults
 * to boklanov-content) to be set as Vercel environment variables. Returns the
 * same /directory/filename path that the app stores in YAML — cdnUrl() in
 * lib/cdn.ts will prepend NEXT_PUBLIC_CDN_BASE at render time.
 */

import { NextResponse } from 'next/server'
import { writeFile, mkdir, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'])
const PUBLIC_ROOT = path.resolve(process.cwd(), 'public')
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — matches typical poster size budget

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif'
}

function sanitizeSegment(s: string): string {
  return s.replace(/[^a-z0-9._-]/gi, '-')
}

function sanitizeDirectory(dir: string): string | null {
  // Strip leading/trailing slashes, collapse repeats, reject `..`
  const trimmed = dir.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return null
  const parts = trimmed.split('/')
  if (parts.some(p => p === '' || p === '..' || p === '.')) return null
  return parts.map(sanitizeSegment).join('/')
}

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
    throw new Error('R2 env vars not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)')
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: keySecret }
  })

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.byteLength,
    CacheControl: 'public, max-age=31536000, immutable'
  }))
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'expected multipart/form-data' }, { status: 400 })
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
    return NextResponse.json({ error: `extension ${ext} not allowed` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file too large' }, { status: 413 })
  }

  const filename = sanitizeSegment(file.name) || `upload${ext}`
  const src = '/' + directory + '/' + filename
  const buffer = Buffer.from(await file.arrayBuffer())

  if (process.env.NODE_ENV === 'production') {
    // In production the Vercel filesystem is read-only — upload to R2 instead.
    // The key mirrors the path without the leading slash so cdn.boklanov.com
    // serves it at the same URL the YAML path resolves to via cdnUrl().
    const r2Key = directory + '/' + filename
    const contentType = MIME[ext] ?? 'application/octet-stream'
    try {
      await uploadToR2(buffer, r2Key, contentType)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    return NextResponse.json({ src, bytes: buffer.byteLength })
  }

  // Development: write to public/ on disk so Next.js serves it immediately.
  const targetDir = path.join(PUBLIC_ROOT, directory)
  const targetPath = path.join(targetDir, filename)

  // Belt-and-suspenders: ensure target stays under public/.
  const rel = path.relative(PUBLIC_ROOT, targetPath)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return NextResponse.json({ error: 'path escapes public/' }, { status: 400 })
  }

  // Reject overwrite — let editors rename instead of silently clobbering.
  try {
    await access(targetPath, fsConstants.F_OK)
    return NextResponse.json(
      { error: 'file already exists', src },
      { status: 409 }
    )
  } catch {
    // ENOENT — good, write it.
  }

  await mkdir(targetDir, { recursive: true })
  await writeFile(targetPath, buffer)

  return NextResponse.json({ src, bytes: buffer.byteLength })
}
