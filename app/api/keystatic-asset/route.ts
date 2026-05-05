/**
 * Local-only asset uploader for the Keystatic admin.
 *
 * Keystatic's `fields.image` doesn't show thumbnails for files placed
 * manually under `public/`, and we keep image references as `fields.text`
 * paths so the YAML is human-editable. This route lets the admin UI
 * upload an image straight into `public/<directory>/<filename>` so the
 * editor can pick a file from disk without leaving Keystatic.
 *
 * Disabled in production — the deployed bundle is read-only and image
 * uploads should go through Keystatic Cloud's Image Library if it's ever
 * enabled.
 */

import { NextResponse } from 'next/server'
import { writeFile, mkdir, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'])
const PUBLIC_ROOT = path.resolve(process.cwd(), 'public')
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — matches typical poster size budget

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

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 })
  }

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
      { error: 'file already exists', src: '/' + directory + '/' + filename },
      { status: 409 }
    )
  } catch {
    // ENOENT — good, write it.
  }

  await mkdir(targetDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(targetPath, buffer)

  return NextResponse.json({
    src: '/' + directory + '/' + filename,
    bytes: buffer.byteLength
  })
}
