/**
 * FROZEN 2026-05-02 — do not re-run. Phase 8.3 folded metadata.yml into
 * frontmatter; Obsidian + obsidian-git is now the editorial workflow.
 * Kept for historical reference. See content/AUTHORING.ru.md.
 *
 * scripts/sync-from-notion.ts (archived)
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

interface CreditEntry {
  role: string
  name: string
  url?: string
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
  premiereDate?: { ru?: string; en?: string }
  ticketsUrl?: string
  ageRating?: string
  durationMin?: number
  role: string
  form: string[]
  lineage: string[]
  credits: { ru: CreditEntry[]; en: CreditEntry[] }
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
// Notion-export quirks (TASKS.md Q1, Q2 — 2026-05-01)
// ---------------------------------------------------------------------------

// Q1 — slugs that come back from Notion as Public=Yes pages but are NOT
// productions. These are navigation / bio / role-overview / festival pages.
// If any of these turn out to BE a production later, drop the slug here and
// re-run sync.
const NON_PRODUCTION_SLUGS = new Set<string>([
  'contacts',              // /contact page mirror
  'roman-boklanov-english', // EN bio mirror — about page, not a production
  'puppet-director',        // role overview — references multiple shows
  'total-fest-dialogs'      // festival listing, not a directorial production
])

// Q2 — Cyrillic-named rows where the CSV `Slug` column is empty AND
// `slugify()` returns empty (because \w doesn't match Cyrillic). Without
// this map the RU sibling never enters the grouping pass and the EN
// sibling ends up as a singleton, leaking its English `Name` into
// `title.ru`. Add a row here whenever a future re-export produces
// another orphan pair.
const MANUAL_SIBLING_PAIRS: Record<string, string> = {
  'Сахарный ребёнок': 'sugar-kid',
  Каштанка: 'kasztanka'
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

function rowLocale(row: CsvRow): 'ru' | 'en' {
  // Q2 — drive locale from the CSV slug suffix (Notion exports paired EN
  // siblings with `-en` / `-eng` suffixes), falling back to Cyrillic-name
  // detection. The previous body-content sniffing produced false positives
  // on EN pages whose body quoted Russian text (cast lists, gallery
  // captions) and silently overwrote `title.ru` with the EN string.
  const slug = (row.Slug || '').toLowerCase()
  if (/-(en|eng)$/.test(slug)) return 'en'
  if (/[А-Яа-яЁё]/.test(row.Name)) return 'ru'
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

// Hosts that are NEVER a theatre — videos, socials, music platforms,
// link-aggregator landing pages.
const NON_THEATRE_HOST_RE =
  /^https?:\/\/(?:www\.)?(?:youtu\.be|youtube\.com|vimeo\.com|instagram\.com|t\.me|telegram\.me|vk\.com|facebook\.com|music\.yandex|tilda\.ws)/i

function isPersonContext(text: string, url: string): boolean {
  if (/\/(?:pers|actors|people|peoples|user)\//i.test(url)) return true
  if (/^[А-ЯЁ][а-яё-]+\s+[А-ЯЁ][а-яё-]+$/u.test(text)) return true
  if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(text)) return true
  return false
}

function cleanLinkText(s: string): string {
  // Strip leading/trailing single brackets Notion's `[[label]](url)` form
  // leaves behind, plus residual bold/whitespace.
  return s.replace(/^\[+|\]+$/g, '').replace(/\*\*/g, '').trim()
}

function looksLikeProperName(s: string): boolean {
  // Theatre proper noun should start with an uppercase letter or digit —
  // rejects Russian preposition phrases like "в театр" / "в большой
  // театр" that Notion sometimes wraps as ticket-link text.
  return /^[A-ZА-ЯЁ\d]/.test(s)
}

// Theatre proper-noun length cap — anything longer is almost certainly
// a press-article title or a synopsis sentence that contains "театр".
const THEATRE_NAME_MAX_LEN = 60

function extractTheatre(body: string): Production['theatre'] {
  // BTK takes priority — its city/country are stable, so we hardcode them.
  if (/Большой театр кукол|Bolshoi Puppet|БТК|BTK/i.test(body)) {
    const t: Production['theatre'] = {
      name: 'Большой театр кукол',
      shortName: 'БТК',
      city: 'Saint Petersburg',
      country: 'RU'
    }
    const url = body.match(/(https?:\/\/(?:www\.)?puppets\.ru\/[^\s)]+)/)
    if (url) t.url = url[1]
    return t
  }
  // Restrict the search to body content BEFORE the press / awards / cast
  // section headings. Theatre identification is metadata that lives near
  // the top; everything below those headings is press-article titles or
  // award festival names that contain "театр" but aren't the theatre.
  const sectionStop = body.search(
    /^#+\s*(?:пресса|press|пресса\s*о|press\s+about|награды|awards|nominations|номинации|премии)/im
  )
  const head = sectionStop > 0 ? body.slice(0, sectionStop) : body

  // (a) Inline-context pattern: "театра [Name](url)" / "theatre [Name](url)".
  // Catches productions where the theatre's proper name doesn't itself
  // contain the word "театр" (e.g. ARTиШОК, Старый дом).
  const inlineRe =
    /(?:театр[аеу]?|theatre|theater)\s+\[(\*\*)?([^\]]+?)(\*\*)?\]\(([^)]+)\)/i
  const inline = head.match(inlineRe)
  if (inline) {
    const text = cleanLinkText(inline[2])
    const url = inline[4]
    if (
      text &&
      text.length <= THEATRE_NAME_MAX_LEN &&
      looksLikeProperName(text) &&
      !NON_THEATRE_HOST_RE.test(url) &&
      !isPersonContext(text, url)
    ) {
      return { name: text, url }
    }
  }
  // (b) Walk every `[text](url)` link and return the first whose text
  // itself contains "театр" / "theatre" / "theater".
  const linkRe = /\[(\*\*)?([^\]]+?)(\*\*)?\]\(([^)]+)\)/g
  for (const m of head.matchAll(linkRe)) {
    const text = cleanLinkText(m[2])
    const url = m[4]
    if (!/^https?:\/\//.test(url)) continue
    if (NON_THEATRE_HOST_RE.test(url)) continue
    if (isPersonContext(text, url)) continue
    if (!/театр|theatre|theater/i.test(text)) continue
    if (text.length > THEATRE_NAME_MAX_LEN) continue
    if (!looksLikeProperName(text)) continue
    return { name: text, url }
  }
  return {}
}

// Bold-label lines that aren't credits — meta fields handled elsewhere
// or just not interesting on the page.
const SKIP_CREDIT_LABELS =
  /^(?:tickets?|билет[ыа]?|website|сайт|premiere|премьера|age(?:\s+restrictions)?|возраст|возрастные(?:\s+ограничения)?|duration|продолжительность|category|категория|description|описание|тэги|tags)$/i

// Lines that signal the start of a cast list. Subsequent non-blank,
// non-bold-label lines until the next bold-label or heading get treated
// as cast members.
const CAST_TRIGGER =
  /(?:^|\s)(?:актер|актриса|actor|cast|состав|в\s+спектакле\s+(?:участву|занят|играют)|in\s+the\s+performance|в\s+ролях)/i

function extractCredits(body: string): CreditEntry[] {
  const credits: CreditEntry[] = []
  const lines = body.split('\n')
  // Bold label, optional separator (`:`, `-`, em/en dash), then value.
  const labelLine = /^\*\*([^*]+?)\*\*\s*[:\-–—]?\s*(.*)$/
  let castRoleLabel = ''
  let inCast = false

  function pushOne(role: string, raw: string) {
    const linkMatches = [...raw.matchAll(/\[([^\]]+?)\]\(([^)]+)\)/g)]
    if (linkMatches.length > 0) {
      for (const lm of linkMatches) {
        const name = lm[1].replace(/\*\*/g, '').replace(/[,.;]+$/, '').trim()
        if (!name) continue
        credits.push({ role, name, url: lm[2] })
      }
      return
    }
    // Plain text — could be one name or "Name1, Name2" list
    const parts = raw
      .replace(/\*\*/g, '')
      .split(/[,;](?![^()]*\))/) // split on commas not inside parens
      .map((p) => p.trim())
      .filter(Boolean)
    for (const p of parts) {
      if (p.length < 2 || p.length > 200) continue
      credits.push({ role, name: p })
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#') || line.startsWith('!')) {
      inCast = false
      continue
    }
    const m = line.match(labelLine)
    if (m) {
      const role = m[1].trim().replace(/[:.\-–—]+$/, '').trim()
      const value = m[2].trim()
      if (CAST_TRIGGER.test(role)) {
        castRoleLabel = role
        if (value) pushOne(role, value)
        else inCast = true
        continue
      }
      if (SKIP_CREDIT_LABELS.test(role)) {
        inCast = false
        continue
      }
      if (value) pushOne(role, value)
      // After a non-cast credit, reset cast state
      inCast = false
      continue
    }
    if (inCast) {
      // Stop if this line begins a new bold label (was caught above)
      // or a heading. Otherwise treat it as a cast row.
      pushOne(castRoleLabel, line)
    }
    if (credits.length >= 50) break
  }
  return credits
}

function extractTicketsUrl(body: string): string | undefined {
  // Match `**Tickets:** [...](url)` / `**Билеты:** [...](url)` / `**Билеты: [...](url)**`.
  const re = /\*\*\s*(?:tickets?|билет[ыа]?)\s*:?\s*\*?\*?\s*\[?\[?[^\]]*\]?\]?\(([^)]+)\)/i
  const m = body.match(re)
  return m?.[1]
}

function extractPremiereDate(body: string): string | undefined {
  // Match a line beginning with `**Premiere:**` or `**Премьера:**` and
  // capture everything after the closing bold marker. The `m` flag is
  // mandatory: without it, the previous non-greedy + optional `:?` form
  // collapsed to capturing just `:` because the engine found a 1-char
  // shortest match before the closing `**`.
  const lineRe =
    /^\*\*\s*(?:premiere|премьера)\s*:?\s*\*\*\s*(.+?)\s*$/im
  const m = body.match(lineRe)
  if (!m) return undefined
  const raw = m[1].trim().replace(/\s+/g, ' ').replace(/[*]/g, '').slice(0, 80)
  return raw || undefined
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
  // Lines starting with 🏆 / 🥇 / 🥈 / 🥉 are awards. 🏅 is reserved for
  // press-citation paragraphs Notion sometimes mixes into the section, so
  // it is intentionally NOT in the trigger set.
  //
  // Per-line format from Notion: `🏆 <date> – <category description>,
  // [**Festival Name**](url) (city)`. The festival name reliably sits at
  // the END of the line — earlier `[...]` brackets often point at actors
  // or jurors. We pick the LAST bracketed-link or the last «…» / "…"
  // quoted phrase. Year is clamped to 1990–2030 to reject URL fragments
  // like `…/128165/…` getting parsed as `1281`.
  const out: Production['awards'] = []
  const lines = body.split('\n')
  const yearRe = /\b(19[9]\d|20[0-3]\d)\b/g
  const linkAllRe = /\[([^\]]+?)\]\(([^)]+)\)/g
  const quotedRe = /[«"“]([^»"”]+?)[»"”]/g
  // "First Last" in Cyrillic — the laureate-name pattern that otherwise
  // wins the "last link" prize over the actual festival.
  const personNameRe = /^[А-ЯЁ][а-яё-]+\s[А-ЯЁ][а-яё-]+$/

  function isPersonLink(text: string, url: string): boolean {
    if (/\/pers\//.test(url)) return true
    if (personNameRe.test(text.replace(/\*\*/g, '').trim())) return true
    return false
  }

  function firstQuoted(s: string): string | null {
    // FIRST, not last: when a 🏆 line has no festival link, the festival
    // is the first quoted phrase. Subsequent quotes are typically the
    // nomination category ("Лучшая женская роль") or the play title
    // referenced at the end of an actor-laureate sentence ("Гипс").
    quotedRe.lastIndex = 0
    const m = quotedRe.exec(s)
    return m ? m[1] : null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    // `u` flag is mandatory: without it, surrogate-pair emoji share
    // their high surrogate (`\uD83C`) inside the character class, so
    // `🏅` (press-citation) leaks past `[🏆🥇🥈🥉]`.
    if (!/^[🏆🥇🥈🥉]/u.test(line)) continue

    const yearMatches = [...line.matchAll(yearRe)]
    const year = yearMatches.length
      ? Number(yearMatches[yearMatches.length - 1][1])
      : undefined

    // Walk all [text](url) links, skipping person/laureate ones, and
    // take the LAST festival link. Falls through to last «…»/"…" quote
    // when the line has no festival link (Structure C/D).
    const links = [...line.matchAll(linkAllRe)]
    let name: string | null = null
    for (let i = links.length - 1; i >= 0; i--) {
      const [, text, url] = links[i]
      if (isPersonLink(text, url)) continue
      name = text
      break
    }
    if (!name) name = firstQuoted(line)
    if (!name) {
      // No link / quote — fall back to the line minus the emoji and date.
      name = line
        .replace(/^[🏆🥇🥈🥉]\s*/u, '')
        .replace(yearRe, '')
        .slice(0, 80)
    }
    name = name
      .replace(/\*\*/g, '')
      .replace(/^[\s.,:;–—-]+|[\s.,:;–—-]+$/g, '')
      .trim()
    if (!name) continue

    out.push(year ? { name, year } : { name })
    if (out.length >= 10) break
  }
  return out
}

function stripInlineMd(s: string): string {
  // [[text]](url) → text  (Notion's nested-bracket form for `[website]` link)
  // [text](url)   → text
  // Then drop bold markers (**), backticks, HTML tags Notion emits for
  // asides, and collapse whitespace runs.
  return s
    .replace(/\[\[([^\]]+)\]\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/<\/?(?:aside|details|summary|figure|figcaption)[^>]*>/gi, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isUrlOrPromoOnly(plain: string): boolean {
  // After stripping MD, paragraph is just a URL (Notion auto-linkifies bare
  // URLs, so a synopsis-position paragraph that's only `https://…` is noise).
  if (/^https?:\/\/\S+$/i.test(plain)) return true
  // Ticket / premiere / age / duration meta lines are not prose. The MD
  // body usually has these as standalone paragraphs near the top — Notion
  // surfaces them as bolded labels with values or links. Skip explicitly so
  // they don't masquerade as synopsis text just because the URL pushes them
  // over the 60-char floor.
  if (/^(tickets?|билеты|website|сайт|premiere|премьера|age|возраст|duration|продолжительность|category|категория)\b[\s:;.\-]/i.test(plain)) {
    return true
  }
  return false
}

function looksLikeCastList(rawParagraph: string): boolean {
  // Notion exports cast lists as a single "paragraph" with internal newlines
  // — `Имя – Роль\nИмя – Роль\n…`. Real prose paragraphs come as one
  // wrapped line. Heuristic: ≥ 3 internal newlines AND a majority of those
  // lines contain a role-name separator (em-dash / en-dash / hyphen).
  const lines = rawParagraph.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 3) return false
  const sep = lines.filter((l) => /\s[–—-]\s/.test(l)).length
  return sep >= Math.ceil(lines.length / 2)
}

function extractSynopsis(body: string): string {
  // First non-empty paragraph that isn't a heading/quote/image, and that
  // contains real prose (not a URL, ticket-promo line, or cast list).
  const paras = body.split(/\n\s*\n/)
  for (const p of paras) {
    const trimmed = p.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('!['))
      continue
    if (looksLikeCastList(trimmed)) continue
    const plain = stripInlineMd(trimmed)
    if (plain.length < 60) continue
    if (isUrlOrPromoOnly(plain)) continue
    return plain.slice(0, 600)
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

# Awards override. The sync extracts awards heuristically from 🏆 lines
# in the Notion MD body — robust for festival-link patterns, less
# reliable when the festival sits in plain prose. If the auto-extracted
# list looks wrong on /awards, drop the corrected list here and it will
# replace the auto-extracted one entirely.
#
# Auto-extracted (${prod.awards.length} entries): leave commented to keep,
# or uncomment + edit to override.
# awards:
${
  prod.awards.length === 0
    ? '#   - { name: "Festival Name", year: 2024, city: "Москва", category: "Лауреат" }'
    : prod.awards
        .map(
          (a) =>
            `#   - name: ${JSON.stringify(a.name)}` +
            (a.year ? `\n#     year: ${a.year}` : '') +
            (a.city ? `\n#     city: ${JSON.stringify(a.city)}` : '') +
            (a.category ? `\n#     category: ${JSON.stringify(a.category)}` : '')
        )
        .join('\n')
}
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
  //    Q1: skip slugs in NON_PRODUCTION_SLUGS (nav / bio / festival pages).
  //    Q2: when CSV `Slug` is empty AND slugify(Name) returns empty
  //    (Cyrillic-only Name), look up MANUAL_SIBLING_PAIRS to attach the
  //    row to its EN sibling's group.
  const groups = new Map<string, CsvRow[]>()
  let droppedNonProduction = 0
  let pairedManually = 0
  for (const row of rows) {
    if (!row.Public || row.Public.toLowerCase() !== 'yes') continue
    let rawSlug = (row.Slug || slugify(row.Name)).toLowerCase()
    if (!rawSlug && MANUAL_SIBLING_PAIRS[row.Name]) {
      rawSlug = MANUAL_SIBLING_PAIRS[row.Name]
      pairedManually++
    }
    if (!rawSlug) continue
    const slug = rawSlug.replace(/-(en|eng)$/, '')
    if (NON_PRODUCTION_SLUGS.has(slug)) {
      droppedNonProduction++
      continue
    }
    const list = groups.get(slug) ?? []
    list.push(row)
    groups.set(slug, list)
  }
  console.log(
    `[sync] grouped slugs: ${groups.size}` +
      ` (filtered ${droppedNonProduction} non-production rows,` +
      ` paired ${pairedManually} unsluggable RU siblings)`
  )

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
      credits: { ru: [], en: [] },
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
      const locale = rowLocale(row)

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

    // Q4 — extract awards from the RU body when present, falling back to
    // EN. Festival names are predominantly Russian; using RU as canonical
    // matches the press-page rule (DESIGN §3 "stay in original language")
    // and stops the EN body's mixed RU/Latin annotations from leaking
    // into the awards list.
    const awardsBody = prod.body.ru || prod.body.en || primaryBody
    prod.awards = extractAwards(awardsBody)

    // Per-locale credits — render in source language so role labels read
    // naturally to a curator browsing in that locale.
    prod.credits = {
      ru: prod.body.ru ? extractCredits(prod.body.ru) : [],
      en: prod.body.en ? extractCredits(prod.body.en) : []
    }
    // Per-locale premiere date — formatted strings differ between RU/EN.
    const premiereRu = prod.body.ru ? extractPremiereDate(prod.body.ru) : undefined
    const premiereEn = prod.body.en ? extractPremiereDate(prod.body.en) : undefined
    if (premiereRu || premiereEn) {
      prod.premiereDate = {
        ...(premiereRu ? { ru: premiereRu } : {}),
        ...(premiereEn ? { en: premiereEn } : {})
      }
    }
    // Tickets URL — language-agnostic. Prefer whichever body has it first.
    const ticketsUrl =
      extractTicketsUrl(prod.body.ru ?? '') ||
      extractTicketsUrl(prod.body.en ?? '')
    if (ticketsUrl) prod.ticketsUrl = ticketsUrl

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
