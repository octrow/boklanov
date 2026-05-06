/**
 * Asset uploader for the Keystatic admin UI.
 *
 * Goal (both dev and prod):
 *   1. Add the file to public/<directory>/<filename>
 *   2. Upload the file to Cloudflare R2 at <directory>/<filename>
 *   (Step 3 — linking the path in YAML — is done by the editor saving in Keystatic.)
 *
 * Dev  (localhost): writes to public/ on disk AND uploads to R2.
 *   - R2 upload is best-effort: if credentials aren't in .env the disk write
 *     still succeeds and the dev server serves the file locally.
 *   - Overwrites are allowed (replace existing file).
 *
 * Prod (Vercel):    uploads to R2 AND commits to GitHub in parallel.
 *   - R2 makes the file immediately reachable via NEXT_PUBLIC_CDN_BASE
 *     so the Keystatic preview thumbnail shows up right away.
 *   - GitHub commit adds the file to public/ in the repo; Vercel rebuilds
 *     and the sync-r2 workflow re-syncs (idempotent).
 *   - Both are required; returns 500 if either fails.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET       (optional, default: boklanov-content)
 *   GITHUB_TOKEN    (prod only) fine-grained PAT, Contents: read+write on boklanov repo
 *   GITHUB_OWNER    (optional, default: octrow)
 *   GITHUB_REPO     (optional, default: boklanov)
 *   GITHUB_BRANCH   (optional, default: main)
 */

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'])
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
  if (parts.some(p => p === '' || p === '..' || p === '.')) return null
  return parts.map(sanitizeSegment).join('/')
}

// ---------------------------------------------------------------------------
// R2
// ---------------------------------------------------------------------------

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<void> {
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket    = process.env.R2_BUCKET ?? 'boklanov-content'
  const keyId     = process.env.R2_ACCESS_KEY_ID
  const keySecret = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !keyId || !keySecret) {
    throw new Error('R2 credentials not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)')
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

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.byteLength,
    CacheControl: 'public, max-age=31536000, immutable'
  }))
}

// ---------------------------------------------------------------------------
// GitHub Contents API
// ---------------------------------------------------------------------------

async function commitToGitHub(buffer: Buffer, pathInRepo: string, message: string): Promise<void> {
  const token  = process.env.GITHUB_TOKEN
  const owner  = process.env.GITHUB_OWNER  ?? 'octrow'
  const repo   = process.env.GITHUB_REPO   ?? 'boklanov'
  const branch = process.env.GITHUB_BRANCH ?? 'main'

  if (!token) throw new Error('GITHUB_TOKEN env var is required for production uploads')

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(pathInRepo)}`

  // Fetch existing SHA so we can overwrite (GitHub requires it for updates).
  const getRes = await fetch(`${contentsUrl}?ref=${encodeURIComponent(branch)}`, {
    headers,
    cache: 'no-store'
  })
  let sha: string | undefined
  if (getRes.status === 200) {
    sha = ((await getRes.json()) as { sha?: string }).sha
  } else if (getRes.status !== 404) {
    throw new Error(`github GET ${pathInRepo}: ${getRes.status} ${await getRes.text()}`)
  }

  const putRes = await fetch(contentsUrl, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: buffer.toString('base64'),
      branch,
      ...(sha ? { sha } : {})
    })
  })
  if (!putRes.ok) {
    throw new Error(`github PUT ${pathInRepo}: ${putRes.status} ${await putRes.text()}`)
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'expected multipart/form-data' }, { status: 400 })
  }

  const file        = form.get('file')
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

  const filename    = sanitizeSegment(file.name) || `upload${ext}`
  const src         = `/${directory}/${filename}`
  const r2Key       = `${directory}/${filename}`
  const contentType = MIME[ext] ?? 'application/octet-stream'
  const buffer      = Buffer.from(await file.arrayBuffer())

  // ── Production ────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    const repoPath = `public/${directory}/${filename}`

    const results = await Promise.allSettled([
      uploadToR2(buffer, r2Key, contentType),
      commitToGitHub(buffer, repoPath, `chore(media): upload ${repoPath} via keystatic`)
    ])

    const failures = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => (r.reason instanceof Error ? r.reason.message : String(r.reason)))

    if (failures.length > 0) {
      return NextResponse.json({ error: failures.join('; ') }, { status: 500 })
    }
    return NextResponse.json({ src, bytes: buffer.byteLength })
  }

  // ── Development ───────────────────────────────────────────────────────────
  // 1. Write to public/ on disk (overwrite OK — dev experiments are ephemeral).
  const targetDir  = path.join(PUBLIC_ROOT, directory)
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
