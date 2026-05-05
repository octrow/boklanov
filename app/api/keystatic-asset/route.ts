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
 * In production: writes the same file to two places in parallel:
 *   1. R2 bucket at <directory>/<filename> — so cdnUrl() (which prepends
 *      NEXT_PUBLIC_CDN_BASE → pub-...r2.dev) can serve it immediately, both
 *      to the live page after a YAML save and to the Keystatic preview tile.
 *   2. The GitHub repo at public/<directory>/<filename> via the Contents API
 *      — so the file is in git as source of truth and is included in future
 *      Vercel deploys / fresh clones. The sync-r2 workflow re-uploads on push,
 *      which is harmless (idempotent overwrite).
 *
 * If R2 succeeds but GitHub fails, the response is a 500 — the user retries,
 * R2 silently overwrites, GitHub commit is attempted again. If GitHub
 * succeeds but R2 fails, sync-r2 will catch it on the next push, so the page
 * still gets the file after deploy.
 *
 * Required Vercel env vars in production:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (R2_BUCKET optional,
 *   defaults to boklanov-content). Same credentials as npm run upload-images.
 *   GITHUB_TOKEN  — fine-grained PAT with Contents: read+write on the
 *                   boklanov repo.
 *   GITHUB_OWNER  — defaults to 'octrow'
 *   GITHUB_REPO   — defaults to 'boklanov'
 *   GITHUB_BRANCH — defaults to 'main'
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
    credentials: { accessKeyId: keyId, secretAccessKey: keySecret },
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

type GitHubError = { ok: false; status: number; message: string }
type GitHubOk = { ok: true; sha?: string }

async function getExistingSha(
  owner: string,
  repo: string,
  branch: string,
  pathInRepo: string,
  token: string
): Promise<GitHubOk | GitHubError> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(pathInRepo)}?ref=${encodeURIComponent(branch)}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    cache: 'no-store'
  })
  if (res.status === 200) {
    const data = (await res.json()) as { sha?: string }
    return { ok: true, sha: data.sha }
  }
  if (res.status === 404) return { ok: true }
  return { ok: false, status: res.status, message: await res.text() }
}

async function commitToGitHub(
  buffer: Buffer,
  pathInRepo: string,
  message: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER ?? 'octrow'
  const repo = process.env.GITHUB_REPO ?? 'boklanov'
  const branch = process.env.GITHUB_BRANCH ?? 'main'

  if (!token) {
    throw new Error('GITHUB_TOKEN env var is required for production uploads')
  }

  const existing = await getExistingSha(owner, repo, branch, pathInRepo, token)
  if (!existing.ok) {
    throw new Error(`github GET ${pathInRepo}: ${existing.status} ${existing.message}`)
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(pathInRepo)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({
      message,
      content: buffer.toString('base64'),
      branch,
      ...(existing.sha ? { sha: existing.sha } : {})
    })
  })
  if (!res.ok) {
    throw new Error(`github PUT ${pathInRepo}: ${res.status} ${await res.text()}`)
  }
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
    // Run R2 upload and the GitHub commit in parallel: R2 makes the file
    // immediately reachable via cdnUrl() (so the Keystatic preview tile and
    // the live page can show it without waiting for a deploy), and the
    // GitHub commit puts the file in git for source-of-truth.
    const r2Key = `${directory}/${filename}`
    const repoPath = `public/${directory}/${filename}`
    const contentType = MIME[ext] ?? 'application/octet-stream'

    const results = await Promise.allSettled([
      uploadToR2(buffer, r2Key, contentType),
      commitToGitHub(buffer, repoPath, `chore(media): upload ${repoPath} via keystatic`)
    ])
    const failures = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)))
    if (failures.length > 0) {
      return NextResponse.json({ error: failures.join('; ') }, { status: 500 })
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
