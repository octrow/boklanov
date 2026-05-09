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

/** UI language for editor-facing field descriptions. Default RU because Roman
 *  is the primary editor; flip to 'en' if a non-Russian editor needs the
 *  English text. Keystatic config is bundled into both server and client, so
 *  this is set at build time, not runtime — change the const and rebuild. */
const DESC_LANG: 'ru' | 'en' = 'ru'

/** Bilingual description picker. Pass both translations; the helper returns
 *  the one matching DESC_LANG. Keeping both at the call site means future
 *  language flips don't require re-translating from the codebase or git
 *  history. */
const desc = (ru: string, en: string): string => (DESC_LANG === 'ru' ? ru : en)

/** Always-object L10n string — three locales, all optional. Migration normalised
 *  bare-string YAML values to this shape so Keystatic can round-trip them.
 *  layout: [4, 4, 4] renders RU/EN/DE side-by-side in a 3-column grid.
 *  Optional `description` surfaces under the wrapper label. */
const l10n = (label: string, description?: string) =>
  fields.object(
    {
      ru: fields.text({ label: `${label} — RU` }),
      en: fields.text({ label: `${label} — EN` }),
      de: fields.text({ label: `${label} — DE` })
    },
    { label, description, layout: [4, 4, 4] }
  )

/** Optional l10n — same shape, different label hint. (Keystatic doesn't have
 *  a runtime "is everything empty" check, so we model these the same.) */
const l10nOpt = l10n

/** L10n with markdoc.inline editors per locale instead of plain text. Used
 *  for prose where the editor benefits from inline formatting (italic,
 *  links). Storage shape on disk stays a bilingual object of strings —
 *  plain prose without markdoc syntax is still valid markdoc, so legacy
 *  values round-trip unchanged. */
const l10nMarkdoc = (label: string, description?: string) =>
  fields.object(
    {
      ru: fields.markdoc.inline({ label: `${label} — RU` }),
      en: fields.markdoc.inline({ label: `${label} — EN` }),
      de: fields.markdoc.inline({ label: `${label} — DE` })
    },
    { label, description, layout: [4, 4, 4] }
  )

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

const ROLE_OPTIONS = [
  { label: 'Director', value: 'director' },
  { label: 'Co-director', value: 'co-director' },
  { label: 'Performer', value: 'performer' },
  { label: 'Art director', value: 'art-director' },
  { label: 'Playwright', value: 'playwright' },
  { label: 'Producer', value: 'producer' }
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
      'About page': ['about'],
      Contact: ['contact']
    }
  },
  collections: {
    productions: collection({
      label: 'Productions',
      slugField: 'slug',
      path: 'content/productions/*/',
      format: { data: 'yaml' },
      // entryLayout: 'content' is kept even though we don't have a single
      // contentField — Keystatic's docs say it only takes effect with one,
      // but in practice the wider editor canvas rendered that way before
      // and editors miss it when removed (form gets squished into the left
      // half of the viewport). If a future Keystatic upgrade makes this a
      // hard error, switch to format.contentField: 'bodyRu' and rename
      // bodyRu.mdx → index.mdx across every entry.
      entryLayout: 'content',
      previewUrl: '/ru/productions/{slug}',
      // Keystatic's `columns` only accepts top-level scalar fields, so the
      // three list-view scalars below (year / durationMin / status) live at
      // the root rather than inside the `production` group. lib/content.ts
      // flattens both shapes, so the on-disk YAML and the runtime API stay
      // unchanged from the consumer's perspective.
      columns: ['year', 'durationMin', 'status'],
      schema: {
        slug: fields.slug({
          name: { label: 'URL slug' },
          slug: {
            label: 'URL slug',
            description: desc(
              'Имя папки в content/productions/. Только нижний регистр и дефисы. После публикации лучше не менять — это часть публичного URL.',
              "Folder name in content/productions/. Lowercase + dashes only. Avoid changing after publish — it's part of the live URL."
            )
          }
        }),

        // ── Top-level list-view columns ────────────────────────────────────
        // year / durationMin / status sit at the root (not inside the
        // `production` group below) so Keystatic's `columns: [...]` config
        // can show them in the productions list view. Keystatic's `columns`
        // type only accepts scalar fields whose key lives at the top of
        // `schema`. lib/content.ts's flattenFm() spreads both root and
        // `production` to a flat shape, so the runtime API is identical.
        year: fields.integer({
          label: 'Premiere year',
          description: desc(
            'Числовой год премьеры — используется для сортировки и в карточках. Отдельно от свободного текста даты в блоке Production.',
            'Numeric year used for sort and display. Distinct from the per-locale free-text date in the Production group.'
          ),
          validation: { isRequired: false, min: 1900, max: 2100 }
        }),
        durationMin: fields.integer({
          label: 'Duration (minutes)',
          description: desc(
            'Длительность спектакля в минутах, с антрактом. Опционально.',
            'Performance length in minutes including intermission. Optional.'
          ),
          validation: { isRequired: false }
        }),
        status: fields.select({
          label: 'Status',
          description: desc(
            'Жизненный цикл продакшена. По умолчанию — «Live» (идёт сейчас).',
            'Lifecycle of this production. Default is "Live" (currently running).'
          ),
          options: STATUS_OPTIONS,
          defaultValue: 'live'
        }),

        // ── WS-1: all fields wrapped in labeled object groups ──────────────
        // Each group becomes one tab in the WS-6 tab strip. YAML shape on
        // disk matches (identity.title, media.poster, …). Migration script:
        // scripts/migrate-productions-schema.ts. Reader update: lib/content.ts.

        identity: fields.object(
          {
            // === Identity & short prose ===
            title: l10n(
              'Title',
              desc(
                'Название спектакля во всех трёх локалях. Показывается в карточке, на странице и в SEO-заголовке.',
                'Production title in all three locales. Shown on cards, page, and SEO title.'
              )
            ),
            tagline: l10nOpt(
              'Tagline',
              desc(
                'Короткая строка-крючок (≤80 символов) под заголовком. Опционально.',
                'Short hook line (≤80 chars) under the title. Optional.'
              )
            ),
            synopsis: l10n(
              'Synopsis',
              desc(
                'Одно-два предложения, показываются на карточках продакшенов и в результатах поиска. 50–200 знаков — комфортно для SEO.',
                'One-or-two-sentence pitch shown on production cards and in search results. 50–200 chars is the SEO sweet spot.'
              )
            ),
            // markdoc.inline editor — supports italic / bold / links.
            // Existing plain-text values like "Мама, папа, приходите скорей…"
            // round-trip identically (plain prose is valid markdoc). The
            // production page renders this through @markdoc/markdoc; see
            // app/[locale]/productions/[slug]/page.tsx.
            directorsNote: l10nMarkdoc(
              "Director's note",
              desc(
                'Цитата от Романа — рендерится как blockquote на странице. Поддерживает курсив / жирный / ссылки через инлайн-редактор.',
                'Note from Roman — rendered as a blockquote on the page. Inline editor supports italic / bold / links.'
              )
            ),

            // === Body — full editorial per locale ===
            // Per Keystatic Discussion #361: with format.data='yaml' and no
            // contentField, each fields.mdx is written as <fieldKey>.mdx next to
            // index.yaml (bodyRu.mdx / bodyEn.mdx / bodyDe.mdx).
            bodyRu: fields.mdx({
              label: 'Body (RU)',
              description: desc(
                'Полный редакторский текст на русском. MDX — поддерживает заголовки, списки, цитаты, выделение.',
                'Full editorial body in Russian. MDX — supports headings, lists, quotes, emphasis.'
              )
            }),
            bodyEn: fields.mdx({
              label: 'Body (EN)',
              description: desc(
                'Полный редакторский текст на английском. Перевод bodyRu (или самостоятельный).',
                'Full editorial body in English. Translation of bodyRu (or standalone).'
              )
            }),
            bodyDe: fields.mdx({
              label: 'Body (DE)',
              description: desc(
                'Полный редакторский текст на немецком. Перевод bodyRu (или самостоятельный).',
                'Full editorial body in German. Translation of bodyRu (or standalone).'
              )
            })
          },
          {
            label: 'Identity',
            description: desc(
              'Название, слоган, синопсис, режиссёрская заметка и полные тексты на всех трёх языках.',
              "Title, tagline, synopsis, director's note, and full editorial bodies in all three locales."
            )
          }
        ),

        media: fields.object(
          {
            // === Media ===
            // poster / productionsPhoto / featuredPhoto / gallery stay as
            // fields.text holding a path string. fields.image was tried in
            // commit b906c59 and reverted: it forces the upload-only workflow
            // and removes the editor's ability to PASTE a path to an existing
            // file (e.g. for legacy R2-synced images, or referencing a sibling
            // entry's image). The custom ImagePathPreview component supplies
            // both: a thumbnail preview, an upload button (writes via
            // /api/keystatic-asset), and aria-label-driven thumbs in collapsed
            // gallery rows.
            poster: fields.object(
              {
                src: fields.text({
                  label: 'Poster image path',
                  description: desc(
                    'Путь к постеру в public/. Можно вписать вручную или нажать «Upload» в превью ниже. Пример: /productions/bury-me-behind-the-baseboard/poster.jpg',
                    'Path to the poster in public/. Type manually or click "Upload" in the preview below. e.g. /productions/bury-me-behind-the-baseboard/poster.jpg'
                  )
                }),
                credit: fields.text({
                  label: 'Photographer credit',
                  description: desc(
                    'Имя фотографа. Показывается мелким шрифтом под изображением.',
                    'Photographer name. Rendered in small print under the image.'
                  )
                })
              },
              {
                label: 'Poster',
                description: desc(
                  'Главное изображение продакшена — основа карточек, страницы и OG-картинки.',
                  'Primary image — used on cards, the production page, and the OG preview.'
                ),
                layout: [8, 4]
              }
            ),

            productionsPhoto: fields.object(
              {
                src: fields.text({
                  label: 'Productions list cover path',
                  description: desc(
                    'Путь, который переопределяет постер в карточке на /productions. Можно вписать вручную или загрузить через «Upload» ниже. Пример: /productions/{slug}/cover.webp',
                    'Path that overrides the poster on the /productions card. Type manually or use Upload below. e.g. /productions/{slug}/cover.webp'
                  )
                }),
                credit: fields.text({
                  label: 'Credit',
                  description: desc(
                    'Имя фотографа для этой обложки.',
                    'Photographer credit for this cover.'
                  )
                })
              },
              {
                label: 'Productions list cover',
                description: desc(
                  'Опциональная замена постера специально для карточки на странице /productions. Если не задана — используется постер.',
                  'Optional override for the /productions card only. Falls back to the poster when blank.'
                ),
                layout: [8, 4]
              }
            ),

            featuredPhoto: fields.object(
              {
                src: fields.text({
                  label: 'Featured strip cover path',
                  description: desc(
                    'Путь, который переопределяет productionsPhoto на ленте «Featured» главной. Каскад: featuredPhoto → productionsPhoto → poster.',
                    'Path that overrides productionsPhoto on the home featured strip. Cascade: featuredPhoto → productionsPhoto → poster.'
                  )
                }),
                credit: fields.text({
                  label: 'Credit',
                  description: desc(
                    'Имя фотографа для этой обложки.',
                    'Photographer credit for this cover.'
                  )
                })
              },
              {
                label: 'Featured strip cover',
                description: desc(
                  'Опциональная замена productionsPhoto на ленте «Featured» главной страницы. Каскад: featuredPhoto → productionsPhoto → poster.',
                  'Optional override on the home featured strip. Cascade: featuredPhoto → productionsPhoto → poster.'
                ),
                layout: [8, 4]
              }
            ),

            gallery: fields.array(
              fields.object(
                {
                  src: fields.text({
                    label: 'Image path',
                    description: desc(
                      'Путь к изображению. Можно вписать вручную или загрузить через «Upload» ниже. Пример: /productions/{slug}/01.jpg',
                      'Path to the image. Type manually or use Upload below. e.g. /productions/{slug}/01.jpg'
                    )
                  }),
                  credit: fields.text({
                    label: 'Credit',
                    description: desc('Имя фотографа.', 'Photographer name.')
                  }),
                  caption: l10nOpt(
                    'Caption',
                    desc(
                      'Подпись к изображению на трёх языках. Доступна как alt-текст для скринридеров.',
                      'Per-locale caption. Doubles as alt text for screen readers.'
                    )
                  )
                },
                // src + credit on one row; caption (l10n grid) on its own row.
                { layout: [8, 4, 12] }
              ),
              {
                label: 'Gallery',
                description: desc(
                  'Доп. фотографии продакшена. Порядок здесь = порядок на странице.',
                  'Extra production photos. Order here = order on the page.'
                ),
                // itemLabel uses the basename of the src path so collapsed rows
                // are identifiable. ImagePathPreview reads this aria-label and
                // injects a thumbnail next to it.
                itemLabel: (p) => {
                  const src = p.fields.src.value
                  return src
                    ? src.split('/').pop() || src
                    : p.fields.credit.value || 'image'
                }
              }
            ),

            videos: fields.array(
              fields.object(
                {
                  provider: fields.select({
                    label: 'Provider',
                    description: desc('Платформа видео.', 'Video platform.'),
                    options: [
                      { label: 'YouTube', value: 'youtube' },
                      { label: 'Vimeo', value: 'vimeo' }
                    ],
                    defaultValue: 'youtube'
                  }),
                  id: fields.text({
                    label: 'Video ID',
                    description: desc(
                      'Только ID, без полного URL. Пример: 1GWFJ0jfPq4 (а не https://youtube.com/watch?v=1GWFJ0jfPq4).',
                      'Just the ID, not the full URL. e.g. 1GWFJ0jfPq4 (not https://youtube.com/watch?v=1GWFJ0jfPq4).'
                    )
                  })
                },
                // provider narrow, id wide.
                { layout: [4, 8] }
              ),
              {
                label: 'Videos',
                description: desc(
                  'Видеовставки на странице продакшена.',
                  'Embedded videos on the production page.'
                ),
                itemLabel: (p) =>
                  `${p.fields.provider.value}:${p.fields.id.value}`
              }
            )
          },
          {
            label: 'Media',
            description: desc(
              'Постер, обложки, галерея и видео.',
              'Poster, cover overrides, gallery photos, and embedded videos.'
            )
          }
        ),

        production: fields.object(
          {
            // === Theatre & dates ===
            theatre: fields.object(
              {
                name: l10n(
                  'Theatre name',
                  desc(
                    'Полное название театра во всех трёх локалях.',
                    'Full theatre name in all three locales.'
                  )
                ),
                shortName: l10nOpt(
                  'Short name',
                  desc(
                    'Сокращённое название (если есть). Используется в плотных списках.',
                    'Shortened name (if any). Used in dense lists.'
                  )
                ),
                city: l10n(
                  'City',
                  desc(
                    'Город, где находится театр-производитель премьеры.',
                    'City where the producing theatre is based.'
                  )
                ),
                // Stays as text: ~8 entries have country: null. fields.select
                // requires defaultValue and would silently coerce null → default
                // on first save. Convert to select once those entries are filled
                // (Tier 2 migration). See KEYSTATIC_IMPROVEMENT_PLAN.md.
                country: fields.text({
                  label: 'Country (ISO-2)',
                  description: desc(
                    'Двухбуквенный ISO-код страны: RU / KZ / DE / AT / ES …',
                    'ISO-2 country code: RU / KZ / DE / AT / ES …'
                  ),
                  validation: { isRequired: false, length: { min: 0, max: 3 } }
                }),
                url: fields.url({
                  label: 'Theatre URL',
                  description: desc(
                    'Публичный сайт театра. Обязательно с https://',
                    'Public website of the theatre. Must include https://'
                  )
                }),
                year: fields.integer({
                  label: 'Founded year',
                  description: desc(
                    'Год основания театра. Опционально.',
                    'Year the theatre was founded. Optional.'
                  ),
                  validation: { isRequired: false }
                })
              },
              // layout: name/shortName/city span full width (l10n sub-grids);
              // country/url/year share a single row at 1/3 each.
              {
                label: 'Theatre',
                description: desc(
                  'Театр-производитель премьеры. Не путать с площадками гастролей (см. Tour cities / Runs).',
                  'Producing theatre for the premiere. Not the touring venues (see Tour cities / Runs).'
                ),
                layout: [12, 12, 12, 4, 4, 4]
              }
            ),

            // Kept as l10n free text (not fields.date) so fuzzy values like
            // "весна 2021" / "Spring 2021" remain expressible. Numeric `year`
            // (top-level, used for list-view columns + sort) carries the
            // structured value.
            premiereDate: l10nOpt(
              'Premiere date (free text)',
              desc(
                'Дата премьеры свободным текстом — допускаются «весна 2021», «Spring 2021», «март 2021».',
                'Free-form premiere date — fuzzy values like "Spring 2021" or "March 2021" are fine.'
              )
            ),
            ticketsUrl: fields.url({
              label: 'Tickets URL',
              description: desc(
                'Публичная страница покупки билетов (если есть). Обязательно с https://',
                'Public ticketing page if one exists. Must include https://'
              )
            }),
            ageRating: fields.text({
              label: 'Age rating',
              description: desc(
                'Возрастное ограничение по российскому стандарту: 0+, 6+, 12+, 16+, 18+.',
                'Russian-standard age rating: 0+, 6+, 12+, 16+, 18+.'
              )
            })
          },
          {
            label: 'Production',
            description: desc(
              'Театр-производитель, даты премьеры, возрастной рейтинг и билеты. Год, длительность и статус — наверху страницы (показываются в списке коллекций).',
              'Producing theatre, premiere dates, age rating, and tickets. Year, duration, and status live at the top of the page — they appear in the collection list view.'
            )
          }
        ),

        taxonomy: fields.object(
          {
            // === Roles & taxonomy ===
            // role / form / lineage are free-text arrays so editors can coin new
            // tags without a code change. Closed multiselects were tried and
            // reverted — `fields.multiselect` has no "creatable" mode. Established
            // values for reference (extend freely):
            //   role:    director, co-director, performer, art-director,
            //            playwright, producer
            //   form:    solo, puppet, theater, family, festival, reading
            //   lineage: btk, kudashov, rgisi
            role: fields.multiselect({
              label: "Roman's role(s)",
              description: desc(
                'Роли Романа в этом спектакле. Множественный выбор из закрытого списка.',
                "Roman's roles in this production. Multi-select from a closed list."
              ),
              options: ROLE_OPTIONS
            }),
            form: fields.array(fields.text({ label: 'Form tag' }), {
              label: 'Form',
              description: desc(
                'Жанр / форма спектакля. Свободный текст — можно вводить любой тег. Устоявшиеся: solo, puppet, theater, family, festival, reading.',
                'Theatrical form / genre. Free-form — type any tag. Established values: solo, puppet, theater, family, festival, reading.'
              ),
              itemLabel: (p) => p.value || 'form'
            }),
            lineage: fields.array(fields.text({ label: 'Lineage tag' }), {
              label: 'Lineage',
              description: desc(
                'Традиция или школа, к которой восходит спектакль. Свободный текст. Устоявшиеся: btk, kudashov, rgisi.',
                'Tradition or school the production traces back to. Free-form. Established values: btk, kudashov, rgisi.'
              ),
              itemLabel: (p) => p.value || 'tag'
            }),
            tags: fields.array(fields.text({ label: 'Tag' }), {
              label: 'Tags',
              description: desc(
                'Произвольные ключевые слова для поиска и фильтрации. Отличается от form (жанр) и lineage (традиция).',
                'Free-form keywords surfaced on listing/search. Distinct from form (genre) and lineage (tradition).'
              ),
              itemLabel: (p) => p.value || 'tag'
            })
          },
          {
            label: 'Taxonomy',
            description: desc(
              'Роли Романа, жанр/форма, школа и теги.',
              "Roman's roles, theatrical form, lineage, and free-form tags."
            )
          }
        ),

        team: fields.object(
          {
            // === Credits ===
            // Three parallel arrays (ru/en/de) instead of one structured array
            // with role-key + per-locale labels. Reviewed and kept: role labels
            // here are full Russian phrases ("Режиссёр, автор инсценировки"),
            // not slugs — there's no closed enum to translate from. Unifying
            // would force every editor to maintain a translation table for
            // ad-hoc role strings, which is more work than typing the line in
            // each locale. Revisit only if a closed role taxonomy emerges.
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
              {
                label: 'Credits',
                description: desc(
                  'Команда и исполнители по локалям. Локали независимы — переводи роль и имя на месте.',
                  'Cast & crew per locale. Each locale is independent — translate role + name in place.'
                )
              }
            )
          },
          {
            label: 'Team',
            description: desc(
              'Команда и состав по локалям.',
              'Cast & crew per locale.'
            )
          }
        ),

        recognition: fields.object(
          {
            // === Recognition ===
            // Awards are scoped to the production, not to a person — no
            // `recipient` field. If a future award singles out one performer
            // (e.g. "Best male performance to Maksim Morozov"), record it in
            // `category` ("Best male performance — Maksim Morozov"). Adding a
            // proper recipient relationship is parked under Tier 3 (people
            // collection).
            awards: fields.array(
              fields.object({
                name: l10n(
                  'Award name',
                  desc(
                    'Название премии или номинации.',
                    'Name of the award or nomination.'
                  )
                ),
                year: fields.integer({
                  label: 'Year',
                  description: desc(
                    'Год получения премии. Опционально.',
                    'Year the award was received. Optional.'
                  ),
                  validation: { isRequired: false }
                }),
                category: l10nOpt(
                  'Category',
                  desc(
                    'Номинация / категория. Если конкретный человек — пиши «За лучшую мужскую роль — Максим Морозов».',
                    'Award category. If a specific person — phrase as "Best male performance — Maksim Morozov".'
                  )
                ),
                city: l10nOpt(
                  'City',
                  desc('Город вручения.', 'City where the award was given.')
                ),
                url: fields.url({
                  label: 'Award URL',
                  description: desc(
                    'Ссылка на страницу премии/анонс.',
                    'Link to the award page or announcement.'
                  )
                })
              }),
              {
                label: 'Awards',
                description: desc(
                  'Победы и номинации. Для участия без награды — раздел Festivals ниже.',
                  'Wins or nominations. Use Festivals for participation without an award.'
                ),
                itemLabel: (p) => p.fields.name.fields.ru.value || 'award'
              }
            ),

            festivals: fields.array(
              fields.object({
                name: l10n(
                  'Festival name',
                  desc('Название фестиваля.', 'Name of the festival.')
                ),
                year: fields.integer({
                  label: 'Year',
                  description: desc(
                    'Год участия. Опционально.',
                    'Year of participation. Optional.'
                  ),
                  validation: { isRequired: false }
                }),
                category: l10nOpt(
                  'Category',
                  desc(
                    'Программа / секция фестиваля.',
                    'Festival programme or section.'
                  )
                ),
                city: l10nOpt(
                  'City',
                  desc('Город фестиваля.', 'Festival city.')
                )
              }),
              {
                label: 'Festivals',
                description: desc(
                  'Участия в фестивалях без награды. Награды — в разделе Awards выше.',
                  'Festival selections / programmes without an award. Awards belong above.'
                ),
                itemLabel: (p) => p.fields.name.fields.ru.value || 'festival'
              }
            ),

            press: fields.array(
              fields.object({
                title: l10n(
                  'Headline',
                  desc(
                    'Заголовок публикации в трёх локалях.',
                    'Article headline in all three locales.'
                  )
                ),
                url: fields.url({
                  label: 'URL',
                  description: desc(
                    'Прямая ссылка на статью. Обязательно с https://',
                    'Direct link to the article. Must include https://'
                  )
                }),
                outlet: fields.text({
                  label: 'Outlet',
                  description: desc(
                    'Название издания (например, sobaka.ru, Süddeutsche Zeitung).',
                    'Outlet name (e.g. sobaka.ru, The Bolshoi Theatre).'
                  )
                }),
                // Stays as text: previously documented as "~10 null entries" but
                // current audit (2026-05-06) shows the key is unused (0 set / 85
                // missing). Promotion to select is technically safe but would
                // silent-fill the default on every press item's first save. Keep
                // as text until at least one press entry actually carries a
                // language value.
                language: fields.text({
                  label: 'Language',
                  description: desc(
                    'Код языка статьи: ru / en / de.',
                    'Article language code: ru / en / de.'
                  )
                })
              }),
              {
                label: 'Press',
                description: desc(
                  'Рецензии и интервью. Один элемент — одна публикация: издание + заголовок + ссылка.',
                  'Reviews and interviews. Each item is one publication — outlet name + headline + link.'
                ),
                itemLabel: (p) => p.fields.title.fields.ru.value || 'press'
              }
            ),

            externalLinks: fields.array(
              fields.object({
                label: l10n(
                  'Label',
                  desc(
                    'Что это за ссылка — текст для кнопки/ссылки в трёх локалях.',
                    'What the link represents — anchor text in all three locales.'
                  )
                ),
                url: fields.url({
                  label: 'URL',
                  description: desc(
                    'Целевой URL. Обязательно с https://',
                    'Target URL. Must include https://'
                  )
                })
              }),
              {
                label: 'External links',
                description: desc(
                  'Всё, что не подходит под Press / Awards / Festivals — страницы партнёров, бэкстейдж, превью и т. п.',
                  "Anything that doesn't fit Press / Awards / Festivals — partner pages, behind-the-scenes posts, etc."
                ),
                itemLabel: (p) => p.fields.label.fields.ru.value || 'link'
              }
            )
          },
          {
            label: 'Recognition',
            description: desc(
              'Премии, фестивали, пресса и внешние ссылки.',
              'Awards, festivals, press coverage, and external links.'
            )
          }
        ),

        history: fields.object(
          {
            // === Performance history ===
            tour: fields.array(
              l10n(
                'City',
                desc(
                  'Город гастролей в трёх локалях.',
                  'Tour city in all three locales.'
                )
              ),
              {
                label: 'Tour cities',
                description: desc(
                  'Города, где спектакль был на гастролях. Не путать с городом премьеры (см. Theatre выше).',
                  'Cities where this production has toured. Not the premiere venue (see Theatre above).'
                ),
                itemLabel: (p) =>
                  p.fields.ru.value || p.fields.en.value || 'city'
              }
            ),

            runs: fields.array(
              fields.object(
                {
                  venue: l10nOpt(
                    'Venue',
                    desc(
                      'Название площадки или театра, где шёл спектакль.',
                      'Name of the venue or theatre where the production ran.'
                    )
                  ),
                  city: l10nOpt(
                    'City',
                    desc('Город этой площадки.', 'City of this venue.')
                  ),
                  yearFrom: fields.integer({
                    label: 'Year from',
                    description: desc(
                      'Первый год показов на этой площадке.',
                      'First year of performances at this venue.'
                    ),
                    validation: { isRequired: false }
                  }),
                  yearTo: fields.integer({
                    label: 'Year to',
                    description: desc(
                      'Последний год показов (или текущий, если идёт).',
                      'Last year of performances (or current, if still running).'
                    ),
                    validation: { isRequired: false }
                  }),
                  count: l10nOpt(
                    'Count (e.g. "60+")',
                    desc(
                      'Примерное число показов. Можно «60+», «more than 100», «более 30».',
                      'Approximate count. Free-form — "60+", "more than 100", etc.'
                    )
                  )
                },
                // venue + city full-width l10n grids; year/count compact row.
                { layout: [12, 12, 4, 4, 4] }
              ),
              {
                label: 'Runs',
                description: desc(
                  'История площадок — где шёл спектакль и сколько примерно раз.',
                  'Venue history — where the production has been performed and roughly how many times.'
                ),
                itemLabel: (p) => p.fields.venue.fields.ru.value || 'run'
              }
            )
          },
          {
            label: 'Performance History',
            description: desc(
              'Города гастролей и история площадок.',
              'Tour cities and venue run history.'
            )
          }
        ),

        settings: fields.object(
          {
            // === Booking CTA ===
            // The three CTA fields are NOT wrapped in fields.conditional yet —
            // doing so reshapes YAML (introduces discriminant/value keys) and
            // would force a migration across all 54 entries. Tracked under
            // Tier 2 in KEYSTATIC_IMPROVEMENT_PLAN.md. For now the label/url
            // fields are simply ignored at render time when the checkbox is off.
            bookingCta: fields.checkbox({
              label: 'Show «booking» CTA',
              description: desc(
                'Когда выключено — страница продакшена скрывает кнопку «забронировать». Label и URL ниже игнорируются.',
                'When off, the production page hides the booking call-to-action — label/URL below are ignored.'
              ),
              defaultValue: true
            }),
            bookingCtaLabel: l10nOpt(
              'Booking CTA label',
              desc(
                'Текст кнопки бронирования в трёх локалях. Если пусто — используется дефолтная фраза для каждой локали.',
                'Booking-button text per locale. Falls back to the default phrase for each locale when blank.'
              )
            ),
            bookingCtaUrl: fields.url({
              label: 'Booking CTA URL (overrides mailto)',
              description: desc(
                'Необязательно. Если пусто — кнопка ведёт на дефолтный mailto-адрес (см. lib/booking.ts).',
                'Optional. Leave blank to fall back to the default mailto link (see lib/booking.ts).'
              )
            }),

            // === Site placement ===
            featured: fields.checkbox({
              label: 'Show on home featured strip',
              description: desc(
                'Выводит этот спектакль на «featured» полосу главной страницы.',
                'Surfaces this production on the home featured strip.'
              )
            }),
            featuredOrder: fields.integer({
              label: 'Featured order (1, 2, 3 …)',
              description: desc(
                'Меньшие числа — выше. Используется только если включён чекбокс «Show on home featured strip».',
                'Lower numbers appear first. Only used when "Show on home featured strip" is on.'
              ),
              validation: { isRequired: false }
            }),
            listOrder: fields.integer({
              label: 'Order in /productions grid',
              description: desc(
                'Меньшие числа — выше. Если пусто — сортировка по году премьеры (свежие первыми).',
                'Lower numbers appear first. Leave blank to fall back to premiere year (newest first).'
              ),
              validation: { isRequired: false }
            }),

            // === Tech / press assets ===
            // Wired to TourRider (rail/details on the production page) — when
            // either URL is set, a "Tech rider (PDF)" / "Press kit (ZIP)" link
            // appears in the rider sheet. Kept as fields.url because PDFs/ZIPs
            // are typically hosted externally (Google Drive, R2). All 54 entries
            // are null as of 2026-05-06; fill in Keystatic when materials exist.
            techRider: fields.url({
              label: 'Tech rider PDF URL',
              description: desc(
                'Внешний URL на тех-райдер (PDF). Когда задан — на странице появляется ссылка «Тех. райдер» в TourRider.',
                'External URL to a tech-rider PDF. When set, a "Tech rider" link appears in the TourRider sheet on the page.'
              )
            }),
            pressKit: fields.url({
              label: 'Press kit ZIP URL',
              description: desc(
                'Внешний URL на пресс-кит (ZIP/PDF). Когда задан — на странице появляется ссылка «Пресс-кит» в TourRider.',
                'External URL to a press kit (ZIP/PDF). When set, a "Press kit" link appears in the TourRider sheet on the page.'
              )
            }),

            // === Legacy Notion sync IDs — kept so existing YAML round-trips ===
            // Do NOT switch to fields.ignored() — that erases the values on save
            // and we still need them for any future cross-reference back to the
            // pre-migration Notion DB.
            notionIds: fields.object(
              {
                ru: fields.text({
                  label: 'Notion ID (RU)',
                  description: desc(
                    'ID из старой русской базы Notion. Не редактируй — нужно для миграционной сверки.',
                    'ID from the legacy Russian Notion DB. Do not edit — needed for migration cross-reference.'
                  )
                }),
                en: fields.text({
                  label: 'Notion ID (EN)',
                  description: desc(
                    'ID из старой английской базы Notion. Не редактируй.',
                    'ID from the legacy English Notion DB. Do not edit.'
                  )
                })
              },
              {
                label: 'Notion IDs (legacy)',
                description: desc(
                  'Из исходной CMS на Notion. По духу — read-only. Оставь как есть, если только не нужна повторная миграция.',
                  'From the original Notion-based CMS. Read-only in spirit — leave as-is unless re-migrating.'
                ),
                layout: [6, 6]
              }
            )
          },
          {
            label: 'Settings',
            description: desc(
              'Бронирование, размещение на главной, тех-райдер, пресс-кит, Notion IDs.',
              'Booking CTA, home placement, tech rider, press kit, and Notion IDs.'
            )
          }
        )
      }
    })
  },
  singletons: {
    about: singleton({
      label: 'About page',
      // Trailing slash is load-bearing: Keystatic's getFormatInfo() switches
      // between "outer file" (content/about.yaml) and "index file inside
      // directory" (content/about/index.yaml) based on whether path ends
      // with "/". We need the directory layout because the schema has
      // multiple fields.mdx (bodyRu/En/De.mdx) sitting next to index.yaml.
      path: 'content/about/',
      format: { data: 'yaml' },
      // entryLayout: 'content' gives the editor a wider canvas (matches the
      // productions tabbed UX). The KeystaticEnhancements tab strip wraps
      // the four top-level groups below into tabs; visible content fills
      // the canvas at full width.
      entryLayout: 'content',
      schema: {
        // Tab 1 — Bio: three locale-specific MDX bodies, written as
        // bodyRu.mdx / bodyEn.mdx / bodyDe.mdx beside index.yaml. Same
        // disk pattern productions use (Discussion #361).
        bio: fields.object(
          {
            bodyRu: fields.mdx({
              label: 'Bio (RU)',
              description: desc(
                'Биографический текст на русском. MDX — заголовки, абзацы, цитаты.',
                'Biography body in Russian. MDX — headings, paragraphs, quotes.'
              )
            }),
            bodyEn: fields.mdx({
              label: 'Bio (EN)',
              description: desc(
                'Биографический текст на английском.',
                'Biography body in English.'
              )
            }),
            bodyDe: fields.mdx({
              label: 'Bio (DE)',
              description: desc(
                'Биографический текст на немецком.',
                'Biography body in German.'
              )
            })
          },
          {
            label: 'Bio',
            description: desc(
              'Биографический текст на трёх локалях. Первый абзац — лид (отображается крупным шрифтом).',
              'Biography body across three locales. First paragraph is the lead (rendered prominently).'
            )
          }
        ),

        // Tab 2 — Visuals: shared portrait + photos (no per-locale split).
        visuals: fields.object(
          {
            portrait: fields.object(
              {
                src: fields.image({
                  label: 'Portrait image',
                  description: desc(
                    'Главное портретное фото. Загружается в public/about/.',
                    'Main portrait photo. Uploaded into public/about/.'
                  ),
                  directory: 'public/about',
                  publicPath: '/about/'
                }),
                credit: fields.text({
                  label: 'Credit',
                  description: desc('Имя фотографа.', 'Photographer name.')
                })
              },
              {
                label: 'Portrait',
                description: desc(
                  'Большой портрет в начале страницы About.',
                  'Large portrait at the top of the About page.'
                ),
                layout: [8, 4]
              }
            ),
            photos: fields.array(
              fields.object(
                {
                  src: fields.image({
                    label: 'Photo',
                    description: desc(
                      'Дополнительное фото. Загружается в public/about/.',
                      'Additional photo. Uploaded into public/about/.'
                    ),
                    directory: 'public/about',
                    publicPath: '/about/'
                  }),
                  credit: fields.text({
                    label: 'Credit',
                    description: desc('Имя фотографа.', 'Photographer name.')
                  })
                },
                { layout: [8, 4] }
              ),
              {
                label: 'Photos',
                description: desc(
                  'Доп. фото для блока внизу страницы. Пустые элементы фильтруются на рендере.',
                  'Extra photos for the bottom block. Empty entries are filtered at render time.'
                ),
                itemLabel: (p) => p.fields.credit.value || 'photo'
              }
            )
          },
          {
            label: 'Visuals',
            description: desc(
              'Общие изображения для всех локалей: портрет и галерея.',
              'Shared images across all locales: portrait and photo gallery.'
            )
          }
        ),

        // Tab 3 — Timeline: milestones (year shared, label l10n) +
        // lineage (key shared, name/role/institution/note l10n).
        timeline: fields.object(
          {
            milestones: fields.array(
              fields.object(
                {
                  year: fields.integer({
                    label: 'Year',
                    description: desc(
                      'Год вехи. Опционально (для нечётких дат — пустой год, описание в label).',
                      'Milestone year. Optional — leave blank and describe in label for fuzzy dates.'
                    ),
                    validation: { isRequired: false }
                  }),
                  label: l10n(
                    'Label',
                    desc(
                      'Описание вехи в трёх локалях.',
                      'Milestone description in all three locales.'
                    )
                  )
                },
                { layout: [3, 9] }
              ),
              {
                label: 'Milestones',
                description: desc(
                  'Биографическая таймлайн. Год + краткое описание на трёх языках.',
                  'Biographical timeline. Year + short label per locale.'
                ),
                itemLabel: (p) =>
                  `${p.fields.year.value ?? '—'} ${
                    p.fields.label.fields.ru.value ||
                    p.fields.label.fields.en.value ||
                    ''
                  }`
              }
            ),
            lineage: fields.array(
              fields.object({
                key: fields.text({
                  label: 'Key (slug)',
                  description: desc(
                    'Стабильный slug-ключ (например, kudashov, btk). Общий для всех локалей.',
                    'Stable slug key (e.g. kudashov, btk). Shared across locales.'
                  )
                }),
                name: l10n(
                  'Name',
                  desc(
                    'Имя учителя / организации в трёх локалях.',
                    'Teacher / institution name in all three locales.'
                  )
                ),
                role: l10n(
                  'Role',
                  desc(
                    'Роль / отношение (мастер, ректор и т. п.).',
                    'Role / relationship (master, rector, etc.).'
                  )
                ),
                institution: l10n(
                  'Institution',
                  desc(
                    'Название института / театра, если применимо.',
                    'Institution / theatre, if applicable.'
                  )
                ),
                note: l10n(
                  'Note',
                  desc(
                    'Опциональная пометка о связи / влиянии.',
                    'Optional note about the connection / influence.'
                  )
                )
              }),
              {
                label: 'Lineage',
                description: desc(
                  'Учителя и школы, к которым восходит работа Романа.',
                  "Teachers and schools Roman's work traces back to."
                ),
                itemLabel: (p) =>
                  p.fields.name.fields.ru.value ||
                  p.fields.name.fields.en.value ||
                  p.fields.key.value ||
                  'entry'
              }
            )
          },
          {
            label: 'Timeline',
            description: desc(
              'Хронология вех и линия преемственности (учителя/школы).',
              'Milestones timeline and lineage (teachers / schools).'
            )
          }
        ),

        // Tab 4 — Margins: marginalia notes (per-locale text array).
        margins: fields.object(
          {
            marginalia: fields.array(
              l10n(
                'Note',
                desc(
                  'Короткая пометка в трёх локалях.',
                  'Short marginal note across three locales.'
                )
              ),
              {
                label: 'Marginalia',
                description: desc(
                  'Маленькие текстовые врезки в полях About-страницы.',
                  'Small textual notes in the margin of the About page.'
                ),
                itemLabel: (p) =>
                  p.fields.ru.value ||
                  p.fields.en.value ||
                  p.fields.de.value ||
                  '—'
              }
            )
          },
          {
            label: 'Margins',
            description: desc(
              'Маргиналии — короткие пометки рядом с абзацами.',
              'Marginalia — short notes alongside body paragraphs.'
            )
          }
        )
      }
    }),

    // -----------------------------------------------------------------------
    // Contact — three editable channels surfaced on /contact. Labels and
    // CTA copy stay in messages/*.json (UI chrome, not editorial content);
    // only the destinations are managed here so Roman can swap a Telegram
    // handle without a code deploy.
    // -----------------------------------------------------------------------
    contact: singleton({
      label: 'Contact',
      // Trailing slash → Keystatic reads content/contact/index.yaml (the
      // file we wrote on disk). Without it, Keystatic looks for the outer
      // file content/contact.yaml, finds nothing, and shows empty fields.
      // See getFormatInfo() in @keystatic/core: dataLocation = path.endsWith('/') ? 'index' : 'outer'.
      path: 'content/contact/',
      format: { data: 'yaml' },
      schema: {
        // Optional intro paragraph rendered above the Telegram / Instagram
        // buttons. Per-locale and multiline so each language can have its
        // own line break / phrasing. Empty values are skipped on render.
        intro: fields.object(
          {
            ru: fields.text({
              label: 'Intro — RU',
              multiline: true
            }),
            en: fields.text({
              label: 'Intro — EN',
              multiline: true
            }),
            de: fields.text({
              label: 'Intro — DE',
              multiline: true
            })
          },
          {
            label: 'Intro',
            description: desc(
              'Необязательный вступительный абзац над кнопками связи. Если пусто — не отображается.',
              'Optional intro paragraph above the contact buttons. Hidden when blank.'
            ),
            layout: [4, 4, 4]
          }
        ),
        email: fields.text({
          label: 'Email',
          description: desc(
            'Публичный email Романа. Используется в mailto-ссылке и подписи.',
            "Roman's public email. Used in the mailto link and copy block."
          ),
          validation: { isRequired: true, length: { min: 3 } }
        }),
        telegramUrl: fields.url({
          label: 'Telegram URL',
          description: desc(
            'Полный URL Telegram-аккаунта. Обязательно с https://. Пример: https://t.me/roman7593',
            'Full Telegram account URL. Must include https://. e.g. https://t.me/roman7593'
          )
        }),
        instagramUrl: fields.url({
          label: 'Instagram URL',
          description: desc(
            'Полный URL Instagram-аккаунта. Обязательно с https://. Пример: https://instagram.com/boklanovroman',
            'Full Instagram account URL. Must include https://. e.g. https://instagram.com/boklanovroman'
          )
        })
      }
    })
  }
})
