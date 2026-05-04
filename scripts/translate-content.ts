#!/usr/bin/env tsx
/**
 * translate-content.ts — fill missing locale fields in content/ using an LLM.
 *
 * tsx scripts/translate-content.ts [--dry-run] [--slug <slug>] [--target en|de|ru]
 *                                  [--force] [--only fields|body|about]
 *                                  [--limit N] [--report] [--budget <usd>]
 *                                  [--provider anthropic|cerebras|openrouter|gemini]
 *
 * Provider auto-detection order (first key found in env wins):
 *   ANTHROPIC_API_KEY → CEREBRAS_API_KEY → OPENROUTER_API_KEY → GEMINI_API_KEY
 */
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createHash } from 'crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { join, resolve } from 'path'
import { parseArgs } from 'util'
import { parseDocument } from 'yaml'
import pMap from 'p-map'

// ── Types ─────────────────────────────────────────────────────────────────────

type Locale = 'ru' | 'en' | 'de'
type FieldKind =
  | 'title'
  | 'synopsis'
  | 'directorsNote'
  | 'tagline'
  | 'bookingCtaLabel'
  | 'role'
  | 'caption'
  | 'date'
  | 'body'
  | 'about'
  | 'venue'        // theatre / venue names, cities — short proper-noun-ish labels
  | 'awardName'    // award + festival names
  | 'awardCity'    // city of award/festival/run
  | 'awardCategory'
  | 'linkLabel'    // externalLinks[].label
  | 'runVenue'     // runs[].venue
  | 'runCount'     // runs[].count e.g. "12 shows"
  | 'tourCity'     // tour[] entries (city names)

interface TranslateJob {
  srcLocale: Locale
  tgtLocale: Locale
  fieldKind: FieldKind
  sourceText: string
}

const stats = {
  inputTokens: 0,
  outputTokens: 0,
  filesChanged: 0,
  cacheHits: 0,
  cost: 0,
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const { values: argv } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    slug:      { type: 'string',  multiple: true },
    target:    { type: 'string',  multiple: true },
    force:     { type: 'boolean', default: false },
    only:      { type: 'string' },
    limit:     { type: 'string' },
    report:    { type: 'boolean', default: false },
    budget:    { type: 'string' },
    provider:  { type: 'string' },
  },
  strict: false,
})

const dryRun        = argv['dry-run'] as boolean
const slugFilter    = (argv.slug   as string[] | undefined) ?? []
const targetLocales = ((argv.target as string[] | undefined) ?? []) as Locale[]
const force         = argv.force as boolean
const onlyScope     = argv.only as 'fields' | 'body' | 'about' | undefined
const limitN        = argv.limit  ? parseInt(argv.limit as string, 10) : Infinity
const reportOnly    = argv.report as boolean
const budgetUsd     = argv.budget ? parseFloat(argv.budget as string) : Infinity

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT            = resolve(process.cwd())
const PRODUCTIONS_DIR = join(ROOT, 'content', 'productions')
const ABOUT_DIR       = join(ROOT, 'content', 'about')
const CACHE_DIR       = join(ROOT, '.cache', 'translate')

const LOCALES: Locale[] = ['ru', 'en', 'de']

// ── Provider config ───────────────────────────────────────────────────────────

interface ProviderCfg {
  envKey:      string
  baseUrl?:    string      // undefined = Anthropic native SDK
  proseModel:  string
  shortModel:  string
  pricing:     { in: number; out: number } // per 1M tokens, rough
}

const PROVIDER_CFGS: Record<string, ProviderCfg> = {
  anthropic: {
    envKey:      'ANTHROPIC_API_KEY',
    proseModel:  'claude-opus-4-7',
    shortModel:  'claude-haiku-4-5-20251001',
    pricing:     { in: 15, out: 75 },
  },
  cerebras: {
    envKey:      'CEREBRAS_API_KEY',
    baseUrl:     'https://api.cerebras.ai/v1',
    proseModel:  'llama-3.3-70b',
    shortModel:  'llama3.1-8b',
    pricing:     { in: 0, out: 0 },  // free tier
  },
  openrouter: {
    envKey:      'OPENROUTER_API_KEY',
    baseUrl:     'https://openrouter.ai/api/v1',
    proseModel:  'google/gemini-2.0-flash-001',
    shortModel:  'google/gemini-2.0-flash-lite-001',
    pricing:     { in: 0.1, out: 0.4 },
  },
  gemini: {
    envKey:      'GEMINI_API_KEY',
    baseUrl:     'https://generativelanguage.googleapis.com/v1beta/openai/',
    proseModel:  'gemini-2.0-flash',
    shortModel:  'gemini-2.0-flash-lite',
    pricing:     { in: 0.1, out: 0.4 },
  },
}

// ── Provider chain ────────────────────────────────────────────────────────────

const DETECTION_ORDER = ['anthropic', 'cerebras', 'openrouter', 'gemini']

function buildProviderChain(requireKey: boolean): string[] {
  const preferred = argv.provider as string | undefined
  if (preferred && !PROVIDER_CFGS[preferred]) {
    console.error(`[translate] unknown provider "${preferred}". Choose: ${Object.keys(PROVIDER_CFGS).join(', ')}`)
    process.exit(1)
  }
  const available = DETECTION_ORDER.filter((n) => process.env[PROVIDER_CFGS[n].envKey])
  if (available.length === 0) {
    if (!requireKey) return []
    console.error('[translate] no API key found. Set one of: ANTHROPIC_API_KEY, CEREBRAS_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY')
    process.exit(1)
  }
  if (!preferred) return available
  return [preferred, ...available.filter((n) => n !== preferred)]
}

// --report makes no API calls, so it doesn't need a key.
const PROVIDER_CHAIN = buildProviderChain(/* requireKey */ !reportOnly)

// ── LLM clients (one per provider, lazy) ──────────────────────────────────────

const _anthropicClients: Record<string, Anthropic> = {}
const _openaiClients:    Record<string, OpenAI>    = {}

function getClient(provider: string): Anthropic | OpenAI {
  const cfg = PROVIDER_CFGS[provider]
  if (provider === 'anthropic') {
    if (!_anthropicClients[provider])
      _anthropicClients[provider] = new Anthropic({ apiKey: process.env[cfg.envKey] })
    return _anthropicClients[provider]
  }
  if (!_openaiClients[provider])
    _openaiClients[provider] = new OpenAI({ apiKey: process.env[cfg.envKey], baseURL: cfg.baseUrl })
  return _openaiClients[provider]
}

const PROSE_KINDS: FieldKind[] = ['synopsis', 'directorsNote', 'body', 'about']

function modelFor(provider: string, kind: FieldKind): string {
  const cfg = PROVIDER_CFGS[provider]
  return PROSE_KINDS.includes(kind) ? cfg.proseModel : cfg.shortModel
}

// Whether an error should cause us to try the next provider vs hard-fail
function shouldRotate(err: any): boolean {
  const status = err?.status ?? err?.response?.status
  if (!status) return true   // network-level error → try next
  // 401/403 = bad key for this provider → try next
  // 404     = model/endpoint not found → try next
  // 429     = rate limited → try next
  // 5xx     = server error → try next
  return status !== 400      // 400 Bad Request is our fault, don't rotate
}

// Single attempt to one provider — throws on any failure
async function callProvider(provider: string, job: TranslateJob, userMsg: string): Promise<string> {
  const model = modelFor(provider, job.fieldKind)

  if (provider === 'anthropic') {
    const msg = await (getClient(provider) as Anthropic).messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    })
    const cfg = PROVIDER_CFGS[provider]
    const u   = msg.usage
    stats.inputTokens  += u.input_tokens
    stats.outputTokens += u.output_tokens
    stats.cost         += (u.input_tokens * cfg.pricing.in + u.output_tokens * cfg.pricing.out) / 1_000_000
    return (msg.content[0] as { type: 'text'; text: string }).text.trim()
  } else {
    const msg = await (getClient(provider) as OpenAI).chat.completions.create({
      model,
      max_tokens: 2048,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMsg },
      ],
    })
    const cfg = PROVIDER_CFGS[provider]
    const u   = msg.usage
    stats.inputTokens  += u?.prompt_tokens     ?? 0
    stats.outputTokens += u?.completion_tokens ?? 0
    stats.cost         += ((u?.prompt_tokens ?? 0) * cfg.pricing.in + (u?.completion_tokens ?? 0) * cfg.pricing.out) / 1_000_000
    return (msg.choices[0].message.content ?? '').trim()
  }
}

// ── Cache ─────────────────────────────────────────────────────────────────────

function cacheKey(job: TranslateJob): string {
  return createHash('sha256')
    .update(`${job.srcLocale}:${job.tgtLocale}:${job.fieldKind}:${job.sourceText}`)
    .digest('hex')
}

function cacheGet(job: TranslateJob): string | null {
  const p = join(CACHE_DIR, `${cacheKey(job)}.txt`)
  if (existsSync(p)) {
    stats.cacheHits++
    return readFileSync(p, 'utf8')
  }
  return null
}

function cacheSet(job: TranslateJob, text: string) {
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(join(CACHE_DIR, `${cacheKey(job)}.txt`), text, 'utf8')
}

// ── Translation ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You translate theatre production metadata for boklanov.com.
Hard rules:
  - Output ONLY the translated string. No quotes, no commentary, no leading/trailing whitespace.
  - Preserve past-tense framing for tour/staging language ("STAGED IN", "INSZENIERTE IN").
  - Do NOT translate proper names of people. Mirror them verbatim.
  - Theatre, venue, and city names: use the established localized form when one exists
    ("Большой театр кукол" ↔ "Bolshoi Puppet Theatre" ↔ "Bolschoi-Puppentheater";
     "Санкт-Петербург" ↔ "Saint Petersburg" ↔ "Sankt Petersburg").
    If no canonical localized form exists, transliterate; do not invent.
  - Award and festival names: same rule. Translate descriptive parts ("Золотой софит" → "Golden Spotlight"),
    transliterate or keep original if it's an established proper noun.
  - Match the existing register: terse, no marketing, no exclamation inflation.
  - For dates: emit native locale form. RU "10 октября 2021 г.", EN "October 10, 2021", DE "10. Oktober 2021".`

async function translateText(job: TranslateJob): Promise<string> {
  const cached = cacheGet(job)
  if (cached !== null) return cached

  if (stats.cost >= budgetUsd) {
    throw new Error(`Budget $${budgetUsd} exceeded (spent ~$${stats.cost.toFixed(2)})`)
  }

  const userMsg = `<field_kind=${job.fieldKind}>\n<${job.srcLocale}> → <${job.tgtLocale}>\n---\n${job.sourceText}`

  let lastErr: unknown
  for (const provider of PROVIDER_CHAIN) {
    // one retry within each provider before rotating
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await callProvider(provider, job, userMsg)
        cacheSet(job, text)
        return text
      } catch (err: any) {
        lastErr = err
        if (!shouldRotate(err)) throw err        // 400 Bad Request — our fault, stop
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500))
        } else {
          // second failure on this provider — rotate
          const status = err?.status ?? '?'
          process.stderr.write(`  [warn] ${provider} failed (${status}), trying next provider\n`)
        }
      }
    }
  }
  throw lastErr
}

// ── YAML helpers ──────────────────────────────────────────────────────────────

function isEmpty(val: unknown): boolean {
  return val === null || val === undefined || (typeof val === 'string' && val.trim() === '')
}

function pickSource(values: Record<Locale, string | null | undefined>): [Locale, string] | null {
  for (const loc of LOCALES) {
    const v = values[loc]
    if (!isEmpty(v)) return [loc, v as string]
  }
  return null
}

function pickSourceField(data: any, field: string): [Locale, string] | null {
  return pickSource({
    ru: data[field]?.ru ?? null,
    en: data[field]?.en ?? null,
    de: data[field]?.de ?? null,
  })
}

function activeTargets(exclude?: Locale): Locale[] {
  const candidates = targetLocales.length ? targetLocales : LOCALES
  return exclude ? candidates.filter((l) => l !== exclude) : candidates
}

// Heuristic for plain-string L10nString values: pick a source locale from the script.
function inferLocaleFromText(s: string): Locale {
  if (/[А-Яа-яЁё]/.test(s)) return 'ru'
  if (/[äöüÄÖÜß]/.test(s)) return 'de'
  return 'en'
}

// L10nString = string | { ru?, en?, de? }. Returns true if any locale was filled / value upgraded.
async function translateL10nString(
  doc: ReturnType<typeof parseDocument>,
  currentVal: unknown,
  path: (string | number)[],
  fieldKind: FieldKind,
  logLabel: string,
): Promise<boolean> {
  if (currentVal === null || currentVal === undefined) return false
  if (typeof currentVal === 'string' && currentVal.trim() === '') return false

  let obj: Record<Locale, string>
  let srcLoc: Locale
  let srcText: string
  const wasString = typeof currentVal === 'string'

  if (wasString) {
    srcText = currentVal as string
    srcLoc  = inferLocaleFromText(srcText)
    obj     = { [srcLoc]: srcText } as Record<Locale, string>
  } else if (typeof currentVal === 'object') {
    const src = pickSource(currentVal as Record<Locale, string | null | undefined>)
    if (!src) return false
    ;[srcLoc, srcText] = src
    obj = { ...(currentVal as Record<Locale, string>) }
  } else {
    return false
  }

  let touched = false
  for (const loc of activeTargets(srcLoc)) {
    if (!isEmpty(obj[loc]) && !force) continue
    const t = await translateText({ srcLocale: srcLoc, tgtLocale: loc, fieldKind, sourceText: srcText })
    console.log(`  ${logLabel}.${loc} ← ${t.slice(0, 60)}${t.length > 60 ? '…' : ''}`)
    obj[loc] = t
    touched  = true
  }

  if ((touched || wasString) && !dryRun) {
    doc.setIn(path, doc.createNode(obj))
  }
  return touched || wasString
}

// Counts how many locale fills a given L10nString value would need (for the gap report).
function l10nStringGaps(val: unknown): Locale[] {
  if (val === null || val === undefined) return []
  if (typeof val === 'string') {
    if (val.trim() === '') return []
    const src = inferLocaleFromText(val)
    return LOCALES.filter((l) => l !== src)
  }
  if (typeof val === 'object') {
    const o = val as Record<Locale, string | null | undefined>
    const hasAny = LOCALES.some((l) => !isEmpty(o[l]))
    if (!hasAny) return []
    return LOCALES.filter((l) => isEmpty(o[l]))
  }
  return []
}

// ── Report ────────────────────────────────────────────────────────────────────

interface GapRow {
  slug: string
  kind: string
  field: string
  locale: Locale
}

function gapsForProduction(slug: string, yamlPath: string): GapRow[] {
  const data = parseDocument(readFileSync(yamlPath, 'utf8')).toJS() as any
  const dir  = join(PRODUCTIONS_DIR, slug)
  const rows: GapRow[] = []

  for (const field of ['title', 'synopsis', 'directorsNote', 'tagline', 'bookingCtaLabel'] as const) {
    if (!data[field] || typeof data[field] !== 'object') continue
    const src = pickSourceField(data, field)
    if (!src) continue
    for (const loc of LOCALES) {
      if (isEmpty(data[field]?.[loc]))
        rows.push({ slug, kind: 'field', field, locale: loc })
    }
  }

  // theatre.{name,shortName,city}
  if (data.theatre) {
    for (const key of ['name', 'shortName', 'city'] as const) {
      for (const loc of l10nStringGaps(data.theatre[key]))
        rows.push({ slug, kind: 'theatre', field: `theatre.${key}`, locale: loc })
    }
  }

  // awards / festivals
  for (const collection of ['awards', 'festivals'] as const) {
    if (!Array.isArray(data[collection])) continue
    data[collection].forEach((item: any, idx: number) => {
      for (const key of ['name', 'category', 'city'] as const) {
        for (const loc of l10nStringGaps(item?.[key]))
          rows.push({ slug, kind: collection, field: `${collection}[${idx}].${key}`, locale: loc })
      }
    })
  }

  // externalLinks[].label
  if (Array.isArray(data.externalLinks)) {
    data.externalLinks.forEach((l: any, idx: number) => {
      for (const loc of l10nStringGaps(l?.label))
        rows.push({ slug, kind: 'links', field: `externalLinks[${idx}].label`, locale: loc })
    })
  }

  // runs[]
  if (Array.isArray(data.runs)) {
    data.runs.forEach((r: any, idx: number) => {
      for (const key of ['venue', 'city', 'count'] as const) {
        for (const loc of l10nStringGaps(r?.[key]))
          rows.push({ slug, kind: 'runs', field: `runs[${idx}].${key}`, locale: loc })
      }
    })
  }

  // tour[]
  if (Array.isArray(data.tour)) {
    data.tour.forEach((c: any, idx: number) => {
      for (const loc of l10nStringGaps(c))
        rows.push({ slug, kind: 'tour', field: `tour[${idx}]`, locale: loc })
    })
  }

  if (data.premiereDate) {
    const src = pickSource(data.premiereDate)
    if (src) {
      for (const loc of LOCALES)
        if (isEmpty(data.premiereDate?.[loc]))
          rows.push({ slug, kind: 'field', field: 'premiereDate', locale: loc })
    }
  }

  if (data.credits) {
    const srcLoc = LOCALES.find((l) => Array.isArray(data.credits[l]) && data.credits[l].length > 0)
    if (srcLoc) {
      for (const loc of LOCALES) {
        if (loc === srcLoc) continue
        const tgt = data.credits[loc]
        if (!Array.isArray(tgt) || tgt.length === 0)
          rows.push({ slug, kind: 'credits', field: 'credits', locale: loc })
      }
    }
  }

  if (Array.isArray(data.press)) {
    data.press.forEach((item: any, idx: number) => {
      if (!item?.title) return
      if (typeof item.title === 'string') {
        const srcLoc = (item.language as Locale | undefined) ?? 'ru'
        for (const loc of LOCALES)
          if (loc !== srcLoc)
            rows.push({ slug, kind: 'press', field: `press[${idx}].title`, locale: loc })
      } else {
        const hasSrc = LOCALES.some((l) => !isEmpty(item.title[l]))
        if (!hasSrc) return
        for (const loc of LOCALES)
          if (isEmpty(item.title[loc]))
            rows.push({ slug, kind: 'press', field: `press[${idx}].title`, locale: loc })
      }
    })
  }

  if (Array.isArray(data.gallery)) {
    data.gallery.forEach((item: any, idx: number) => {
      if (!item.caption) return
      const hasSrc = LOCALES.some((l) => !isEmpty(item.caption[l]))
      if (!hasSrc) return
      for (const loc of LOCALES)
        if (isEmpty(item.caption[loc]))
          rows.push({ slug, kind: 'caption', field: `gallery[${idx}].caption`, locale: loc })
    })
  }

  for (const loc of LOCALES) {
    const bodyPath = join(dir, `body.${loc}.md`)
    const sibling  = LOCALES.find((l) => l !== loc && existsSync(join(dir, `body.${l}.md`)))
    if (!existsSync(bodyPath) && sibling)
      rows.push({ slug, kind: 'body', field: `body.${loc}.md`, locale: loc })
  }

  return rows
}

function runReport() {
  const slugs = productionSlugs()
  const rows: GapRow[] = []

  for (const slug of slugs) {
    const yamlPath = join(PRODUCTIONS_DIR, slug, 'index.yaml')
    if (!existsSync(yamlPath)) continue
    rows.push(...gapsForProduction(slug, yamlPath))
  }

  // about gaps
  for (const loc of LOCALES) {
    const p = join(ABOUT_DIR, `${loc}.yaml`)
    if (!existsSync(p)) rows.push({ slug: 'about', kind: 'about', field: `${loc}.yaml`, locale: loc })
    const m = join(ABOUT_DIR, `${loc}.md`)
    if (!existsSync(m)) rows.push({ slug: 'about', kind: 'about', field: `${loc}.md`, locale: loc })
  }

  console.log('\nGap report\n')
  console.log('Slug'.padEnd(34) + 'Kind'.padEnd(10) + 'Field'.padEnd(28) + 'Locale')
  console.log('─'.repeat(78))
  for (const r of rows)
    console.log(r.slug.padEnd(34) + r.kind.padEnd(10) + r.field.padEnd(28) + r.locale)
  console.log(`\nTotal gaps: ${rows.length}`)
}

// ── Production slugs ──────────────────────────────────────────────────────────

function productionSlugs(): string[] {
  let slugs = readdirSync(PRODUCTIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
  if (slugFilter.length) slugs = slugs.filter((s) => slugFilter.includes(s))
  return slugs
}

// ── Write with backup ─────────────────────────────────────────────────────────

const modifiedFiles: string[] = []

function writeWithBackup(path: string, content: string) {
  const bak = path + '.bak'
  if (existsSync(path)) writeFileSync(bak, readFileSync(path, 'utf8'), 'utf8')
  writeFileSync(path, content, 'utf8')
  if (!modifiedFiles.includes(path)) modifiedFiles.push(path)
  stats.filesChanged++
}

function cleanupBaks() {
  for (const p of modifiedFiles) {
    const bak = p + '.bak'
    if (existsSync(bak)) try { unlinkSync(bak) } catch {}
  }
}

function restoreAllBaks() {
  for (const p of modifiedFiles) {
    const bak = p + '.bak'
    if (existsSync(bak)) {
      writeFileSync(p, readFileSync(bak, 'utf8'), 'utf8')
      try { unlinkSync(bak) } catch {}
      console.error(`  restored: ${p.replace(ROOT, '.')}`)
    }
  }
}

// ── Lint check ────────────────────────────────────────────────────────────────

function runLintContent(): boolean {
  // Inline the wikilink check (same logic as scripts/lint-content.ts)
  const WIKILINK = /!\[\[.+?\]\]/
  function mdFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? mdFiles(join(dir, e.name))
        : e.name.endsWith('.md')
          ? [join(dir, e.name)]
          : []
    )
  }
  let ok = true
  for (const f of mdFiles(join(ROOT, 'content'))) {
    if (WIKILINK.test(readFileSync(f, 'utf8'))) {
      console.error(`  [lint] Obsidian wikilink in ${f.replace(ROOT, '.')}`)
      ok = false
    }
  }
  return ok
}

// ── Translate a production ────────────────────────────────────────────────────

async function translateProduction(slug: string) {
  const dir      = join(PRODUCTIONS_DIR, slug)
  const yamlPath = join(dir, 'index.yaml')
  if (!existsSync(yamlPath)) return

  const rawYaml = readFileSync(yamlPath, 'utf8')
  const doc      = parseDocument(rawYaml)
  const data     = doc.toJS() as any
  let   changed  = false

  // scalar locale fields
  if (!onlyScope || onlyScope === 'fields') {
    const SCALAR_LOCALE_FIELDS: Array<[string, FieldKind]> = [
      ['title',           'title'],
      ['synopsis',        'synopsis'],
      ['directorsNote',   'directorsNote'],
      ['tagline',         'tagline'],
      ['bookingCtaLabel', 'bookingCtaLabel'],
    ]
    for (const [field, kind] of SCALAR_LOCALE_FIELDS) {
      const obj = data[field]
      if (!obj || typeof obj !== 'object') continue
      const src = pickSourceField(data, field)
      if (!src) continue
      const [srcLocale, srcText] = src

      for (const loc of activeTargets(force ? undefined : srcLocale)) {
        if (!isEmpty(data[field]?.[loc]) && !force) continue
        const t = await translateText({ srcLocale, tgtLocale: loc, fieldKind: kind, sourceText: srcText })
        console.log(`  ${slug} ${field}.${loc} ← ${t.slice(0, 60)}${t.length > 60 ? '…' : ''}`)
        if (!dryRun) { doc.setIn([field, loc], t); changed = true }
      }
    }

    // premiereDate
    if (data.premiereDate) {
      const src = pickSource(data.premiereDate)
      if (src) {
        const [srcLocale, srcText] = src
        for (const loc of activeTargets(force ? undefined : srcLocale)) {
          if (!isEmpty(data.premiereDate?.[loc]) && !force) continue
          const t = await translateText({ srcLocale, tgtLocale: loc, fieldKind: 'date', sourceText: srcText })
          console.log(`  ${slug} premiereDate.${loc} ← ${t}`)
          if (!dryRun) { doc.setIn(['premiereDate', loc], t); changed = true }
        }
      }
    }

    // credits
    if (data.credits) {
      const srcLocale = LOCALES.find(
        (l) => Array.isArray(data.credits[l]) && (data.credits[l] as any[]).length > 0
      )
      if (srcLocale) {
        const srcList = data.credits[srcLocale] as Array<{ role: string; name: string; url?: string }>
        for (const loc of activeTargets(srcLocale)) {
          const tgtList = data.credits[loc]
          if (Array.isArray(tgtList) && tgtList.length > 0 && !force) continue
          const newList = await pMap(
            srcList,
            async (item) => {
              const r = await translateText({
                srcLocale,
                tgtLocale: loc,
                fieldKind: 'role',
                sourceText: item.role,
              })
              const out: Record<string, string> = { role: r, name: item.name }
              if (item.url) out.url = item.url
              return out
            },
            { concurrency: 4 }
          )
          console.log(`  ${slug} credits.${loc} ← ${newList.length} entries`)
          if (!dryRun) { doc.setIn(['credits', loc], doc.createNode(newList)); changed = true }
        }
      }
    }

    // press titles — translate when string or when locale-keyed but missing variants
    if (Array.isArray(data.press) && data.press.length > 0) {
      for (let i = 0; i < data.press.length; i++) {
        const item = data.press[i]
        if (!item?.title) continue
        const titleIsString = typeof item.title === 'string'
        // Determine source locale and text
        let srcLoc: Locale
        let srcText: string
        if (titleIsString) {
          // Plain string: language field tells us locale, else default ru
          const lang = item.language as Locale | undefined
          srcLoc  = (lang && LOCALES.includes(lang)) ? lang : 'ru'
          srcText = item.title
        } else {
          // Already locale-keyed: pick best source
          const src = pickSource(item.title)
          if (!src) continue
          ;[srcLoc, srcText] = src
        }

        // Build updated title object
        const titleObj: Record<Locale, string> = titleIsString
          ? { [srcLoc]: srcText } as Record<Locale, string>
          : { ...item.title }

        let pressChanged = false
        for (const loc of activeTargets(srcLoc)) {
          if (!isEmpty(titleObj[loc]) && !force) continue
          const t = await translateText({ srcLocale: srcLoc, tgtLocale: loc, fieldKind: 'title', sourceText: srcText })
          console.log(`  ${slug} press[${i}].title.${loc} ← ${t.slice(0, 60)}${t.length > 60 ? '…' : ''}`)
          titleObj[loc] = t
          pressChanged  = true
        }
        if (pressChanged || titleIsString) {
          if (!dryRun) { doc.setIn(['press', i, 'title'], doc.createNode(titleObj)); changed = true }
        }
      }
    }

    // gallery captions
    if (Array.isArray(data.gallery)) {
      for (let i = 0; i < data.gallery.length; i++) {
        const item = data.gallery[i]
        if (!item?.caption) continue
        const srcLoc = LOCALES.find((l) => !isEmpty(item.caption[l]))
        if (!srcLoc) continue
        const srcText = item.caption[srcLoc]
        for (const loc of activeTargets(srcLoc)) {
          if (!isEmpty(item.caption[loc]) && !force) continue
          const t = await translateText({ srcLocale: srcLoc, tgtLocale: loc, fieldKind: 'caption', sourceText: srcText })
          console.log(`  ${slug} gallery[${i}].caption.${loc} ← ${t.slice(0, 50)}`)
          if (!dryRun) { doc.setIn(['gallery', i, 'caption', loc], t); changed = true }
        }
      }
    }

    // theatre.{name,shortName,city} — L10nString
    if (data.theatre && typeof data.theatre === 'object') {
      for (const [key, kind] of [
        ['name',      'venue'],
        ['shortName', 'venue'],
        ['city',      'venue'],
      ] as Array<[string, FieldKind]>) {
        if (await translateL10nString(doc, data.theatre[key], ['theatre', key], kind, `${slug} theatre.${key}`))
          changed = true
      }
    }

    // awards[] — L10nString on name, category, city
    if (Array.isArray(data.awards)) {
      for (let i = 0; i < data.awards.length; i++) {
        const a = data.awards[i]
        if (!a) continue
        for (const [key, kind] of [
          ['name',     'awardName'],
          ['category', 'awardCategory'],
          ['city',     'awardCity'],
        ] as Array<[string, FieldKind]>) {
          if (await translateL10nString(doc, a[key], ['awards', i, key], kind, `${slug} awards[${i}].${key}`))
            changed = true
        }
      }
    }

    // festivals[] — same shape as awards
    if (Array.isArray(data.festivals)) {
      for (let i = 0; i < data.festivals.length; i++) {
        const f = data.festivals[i]
        if (!f) continue
        for (const [key, kind] of [
          ['name',     'awardName'],
          ['category', 'awardCategory'],
          ['city',     'awardCity'],
        ] as Array<[string, FieldKind]>) {
          if (await translateL10nString(doc, f[key], ['festivals', i, key], kind, `${slug} festivals[${i}].${key}`))
            changed = true
        }
      }
    }

    // externalLinks[].label — L10nString
    if (Array.isArray(data.externalLinks)) {
      for (let i = 0; i < data.externalLinks.length; i++) {
        const l = data.externalLinks[i]
        if (!l) continue
        if (await translateL10nString(doc, l.label, ['externalLinks', i, 'label'], 'linkLabel', `${slug} externalLinks[${i}].label`))
          changed = true
      }
    }

    // runs[].{venue,city,count} — L10nString
    if (Array.isArray(data.runs)) {
      for (let i = 0; i < data.runs.length; i++) {
        const r = data.runs[i]
        if (!r) continue
        for (const [key, kind] of [
          ['venue', 'runVenue'],
          ['city',  'awardCity'],
          ['count', 'runCount'],
        ] as Array<[string, FieldKind]>) {
          if (await translateL10nString(doc, r[key], ['runs', i, key], kind, `${slug} runs[${i}].${key}`))
            changed = true
        }
      }
    }

    // tour[] — array of L10nString city entries
    if (Array.isArray(data.tour)) {
      for (let i = 0; i < data.tour.length; i++) {
        if (await translateL10nString(doc, data.tour[i], ['tour', i], 'tourCity', `${slug} tour[${i}]`))
          changed = true
      }
    }

    if (changed && !dryRun) writeWithBackup(yamlPath, doc.toString())
  }

  // body files
  if (!onlyScope || onlyScope === 'body') {
    await translateBodyFiles(slug, dir)
  }
}

// ── Body file translation ─────────────────────────────────────────────────────

async function translateBodyFiles(slug: string, dir: string) {
  const srcLocale = LOCALES.find((l) => {
    const p = join(dir, `body.${l}.md`)
    return existsSync(p) && readFileSync(p, 'utf8').trim() !== ''
  })
  if (!srcLocale) return

  const srcText = readFileSync(join(dir, `body.${srcLocale}.md`), 'utf8')

  for (const loc of activeTargets(srcLocale)) {
    const bodyPath = join(dir, `body.${loc}.md`)
    if (existsSync(bodyPath) && readFileSync(bodyPath, 'utf8').trim() !== '' && !force) continue
    const t = await translateText({ srcLocale, tgtLocale: loc, fieldKind: 'body', sourceText: srcText })
    console.log(`  ${slug} body.${loc}.md ← ${t.length} chars`)
    if (!dryRun) writeWithBackup(bodyPath, t.endsWith('\n') ? t : t + '\n')
  }
}

// ── About page translation ────────────────────────────────────────────────────

async function translateAbout() {
  if (onlyScope && onlyScope !== 'about') return

  // Structured YAML: translate milestones.label, lineage.role/.note, marginalia
  const srcYamlLocale = LOCALES.find((l) => existsSync(join(ABOUT_DIR, `${l}.yaml`)))
  if (!srcYamlLocale) return

  const srcYamlRaw = readFileSync(join(ABOUT_DIR, `${srcYamlLocale}.yaml`), 'utf8')
  const srcData    = parseDocument(srcYamlRaw).toJS() as any

  for (const loc of activeTargets(srcYamlLocale)) {
    const tgtPath      = join(ABOUT_DIR, `${loc}.yaml`)
    const tgtExists    = existsSync(tgtPath)
    const newFile      = !tgtExists
    const tgtDoc       = tgtExists
      ? parseDocument(readFileSync(tgtPath, 'utf8'))
      : parseDocument(srcYamlRaw)
    const tgtData      = tgtDoc.toJS() as any
    let   changed      = false

    // milestones[].label
    if (Array.isArray(srcData.milestones)) {
      for (let i = 0; i < srcData.milestones.length; i++) {
        const srcLabel = srcData.milestones[i]?.label
        const tgtLabel = tgtData.milestones?.[i]?.label
        if (!isEmpty(srcLabel) && (newFile || isEmpty(tgtLabel) || force)) {
          const t = await translateText({ srcLocale: srcYamlLocale, tgtLocale: loc, fieldKind: 'about', sourceText: srcLabel })
          console.log(`  about milestones[${i}].label.${loc} ← ${t.slice(0, 60)}`)
          if (!dryRun) { tgtDoc.setIn(['milestones', i, 'label'], t); changed = true }
        }
      }
    }

    // lineage[].role and .note
    if (Array.isArray(srcData.lineage)) {
      for (let i = 0; i < srcData.lineage.length; i++) {
        for (const key of ['role', 'note'] as const) {
          const srcVal = srcData.lineage[i]?.[key]
          const tgtVal = tgtData.lineage?.[i]?.[key]
          if (!isEmpty(srcVal) && (newFile || isEmpty(tgtVal) || force)) {
            const t = await translateText({ srcLocale: srcYamlLocale, tgtLocale: loc, fieldKind: 'about', sourceText: srcVal })
            console.log(`  about lineage[${i}].${key}.${loc} ← ${t.slice(0, 60)}`)
            if (!dryRun) { tgtDoc.setIn(['lineage', i, key], t); changed = true }
          }
        }
      }
    }

    // marginalia[]
    if (Array.isArray(srcData.marginalia)) {
      for (let i = 0; i < srcData.marginalia.length; i++) {
        const srcVal = srcData.marginalia[i]
        const tgtVal = tgtData.marginalia?.[i]
        if (!isEmpty(srcVal) && (newFile || isEmpty(tgtVal) || force)) {
          const t = await translateText({ srcLocale: srcYamlLocale, tgtLocale: loc, fieldKind: 'about', sourceText: srcVal })
          console.log(`  about marginalia[${i}].${loc} ← ${t}`)
          if (!dryRun) { tgtDoc.setIn(['marginalia', i], t); changed = true }
        }
      }
    }

    if (changed && !dryRun) writeWithBackup(tgtPath, tgtDoc.toString())
  }

  // About MD files
  const srcMdLocale = LOCALES.find((l) => {
    const p = join(ABOUT_DIR, `${l}.md`)
    return existsSync(p) && readFileSync(p, 'utf8').trim() !== ''
  })
  if (!srcMdLocale) return

  const srcMd = readFileSync(join(ABOUT_DIR, `${srcMdLocale}.md`), 'utf8')
  for (const loc of activeTargets(srcMdLocale)) {
    const mdPath = join(ABOUT_DIR, `${loc}.md`)
    if (existsSync(mdPath) && readFileSync(mdPath, 'utf8').trim() !== '' && !force) continue
    const t = await translateText({ srcLocale: srcMdLocale, tgtLocale: loc, fieldKind: 'body', sourceText: srcMd })
    console.log(`  about ${loc}.md ← ${t.length} chars`)
    if (!dryRun) writeWithBackup(mdPath, t.endsWith('\n') ? t : t + '\n')
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (reportOnly) {
    runReport()
    return
  }

  console.log(`[translate] providers: ${PROVIDER_CHAIN.join(' → ')}`)
  if (dryRun) console.log('[translate] DRY RUN — no files will be written\n')

  const slugs = productionSlugs()
  let done = 0

  if (!onlyScope || onlyScope !== 'about') {
    for (const slug of slugs) {
      if (done >= limitN) break
      process.stdout.write(`\n[${++done}/${slugs.length}] ${slug}\n`)
      await translateProduction(slug)
    }
  }

  // about runs only when no --slug filter (or explicitly --only about)
  if (onlyScope === 'about' || (!onlyScope && slugFilter.length === 0)) {
    process.stdout.write('\n[about]\n')
    await translateAbout()
  }

  if (!dryRun && modifiedFiles.length > 0) {
    process.stdout.write('\n[translate] running lint-content…\n')
    const ok = runLintContent()
    if (!ok) {
      console.error('[translate] lint failed — restoring backups:')
      restoreAllBaks()
      process.exit(1)
    }
    cleanupBaks()
  }

  console.log('\n[translate] done.')
  console.log(`  files changed:   ${stats.filesChanged}`)
  console.log(`  cache hits:      ${stats.cacheHits}`)
  console.log(`  input tokens:    ${stats.inputTokens.toLocaleString()}`)
  console.log(`  output tokens:   ${stats.outputTokens.toLocaleString()}`)
  console.log(`  estimated cost:  $${stats.cost.toFixed(4)}`)
}

main().catch((err) => {
  console.error('[translate] fatal:', err.message)
  process.exit(1)
})
