/**
 * scripts/production-mapping.ts — Keystatic YAML → Payload `productions` data.
 *
 * Shared by seed-payload.ts (one-shot import) and port-content-delta.ts
 * (Keystatic → Payload cutover delta). Keep both on one mapping so a field
 * the seed knows about is never missed by the port.
 */

export type L10n = {
  ru?: string | null
  en?: string | null
  de?: string | null
}
export type AnyMap = Record<string, unknown>

/** A Keystatic l10n field is either a bare string (same in every locale) or a
 *  { ru, en, de } object. Normalise to the object form, then we can pluck per
 *  locale. */
export const expand = (v: unknown): L10n => {
  if (v == null) return {}
  if (typeof v === 'string') return { ru: v, en: v, de: v }
  if (typeof v === 'object') return v as L10n
  return {}
}

export const pickLocale = (
  v: unknown,
  locale: 'ru' | 'en' | 'de'
): string | null => {
  const o = expand(v)
  return o[locale] ?? o.ru ?? o.en ?? null
}

export const arrayWrap = <T>(v: T | T[] | undefined | null): T[] => {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

/** Wrap plain text as a Lexical SerializedEditorState root so Payload's
 *  jsonb-typed body fields accept the seed. Mirrors the runtime shape produced
 *  by scripts/migrate-about-body-to-lexical.ts §stringToLexical — kept inline
 *  rather than imported because both scripts are one-shot operational tools
 *  and cross-imports between them are not worth the coupling.
 *  Returns `any` deliberately — see toPayloadProduction's note. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bodyToLexical(text: string | null | undefined): any {
  if (!text) return null
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter((p) => p.length > 0)
  const children =
    paragraphs.length === 0
      ? [paragraphNode('')]
      : paragraphs.map(paragraphNode)
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children
    }
  }
}

function paragraphNode(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children: text
      ? [
          {
            type: 'text',
            version: 1,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text
          }
        ]
      : []
  }
}

/** Convert Keystatic YAML shape to Payload `productions` data for ONE locale.
 *  Localized fields are filled with the per-locale value; non-localized fields
 *  are filled identically on every pass (Payload writes the row scalars on the
 *  defaultLocale pass and ignores them on subsequent locale passes).
 *
 *  Returns `any` deliberately: the legacy YAML shape is well-known and we want
 *  to bypass Payload's strict generated types — adding null-vs-undefined and
 *  type-narrowing for every nested field would triple the seed's line count
 *  without catching anything the seed-run logs wouldn't catch loudly. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPayloadProduction(
  yaml: AnyMap,
  slug: string,
  locale: 'ru' | 'en' | 'de',
  body: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const p = yaml as AnyMap & {
    identity?: AnyMap
    media?: AnyMap
    production?: AnyMap
    taxonomy?: AnyMap
    team?: { credits?: { ru?: unknown[]; en?: unknown[]; de?: unknown[] } }
    recognition?: AnyMap
    history?: AnyMap
    settings?: AnyMap
    year?: number
    durationMin?: number
    status?: string
  }
  const id = p.identity ?? {}
  const m = (p.media ?? {}) as AnyMap
  const prod = (p.production ?? {}) as AnyMap & { theatre?: AnyMap }
  const tax = (p.taxonomy ?? {}) as AnyMap
  const rec = (p.recognition ?? {}) as AnyMap
  const hist = (p.history ?? {}) as AnyMap
  const set = (p.settings ?? {}) as AnyMap
  const th = prod.theatre ?? {}

  return {
    slug,
    status: p.status ?? 'live',

    identity: {
      title: pickLocale((id as AnyMap).title, locale),
      // tagline / synopsis / directorsNote / body are all `type: 'richText'`
      // in collections/Productions.ts → Payload expects a Lexical
      // SerializedEditorState (jsonb), NOT a flat string. Skipping this
      // wrap is what left the columns NULL across all 54 productions ×
      // 3 locales — see scripts/restore-production-richtext.ts +
      // PAYLOAD_ADMIN_UX_PLAN.md §Round-5 for the historic context.
      tagline: bodyToLexical(pickLocale((id as AnyMap).tagline, locale)),
      synopsis: bodyToLexical(pickLocale((id as AnyMap).synopsis, locale)),
      directorsNote: bodyToLexical(
        pickLocale((id as AnyMap).directorsNote, locale)
      ),
      body: bodyToLexical(body)
    },

    media: {
      poster: m.poster ?? { src: null, credit: null },
      productionsPhoto: m.productionsPhoto ?? { src: null, credit: null },
      featuredPhoto: m.featuredPhoto ?? { src: null, credit: null },
      gallery: arrayWrap(m.gallery as unknown[]).map((g) => {
        const item = g as AnyMap
        return {
          src: item.src ?? null,
          credit: item.credit ?? null,
          caption: pickLocale(item.caption, locale)
        }
      }),
      videos: arrayWrap(m.videos as unknown[])
    },

    production: {
      theatre: {
        name: pickLocale(th.name, locale),
        shortName: pickLocale(th.shortName, locale),
        city: pickLocale(th.city, locale),
        country: th.country ?? null,
        url: th.url ?? null,
        year: th.year ?? null
      },
      premiereDate: pickLocale(prod.premiereDate, locale),
      ticketsUrl: prod.ticketsUrl ?? null,
      ageRating: prod.ageRating ?? null,
      // Keystatic keeps these at the YAML root; in Payload they live in the
      // `production` group. The original seed wrote them top-level, Payload
      // dropped them, and all 54 rows lost year + duration.
      year: p.year ?? null,
      durationMin: p.durationMin ?? null
    },

    taxonomy: {
      role: arrayWrap(tax.role as string[]),
      form: arrayWrap(tax.form as string[]),
      lineage: arrayWrap(tax.lineage as string[]),
      tags: arrayWrap(tax.tags as string[])
    },

    team: {
      creditsRu: p.team?.credits?.ru ?? [],
      creditsEn: p.team?.credits?.en ?? [],
      creditsDe: p.team?.credits?.de ?? []
    },

    recognition: {
      awards: arrayWrap(rec.awards as unknown[]).map((a) => {
        const o = a as AnyMap
        return {
          name: pickLocale(o.name, locale),
          year: o.year ?? null,
          category: pickLocale(o.category, locale),
          city: pickLocale(o.city, locale),
          url: o.url ?? null
        }
      }),
      festivals: arrayWrap(rec.festivals as unknown[]).map((f) => {
        const o = f as AnyMap
        return {
          name: pickLocale(o.name, locale),
          year: o.year ?? null,
          category: pickLocale(o.category, locale),
          city: pickLocale(o.city, locale)
        }
      }),
      press: arrayWrap(rec.press as unknown[]).map((pr) => {
        const o = pr as AnyMap
        return {
          title: pickLocale(o.title, locale),
          url: o.url ?? null,
          outlet: o.outlet ?? null,
          language: o.language ?? null
        }
      }),
      externalLinks: arrayWrap(rec.externalLinks as unknown[]).map((l) => {
        const o = l as AnyMap
        return { label: pickLocale(o.label, locale), url: o.url ?? null }
      })
    },

    history: {
      tour: arrayWrap(hist.tour as unknown[]).map((c) => ({
        city: pickLocale(c, locale)
      })),
      runs: arrayWrap(hist.runs as unknown[]).map((r) => {
        const o = r as AnyMap
        return {
          venue: pickLocale(o.venue, locale),
          city: pickLocale(o.city, locale),
          yearFrom: o.yearFrom ?? null,
          yearTo: o.yearTo ?? null,
          count: pickLocale(o.count, locale)
        }
      })
    },

    settings: {
      bookingCta: set.bookingCta ?? true,
      bookingCtaLabel: pickLocale(set.bookingCtaLabel, locale),
      bookingCtaUrl: set.bookingCtaUrl ?? null,
      featured: set.featured ?? false,
      featuredOrder: set.featuredOrder ?? null,
      listOrder: set.listOrder ?? null,
      techRider: set.techRider ?? null,
      pressKit: set.pressKit ?? null,
      notionIds: set.notionIds ?? { ru: null, en: null }
    }
  }
}
