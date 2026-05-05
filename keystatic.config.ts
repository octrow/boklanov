/**
 * keystatic.config.ts — content schema for boklanov.com
 *
 * Source of truth stays at content/productions/<slug>/{index.yaml, bodyRu.mdx, bodyEn.mdx, bodyDe.mdx}.
 * Keystatic edits these files in place; the runtime in lib/content.ts reads them.
 *
 * Layout produced by this config (verified against Keystatic Discussion #361):
 *   content/productions/<slug>/
 *     index.yaml      ← all structured fields below (data: 'yaml')
 *     bodyRu.mdx      ← from fields.mdx({ ... }) named bodyRu
 *     bodyEn.mdx
 *     bodyDe.mdx
 *
 * Storage:
 *   - dev (`npm run dev`): `kind: 'local'` — writes to disk directly.
 *   - prod (Vercel build): `kind: 'cloud'` — Keystatic Cloud handles auth.
 *
 * The switch is on `process.env.NODE_ENV`, NOT a custom env var. Why:
 * `keystatic.config.ts` is bundled into BOTH the server route handler AND
 * the client-side Keystatic UI. Next.js only inlines `NEXT_PUBLIC_*` and
 * `NODE_ENV` into the client bundle — any other `process.env.X` becomes
 * `undefined` on the client. If we used `KEYSTATIC_STORAGE`, the client
 * would think we're in local mode while the server thinks we're in cloud,
 * the protocols would mismatch, and every API request would 404. Hard-won
 * lesson; do not re-add env-var-driven storage.
 *
 * Auth:
 *   - prod: Keystatic Cloud — log in at /keystatic via email magic-link.
 *           Roman + Daniil are members of the `boklanov` team there.
 *   - dev: trusted-local, no auth. Only listens on localhost.
 *
 * Docs:
 *   https://keystatic.com/docs/cloud
 *   https://keystatic.com/docs/recipes/nextjs-disable-admin-ui-in-production
 */

import { config, fields, collection, singleton } from '@keystatic/core'

// ---------------------------------------------------------------------------
// Storage — NODE_ENV-gated so the value is identical on client and server.
// ---------------------------------------------------------------------------

const storage =
  process.env.NODE_ENV === 'production'
    ? ({ kind: 'cloud' } as const)
    : ({ kind: 'local' } as const)

/** Belt-and-suspenders gate used by app/keystatic/layout.tsx and
 *  app/api/keystatic/[...params]/route.ts. With cloud storage in prod,
 *  Keystatic Cloud already enforces auth — this just kills the route
 *  entirely if someone accidentally redeploys with local storage. */
export const showAdminUI =
  process.env.NODE_ENV !== 'production' || storage.kind !== 'local'

// Cloud project — must be a literal so it makes it into the client bundle.
const cloudProject = 'boklanov/boklanov' as const

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

/** Always-object L10n string — three locales, all optional. Migration normalised
 *  bare-string YAML values to this shape so Keystatic can round-trip them.
 *  layout: [4, 4, 4] renders RU/EN/DE side-by-side in a 3-column grid. */
const l10n = (label: string) =>
  fields.object(
    {
      ru: fields.text({ label: `${label} — RU` }),
      en: fields.text({ label: `${label} — EN` }),
      de: fields.text({ label: `${label} — DE` })
    },
    { label, layout: [4, 4, 4] }
  )

/** Optional l10n — same shape, different label hint. (Keystatic doesn't have
 *  a runtime "is everything empty" check, so we model these the same.) */
const l10nOpt = l10n

// Status is the only enum we lock down — every editor we expect uses one of
// these four values, and adding a new status is a code change (the frontend
// likely cares). role / form / lineage stay as free-text arrays because the
// editor needs to coin new tags as work evolves; Keystatic's multiselect is
// a closed enum with no "creatable" mode.
const STATUS_OPTIONS = [
  { label: 'Live', value: 'live' },
  { label: 'In development', value: 'in-development' },
  { label: 'Archived', value: 'archived' },
  { label: 'On tour', value: 'on-tour' }
] as const

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export default config({
  storage,
  cloud: { project: cloudProject as `${string}/${string}` },
  ui: {
    brand: { name: 'boklanov.com' },
    navigation: {
      Productions: ['productions'],
      'About page': ['aboutRu', 'aboutEn', 'aboutDe']
    }
  },
  collections: {
    productions: collection({
      label: 'Productions',
      slugField: 'slug',
      path: 'content/productions/*/',
      format: { data: 'yaml' },
      // No entryLayout: 'content' here — that mode requires format.contentField,
      // which can only point to ONE mdx field. We have three (bodyRu/En/De)
      // and migrating to a single primary content file would rename
      // bodyRu.mdx → index.mdx across every entry. Stick with 'form' layout
      // and rely on field ordering below for editor scannability.
      previewUrl: '/ru/productions/{slug}',
      columns: ['year', 'durationMin', 'status'],
      // Schema field order = editor UI order. Most-edited / narrative fields
      // first, admin / legacy at the bottom. Bodies live near the top because
      // they hold the primary editorial content. Section dividers follow:
      //   identity → bodies → media → theatre/dates → taxonomy → credits
      //   → recognition → history → booking → placement → tech → legacy.
      schema: {
        slug: fields.slug({
          name: {
            label: 'Slug',
            description: 'Folder name (lowercase, dashes)'
          }
        }),

        // === Identity & short prose ===
        title: l10n('Title'),
        tagline: l10nOpt('Tagline'),
        synopsis: l10n('Synopsis'),
        directorsNote: l10nOpt("Director's note"),

        // === Body — full editorial per locale ===
        // Per Keystatic Discussion #361: with format.data='yaml' and no
        // contentField, each fields.mdx is written as <fieldKey>.mdx next to
        // index.yaml (bodyRu.mdx / bodyEn.mdx / bodyDe.mdx).
        bodyRu: fields.mdx({ label: 'Body (RU)' }),
        bodyEn: fields.mdx({ label: 'Body (EN)' }),
        bodyDe: fields.mdx({ label: 'Body (DE)' }),

        // === Media ===
        poster: fields.object(
          {
            src: fields.text({
              label: 'Poster image path',
              description: 'e.g. /productions/bury-me-behind-the-baseboard/poster.jpg'
            }),
            credit: fields.text({ label: 'Photographer credit' })
          },
          { label: 'Poster' }
        ),

        productionsPhoto: fields.object(
          {
            src: fields.text({
              label: 'Productions list cover path',
              description: 'Overrides poster on the /productions card. e.g. /productions/{slug}/cover.webp'
            }),
            credit: fields.text({ label: 'Credit' })
          },
          { label: 'Productions list cover' }
        ),

        featuredPhoto: fields.object(
          {
            src: fields.text({
              label: 'Featured strip cover path',
              description: 'Overrides productionsPhoto on the home featured strip. e.g. /productions/{slug}/featured.webp'
            }),
            credit: fields.text({ label: 'Credit' })
          },
          { label: 'Featured strip cover' }
        ),

        gallery: fields.array(
          fields.object({
            src: fields.text({
              label: 'Image path',
              description: 'e.g. /productions/{slug}/01.jpg'
            }),
            credit: fields.text({ label: 'Credit' }),
            caption: l10nOpt('Caption')
          }),
          {
            label: 'Gallery',
            itemLabel: (p) => {
              const src = p.fields.src.value
              return src
                ? src.split('/').pop() || src
                : p.fields.credit.value || 'image'
            }
          }
        ),

        videos: fields.array(
          fields.object({
            provider: fields.select({
              label: 'Provider',
              options: [
                { label: 'YouTube', value: 'youtube' },
                { label: 'Vimeo', value: 'vimeo' }
              ],
              defaultValue: 'youtube'
            }),
            id: fields.text({
              label: 'Video ID',
              description: 'Just the ID, not the full URL (e.g. 1GWFJ0jfPq4)'
            })
          }),
          {
            label: 'Videos',
            itemLabel: (p) => `${p.fields.provider.value}:${p.fields.id.value}`
          }
        ),

        // === Theatre & dates ===
        theatre: fields.object(
          {
            name: l10n('Theatre name'),
            shortName: l10nOpt('Short name'),
            city: l10n('City'),
            // Stays as text: ~8 entries have country: null. fields.select
            // requires defaultValue and would silently coerce null → default
            // on first save. Convert to select once those entries are filled
            // (Tier 2 migration). See KEYSTATIC_IMPROVEMENT_PLAN.md.
            country: fields.text({
              label: 'Country (ISO-2)',
              description: 'RU / KZ / DE / AT / ES …',
              validation: { isRequired: false, length: { min: 0, max: 3 } }
            }),
            url: fields.url({ label: 'Theatre URL' }),
            year: fields.integer({
              label: 'Founded year',
              validation: { isRequired: false }
            })
          },
          { label: 'Theatre' }
        ),

        year: fields.integer({
          label: 'Premiere year',
          validation: { isRequired: false, min: 1900, max: 2100 }
        }),
        premiereDate: l10nOpt('Premiere date (free text)'),
        ticketsUrl: fields.url({ label: 'Tickets URL' }),
        durationMin: fields.integer({
          label: 'Duration (minutes)',
          description: 'Performance length including intermission',
          validation: { isRequired: false }
        }),
        ageRating: fields.text({
          label: 'Age rating',
          description: '0+, 6+, 12+, 16+, 18+'
        }),
        status: fields.select({
          label: 'Status',
          description: 'Lifecycle of this production. Most entries should be "Live".',
          options: STATUS_OPTIONS,
          defaultValue: 'live'
        }),

        // === Roles & taxonomy ===
        // role / form / lineage are free-text arrays so editors can coin new
        // tags without a code change. Closed multiselects were tried and
        // reverted — `fields.multiselect` has no "creatable" mode. Established
        // values for reference (extend freely):
        //   role:    director, co-director, performer, art-director,
        //            playwright, producer
        //   form:    solo, puppet, theater, family, festival, reading
        //   lineage: btk, kudashov, rgisi
        role: fields.array(fields.text({ label: 'Role tag' }), {
          label: "Roman's role(s)",
          description: 'Roman’s contribution to this production. Add any role term you need.',
          itemLabel: (p) => p.value || 'role'
        }),
        form: fields.array(fields.text({ label: 'Form tag' }), {
          label: 'Form',
          description: 'Theatrical form / genre. Free-form — type any tag.',
          itemLabel: (p) => p.value || 'form'
        }),
        lineage: fields.array(fields.text({ label: 'Lineage tag' }), {
          label: 'Lineage',
          description: 'Tradition or school the production traces back to. Add as needed.',
          itemLabel: (p) => p.value || 'tag'
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (p) => p.value || 'tag'
        }),

        // === Credits ===
        credits: fields.object(
          {
            ru: fields.array(
              fields.object({
                role: fields.text({ label: 'Role' }),
                name: fields.text({ label: 'Name' }),
                url: fields.url({ label: 'URL' })
              }),
              {
                label: 'RU credits',
                itemLabel: (p) =>
                  `${p.fields.role.value} — ${p.fields.name.value}`
              }
            ),
            en: fields.array(
              fields.object({
                role: fields.text({ label: 'Role' }),
                name: fields.text({ label: 'Name' }),
                url: fields.url({ label: 'URL' })
              }),
              {
                label: 'EN credits',
                itemLabel: (p) =>
                  `${p.fields.role.value} — ${p.fields.name.value}`
              }
            ),
            de: fields.array(
              fields.object({
                role: fields.text({ label: 'Role' }),
                name: fields.text({ label: 'Name' }),
                url: fields.url({ label: 'URL' })
              }),
              {
                label: 'DE credits',
                itemLabel: (p) =>
                  `${p.fields.role.value} — ${p.fields.name.value}`
              }
            )
          },
          { label: 'Credits' }
        ),

        // === Recognition ===
        awards: fields.array(
          fields.object({
            name: l10n('Award name'),
            year: fields.integer({
              label: 'Year',
              validation: { isRequired: false }
            }),
            category: l10nOpt('Category'),
            city: l10nOpt('City'),
            url: fields.url({ label: 'Award URL' })
          }),
          {
            label: 'Awards',
            itemLabel: (p) => p.fields.name.fields.ru.value || 'award'
          }
        ),

        festivals: fields.array(
          fields.object({
            name: l10n('Festival name'),
            year: fields.integer({
              label: 'Year',
              validation: { isRequired: false }
            }),
            category: l10nOpt('Category'),
            city: l10nOpt('City')
          }),
          {
            label: 'Festivals',
            itemLabel: (p) => p.fields.name.fields.ru.value || 'festival'
          }
        ),

        press: fields.array(
          fields.object({
            title: l10n('Headline'),
            url: fields.url({ label: 'URL' }),
            outlet: fields.text({ label: 'Outlet' }),
            language: fields.select({
              label: 'Language',
              options: [
                { label: 'Russian', value: 'ru' },
                { label: 'English', value: 'en' },
                { label: 'German', value: 'de' }
              ],
              defaultValue: 'ru'
            })
          }),
          {
            label: 'Press',
            itemLabel: (p) => p.fields.title.fields.ru.value || 'press'
          }
        ),

        externalLinks: fields.array(
          fields.object({
            label: l10n('Label'),
            url: fields.url({ label: 'URL' })
          }),
          {
            label: 'External links',
            itemLabel: (p) => p.fields.label.fields.ru.value || 'link'
          }
        ),

        // === Performance history ===
        tour: fields.array(l10n('City'), {
          label: 'Tour cities',
          description: 'Cities where this production has toured (not the premiere venue)',
          itemLabel: (p) => p.fields.ru.value || p.fields.en.value || 'city'
        }),

        runs: fields.array(
          fields.object({
            venue: l10nOpt('Venue'),
            city: l10nOpt('City'),
            yearFrom: fields.integer({
              label: 'Year from',
              validation: { isRequired: false }
            }),
            yearTo: fields.integer({
              label: 'Year to',
              validation: { isRequired: false }
            }),
            count: l10nOpt('Count (e.g. "60+")')
          }),
          {
            label: 'Runs',
            itemLabel: (p) => p.fields.venue.fields.ru.value || 'run'
          }
        ),

        // === Booking CTA ===
        bookingCta: fields.checkbox({
          label: 'Show «booking» CTA',
          defaultValue: true
        }),
        bookingCtaLabel: l10nOpt('Booking CTA label'),
        bookingCtaUrl: fields.url({
          label: 'Booking CTA URL (overrides mailto)'
        }),

        // === Site placement ===
        featured: fields.checkbox({
          label: 'Show on home featured strip',
          description: 'Surfaces this production on the home page'
        }),
        featuredOrder: fields.integer({
          label: 'Featured order (1, 2, 3 …)',
          description: 'Lower numbers appear first. Only used when "Show on home featured strip" is on.',
          validation: { isRequired: false }
        }),
        listOrder: fields.integer({
          label: 'Order in /productions grid',
          description: 'Lower numbers appear first. Leave blank to fall back to premiere year (newest first).',
          validation: { isRequired: false }
        }),

        // === Tech / press assets ===
        techRider: fields.url({ label: 'Tech rider PDF URL' }),
        pressKit: fields.url({ label: 'Press kit PDF URL' }),

        // === Legacy Notion sync IDs — kept so existing YAML round-trips ===
        notionIds: fields.object(
          {
            ru: fields.text({ label: 'Notion ID (RU)' }),
            en: fields.text({ label: 'Notion ID (EN)' })
          },
          { label: 'Notion IDs (legacy)' }
        )
      }
    })
  },
  singletons: {
    aboutRu: aboutSingleton('RU', 'ru'),
    aboutEn: aboutSingleton('EN', 'en'),
    aboutDe: aboutSingleton('DE', 'de')
  }
})

// ---------------------------------------------------------------------------
// About page singletons — one per locale.
// Each writes content/about/<locale>.yaml + content/about/<locale>.mdx.
// ---------------------------------------------------------------------------

function aboutSingleton(label: string, locale: 'ru' | 'en' | 'de') {
  return singleton({
    label: `About — ${label}`,
    path: `content/about/${locale}`,
    format: { data: 'yaml', contentField: 'body' },
    // contentField is already 'body', so entryLayout 'content' gives the bio
    // prominent UI placement and pushes the structured fields to the sidebar.
    entryLayout: 'content',
    // Field order = editor UI order. Bio first (the narrative), then visuals,
    // then biographical structure, then small notes.
    schema: {
      body: fields.mdx({ label: 'Bio' }),
      portrait: fields.object(
        {
          src: fields.image({
            label: 'Portrait image',
            directory: 'public/about',
            publicPath: '/about/'
          }),
          credit: fields.text({ label: 'Credit' })
        },
        { label: 'Portrait' }
      ),
      photos: fields.array(
        fields.object({
          src: fields.image({
            label: 'Photo',
            directory: 'public/about',
            publicPath: '/about/'
          }),
          credit: fields.text({ label: 'Credit' })
        }),
        {
          label: 'Photos',
          itemLabel: (p) => p.fields.credit.value || 'photo'
        }
      ),
      milestones: fields.array(
        fields.object({
          year: fields.integer({
            label: 'Year',
            validation: { isRequired: false }
          }),
          label: fields.text({ label: 'Label', multiline: true })
        }),
        {
          label: 'Milestones',
          itemLabel: (p) => `${p.fields.year.value ?? '—'} ${p.fields.label.value}`
        }
      ),
      lineage: fields.array(
        fields.object({
          key: fields.text({ label: 'Key (slug)' }),
          name: fields.text({ label: 'Name' }),
          role: fields.text({ label: 'Role' }),
          institution: fields.text({ label: 'Institution' }),
          note: fields.text({ label: 'Note', multiline: true })
        }),
        {
          label: 'Lineage',
          itemLabel: (p) => p.fields.name.value || 'entry'
        }
      ),
      marginalia: fields.array(fields.text({ label: 'Note' }), {
        label: 'Marginalia',
        itemLabel: (p) => p.value || '—'
      })
    }
  })
}
