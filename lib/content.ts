/**
 * lib/content.ts — content loader API.
 *
 * Source of truth (post-Payload migration, PAYLOAD_MIGRATION_PLAN §P3):
 *   Postgres rows in `productions` collection, queried via Payload Local API
 *   with `locale: 'all'` so we get every localized field as { ru, en, de }.
 *
 * Public interface (`Production`, `ProductionView`, `getAllProductions`,
 * `getProduction`, `getRelatedProductions`) is preserved verbatim. The three
 * getters became async — every caller awaits them.
 *
 * LQIP data still lives in `public/productions/<slug>/lqip.json` (built by
 * the sharp LQIP pipeline; not migrated to Payload per plan §Q2 default).
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import type { Locale } from '@/i18n/routing'

const LQIP_DIR = path.resolve(process.cwd(), 'public', 'productions')

// ---------------------------------------------------------------------------
// Process-level in-memory cache — stored on globalThis so it survives Next.js
// HMR module reloads. Acts as a safety net when unstable_cache is bypassed by
// browser "Disable cache" / cache-control:no-cache (common in DevTools).
// In production the TTL is 0 so this block is never entered; unstable_cache
// with tag-based revalidation owns the production caching lifecycle.
// ---------------------------------------------------------------------------
type MemEntry<T> = { data: T; at: number }
const g = globalThis as typeof globalThis & {
  _bk?: {
    all: MemEntry<Production[]> | null
    about: MemEntry<AboutData> | null
    contact: MemEntry<ContactData> | null
  }
}
if (!g._bk) g._bk = { all: null, about: null, contact: null }
const _mem = g._bk
const MEM_TTL = process.env.NODE_ENV === 'development' ? 60_000 : 0

// ---------------------------------------------------------------------------
// Types - public shape consumed by page routes (unchanged from pre-migration)
// ---------------------------------------------------------------------------

export type L10nString = string | { ru?: string; en?: string; de?: string }

/** Pre-baked AVIF widths per PAYLOAD_IMAGE_VARIANTS_PLAN.md. URLs match
 *  `<src.dirname>/<basename>.<W>.avif` (period-separated suffix). Computed
 *  by `buildVariants()`; null until the bake script has run AND
 *  `NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED=1` is set, so consumers fall back to
 *  the legacy `next/image` path during rollout. */
export interface ImageVariants {
  w420: string
  w600: string
  w720: string
  w828: string
  w1080: string
}

export interface GalleryItem {
  src: string
  credit: string | null
  caption: { ru: string | null; en: string | null; de?: string | null }
  variants: ImageVariants | null
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
  body: {
    ru: SerializedEditorState | null
    en: SerializedEditorState | null
    de?: SerializedEditorState | null
  }
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
    variants: ImageVariants | null
  }
  productionsPhoto: {
    src: string | null
    credit: string | null
    variants: ImageVariants | null
  } | null
  featuredPhoto: {
    src: string | null
    credit: string | null
    variants: ImageVariants | null
  } | null
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
  bookingCta: boolean
  bookingCtaLabel: { ru?: string; en?: string; de?: string | null } | null
  bookingCtaUrl: string | null
  tags: string[]
  tour: L10nString[]
  tagline: { ru?: string; en?: string | null; de?: string | null } | null
  directorsNote: {
    ru?: SerializedEditorState | null
    en?: SerializedEditorState | null
    de?: SerializedEditorState | null
  } | null
  runs: Array<{
    venue?: L10nString
    city?: L10nString
    yearFrom?: number
    yearTo?: number
    count?: string | { ru?: string; en?: string; de?: string }
  }>
}

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
  body: SerializedEditorState | null
  credits: CreditEntry[]
  premiereDate: string | null
  tagline: string | null
  directorsNote: SerializedEditorState | null
  bookingCtaLabel: string | null
  press: Array<{
    title: string
    url: string
    outlet?: string
    language?: string
  }>
  awards: Array<{
    name: string
    category?: string
    year?: number
    city?: string
  }>
  festivals: Array<{
    name: string
    category?: string
    year?: number
    city?: string
  }>
  externalLinks: Array<{ label: string; url: string }>
  runs: Array<{
    venue?: string
    city?: string
    yearFrom?: number
    yearTo?: number
    count?: string
  }>
  theatre: {
    name?: string
    shortName?: string
    city?: string
    country?: string
    url?: string
  }
  tour: string[]
  titles: Production['title']
}

// ---------------------------------------------------------------------------
// Payload doc → Production mapper
// ---------------------------------------------------------------------------

type AnyMap = Record<string, unknown>
type L10nObj = { ru?: string; en?: string; de?: string }

/** Normalise Payload's `locale: 'all'` response — already an object — to the
 *  L10nString-ish shape used by the existing Production interface. Strips
 *  null sub-values (Payload returns null for empty localized fields). */
const asL10n = (v: unknown): L10nObj => {
  if (v == null) return {}
  if (typeof v === 'string') return { ru: v, en: v, de: v }
  if (typeof v !== 'object') return {}
  const o = v as Record<string, unknown>
  const out: L10nObj = {}
  if (typeof o.ru === 'string') out.ru = o.ru
  if (typeof o.en === 'string') out.en = o.en
  if (typeof o.de === 'string') out.de = o.de
  return out
}

const asString = (v: unknown): string => (typeof v === 'string' ? v : '')

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

const isEditorState = (v: unknown): v is SerializedEditorState =>
  typeof v === 'object' && v !== null && 'root' in v

/** Extract per-locale Lexical SerializedEditorState objects from a Payload
 *  `locale: 'all'` response for a localized richText field. */
const asLexical = (
  v: unknown
): {
  ru?: SerializedEditorState | null
  en?: SerializedEditorState | null
  de?: SerializedEditorState | null
} => {
  if (v == null || typeof v !== 'object') return {}
  const o = v as Record<string, unknown>
  return {
    ru: isEditorState(o.ru) ? o.ru : null,
    en: isEditorState(o.en) ? o.en : null,
    de: isEditorState(o.de) ? o.de : null
  }
}

/** Unwrap `{value: 'tag'}` entries from Payload array-of-text-with-named-field
 *  back to plain string arrays expected by the legacy Production interface. */
const flatStringArr = (v: unknown): string[] =>
  asArray<AnyMap>(v)
    .map((it) => (typeof it.value === 'string' ? it.value : ''))
    .filter(Boolean)

/** Variant emission is gated on this flag so we can roll out per-environment
 *  after the bake-image-variants script lands the AVIFs in R2. Set to '1' in
 *  Vercel envs (Preview + Production) once the script has run. */
const VARIANTS_ENABLED = process.env.NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED === '1'

const VARIANT_WIDTHS = [420, 600, 720, 828, 1080] as const

/** Derive variant URLs from a source path by suffixing `.<W>.avif` to the
 *  basename. Returns `null` when variants are disabled, the source is null,
 *  the source is an external URL, or the extension is unrecognised. */
function buildVariants(src: string | null | undefined): ImageVariants | null {
  if (!VARIANTS_ENABLED) return null
  if (typeof src !== 'string' || src.length === 0) return null
  if (/^https?:/i.test(src)) return null
  const ext = src.match(/\.(jpe?g|png|webp)$/i)
  if (!ext) return null
  const stem = src.slice(0, -ext[0].length)
  return {
    w420: `${stem}.${VARIANT_WIDTHS[0]}.avif`,
    w600: `${stem}.${VARIANT_WIDTHS[1]}.avif`,
    w720: `${stem}.${VARIANT_WIDTHS[2]}.avif`,
    w828: `${stem}.${VARIANT_WIDTHS[3]}.avif`,
    w1080: `${stem}.${VARIANT_WIDTHS[4]}.avif`
  }
}

/** Convert one Payload `productions` document (fetched with `locale: 'all'`)
 *  to the legacy Production shape consumed by every page route. */
function payloadDocToProduction(doc: AnyMap): Production {
  const identity = (doc.identity as AnyMap) ?? {}
  const media = (doc.media as AnyMap) ?? {}
  const production = (doc.production as AnyMap) ?? {}
  const theatre = (production.theatre as AnyMap) ?? {}
  const taxonomy = (doc.taxonomy as AnyMap) ?? {}
  const team = (doc.team as AnyMap) ?? {}
  const recognition = (doc.recognition as AnyMap) ?? {}
  const history = (doc.history as AnyMap) ?? {}
  const settings = (doc.settings as AnyMap) ?? {}

  const bodyL10n = asLexical(identity.body)
  const body: Production['body'] = {
    ru: bodyL10n.ru ?? null,
    en: bodyL10n.en ?? null,
    ...(bodyL10n.de !== undefined ? { de: bodyL10n.de } : {})
  }

  const poster = (media.poster as AnyMap) ?? {}
  const productionsPhoto = (media.productionsPhoto as AnyMap) ?? {}
  const featuredPhoto = (media.featuredPhoto as AnyMap) ?? {}

  return {
    slug: asString(doc.slug),
    notionIds: {
      ru: asString((settings.notionIds as AnyMap)?.ru) || undefined,
      en: asString((settings.notionIds as AnyMap)?.en) || undefined
    },
    title: asL10n(identity.title),
    synopsis: asL10n(identity.synopsis),
    body,
    theatre: {
      name: asL10n(theatre.name),
      shortName: asL10n(theatre.shortName),
      city: asL10n(theatre.city),
      country: asString(theatre.country) || undefined,
      url: asString(theatre.url) || undefined
    },
    year: typeof production.year === 'number' ? production.year : undefined,
    premiereDate: asL10n(production.premiereDate),
    ticketsUrl: asString(production.ticketsUrl) || null,
    ageRating: asString(production.ageRating) || null,
    durationMin:
      typeof production.durationMin === 'number'
        ? production.durationMin
        : null,
    role: asArray<string>(taxonomy.role),
    form: flatStringArr(taxonomy.form),
    lineage: flatStringArr(taxonomy.lineage),
    credits: {
      ru: asArray<CreditEntry>(team.creditsRu),
      en: asArray<CreditEntry>(team.creditsEn),
      de: asArray<CreditEntry>(team.creditsDe)
    },
    poster: {
      src: asString(poster.src) || null,
      credit: asString(poster.credit) || null,
      lqip: null,
      width: null,
      height: null,
      variants: buildVariants(asString(poster.src) || null)
    },
    productionsPhoto: productionsPhoto.src
      ? {
          src: asString(productionsPhoto.src),
          credit: asString(productionsPhoto.credit) || null,
          variants: buildVariants(asString(productionsPhoto.src))
        }
      : null,
    featuredPhoto: featuredPhoto.src
      ? {
          src: asString(featuredPhoto.src),
          credit: asString(featuredPhoto.credit) || null,
          variants: buildVariants(asString(featuredPhoto.src))
        }
      : null,
    gallery: asArray<AnyMap>(media.gallery)
      .filter((g) => typeof g.src === 'string' && (g.src as string).length > 0)
      .map((g) => {
        const cap = asL10n(g.caption)
        const src = g.src as string
        return {
          src,
          credit: asString(g.credit) || null,
          caption: {
            ru: cap.ru ?? null,
            en: cap.en ?? null,
            de: cap.de ?? null
          },
          variants: buildVariants(src)
        }
      }),
    videos: asArray<AnyMap>(media.videos).map((v) => ({
      provider: asString(v.provider),
      id: asString(v.id)
    })),
    awards: asArray<AnyMap>(recognition.awards).map((a) => ({
      name: asL10n(a.name),
      category: asL10n(a.category),
      year: typeof a.year === 'number' ? a.year : undefined,
      city: asL10n(a.city)
    })),
    festivals: asArray<AnyMap>(recognition.festivals).map((f) => ({
      name: asL10n(f.name),
      category: asL10n(f.category),
      year: typeof f.year === 'number' ? f.year : undefined,
      city: asL10n(f.city)
    })),
    press: asArray<AnyMap>(recognition.press).map((p) => ({
      title: asL10n(p.title),
      url: asString(p.url),
      outlet: asString(p.outlet) || undefined,
      language: asString(p.language) || undefined
    })),
    externalLinks: asArray<AnyMap>(recognition.externalLinks).map((l) => ({
      label: asL10n(l.label),
      url: asString(l.url)
    })),
    techRider: asString(settings.techRider) || null,
    pressKit: asString(settings.pressKit) || null,
    featured: settings.featured === true,
    featuredOrder:
      typeof settings.featuredOrder === 'number'
        ? settings.featuredOrder
        : undefined,
    listOrder:
      typeof settings.listOrder === 'number' ? settings.listOrder : undefined,
    bookingCta: settings.bookingCta === false ? false : true,
    bookingCtaLabel: settings.bookingCtaLabel
      ? asL10n(settings.bookingCtaLabel)
      : null,
    bookingCtaUrl: asString(settings.bookingCtaUrl) || null,
    tags: flatStringArr(taxonomy.tags),
    // Tour entries in Payload are `{ city: { ru, en, de } }`; legacy shape is
    // an array of L10nString. Flatten the wrapping field.
    tour: asArray<AnyMap>(history.tour).map((t) => asL10n(t.city)),
    tagline: asL10n(identity.tagline),
    directorsNote: asLexical(
      identity.directorsNote
    ) as Production['directorsNote'],
    runs: asArray<AnyMap>(history.runs).map((r) => ({
      venue: asL10n(r.venue),
      city: asL10n(r.city),
      yearFrom: typeof r.yearFrom === 'number' ? r.yearFrom : undefined,
      yearTo: typeof r.yearTo === 'number' ? r.yearTo : undefined,
      count: asL10n(r.count)
    }))
  }
}

/** Read sibling lqip.json if present. Unchanged from pre-migration. */
function readLqip(slug: string): {
  lqip: string | null
  width: number | null
  height: number | null
} {
  const lqipPath = path.join(LQIP_DIR, slug, 'lqip.json')
  if (!fs.existsSync(lqipPath)) {
    return { lqip: null, width: null, height: null }
  }
  try {
    const data = JSON.parse(fs.readFileSync(lqipPath, 'utf8')) as {
      poster?: string
      posterWidth?: number
      posterHeight?: number
    }
    return {
      lqip: data.poster ?? null,
      width: data.posterWidth ?? null,
      height: data.posterHeight ?? null
    }
  } catch {
    return { lqip: null, width: null, height: null }
  }
}

// ---------------------------------------------------------------------------
// Cached fetchers — tagged for revalidation by hooks/revalidate.ts
// ---------------------------------------------------------------------------

const fetchAllProductions = unstable_cache(
  async (): Promise<Production[]> => {
    const now = Date.now()
    if (MEM_TTL > 0 && _mem.all && now - _mem.all.at < MEM_TTL)
      return _mem.all.data

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'productions',
      locale: 'all',
      depth: 0,
      limit: 500,
      pagination: false
    })
    const out = docs.map((d) => {
      const prod = payloadDocToProduction(d as unknown as AnyMap)
      const lqip = readLqip(prod.slug)
      prod.poster.lqip = lqip.lqip
      prod.poster.width = lqip.width
      prod.poster.height = lqip.height
      return prod
    })
    // Same sort as the legacy loader: featured → year desc → slug asc.
    out.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      const ay = a.year ?? 0
      const by = b.year ?? 0
      if (ay !== by) return by - ay
      return a.slug.localeCompare(b.slug)
    })
    _mem.all = { data: out, at: now }
    return out
  },
  ['productions:all'],
  { tags: ['productions'] }
)

// ---------------------------------------------------------------------------
// About + Contact globals (Tier 5.5 — replaces fs reads of content/{about,contact})
// ---------------------------------------------------------------------------

/** Localized text shape returned by Payload's `locale: 'all'` mode after
 *  passing through `asL10n` — empty locales drop out as `undefined`. Mirrors
 *  L10nObj used by the productions mapper. */
export type AboutL10n = L10nObj

/** Per-locale Lexical bio body. Same shape as `Production.body` — DE is
 *  optional because legacy rows may omit a DE column entirely. */
export interface AboutBody {
  ru: SerializedEditorState | null
  en: SerializedEditorState | null
  de?: SerializedEditorState | null
}

export interface AboutData {
  body: AboutBody
  portrait: { src: string | null; credit: string | null }
  photos: Array<{ src: string; credit: string | null }>
  milestones: Array<{ year: number | null; label: AboutL10n }>
  lineage: Array<{
    key: string
    name: AboutL10n
    role: AboutL10n
    institution: AboutL10n
    note: AboutL10n
  }>
  marginalia: Array<{ note: AboutL10n }>
}

export interface ContactData {
  intro: AboutL10n
  email: string
  telegramUrl: string | null
  instagramUrl: string | null
}

const fetchAboutGlobal = unstable_cache(
  async (): Promise<AboutData> => {
    const now = Date.now()
    if (MEM_TTL > 0 && _mem.about && now - _mem.about.at < MEM_TTL)
      return _mem.about.data

    const payload = await getPayload({ config })
    const doc = (await payload.findGlobal({
      slug: 'about',
      locale: 'all',
      depth: 0
    })) as unknown as AnyMap

    const portrait = (doc.portrait as AnyMap | undefined) ?? {}
    const rawPhotos = Array.isArray(doc.photos) ? (doc.photos as AnyMap[]) : []
    const rawMilestones = Array.isArray(doc.milestones)
      ? (doc.milestones as AnyMap[])
      : []
    const rawLineage = Array.isArray(doc.lineage)
      ? (doc.lineage as AnyMap[])
      : []
    const rawMarginalia = Array.isArray(doc.marginalia)
      ? (doc.marginalia as AnyMap[])
      : []

    const bodyL10n = asLexical(doc.body)
    const result: AboutData = {
      body: {
        ru: bodyL10n.ru ?? null,
        en: bodyL10n.en ?? null,
        ...(bodyL10n.de !== undefined ? { de: bodyL10n.de } : {})
      },
      portrait: {
        src: typeof portrait.src === 'string' ? portrait.src : null,
        credit: typeof portrait.credit === 'string' ? portrait.credit : null
      },
      photos: rawPhotos
        .filter((p) => typeof p.src === 'string' && p.src.length > 0)
        .map((p) => ({
          src: p.src as string,
          credit: typeof p.credit === 'string' ? p.credit : null
        })),
      milestones: rawMilestones.map((m) => ({
        year: typeof m.year === 'number' ? m.year : null,
        label: asL10n(m.label)
      })),
      lineage: rawLineage.map((l) => ({
        key: typeof l.key === 'string' ? l.key : '',
        name: asL10n(l.name),
        role: asL10n(l.role),
        institution: asL10n(l.institution),
        note: asL10n(l.note)
      })),
      marginalia: rawMarginalia.map((m) => ({ note: asL10n(m.note) }))
    }
    _mem.about = { data: result, at: now }
    return result
  },
  ['about:global'],
  { tags: ['about'] }
)

const fetchContactGlobal = unstable_cache(
  async (): Promise<ContactData> => {
    const now = Date.now()
    if (MEM_TTL > 0 && _mem.contact && now - _mem.contact.at < MEM_TTL)
      return _mem.contact.data

    const payload = await getPayload({ config })
    const doc = (await payload.findGlobal({
      slug: 'contact',
      locale: 'all',
      depth: 0
    })) as unknown as AnyMap

    const result: ContactData = {
      intro: asL10n(doc.intro),
      email: typeof doc.email === 'string' ? doc.email : '',
      telegramUrl:
        typeof doc.telegramUrl === 'string' && doc.telegramUrl.length > 0
          ? doc.telegramUrl
          : null,
      instagramUrl:
        typeof doc.instagramUrl === 'string' && doc.instagramUrl.length > 0
          ? doc.instagramUrl
          : null
    }
    _mem.contact = { data: result, at: now }
    return result
  },
  ['contact:global'],
  { tags: ['contact'] }
)

export const getAbout = cache((): Promise<AboutData> => fetchAboutGlobal())
export const getContact = cache(
  (): Promise<ContactData> => fetchContactGlobal()
)

// ---------------------------------------------------------------------------
// Locale projection (unchanged from pre-migration)
// ---------------------------------------------------------------------------

function resolveL10n(
  val: L10nString | null | undefined,
  locale: Locale
): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  return val[locale] ?? val.en ?? val.de ?? val.ru ?? ''
}

function resolveL10nOpt(
  val: L10nString | null | undefined,
  locale: Locale
): string | undefined {
  if (val === undefined || val === null) return undefined
  return resolveL10n(val, locale)
}

/** Pick a localized value from a multilingual map, falling back
 *  current-locale → en → de → ru → caller-supplied default.
 *
 *  Fallback order mirrors `routing.locales = ['en', 'de', 'ru']` (i18n/
 *  routing.ts), so a missing value in the active locale prefers the
 *  default-locale (EN), then DE, then RU before the caller's fallback.
 *
 *  Centralises the chain previously inlined across `project()` and gallery
 *  alt callers. DE-graceful-empty fields (`directorsNote`, `tagline`) must
 *  NOT use this helper — they intentionally stop at the DE slot rather than
 *  falling back to EN/RU. See `DESIGN_v3_PROPOSAL.md` §9v3.7. */
export function pickL10n<V, T>(
  field: Partial<Record<Locale, V | null>> | null | undefined,
  locale: Locale,
  fallback: T
): V | T {
  if (!field) return fallback
  return field[locale] ?? field.en ?? field.de ?? field.ru ?? fallback
}

function project(p: Production, locale: Locale): ProductionView {
  const t = pickL10n(p.title, locale, p.slug)
  const s = pickL10n(p.synopsis, locale, '')
  const b = pickL10n(p.body, locale, null)
  // Array fallback chain — same EN→DE→RU order as `pickL10n`, but with a
  // `.length` check so an empty-but-present array doesn't short-circuit.
  const credits =
    (locale === 'de' && p.credits.de?.length ? p.credits.de : null) ??
    (locale === 'en' && p.credits.en?.length ? p.credits.en : null) ??
    (locale === 'ru' && p.credits.ru?.length ? p.credits.ru : null) ??
    (p.credits.en?.length
      ? p.credits.en
      : p.credits.de?.length
        ? p.credits.de
        : (p.credits.ru ?? []))
  const premiereDate = pickL10n(p.premiereDate, locale, null)
  // directorsNote and tagline use DE-graceful-empty: DE pages with a null
  // DE value show "forthcoming" rather than the RU/EN fallback. Per
  // DESIGN_v3_PROPOSAL.md §9v3.7 — explicit, do not collapse into pickL10n.
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
  const bookingCtaLabel = pickL10n(p.bookingCtaLabel, locale, null)

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

  const resolvedTour = p.tour
    .map((c) => resolveL10n(c, locale))
    .filter((c) => c !== '')

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
// Public API — now async. Every caller in app/ and components/ awaits these.
// ---------------------------------------------------------------------------

export const getAllProductions = cache(
  async (locale: Locale): Promise<ProductionView[]> => {
    const all = await fetchAllProductions()
    return all.map((p) => project(p, locale))
  }
)

export const getProduction = cache(
  async (slug: string, locale: Locale): Promise<ProductionView | null> => {
    const all = await fetchAllProductions()
    const hit = all.find((p) => p.slug === slug)
    return hit ? project(hit, locale) : null
  }
)

export async function getRelatedProductions(
  production: ProductionView | Production,
  n: number = 3
): Promise<Production[]> {
  const all = await fetchAllProductions()
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
    score += lineageOverlap * 4
    if (score > 0) scored.push({ prod: cand, score })
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const aRoleEq = a.prod.role.some((r) => production.role.includes(r)) ? 1 : 0
    const bRoleEq = b.prod.role.some((r) => production.role.includes(r)) ? 1 : 0
    if (aRoleEq !== bRoleEq) return bRoleEq - aRoleEq
    return (b.prod.year ?? 0) - (a.prod.year ?? 0)
  })

  return scored.slice(0, n).map((s) => s.prod)
}

function ageBucket(rating: string | null): string | null {
  if (!rating) return null
  const m = rating.match(/(\d+)/)
  if (!m) return null
  const n = Number(m[1])
  if (n <= 6) return 'kids'
  if (n <= 12) return 'teens'
  return 'adults'
}

export function _resetCache() {
  if (g._bk) g._bk = { all: null, about: null, contact: null }
}
