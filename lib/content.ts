/**
 * lib/content.ts - content loader API (F6)
 *
 * Pure functions over the content tree. No I/O outside build-time file reads.
 * Source of truth:
 *   content/productions/<slug>/index.yaml         — structured data
 *   content/productions/<slug>/body.{ru,en,de}.md — long-form prose (optional)
 *
 * Page routes call:
 *   - getAllProductions(locale)
 *   - getProduction(slug, locale)
 *   - getRelatedProductions(production, n=3)   → brief D9 algorithm
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { parse as parseYaml } from 'yaml'

import type { Locale } from '@/i18n/routing'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const CONTENT_DIR = path.resolve(process.cwd(), 'content', 'productions')
const LQIP_DIR = path.resolve(process.cwd(), 'public', 'productions')

// ---------------------------------------------------------------------------
// Types - public shape consumed by page routes
// ---------------------------------------------------------------------------

/** A string field that can optionally be locale-keyed. Resolved to string in ProjectionView. */
export type L10nString = string | { ru?: string; en?: string; de?: string }

export interface GalleryItem {
  src: string
  credit: string | null
  caption: { ru: string | null; en: string | null; de?: string | null }
}

export interface CreditEntry {
  role: string
  name: string
  url?: string
}

export interface Production {
  slug: string
  notionIds: { ru?: string; en?: string }
  title: { ru?: string; en?: string; de?: string | null }
  synopsis: { ru?: string; en?: string; de?: string | null }
  body: { ru: string; en: string; de?: string }
  theatre: {
    name?: L10nString
    shortName?: L10nString
    city?: L10nString
    country?: string
    url?: string
  }
  year?: number
  premiereDate?: { ru?: string; en?: string; de?: string | null }
  ticketsUrl?: string | null
  ageRating?: string | null
  durationMin?: number | null
  role: string[]
  form: string[]
  lineage: string[]
  credits: { ru: CreditEntry[]; en: CreditEntry[]; de?: CreditEntry[] }
  poster: {
    src: string | null
    credit: string | null
    lqip: string | null
    width: number | null
    height: number | null
  }
  gallery: GalleryItem[]
  videos: Array<{ provider: string; id: string }>
  awards: Array<{
    name: L10nString
    category?: L10nString
    year?: number
    city?: L10nString
  }>
  festivals: Array<{
    name: L10nString
    category?: L10nString
    year?: number
    city?: L10nString
  }>
  press: Array<{
    title: string | { ru?: string; en?: string; de?: string }
    url: string
    outlet?: string
    language?: string
  }>
  externalLinks: Array<{ label: L10nString; url: string }>
  techRider: string | null
  pressKit: string | null
  featured: boolean
  featuredOrder?: number
  listOrder?: number
  /** false hides the booking CTA on the production page; default true. */
  bookingCta: boolean
  /** Optional locale-keyed label override for the booking CTA. */
  bookingCtaLabel: { ru?: string; en?: string; de?: string | null } | null
  /** Optional URL override for the booking CTA (replaces the default mailto). */
  bookingCtaUrl: string | null
  tags: string[]
  tour: L10nString[]
  tagline: { ru?: string; en?: string | null; de?: string | null } | null
  directorsNote: { ru?: string; en?: string; de?: string | null } | null
  runs: Array<{
    venue?: L10nString
    city?: L10nString
    yearFrom?: number
    yearTo?: number
    count?: L10nString
  }>
}

/** Locale-projected view returned by getAllProductions / getProduction. */
export interface ProductionView
  extends Omit<
    Production,
    | 'title'
    | 'synopsis'
    | 'body'
    | 'credits'
    | 'premiereDate'
    | 'tagline'
    | 'directorsNote'
    | 'bookingCtaLabel'
    | 'press'
    | 'awards'
    | 'festivals'
    | 'externalLinks'
    | 'runs'
    | 'theatre'
    | 'tour'
  > {
  title: string
  synopsis: string
  body: string
  credits: CreditEntry[]
  premiereDate: string | null
  tagline: string | null
  directorsNote: string | null
  bookingCtaLabel: string | null
  press: Array<{ title: string; url: string; outlet?: string; language?: string }>
  awards: Array<{ name: string; category?: string; year?: number; city?: string }>
  festivals: Array<{ name: string; category?: string; year?: number; city?: string }>
  externalLinks: Array<{ label: string; url: string }>
  runs: Array<{ venue?: string; city?: string; yearFrom?: number; yearTo?: number; count?: string }>
  theatre: { name?: string; shortName?: string; city?: string; country?: string; url?: string }
  tour: string[]
  /** original multi-locale title kept around for hreflang / OG. */
  titles: Production['title']
}

// ---------------------------------------------------------------------------
// Internal: load + merge
// ---------------------------------------------------------------------------

let _cache: Production[] | null = null

function loadAll(): Production[] {
  if (_cache) return _cache

  if (!fs.existsSync(CONTENT_DIR)) {
    _cache = []
    return _cache
  }

  const slugs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  const out: Production[] = []
  for (const slug of slugs) {
    const dir = path.join(CONTENT_DIR, slug)
    const yamlPath = path.join(dir, 'index.yaml')
    if (!fs.existsSync(yamlPath)) continue

    const raw = fs.readFileSync(yamlPath, 'utf8')
    const frontmatter = (parseYaml(raw) ?? {}) as Partial<Production>
    frontmatter.body = readBodyFiles(dir)

    const prod = fromFm(frontmatter, raw)

    const lqipPath = path.join(LQIP_DIR, slug, 'lqip.json')
    if (fs.existsSync(lqipPath)) {
      try {
        const lqipData = JSON.parse(fs.readFileSync(lqipPath, 'utf8')) as {
          poster?: string
          posterWidth?: number
          posterHeight?: number
        }
        prod.poster.lqip = lqipData.poster ?? null
        prod.poster.width = lqipData.posterWidth ?? null
        prod.poster.height = lqipData.posterHeight ?? null
      } catch {
        // malformed lqip.json - ignore
      }
    }

    out.push(prod)
  }

  // Stable sort: featured first, then year desc, then slug.
  out.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    const ay = a.year ?? 0
    const by = b.year ?? 0
    if (ay !== by) return by - ay
    return a.slug.localeCompare(b.slug)
  })

  _cache = out
  return out
}

/** Read body.{ru,en,de}.md siblings of index.yaml. Missing files → ''. */
function readBodyFiles(dir: string): { ru: string; en: string; de?: string } {
  const read = (locale: 'ru' | 'en' | 'de'): string => {
    const p = path.join(dir, `body.${locale}.md`)
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : ''
  }
  const out: { ru: string; en: string; de?: string } = {
    ru: read('ru'),
    en: read('en')
  }
  const de = read('de')
  if (de) out.de = de
  return out
}

/** Build a Production from yaml frontmatter (body already injected). */
function fromFm(fm: Partial<Production>, _rawYaml: string): Production {
  return {
    slug: fm.slug as string,
    notionIds: fm.notionIds ?? {},
    title: fm.title ?? {},
    synopsis: fm.synopsis ?? {},
    body: {
      ru: (fm.body as any)?.ru?.trim() ?? '',
      en: (fm.body as any)?.en?.trim() ?? '',
      ...((fm.body as any)?.de ? { de: (fm.body as any).de.trim() } : {})
    },
    theatre: fm.theatre ?? {},
    year: fm.year,
    premiereDate: fm.premiereDate,
    ticketsUrl: fm.ticketsUrl ?? null,
    ageRating: fm.ageRating ?? null,
    durationMin: fm.durationMin ?? null,
    role: Array.isArray(fm.role) ? fm.role : [fm.role ?? 'director'],
    form: fm.form ?? [],
    lineage: fm.lineage ?? [],
    credits: fm.credits ?? { ru: [], en: [] },
    poster: {
      src: fm.poster?.src ?? null,
      credit: fm.poster?.credit ?? null,
      lqip: null, // filled by loadAll() from lqip.json
      width: null,
      height: null
    },
    gallery: (fm.gallery ?? []).map((g) => ({
      src: g.src,
      credit: g.credit ?? null,
      caption: {
        ru: (g.caption as any)?.ru ?? null,
        en: (g.caption as any)?.en ?? null,
        de: (g.caption as any)?.de ?? null
      }
    })),
    videos: fm.videos ?? [],
    awards: fm.awards ?? [],
    festivals: fm.festivals ?? [],
    press: fm.press ?? [],
    externalLinks: fm.externalLinks ?? [],
    techRider: fm.techRider ?? null,
    pressKit: fm.pressKit ?? null,
    featured: !!fm.featured,
    featuredOrder:
      typeof fm.featuredOrder === 'number' ? fm.featuredOrder : undefined,
    listOrder: typeof fm.listOrder === 'number' ? fm.listOrder : undefined,
    bookingCta: fm.bookingCta === false ? false : true,
    bookingCtaLabel:
      fm.bookingCtaLabel && typeof fm.bookingCtaLabel === 'object'
        ? fm.bookingCtaLabel
        : null,
    bookingCtaUrl: fm.bookingCtaUrl ?? null,
    tags: fm.tags ?? [],
    tour: (fm.tour as L10nString[] | undefined) ?? [],
    tagline: fm.tagline ?? null,
    directorsNote: fm.directorsNote ?? null,
    runs: fm.runs ?? []
  }
}

// ---------------------------------------------------------------------------
// Locale projection
// ---------------------------------------------------------------------------

function resolveL10n(val: L10nString | null | undefined, locale: Locale): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  return val[locale] ?? val.en ?? val.ru ?? val.de ?? ''
}

function resolveL10nOpt(
  val: L10nString | null | undefined,
  locale: Locale
): string | undefined {
  if (val === undefined || val === null) return undefined
  return resolveL10n(val, locale)
}

function project(p: Production, locale: Locale): ProductionView {
  // Fallback chain: requested → ru → en → '' (never throw).
  const t = p.title[locale] ?? p.title.ru ?? p.title.en ?? p.slug
  const s = p.synopsis[locale] ?? p.synopsis.ru ?? p.synopsis.en ?? ''
  const b =
    p.body[locale as 'ru' | 'en' | 'de'] ||
    p.body.ru ||
    p.body.en ||
    ''
  // Credits & premiere date: per-locale with RU→EN fallback, mirroring
  // the press/awards "original language" rule. DE chrome falls through
  // to RU credits (v1 has no DE bodies - that's a v2 fill).
  const credits =
    (locale === 'en' && p.credits.en?.length ? p.credits.en : null) ??
    (locale === 'ru' && p.credits.ru?.length ? p.credits.ru : null) ??
    (p.credits.ru?.length ? p.credits.ru : (p.credits.en ?? []))
  const premiereDate =
    p.premiereDate?.[locale as 'ru' | 'en'] ??
    p.premiereDate?.ru ??
    p.premiereDate?.en ??
    null
  const directorsNote =
    locale === 'de'
      ? (p.directorsNote?.de ?? null)
      : (p.directorsNote?.[locale as 'ru' | 'en'] ??
        p.directorsNote?.ru ??
        p.directorsNote?.en ??
        null)
  const tagline =
    locale === 'de'
      ? (p.tagline?.de ?? null)
      : (p.tagline?.[locale as 'ru' | 'en'] ?? p.tagline?.ru ?? null)
  const bookingCtaLabel = p.bookingCtaLabel
    ? (p.bookingCtaLabel[locale] ??
      p.bookingCtaLabel.ru ??
      p.bookingCtaLabel.en ??
      null)
    : null

  const resolvedPress = p.press.map((item) => ({
    ...item,
    title: resolveL10n(item.title, locale)
  }))

  const resolvedAwards = p.awards.map((a) => ({
    ...a,
    name: resolveL10n(a.name, locale),
    category: resolveL10nOpt(a.category, locale),
    city: resolveL10nOpt(a.city, locale)
  }))

  const resolvedFestivals = p.festivals.map((f) => ({
    ...f,
    name: resolveL10n(f.name, locale),
    category: resolveL10nOpt(f.category, locale),
    city: resolveL10nOpt(f.city, locale)
  }))

  const resolvedExternalLinks = p.externalLinks.map((l) => ({
    ...l,
    label: resolveL10n(l.label, locale)
  }))

  const resolvedRuns = p.runs.map((r) => ({
    ...r,
    venue: resolveL10nOpt(r.venue, locale),
    city: resolveL10nOpt(r.city, locale),
    count: resolveL10nOpt(r.count, locale)
  }))

  const resolvedTheatre = {
    ...p.theatre,
    name: resolveL10nOpt(p.theatre.name, locale),
    shortName: resolveL10nOpt(p.theatre.shortName, locale),
    city: resolveL10nOpt(p.theatre.city, locale)
  }

  const resolvedTour = p.tour.map((c) => resolveL10n(c, locale)).filter((c) => c !== '')

  const {
    title: _t,
    synopsis: _s,
    body: _b,
    credits: _c,
    premiereDate: _p,
    tagline: _tg,
    directorsNote: _dn,
    bookingCtaLabel: _bcl,
    press: _press,
    awards: _awards,
    festivals: _festivals,
    externalLinks: _externalLinks,
    runs: _runs,
    theatre: _theatre,
    tour: _tour,
    ...rest
  } = p
  return {
    ...rest,
    title: t!,
    synopsis: s!,
    body: b,
    credits,
    premiereDate,
    tagline: tagline || null,
    directorsNote,
    bookingCtaLabel,
    press: resolvedPress,
    awards: resolvedAwards,
    festivals: resolvedFestivals,
    externalLinks: resolvedExternalLinks,
    runs: resolvedRuns,
    theatre: resolvedTheatre,
    tour: resolvedTour,
    titles: p.title
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAllProductions(locale: Locale): ProductionView[] {
  return loadAll().map((p) => project(p, locale))
}

export function getProduction(
  slug: string,
  locale: Locale
): ProductionView | null {
  const hit = loadAll().find((p) => p.slug === slug)
  return hit ? project(hit, locale) : null
}

/**
 * Recommends algorithm (brief D9):
 *   "same age bucket + same theatre form + same lineage"
 * Score each candidate by overlap; return top N (default 3) excluding self.
 *
 * Scoring weights chosen so any single dimension is enough to surface a
 * candidate, but matches across multiple dimensions sort first.
 */
export function getRelatedProductions(
  production: ProductionView | Production,
  n: number = 3
): Production[] {
  const all = loadAll()
  const targetAge = ageBucket(production.ageRating ?? null)

  type Scored = { prod: Production; score: number }
  const scored: Scored[] = []

  for (const cand of all) {
    if (cand.slug === production.slug) continue
    let score = 0
    if (ageBucket(cand.ageRating ?? null) === targetAge && targetAge !== null) {
      score += 3
    }
    const formOverlap = cand.form.filter((f) =>
      production.form.includes(f)
    ).length
    score += formOverlap * 2
    const lineageOverlap = cand.lineage.filter((l) =>
      production.lineage.includes(l)
    ).length
    score += lineageOverlap * 4 // lineage is the strongest signal
    if (score > 0) scored.push({ prod: cand, score })
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // tie-break: prefer same role, then newer year
    const aRoleEq = a.prod.role.some((r) => production.role.includes(r)) ? 1 : 0
    const bRoleEq = b.prod.role.some((r) => production.role.includes(r)) ? 1 : 0
    if (aRoleEq !== bRoleEq) return bRoleEq - aRoleEq
    return (b.prod.year ?? 0) - (a.prod.year ?? 0)
  })

  return scored.slice(0, n).map((s) => s.prod)
}

function ageBucket(rating: string | null): string | null {
  if (!rating) return null
  // brief D9: age BUCKETS, not exact ratings. Group 0+/3+/6+ as "kids",
  // 12+ as "teens", 16+/18+ as "adults". This matches the filter UI
  // we'll build in C4.
  const m = rating.match(/(\d+)/)
  if (!m) return null
  const n = Number(m[1])
  if (n <= 6) return 'kids'
  if (n <= 12) return 'teens'
  return 'adults'
}

/** For tests / scripts. */
export function _resetCache() {
  _cache = null
}
