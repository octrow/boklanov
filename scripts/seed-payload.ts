/**
 * scripts/seed-payload.ts — one-shot import of content/productions/* into Payload.
 *
 * Run with: npm run payload:seed
 *
 * Idempotent: pre-checks for an existing slug and updates in place if found.
 * Skips revalidation hooks via `context.disableRevalidate = true` so a 54-row
 * seed doesn't flush the RSC cache 54 times.
 *
 * See PAYLOAD_MIGRATION_PLAN §P2.5.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { Payload } from 'payload'

const ROOT = path.resolve(process.cwd(), 'content/productions')
const ABOUT_DIR = path.resolve(process.cwd(), 'content/about')
const CONTACT_DIR = path.resolve(process.cwd(), 'content/contact')

type L10n = { ru?: string | null; en?: string | null; de?: string | null }
type AnyMap = Record<string, unknown>

/** A Keystatic l10n field is either a bare string (same in every locale) or a
 *  { ru, en, de } object. Normalise to the object form, then we can pluck per
 *  locale. */
const expand = (v: unknown): L10n => {
  if (v == null) return {}
  if (typeof v === 'string') return { ru: v, en: v, de: v }
  if (typeof v === 'object') return v as L10n
  return {}
}

const pickLocale = (v: unknown, locale: 'ru' | 'en' | 'de'): string | null => {
  const o = expand(v)
  return o[locale] ?? o.ru ?? o.en ?? null
}

const readOpt = async (p: string): Promise<string | null> => {
  try {
    return await fs.readFile(p, 'utf8')
  } catch {
    return null
  }
}

const arrayWrap = <T>(v: T | T[] | undefined | null): T[] => {
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
function bodyToLexical(text: string | null | undefined): any {
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
function toPayloadProduction(
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
    year: p.year ?? null,
    durationMin: p.durationMin ?? null,
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
      ageRating: prod.ageRating ?? null
    },

    taxonomy: {
      role: arrayWrap(tax.role as string[]),
      form: arrayWrap(tax.form as string[]).map((v) => ({ value: v })),
      lineage: arrayWrap(tax.lineage as string[]).map((v) => ({ value: v })),
      tags: arrayWrap(tax.tags as string[]).map((v) => ({ value: v }))
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

async function seedProductions(payload: Payload) {
  const slugs = (await fs.readdir(ROOT)).filter(
    (n) => !n.startsWith('.') && !n.startsWith('_')
  )
  console.log(`→ Found ${slugs.length} production folders`)

  for (const slug of slugs) {
    const dir = path.join(ROOT, slug)
    const yamlText = await readOpt(path.join(dir, 'index.yaml'))
    if (!yamlText) {
      console.warn(`  ⚠ ${slug}: no index.yaml — skip`)
      continue
    }
    const yaml = parseYaml(yamlText) as AnyMap
    const bodyRu = await readOpt(path.join(dir, 'bodyRu.mdx'))
    const bodyEn = await readOpt(path.join(dir, 'bodyEn.mdx'))
    const bodyDe = await readOpt(path.join(dir, 'bodyDe.mdx'))

    const existing = await payload.find({
      collection: 'productions',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0
    })

    const ctx = { disableRevalidate: true }
    const ruData = toPayloadProduction(yaml, slug, 'ru', bodyRu)

    const doc =
      existing.docs[0]?.id != null
        ? await payload.update({
            collection: 'productions',
            id: existing.docs[0].id,
            data: ruData,
            locale: 'ru',
            context: ctx
          })
        : await payload.create({
            collection: 'productions',
            data: ruData,
            locale: 'ru',
            context: ctx
          })

    // EN + DE — only localized fields will actually persist new values.
    await payload.update({
      collection: 'productions',
      id: doc.id,
      data: toPayloadProduction(yaml, slug, 'en', bodyEn),
      locale: 'en',
      context: ctx
    })
    await payload.update({
      collection: 'productions',
      id: doc.id,
      data: toPayloadProduction(yaml, slug, 'de', bodyDe),
      locale: 'de',
      context: ctx
    })

    console.log(`  ✓ ${slug}`)
  }
}

async function seedAbout(payload: Payload) {
  const ruYaml = await readOpt(path.join(ABOUT_DIR, 'ru.yaml'))
  const enYaml = await readOpt(path.join(ABOUT_DIR, 'en.yaml'))
  const deYaml = await readOpt(path.join(ABOUT_DIR, 'de.yaml'))
  const ruBody = await readOpt(path.join(ABOUT_DIR, 'bio', 'bodyRu.mdx'))
  const enBody = await readOpt(path.join(ABOUT_DIR, 'bio', 'bodyEn.mdx'))
  const deBody = await readOpt(path.join(ABOUT_DIR, 'bio', 'bodyDe.mdx'))

  if (!ruYaml) {
    console.warn('→ about: no ru.yaml — skip')
    return
  }
  const ru = parseYaml(ruYaml) as AnyMap
  const en = (enYaml ? (parseYaml(enYaml) as AnyMap) : {}) as AnyMap
  const de = (deYaml ? (parseYaml(deYaml) as AnyMap) : {}) as AnyMap

  const ctx = { disableRevalidate: true }

  // RU pass — also writes shared fields (visuals.portrait / photos).
  await payload.updateGlobal({
    slug: 'about',
    locale: 'ru',
    context: ctx,
    data: {
      body: bodyToLexical(ruBody),
      portrait: (ru.visuals as AnyMap)?.portrait ?? { src: null, credit: null },
      photos: arrayWrap((ru.visuals as AnyMap)?.photos as unknown[]).map(
        (p) => p as { src?: string; credit?: string }
      ),
      milestones: arrayWrap(
        (ru.timeline as AnyMap)?.milestones as unknown[]
      ).map((m) => {
        const o = m as AnyMap
        return {
          year: typeof o.year === 'number' ? o.year : null,
          label: pickLocale(o.label, 'ru')
        }
      }),
      lineage: arrayWrap((ru.timeline as AnyMap)?.lineage as unknown[]).map(
        (l) => {
          const o = l as AnyMap
          return {
            key: typeof o.key === 'string' ? o.key : null,
            name: pickLocale(o.name, 'ru'),
            role: pickLocale(o.role, 'ru'),
            institution: pickLocale(o.institution, 'ru'),
            note: pickLocale(o.note, 'ru')
          }
        }
      ),
      marginalia: arrayWrap(
        (ru.margins as AnyMap)?.marginalia as unknown[]
      ).map((n) => ({ note: pickLocale(n, 'ru') }))
    }
  })

  for (const [code, src, bodyText] of [
    ['en', en, enBody],
    ['de', de, deBody]
  ] as const) {
    await payload.updateGlobal({
      slug: 'about',
      locale: code,
      context: ctx,
      data: {
        body: bodyToLexical(bodyText),
        milestones: arrayWrap(
          (src.timeline as AnyMap)?.milestones as unknown[]
        ).map((m) => {
          const o = m as AnyMap
          return {
            year: typeof o.year === 'number' ? o.year : null,
            label: pickLocale(o.label, code)
          }
        })
      }
    })
  }

  console.log('  ✓ about')
}

async function seedContact(payload: Payload) {
  const yamlText = await readOpt(path.join(CONTACT_DIR, 'index.yaml'))
  if (!yamlText) {
    console.warn('→ contact: no index.yaml — skip')
    return
  }
  const c = parseYaml(yamlText) as AnyMap & { intro?: L10n }
  const ctx = { disableRevalidate: true }

  await payload.updateGlobal({
    slug: 'contact',
    locale: 'ru',
    context: ctx,
    data: {
      intro: pickLocale(c.intro, 'ru'),
      email: typeof c.email === 'string' ? c.email : '',
      telegramUrl: typeof c.telegramUrl === 'string' ? c.telegramUrl : null,
      instagramUrl: typeof c.instagramUrl === 'string' ? c.instagramUrl : null
    }
  })
  for (const code of ['en', 'de'] as const) {
    await payload.updateGlobal({
      slug: 'contact',
      locale: code,
      context: ctx,
      data: { intro: pickLocale(c.intro, code) }
    })
  }
  console.log('  ✓ contact')
}

async function main() {
  console.log('Initialising Payload…')
  const payload = await getPayload({ config })

  console.log('\nSeeding productions…')
  await seedProductions(payload)

  console.log('\nSeeding about…')
  await seedAbout(payload)

  console.log('\nSeeding contact…')
  await seedContact(payload)

  console.log('\n✓ done')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
