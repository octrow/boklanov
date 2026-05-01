/**
 * scripts/sync-from-notion.ts
 *
 * Parses the local Notion export at `notion-data/Роман Бокланов/...` and
 * emits per-production MDX files into `content/productions/<slug>.mdx`,
 * plus copies images to `public/productions/<slug>/`.
 *
 * Re-runnable: re-export from Notion → drop into notion-data/ → re-run.
 * Idempotent — wipes content/productions/ and public/productions/ first.
 *
 * Phase 4 invariants (DESIGN_BRIEF §6, §7):
 *   - RU + EN siblings merge into ONE record by shared CSV `Slug` column
 *   - frontmatter shape per brief §7
 *   - heuristic extraction for year, duration, ageRating, theatre, role
 *   - everything else is filled in F5 via per-production metadata.yml overlay
 *
 * Run:  npm run sync   (defined in package.json)
 */

import { parse as parseCsv } from 'csv-parse/sync'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import * as yaml from 'yaml'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const EXPORT_ROOT = path.join(ROOT, 'notion-data', 'Роман Бокланов')
const DB_DIR = path.join(EXPORT_ROOT, 'site map database')
const CSV_PATH = path.join(
  EXPORT_ROOT,
  'site map database 9dd7e6f635ca489ea2380ad34a5404f1_all.csv'
)
const CONTENT_DIR = path.join(ROOT, 'content', 'productions')
const PUBLIC_DIR = path.join(ROOT, 'public', 'productions')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CsvRow {
  Name: string
  Author: string
  Created: string
  'Created time': string
  Description: string
  Featured: string
  'Last edited time': string
  Public: string
  Published: string
  Slug: string
  Tags: string
}

interface Production {
  slug: string
  notionIds: { ru?: string; en?: string }
  title: { ru?: string; en?: string; de?: null }
  synopsis: { ru?: string; en?: string }
  body: { ru?: string; en?: string }
  theatre: {
    name?: string
    shortName?: string
    city?: string
    country?: string
    url?: string
  }
  year?: number
  ageRating?: string
  durationMin?: number
  role: string
  form: string[]
  lineage: string[]
  poster: { src: string | null; credit: null }
  gallery: Array<{ src: string; credit: null; caption: null }>
  videos: Array<{ provider: string; id: string }>
  awards: Array<{ name: string; category?: string; year?: number; city?: string }>
  press: Array<{ title: string; url: string; outlet?: string; language?: string }>
  externalLinks: Array<{ label: string; url: string }>
  techRider: null
  pressKit: null
  featured: boolean
  tags: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function detectLocale(text: string, name: string): 'ru' | 'en' {
  // Cyrillic in name → RU; otherwise EN. Fallback: scan body.
  if (/[А-Яа-яЁё]/.test(name)) return 'ru'
  if (/[А-Яа-яЁё]/.test(text.slice(0, 500))) return 'ru'
  return 'en'
}

function extractYear(body: string, fallback: string): number | undefined {
  // "Premiere: 24 March 2021" / "Премьера: 12 декабря 2020" / Published date.
  const premiereLine = body.match(/(?:Premiere|Премьера)[^\n]*?(\d{4})/i)
  if (premiereLine) return Number(premiereLine[1])
  const fbYear = fallback.match(/(\d{4})/)
  if (fbYear) return Number(fbYear[1])
  return undefined
}

function extractDuration(body: string): number | undefined {
  // "Duration: 1 hour" / "1 hour 30 minutes" / "Продолжительность: 90 минут"
  const m1 = body.match(/(?:Duration|Продолжительность)[^\n]*?(\d+)\s*(hour|hours|час)/i)
  const m2 = body.match(/(?:Duration|Продолжительность)[^\n]*?(\d+)\s*(min|мин)/i)
  let mins = 0
  if (m1) mins += Number(m1[1]) * 60
  if (m2) mins += Number(m2[1])
  return mins > 0 ? mins : undefined
}

function extractAgeRating(body: string): string | undefined {
  const m = body.match(/(?:Category|Возраст)[^\n]*?(\d+\+)/)
  if (m) return m[1]
  const m2 = body.match(/\b(0\+|3\+|6\+|12\+|16\+|18\+)\b/)
  return m2?.[1]
}

function extractRole(tags: string): string {
  const t = tags.toLowerCase()
  if (t.includes('mono-performance')) return 'performer'
  if (t.includes('reading') || t.includes('читка')) return 'reader'
  return 'director'
}

function extractForm(tags: string): string[] {
  const out: string[] = []
  const t = tags.toLowerCase()
  if (t.includes('mono')) out.push('solo')
  if (t.includes('puppet') || t.includes('кукол')) out.push('puppet')
  if (t.includes('object') || t.includes('предмет')) out.push('object')
  if (t.includes('family') || t.includes('семей')) out.push('family')
  if (t.includes('reading') || t.includes('читка')) out.push('reading')
  if (out.length === 0) out.push('ensemble')
  return Array.from(new Set(out))
}

function extractTheatre(body: string): Production['theatre'] {
  // Look for known short-names. Brief D5 lineage: BTK / РГИСИ / Кудашов.
  const t: Production['theatre'] = {}
  if (/Большой театр кукол|Bolshoi Puppet|БТК|BTK/i.test(body)) {
    t.name = 'Большой театр кукол'
    t.shortName = 'БТК'
    t.city = 'Saint Petersburg'
    t.country = 'RU'
    const url = body.match(/(https?:\/\/(?:www\.)?puppets\.ru\/[^\s)]+)/)
    if (url) t.url = url[1]
  }
  return t
}

function extractLineage(theatre: Production['theatre'], body: string): string[] {
  const out: string[] = []
  if (theatre.shortName === 'БТК') out.push('btk')
  if (/Кудашов|Kudashov/i.test(body)) out.push('kudashov')
  if (/РГИСИ|RGISI/i.test(body)) out.push('rgisi')
  return out
}

function extractVideos(body: string): Array<{ provider: string; id: string }> {
  const out: Array<{ provider: string; id: string }> = []
  const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/g
  for (const m of body.matchAll(ytRegex)) out.push({ provider: 'youtube', id: m[1] })
  return Array.from(
    new Map(out.map((v) => [`${v.provider}:${v.id}`, v])).values()
  )
}

function extractPress(body: string): Production['press'] {
  // Crude: links inside the "Press about" / "Пресса" section.
  const sectionMatch = body.match(
    /(?:Press about|Пресса о|Press:)[\s\S]*?(?=\n##|\n!\[|$)/i
  )
  if (!sectionMatch) return []
  const out: Production['press'] = []
  const linkRe = /\[([^\]]{4,200})\]\((https?:\/\/[^)]+)\)/g
  for (const m of sectionMatch[0].matchAll(linkRe)) {
    const title = m[1].replace(/\*\*/g, '').trim()
    if (title.length < 4) continue
    out.push({ title, url: m[2] })
    if (out.length >= 12) break
  }
  return out
}

function extractAwards(body: string): Production['awards'] {
  // Lines starting with 🏆 inside "Nominations" section.
  const out: Production['awards'] = []
  const lines = body.split('\n')
  for (const line of lines) {
    if (!/[🏆🥇🥈🥉]/.test(line)) continue
    const yearMatch = line.match(/(\d{4})/)
    const nameMatch = line.match(/\[([^\]]+?)\]/) || line.match(/[«"']([^»"']+?)[»"']/)
    out.push({
      name: nameMatch ? nameMatch[1] : line.slice(0, 80).replace(/[🏆🥇🥈🥉]/g, '').trim(),
      year: yearMatch ? Number(yearMatch[1]) : undefined
    })
    if (out.length >= 10) break
  }
  return out
}

function extractSynopsis(body: string): string {
  // First non-empty paragraph that isn't a heading/quote/image.
  const paras = body.split(/\n\s*\n/)
  for (const p of paras) {
    const trimmed = p.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('!['))
      continue
    if (trimmed.length < 60) continue
    return trimmed.replace(/\n+/g, ' ').slice(0, 600)
  }
  return ''
}

function findImageRefs(body: string): string[] {
  // Markdown image syntax. Returns URL-encoded relative paths.
  const out: string[] = []
  for (const m of body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) out.push(m[1])
  return out
}

async function copyImage(
  src: string,
  destDir: string,
  index: number
): Promise<string | null> {
  if (!fs.existsSync(src)) return null
  const ext = path.extname(src).toLowerCase() || '.jpg'
  const filename = index === 0 ? `poster${ext}` : `${String(index).padStart(2, '0')}${ext}`
  const dest = path.join(destDir, filename)
  fs.copyFileSync(src, dest)
  return filename
}

function buildMetadataStub(prod: Production): string {
  // The overlay schema. Anything set here wins over MDX frontmatter at load
  // time (lib/content.ts in F6). The stub is the manual-pass checklist.
  // Leave fields as `null` or `[]` — the loader treats those as "no overlay".
  const galleryStub = prod.gallery.map((g) => ({
    src: g.src,
    credit: null,
    caption: { ru: null, en: null }
  }))
  const titleRu = prod.title.ru ?? prod.title.en ?? prod.slug
  return `# Manual-pass overlay for: ${titleRu}
#
# Edit this file to fill in the fields the auto-sync can't infer.
# The content loader (lib/content.ts) merges this on top of the MDX
# frontmatter at build time — anything you set here wins.
#
# DO NOT delete fields you don't want to set; leave them as null / [].
# Leaving a field commented out also works.
#
# See content/README.md for the full workflow.

# Editor's choice for the home-page featured row (4–6 max site-wide).
featured: ${prod.featured ? 'true' : 'false'}

# Photo credits — one entry per gallery image. \`src\` matches the path the
# sync emitted; copy/paste from index.mdx if needed.
gallery:
${
  galleryStub.length === 0
    ? '  []'
    : galleryStub
        .map(
          (g) =>
            `  - src: ${g.src}\n    credit: null            # photographer name\n    caption:\n      ru: null\n      en: null`
        )
        .join('\n')
}

# Poster credit (often the same photographer; sometimes a designer).
poster:
  credit: null

# Production form — controls filtering + recommends. Pick from:
#   puppet | object | solo | ensemble | family | reading | sketch
# Auto-detect filled: ${JSON.stringify(prod.form)}
form: ${prod.form.length ? JSON.stringify(prod.form) : '[]'}

# Lineage — for the recommends algorithm (brief D9). Pick from:
#   btk | rgisi | kudashov | dotheatre | ...
# Auto-detect filled: ${JSON.stringify(prod.lineage)}
lineage: ${prod.lineage.length ? JSON.stringify(prod.lineage) : '[]'}

# Director / co-director / performer / reader / sketch
# Auto-detect filled: ${prod.role}
role: ${prod.role}

# Age rating: 0+ | 3+ | 6+ | 12+ | 16+ | 18+ (auto: ${prod.ageRating ?? 'null'})
ageRating: ${prod.ageRating ? JSON.stringify(prod.ageRating) : 'null'}

# Duration in minutes (auto: ${prod.durationMin ?? 'null'})
durationMin: ${prod.durationMin ?? 'null'}

# External assets — paths or URLs. Leave null if absent.
techRider: null   # /productions/${prod.slug}/tech-rider.pdf
pressKit:  null   # /productions/${prod.slug}/press-kit.zip

# DE title (only fill for v2 priority shows).
title:
  de: null

# DE synopsis (only fill for v2 priority shows).
synopsis:
  de: null

# Extra video URLs the sync didn't catch (Vimeo, etc.).
# videos:
#   - { provider: vimeo, id: "123456789" }
videos: []
`
}

async function makeLqip(srcPath: string): Promise<string | null> {
  try {
    const buf = await sharp(srcPath)
      .resize(24, 24, { fit: 'inside' })
      .blur(1)
      .jpeg({ quality: 50 })
      .toBuffer()
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Reset output dirs.
  //    - public/productions/ is fully regenerated (images come from notion-data)
  //    - content/productions/<slug>/index.mdx is regenerated
  //    - content/productions/<slug>/metadata.yml is PRESERVED (manual edits live there)
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true })
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  fs.mkdirSync(CONTENT_DIR, { recursive: true })
  if (fs.existsSync(CONTENT_DIR)) {
    for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const idx = path.join(CONTENT_DIR, entry.name, 'index.mdx')
      if (fs.existsSync(idx)) fs.rmSync(idx)
    }
  }

  // 2. Parse CSV index — strip BOM.
  const csvRaw = fs.readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, '')
  const rows: CsvRow[] = parseCsv(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })
  console.log(`[sync] CSV rows: ${rows.length}`)

  // 3. Group rows by Slug. The CSV uses `<base>` for RU and `<base>-en`
  //    for EN — strip `-en` so siblings collapse into one record.
  const groups = new Map<string, CsvRow[]>()
  for (const row of rows) {
    if (!row.Public || row.Public.toLowerCase() !== 'yes') continue
    const rawSlug = (row.Slug || slugify(row.Name)).toLowerCase()
    if (!rawSlug) continue
    const slug = rawSlug.replace(/-(en|eng)$/, '')
    const list = groups.get(slug) ?? []
    list.push(row)
    groups.set(slug, list)
  }
  console.log(`[sync] grouped slugs: ${groups.size}`)

  // 4. Build a filename index over DB_DIR for quick lookup.
  const dbEntries = fs.readdirSync(DB_DIR)
  const mdFiles = dbEntries.filter((e) => e.endsWith('.md'))
  // Normalize CSV name and filename so curly quotes / colons / leading spaces
  // don't break the lookup. Notion writes "’" in CSV but "'" in filenames, etc.
  function normalize(s: string): string {
    return s
      .normalize('NFKC')
      .replace(/[’‘`]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[—–]/g, '-')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .toLowerCase()
  }
  const mdIndex = mdFiles.map((f) => {
    const stem = f.replace(/\s[a-f0-9]{32}\.md$/, '')
    return { file: f, stem, key: normalize(stem) }
  })

  function findMdFor(name: string): { md: string; folder: string | null } | null {
    const wanted = normalize(name)
    if (!wanted) return null
    const hit =
      mdIndex.find((e) => e.key === wanted) ??
      mdIndex.find((e) => e.key.startsWith(wanted)) ??
      mdIndex.find((e) => wanted.startsWith(e.key))
    if (!hit) return null
    const folderPath = path.join(DB_DIR, hit.stem)
    return {
      md: path.join(DB_DIR, hit.file),
      folder: fs.existsSync(folderPath) ? folderPath : null
    }
  }

  // 5. Build Production records.
  const productions: Production[] = []

  for (const [slug, csvRows] of groups) {
    const ruRow = csvRows.find((r) => /[А-Яа-яЁё]/.test(r.Name))
    const enRow = csvRows.find((r) => !/[А-Яа-яЁё]/.test(r.Name))

    const prod: Production = {
      slug,
      notionIds: {},
      title: {},
      synopsis: {},
      body: {},
      theatre: {},
      role: 'director',
      form: [],
      lineage: [],
      poster: { src: null, credit: null },
      gallery: [],
      videos: [],
      awards: [],
      press: [],
      externalLinks: [],
      techRider: null,
      pressKit: null,
      featured: csvRows.some((r) => r.Featured?.toLowerCase() === 'yes'),
      tags: Array.from(
        new Set(
          csvRows
            .flatMap((r) => (r.Tags || '').split(','))
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        )
      )
    }

    const tagsCombined = csvRows.map((r) => r.Tags || '').join(', ')
    prod.role = extractRole(tagsCombined)
    prod.form = extractForm(tagsCombined)

    let primaryMd: { md: string; folder: string | null } | null = null
    let primaryBody = ''

    for (const row of csvRows) {
      const found = findMdFor(row.Name)
      if (!found) {
        console.warn(`[sync] no .md for "${row.Name}"`)
        continue
      }
      const body = fs.readFileSync(found.md, 'utf8')
      const locale = detectLocale(body, row.Name)

      // capture notion id from filename
      const idMatch = path.basename(found.md).match(/([a-f0-9]{32})\.md$/)
      if (idMatch) prod.notionIds[locale] = idMatch[1]

      prod.title[locale] = row.Name
      prod.body[locale] = body
      prod.synopsis[locale] = row.Description?.trim() || extractSynopsis(body)

      // Prefer the entry that HAS an asset folder. Notion exports often
      // attach images only to one locale of a paired record.
      const isBetter =
        !primaryMd ||
        (found.folder && !primaryMd.folder) ||
        (locale === 'ru' && primaryMd && !primaryMd.folder === !found.folder)
      if (isBetter) {
        primaryMd = found
        primaryBody = body
      }
    }

    if (!primaryMd) {
      console.warn(`[sync] skip ${slug} — no readable .md`)
      continue
    }

    // Heuristics from primary body.
    prod.year = extractYear(primaryBody, csvRows[0]?.Published || '')
    prod.durationMin = extractDuration(primaryBody)
    prod.ageRating = extractAgeRating(primaryBody)
    prod.theatre = extractTheatre(primaryBody)
    prod.lineage = extractLineage(prod.theatre, primaryBody)
    prod.videos = extractVideos(
      Object.values(prod.body).filter((s): s is string => typeof s === 'string').join('\n')
    )
    prod.press = extractPress(primaryBody)
    prod.awards = extractAwards(primaryBody)

    // 6. Copy images.
    if (primaryMd.folder) {
      const refs = findImageRefs(primaryBody)
      const seen = new Set<string>()
      const destDir = path.join(PUBLIC_DIR, slug)
      fs.mkdirSync(destDir, { recursive: true })

      let writtenIndex = 0
      for (const ref of refs) {
        // ref looks like "<FolderName>/<encoded-filename>" — split safely.
        const [, encodedFile] = ref.split('/').reduce<[string, string]>(
          (acc, part, i, arr) =>
            i === arr.length - 1 ? [acc[0], part] : [acc[0] + '/' + part, acc[1]],
          ['', '']
        )
        const decodedFile = decodeURIComponent(encodedFile)
        const candidate = path.join(primaryMd.folder, decodedFile)
        if (seen.has(candidate)) continue
        seen.add(candidate)

        const filename = await copyImage(candidate, destDir, writtenIndex)
        if (!filename) continue
        const publicSrc = `/productions/${slug}/${filename}`

        if (writtenIndex === 0) {
          prod.poster.src = publicSrc
        } else {
          prod.gallery.push({ src: publicSrc, credit: null, caption: null })
        }
        writtenIndex++
      }

      // Generate lqip placeholders next to the files.
      if (prod.poster.src) {
        const posterPath = path.join(ROOT, 'public', prod.poster.src)
        const lqip = await makeLqip(posterPath)
        if (lqip) {
          fs.writeFileSync(
            path.join(destDir, 'lqip.json'),
            JSON.stringify({ poster: lqip }, null, 2)
          )
        }
      }
    }

    productions.push(prod)
  }

  console.log(`[sync] productions built: ${productions.length}`)

  // 7. Write MDX + metadata.yml stub for each production.
  //    Layout per F5:
  //      content/productions/<slug>/index.mdx     — regenerated each sync
  //      content/productions/<slug>/metadata.yml  — stub on first sync, then
  //                                                  hand-edited; never overwritten
  for (const prod of productions) {
    const dir = path.join(CONTENT_DIR, prod.slug)
    fs.mkdirSync(dir, { recursive: true })

    const { body, ...frontmatterFields } = prod
    const fm = yaml.stringify(frontmatterFields, { lineWidth: 0 })
    const ruBody = body.ru ?? ''
    const enBody = body.en ?? ''
    const mdx = `---
${fm.trimEnd()}
---

{/* RU body */}
{/* prettier-ignore */}
<Locale value="ru">
${ruBody.trim()}
</Locale>

{/* EN body */}
{/* prettier-ignore */}
<Locale value="en">
${enBody.trim()}
</Locale>
`
    fs.writeFileSync(path.join(dir, 'index.mdx'), mdx)

    // metadata.yml: write a stub ONLY if absent. Hand-edits survive resync.
    const metaPath = path.join(dir, 'metadata.yml')
    if (!fs.existsSync(metaPath)) {
      const stub = buildMetadataStub(prod)
      fs.writeFileSync(metaPath, stub)
    }
  }

  // 8. Index file for the loader.
  const index = productions.map((p) => ({
    slug: p.slug,
    title: p.title,
    year: p.year,
    role: p.role,
    form: p.form,
    lineage: p.lineage,
    featured: p.featured,
    poster: p.poster.src,
    ageRating: p.ageRating,
    theatre: p.theatre.shortName ?? p.theatre.name ?? null,
    country: p.theatre.country ?? null
  }))
  fs.writeFileSync(
    path.join(ROOT, 'content', 'productions-index.json'),
    JSON.stringify(index, null, 2)
  )

  console.log(`[sync] done — ${productions.length} productions written`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
