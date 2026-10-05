#!/usr/bin/env node
/**
 * Phase 1 photo audit (local).
 *
 * The Notion export in notion-data/ already contains every image we need.
 * This walks the local "site map database" folder, maps each production folder
 * to its companion .md file, counts images, and scrapes captions / credit
 * candidates from the markdown.
 *
 * Output: .design/boklanov-rewrite/photo-audit.md
 *
 * Run: node scripts/photo-audit.mjs
 */

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = new URL(
  '../notion-data/Роман Бокланов/site map database/',
  import.meta.url
)
const OUT = new URL(
  '../.design/boklanov-rewrite/photo-audit.md',
  import.meta.url
)

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const NOTION_ID_RE = /\b([0-9a-f]{32})\b/i

const stripNotionId = (name) => {
  const m = name.match(/^(.+?)\s+([0-9a-f]{32})$/i)
  return m ? { title: m[1].trim(), id: m[2] } : { title: name, id: null }
}

const isImage = (filename) =>
  IMAGE_EXT.has('.' + filename.split('.').pop().toLowerCase())

const audit = async () => {
  const rootPath = fileURLToPath(ROOT)
  const entries = await readdir(rootPath, { withFileTypes: true })

  // In Notion's export, folders are named "Title" (no id) and the MD file is
  // "Title <32-hex-id>.md". Group by normalized title so each pair becomes one
  // record.
  const productions = new Map()
  const orphans = []
  const norm = (s) => s.trim().toLowerCase()

  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue
    const full = join(rootPath, entry.name)
    const isDir = entry.isDirectory()
    const isMd = !isDir && entry.name.endsWith('.md')
    if (!isDir && !isMd) continue

    const baseName = isMd ? entry.name.replace(/\.md$/, '') : entry.name
    const { title, id } = stripNotionId(baseName)
    const key = norm(title)
    if (!productions.has(key)) {
      productions.set(key, { id: id || null, title, dir: null, md: null })
    }
    const rec = productions.get(key)
    if (isDir) rec.dir = full
    else {
      rec.md = full
      if (id) rec.id = id
      rec.title = title // prefer MD-derived title (often has nicer punctuation)
    }
  }

  const list = []
  for (const rec of productions.values()) {
    let imageCount = 0
    let totalBytes = 0
    let posters = []
    let images = []

    if (rec.dir) {
      const files = await readdir(rec.dir, { withFileTypes: true })
      for (const f of files) {
        if (f.isDirectory()) continue
        if (!isImage(f.name)) continue
        imageCount++
        const filePath = join(rec.dir, f.name)
        const s = await stat(filePath)
        totalBytes += s.size
        images.push({ name: f.name, bytes: s.size })
        const lower = f.name.toLowerCase()
        if (
          lower.includes('афиш') ||
          lower.includes('%d0%90%d1%84%d0%b8%d1%88') || // URL-encoded "Афиш"
          lower.startsWith('cover') ||
          lower.startsWith('poster')
        ) {
          posters.push(f.name)
        }
      }
    }

    let captions = []
    let externalImageCount = 0
    let creditMatches = []
    if (rec.md) {
      const md = await readFile(rec.md, 'utf-8')
      // count external image references in markdown body (e.g., posters hosted
      // on theatre sites or AWS S3 from Notion)
      const externalImages = md.match(/!\[[^\]]*\]\(https?:\/\/[^)]+\)/g) || []
      externalImageCount = externalImages.length
      // simple "Фото", "photo", "(c)", "©" credit detection
      const creditRe =
        /(?:Фото[:\s]+|Photo[:\s]+|Photographer[:\s]+|Фотограф[:\s]+|©\s*|\(c\)\s*)([^\n.]{2,80})/gi
      let m
      while ((m = creditRe.exec(md)) !== null) {
        creditMatches.push(m[1].trim())
      }
      // markdown image alt-text is sometimes used as caption
      const altRe = /!\[([^\]]+)\]\([^)]+\)/g
      while ((m = altRe.exec(md)) !== null) {
        const alt = m[1].trim()
        if (alt && alt !== 'Untitled' && alt.length > 2 && alt.length < 240) {
          captions.push(alt)
        }
      }
    }

    list.push({
      ...rec,
      imageCount,
      totalBytes,
      posters,
      images,
      externalImageCount,
      captions: [...new Set(captions)].slice(0, 6),
      credits: [...new Set(creditMatches)].slice(0, 6)
    })
  }

  // sort: most images first, then alphabetic
  list.sort((a, b) => {
    if (a.imageCount !== b.imageCount) return b.imageCount - a.imageCount
    return a.title.localeCompare(b.title, 'ru')
  })

  const total = list.length
  const withImages = list.filter((p) => p.imageCount > 0).length
  const withPoster = list.filter((p) => p.posters.length > 0).length
  const totalImages = list.reduce((s, p) => s + p.imageCount, 0)
  const totalBytes = list.reduce((s, p) => s + p.totalBytes, 0)
  const allCredits = new Set()
  for (const p of list) for (const c of p.credits) allCredits.add(c)

  const fmtMB = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`

  const lines = []
  lines.push('# Photo coverage audit - boklanov.ru')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Source: \`${rootPath.replace(/\/$/, '')}\``)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`- Production / sub-page records: **${total}**`)
  lines.push(
    `- Records with at least one local image: **${withImages}** (${pct(withImages, total)})`
  )
  lines.push(
    `- Records with a poster (Афиша / poster / cover): **${withPoster}** (${pct(withPoster, total)})`
  )
  lines.push(
    `- Local images on disk: **${totalImages}** (${fmtMB(totalBytes)})`
  )
  lines.push(
    `- Average images per record (incl. zero): **${(totalImages / total).toFixed(1)}**`
  )
  lines.push(
    `- Average images per record (with photos only): **${(totalImages / Math.max(1, withImages)).toFixed(1)}**`
  )
  lines.push(
    `- Distinct photographer-credit candidates pulled from MD: **${allCredits.size}**`
  )
  lines.push(`- Orphan files (no Notion id pair): **${orphans.length}**`)
  lines.push('')
  lines.push('## Per-record coverage')
  lines.push('')
  lines.push('| Images | Poster | MD | Title | Notion id |')
  lines.push('|-------:|:------:|:--:|:------|:----------|')
  for (const p of list) {
    const poster = p.posters.length ? '●' : '·'
    const md = p.md ? '●' : '·'
    const title = p.title.replace(/\|/g, '\\|')
    const idShort = p.id ? p.id.slice(0, 8) : '-'
    lines.push(
      `| ${p.imageCount} | ${poster} | ${md} | ${title} | \`${idShort}\` |`
    )
  }
  lines.push('')

  const empty = list.filter((p) => p.imageCount === 0 && p.md)
  lines.push('## Pages with markdown but no local images')
  lines.push('')
  if (empty.length === 0) {
    lines.push('_None._')
  } else {
    for (const p of empty) {
      lines.push(
        `- ${p.title} - \`${p.id ? p.id.slice(0, 8) : '-'}\` — external refs in MD: ${p.externalImageCount}`
      )
    }
  }
  lines.push('')

  lines.push('## Photographer-credit candidates found in MD')
  lines.push('')
  if (allCredits.size === 0) {
    lines.push(
      '_No explicit "Фото:", "Photo:", "©" credits matched in any markdown._'
    )
  } else {
    for (const c of [...allCredits].sort()) {
      lines.push(`- ${c}`)
    }
  }
  lines.push('')

  lines.push('## Caption / alt-text samples (first 30)')
  lines.push('')
  const allCaptions = []
  for (const p of list) {
    for (const c of p.captions) {
      allCaptions.push({ title: p.title, caption: c })
    }
  }
  if (allCaptions.length === 0) {
    lines.push('_No image alt-text or captions captured._')
  } else {
    for (const c of allCaptions.slice(0, 30)) {
      lines.push(`- _${c.title}_ — ${c.caption}`)
    }
  }
  lines.push('')

  lines.push('## Records with no companion MD (folder only)')
  lines.push('')
  const noMd = list.filter((p) => !p.md && p.imageCount > 0)
  if (noMd.length === 0) {
    lines.push('_None._')
  } else {
    for (const p of noMd) {
      lines.push(
        `- ${p.title} — ${p.imageCount} images — \`${p.id ? p.id.slice(0, 8) : '—'}\``
      )
    }
  }
  lines.push('')

  if (orphans.length > 0) {
    lines.push('## Orphan entries (no Notion id pair)')
    lines.push('')
    for (const o of orphans) {
      lines.push(`- ${o.title} (${o.kind})`)
    }
    lines.push('')
  }

  await mkdir(dirname(fileURLToPath(OUT)), { recursive: true })
  await writeFile(OUT, lines.join('\n'), 'utf-8')

  process.stderr.write(`wrote ${fileURLToPath(OUT)}\n`)
  return {
    productions: total,
    withImages,
    withPoster,
    totalImages,
    totalBytes,
    distinctCredits: allCredits.size
  }
}

const pct = (n, total) =>
  total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`

audit()
  .then((s) => process.stdout.write(JSON.stringify(s, null, 2) + '\n'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
