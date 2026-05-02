/**
 * lib/content.ts — content loader API (F6)
 *
 * Pure functions over the content tree. No I/O outside build-time file reads.
 * Source of truth: content/productions/<slug>/index.mdx frontmatter + body.
 * (Phase 8.3: metadata.yml overlay folded into frontmatter — no overlay step.)
 *
 * Page routes call:
 *   - getAllProductions(locale)
 *   - getProduction(slug, locale)
 *   - getRelatedProductions(production, n=3)   → brief D9 algorithm
 */

import * as fs from 'node:fs'
import matter from 'gray-matter'
import * as path from 'node:path'

import type { Locale } from '@/i18n/routing'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const CONTENT_DIR = path.resolve(process.cwd(), 'content', 'productions')
const LQIP_DIR = path.resolve(process.cwd(), 'public', 'productions')

// ---------------------------------------------------------------------------
// Types — public shape consumed by page routes
// ---------------------------------------------------------------------------

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
  body: { ru: string; en: string }
  theatre: {
    name?: string
    shortName?: string
    city?: string
    country?: string
    url?: string
  }
  year?: number
  premiereDate?: { ru?: string; en?: string; de?: string | null }
  ticketsUrl?: string | null
  ageRating?: string | null
  durationMin?: number | null
  role: string
  form: string[]
  lineage: string[]
  credits: { ru: CreditEntry[]; en: CreditEntry[]; de?: CreditEntry[] }
  poster: { src: string | null; credit: string | null; lqip: string | null; width: number | null; height: number | null }
  gallery: GalleryItem[]
  videos: Array<{ provider: string; id: string }>
  awards: Array<{ name: string; category?: string; year?: number; city?: string }>
  press: Array<{ title: string; url: string; outlet?: string; language?: string }>
  externalLinks: Array<{ label: string; url: string }>
  techRider: string | null
  pressKit: string | null
  featured: boolean
  tags: string[]
  tour: string[]
}

/** Locale-projected view returned by getAllProductions / getProduction. */
export interface ProductionView
  extends Omit<Production, 'title' | 'synopsis' | 'body' | 'credits' | 'premiereDate'> {
  title: string
  synopsis: string
  body: string
  credits: CreditEntry[]
  premiereDate: string | null
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
    const mdxPath = path.join(dir, 'index.mdx')
    if (!fs.existsSync(mdxPath)) continue

    const raw = fs.readFileSync(mdxPath, 'utf8')
    const { data: frontmatter } = matter(raw)

    const prod = fromFm(frontmatter as Partial<Production>, raw)

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
        // malformed lqip.json — ignore
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

/** Build a Production directly from frontmatter (overlay already folded in). */
function fromFm(fm: Partial<Production>, rawMdx: string): Production {
  return {
    slug: fm.slug as string,
    notionIds: fm.notionIds ?? {},
    title: fm.title ?? {},
    synopsis: fm.synopsis ?? {},
    body: extractBodies(rawMdx),
    theatre: fm.theatre ?? {},
    year: fm.year,
    premiereDate: fm.premiereDate,
    ticketsUrl: fm.ticketsUrl ?? null,
    ageRating: fm.ageRating ?? null,
    durationMin: fm.durationMin ?? null,
    role: fm.role ?? 'director',
    form: fm.form ?? [],
    lineage: fm.lineage ?? [],
    credits: fm.credits ?? { ru: [], en: [] },
    poster: {
      src: fm.poster?.src ?? null,
      credit: fm.poster?.credit ?? null,
      lqip: null,   // filled by loadAll() from lqip.json
      width: null,
      height: null,
    },
    gallery: (fm.gallery ?? []).map((g) => ({
      src: g.src,
      credit: g.credit ?? null,
      caption: {
        ru: (g.caption as any)?.ru ?? null,
        en: (g.caption as any)?.en ?? null,
        de: (g.caption as any)?.de ?? null,
      },
    })),
    videos: fm.videos ?? [],
    awards: fm.awards ?? [],
    press: fm.press ?? [],
    externalLinks: fm.externalLinks ?? [],
    techRider: fm.techRider ?? null,
    pressKit: fm.pressKit ?? null,
    featured: !!fm.featured,
    tags: fm.tags ?? [],
    tour: (fm.tour as string[] | undefined) ?? [],
  }
}

/** Pulls RU and EN bodies out of the <Locale value="…"> wrappers in the MDX. */
function extractBodies(rawMdx: string): { ru: string; en: string } {
  const stripFrontmatter = rawMdx.replace(/^---[\s\S]*?---\s*/, '')
  const grab = (locale: 'ru' | 'en') => {
    const re = new RegExp(`<Locale value="${locale}">([\\s\\S]*?)</Locale>`, 'i')
    return stripFrontmatter.match(re)?.[1].trim() ?? ''
  }
  return { ru: grab('ru'), en: grab('en') }
}

// ---------------------------------------------------------------------------
// Locale projection
// ---------------------------------------------------------------------------

function project(p: Production, locale: Locale): ProductionView {
  // Fallback chain: requested → ru → en → '' (never throw).
  const t =
    p.title[locale] ??
    p.title.ru ??
    p.title.en ??
    p.slug
  const s =
    p.synopsis[locale] ??
    p.synopsis.ru ??
    p.synopsis.en ??
    ''
  const b =
    (locale === 'ru' && p.body.ru) ||
    (locale === 'en' && p.body.en) ||
    p.body.ru ||
    p.body.en ||
    ''
  // Credits & premiere date: per-locale with RU→EN fallback, mirroring
  // the press/awards "original language" rule. DE chrome falls through
  // to RU credits (v1 has no DE bodies — that's a v2 fill).
  const credits =
    (locale === 'en' && p.credits.en?.length ? p.credits.en : null) ??
    (locale === 'ru' && p.credits.ru?.length ? p.credits.ru : null) ??
    (p.credits.ru?.length ? p.credits.ru : p.credits.en ?? [])
  const premiereDate =
    p.premiereDate?.[locale as 'ru' | 'en'] ??
    p.premiereDate?.ru ??
    p.premiereDate?.en ??
    null

  const { title: _t, synopsis: _s, body: _b, credits: _c, premiereDate: _p, ...rest } = p
  return {
    ...rest,
    title: t!,
    synopsis: s!,
    body: b,
    credits,
    premiereDate,
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
    const formOverlap = cand.form.filter((f) => production.form.includes(f)).length
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
    const aRoleEq = a.prod.role === production.role ? 1 : 0
    const bRoleEq = b.prod.role === production.role ? 1 : 0
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
