/**
 * lib/content.ts — content loader API (F6)
 *
 * Pure functions over the merged content tree. No I/O outside build-time
 * file reads. The content tree itself is produced by F4/F5
 * (scripts/sync-from-notion.ts).
 *
 * Source-of-truth shape comes from:
 *   - frontmatter in content/productions/<slug>/index.mdx (from CSV + body heuristics)
 *   - content/productions/<slug>/metadata.yml             (manual overlay; wins)
 *   - content/productions-index.json                       (flat index from sync)
 *
 * The merged result satisfies brief §7. Page routes call:
 *   - getAllProductions(locale)
 *   - getProduction(slug, locale)
 *   - getRelatedProductions(production, n=3)   → brief D9 algorithm
 */

import * as fs from 'node:fs'
import matter from 'gray-matter'
import * as path from 'node:path'
import * as yaml from 'yaml'

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

    const metaPath = path.join(dir, 'metadata.yml')
    const overlay = fs.existsSync(metaPath)
      ? (yaml.parse(fs.readFileSync(metaPath, 'utf8')) ?? {})
      : {}

    const prod = merge(frontmatter as Partial<Production>, overlay, raw)

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

/** Overlay-wins merge. `null` / empty arrays in overlay are treated as "no override". */
function merge(
  fm: Partial<Production>,
  overlay: Record<string, unknown>,
  rawMdx: string
): Production {
  const pick = <T,>(overlayVal: T | null | undefined, fmVal: T): T => {
    if (overlayVal === null || overlayVal === undefined) return fmVal
    if (Array.isArray(overlayVal) && overlayVal.length === 0) return fmVal
    return overlayVal
  }

  const galleryFm = (fm.gallery ?? []) as GalleryItem[]
  const galleryOverlay = (overlay.gallery as GalleryItem[] | undefined) ?? []
  // Match overlay items to fm items by `src` so the order/length comes from
  // the sync (truth) and credits come from the overlay (manual).
  const galleryMerged = galleryFm.map((g) => {
    const o = galleryOverlay.find((x) => x?.src === g.src)
    if (!o) return g
    return {
      src: g.src,
      credit: pick(o.credit, g.credit),
      caption: {
        ru: pick(o.caption?.ru, g.caption?.ru ?? null),
        en: pick(o.caption?.en, g.caption?.en ?? null),
        de: pick((o.caption as any)?.de, (g.caption as any)?.de ?? null)
      }
    }
  })

  const overlayPoster = (overlay.poster ?? {}) as { credit?: string | null }
  const overlayTitle = (overlay.title ?? {}) as Record<string, string | null>
  const overlaySynopsis = (overlay.synopsis ?? {}) as Record<string, string | null>

  const merged: Production = {
    slug: fm.slug as string,
    notionIds: fm.notionIds ?? {},
    title: {
      ru: fm.title?.ru,
      en: fm.title?.en,
      de: pick(overlayTitle.de, fm.title?.de ?? null)
    },
    synopsis: {
      ru: fm.synopsis?.ru,
      en: fm.synopsis?.en,
      de: pick(overlaySynopsis.de, (fm.synopsis as any)?.de ?? null)
    },
    body: extractBodies(rawMdx),
    theatre: pick(
      overlay.theatre as Production['theatre'] | undefined,
      fm.theatre ?? {}
    ),
    year: fm.year,
    premiereDate: pick(
      overlay.premiereDate as Production['premiereDate'] | undefined,
      fm.premiereDate ?? undefined
    ),
    ticketsUrl: pick(
      overlay.ticketsUrl as string | null | undefined,
      fm.ticketsUrl ?? null
    ),
    ageRating: pick(overlay.ageRating as string | null, fm.ageRating ?? null),
    durationMin: pick(overlay.durationMin as number | null, fm.durationMin ?? null),
    role: pick(overlay.role as string, fm.role ?? 'director'),
    form: pick(overlay.form as string[], fm.form ?? []),
    lineage: pick(overlay.lineage as string[], fm.lineage ?? []),
    credits: pick(
      overlay.credits as Production['credits'] | undefined,
      fm.credits ?? { ru: [], en: [] }
    ),
    poster: {
      src: fm.poster?.src ?? null,
      credit: pick(overlayPoster.credit, fm.poster?.credit ?? null),
      lqip: null,    // filled by loadAll() after merge
      width: null,   // filled by loadAll() from lqip.json posterWidth
      height: null   // filled by loadAll() from lqip.json posterHeight
    },
    gallery: galleryMerged,
    videos: [
      ...(fm.videos ?? []),
      ...((overlay.videos as Production['videos']) ?? [])
    ],
    awards: pick(
      overlay.awards as Production['awards'] | undefined,
      fm.awards ?? []
    ),
    press: fm.press ?? [],
    externalLinks: fm.externalLinks ?? [],
    techRider: pick(overlay.techRider as string | null, fm.techRider ?? null),
    pressKit: pick(overlay.pressKit as string | null, fm.pressKit ?? null),
    featured:
      typeof overlay.featured === 'boolean' ? overlay.featured : !!fm.featured,
    tags: fm.tags ?? []
  }

  return merged
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
