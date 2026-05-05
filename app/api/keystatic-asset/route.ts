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
 * In production: commits the file to the GitHub repo at
 * public/<directory>/<filename> on the configured branch via the Contents
 * API. Vercel auto-deploys the new commit; the .github/workflows/sync-r2.yml
 * action additionally mirrors public/productions/** + public/about/** to R2.
 *
 * Why GitHub and not direct R2: the live site reads images from public/ in
 * the deployed bundle (cdn.boklanov.com is currently misconfigured), so a
 * file uploaded only to R2 is invisible to the page. Writing to git puts the
 * image in the same place the dev workflow puts it.
 *
 * Required Vercel env vars in production:
 *   GITHUB_TOKEN  — fine-grained PAT (or app token) with Contents: read+write
 *                   on the boklanov repo. Used to PUT files via the Contents API.
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
    // Commit straight to the repo so Vercel rebuilds with the file in public/.
    // The image will be visible at boklanov.com${src} after the deploy.
    const repoPath = `public/${directory}/${filename}`
    try {
      await commitToGitHub(buffer, repoPath, `chore(media): upload ${repoPath} via keystatic`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    return NextResponse.json({ src, bytes: buffer.byteLength, deferred: true })
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
