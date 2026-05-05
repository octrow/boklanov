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
 *  bare-string YAML values to this shape so Keystatic can round-trip them. */
const l10n = (label: string) =>
  fields.object(
    {
      ru: fields.text({ label: `${label} — RU` }),
      en: fields.text({ label: `${label} — EN` }),
      de: fields.text({ label: `${label} — DE` })
    },
    { label }
  )

/** Optional l10n — same shape, different label hint. (Keystatic doesn't have
 *  a runtime "is everything empty" check, so we model these the same.) */
const l10nOpt = l10n

// role / form kept as free-form text arrays so legacy values that aren't in a
// fixed enum (e.g. "family") don't fail Keystatic's loader.

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export default config({
  storage,
  cloud: { project: cloudProject as `${string}/${string}` },
  ui: {
    brand: { name: 'boklanov.com' }
  },
  collections: {
    productions: collection({
      label: 'Productions',
      slugField: 'slug',
      path: 'content/productions/*/',
      format: { data: 'yaml' },
      entryLayout: 'content',
      columns: ['slug', 'year'],
      schema: {
        slug: fields.slug({
          name: {
            label: 'Slug',
            description: 'Folder name (lowercase, dashes)'
          }
        }),

        // Legacy Notion sync IDs — kept so existing YAML round-trips.
        notionIds: fields.object(
          {
            ru: fields.text({ label: 'Notion ID (RU)' }),
            en: fields.text({ label: 'Notion ID (EN)' })
          },
          { label: 'Notion IDs (legacy)' }
        ),

        // === Titles & texts ===
        title: l10n('Title'),
        synopsis: l10n('Synopsis'),
        tagline: l10nOpt('Tagline'),
        directorsNote: l10nOpt("Director's note"),

        // === Theatre ===
        theatre: fields.object(
          {
            name: l10n('Theatre name'),
            shortName: l10nOpt('Short name'),
            city: l10n('City'),
            country: fields.text({
              label: 'Country (ISO-2)',
              description: 'RU / KZ / DE / ES …',
              validation: { isRequired: false, length: { min: 0, max: 3 } }
            }),
            url: fields.url({ label: 'Theatre URL' })
          },
          { label: 'Theatre' }
        ),

        // === Dates & markers ===
        year: fields.integer({
          label: 'Premiere year',
          validation: { isRequired: false, min: 1900, max: 2100 }
        }),
        premiereDate: l10nOpt('Premiere date (free text)'),
        ticketsUrl: fields.url({ label: 'Tickets URL' }),
        status: fields.text({
          label: 'Status',
          description: 'Free-form. e.g. "in-development". Leave blank for live.'
        }),
        ageRating: fields.text({
          label: 'Age rating',
          description: '0+, 6+, 12+, 16+, 18+'
        }),
        durationMin: fields.integer({
          label: 'Duration (minutes)',
          validation: { isRequired: false }
        }),

        role: fields.array(fields.text({ label: 'Role tag' }), {
          label: 'Roman’s role(s)',
          itemLabel: (p) => p.value || 'role'
        }),
        form: fields.array(fields.text({ label: 'Form tag' }), {
          label: 'Form',
          itemLabel: (p) => p.value || 'form'
        }),
        lineage: fields.array(fields.text({ label: 'Lineage tag' }), {
          label: 'Lineage',
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

        // === Media ===
        poster: fields.object(
          {
            src: fields.image({
              label: 'Poster image',
              directory: 'public/productions/{slug}',
              publicPath: '/productions/{slug}/'
            }),
            credit: fields.text({ label: 'Photographer credit' })
          },
          { label: 'Poster' }
        ),

        productionsPhoto: fields.object(
          {
            src: fields.image({
              label: 'Cover for /productions card (overrides poster)',
              directory: 'public/productions/{slug}',
              publicPath: '/productions/{slug}/'
            }),
            credit: fields.text({ label: 'Credit' })
          },
          { label: 'Productions list cover' }
        ),

        featuredPhoto: fields.object(
          {
            src: fields.image({
              label:
                'Cover for home featured strip (overrides productionsPhoto)',
              directory: 'public/productions/{slug}',
              publicPath: '/productions/{slug}/'
            }),
            credit: fields.text({ label: 'Credit' })
          },
          { label: 'Featured strip cover' }
        ),

        gallery: fields.array(
          fields.object({
            src: fields.image({
              label: 'Image',
              directory: 'public/productions/{slug}',
              publicPath: '/productions/{slug}/'
            }),
            credit: fields.text({ label: 'Credit' }),
            caption: l10nOpt('Caption')
          }),
          {
            label: 'Gallery',
            itemLabel: (p) => p.fields.credit.value || 'image'
          }
        ),

        videos: fields.array(
          fields.object({
            provider: fields.text({
              label: 'Provider',
              description: 'youtube | vimeo'
            }),
            id: fields.text({ label: 'Video ID' })
          }),
          {
            label: 'Videos',
            itemLabel: (p) => `${p.fields.provider.value}:${p.fields.id.value}`
          }
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
            city: l10nOpt('City')
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
            language: fields.text({ label: 'Language (ru/en/de)' })
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

        techRider: fields.url({ label: 'Tech rider PDF URL' }),
        pressKit: fields.url({ label: 'Press kit PDF URL' }),

        // === Booking CTA ===
        bookingCta: fields.checkbox({
          label: 'Show «booking» CTA',
          defaultValue: true
        }),
        bookingCtaLabel: l10nOpt('Booking CTA label'),
        bookingCtaUrl: fields.url({
          label: 'Booking CTA URL (overrides mailto)'
        }),

        // === Placement ===
        featured: fields.checkbox({ label: 'Show on home featured strip' }),
        featuredOrder: fields.integer({
          label: 'Featured order (1, 2, 3 …)',
          validation: { isRequired: false }
        }),
        listOrder: fields.integer({
          label: 'Order in /productions grid',
          validation: { isRequired: false }
        }),

        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (p) => p.value || 'tag'
        }),

        tour: fields.array(l10n('City'), {
          label: 'Tour cities',
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

        // === Body files (sibling docs — produce bodyRu.mdx / bodyEn.mdx / bodyDe.mdx) ===
        // Per Discussion #361: each non-primary document field is written as
        // <fieldKey>.<ext> next to index.yaml.
        bodyRu: fields.mdx({ label: 'Body (RU)' }),
        bodyEn: fields.mdx({ label: 'Body (EN)' }),
        bodyDe: fields.mdx({ label: 'Body (DE)' })
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
    schema: {
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
      marginalia: fields.array(fields.text({ label: 'Note' }), {
        label: 'Marginalia',
        itemLabel: (p) => p.value || '—'
      }),
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
      body: fields.mdx({ label: 'Bio' })
    }
  })
}
