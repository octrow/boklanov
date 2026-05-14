# PAYLOAD_POLISH_PLAN

Status: **Tiers 1 + 2 + 5 shipped 2026-05-14**. Tier 3 + 6 deferred. Tier 4
parked indefinitely. Owner: Daniil. Follow-up to `PAYLOAD_MIGRATION_PLAN.md`
after P1–P3 + media UX shipped.

## What shipped 2026-05-14

| #       | Commit            | Scope                                                                                                           |
| ------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| 1.1     | `49790b3` (prior) | RU/EN `label` on every leaf field in Productions, About, Contact                                                |
| 1.2     | `9c9a745`         | RU/EN `admin.description` ported verbatim from `keystatic.config.ts`                                            |
| 1.3     | `4a55e7c`         | Sidebar groups Контент / Медиатека / Система; RU plurals on Users + Media                                       |
| 1.4     | `d4b0d19`         | `defaultColumns`: `identity.title`, `year`, `durationMin`, `status`, `settings.featured`                        |
| 1.4-fix | `87b64b6`         | `useAsTitle` reverted to `slug` (kept dotted-path `defaultColumns`)                                             |
| 1.5     | `2481c7e`         | `admin.condition` hides `bookingCtaLabel`/`bookingCtaUrl` and `featuredOrder` until their toggles are on        |
| 1.6     | `ad74687`         | `i18n.supportedLanguages: { ru, en }` via `@payloadcms/translations`; fallback `en`                             |
| 2.1     | `fc16c51`         | 8 unnamed tabs wrap the original `type: 'group'` fields — Postgres shape unchanged                              |
| 2.1-fix | `1fc6de2`         | `slug` → Идентичность, `year` + `durationMin` → Продакшен, `status` → Настройки. Tab strip is the first element |
| 2.3     | `3565e1f`         | `custom.scss` tightens the dead band below the tab strip                                                        |
| 2.5     | `f1abef8`         | Live-preview breakpoints aligned with DESIGN.md (390 / 768 / 1440)                                              |
| 5.1     | `c83e336`         | `predev` regenerates importMap                                                                                  |
| 5.2     | `5ee93ff`         | `prebuild` regenerates types + importMap                                                                        |

Not shipped this round (intentional):

- **2.2 locale-switcher banner** — Payload already shows the switcher in the header; custom banner deemed redundant.
- **2.4 visible save state** — Payload's Save button already greys/colours by dirty state out of the box; nothing to wire.
- **Tier 3** — deferred until Tier 1+2 dogfood time on the real schema.
- **Tier 4** — parked per the bury-me review's editorial-fit warning.
- **Tier 6** — runs together with the Keystatic deletion PR, not before.

What's already live (do not redo):

- Payload 3 admin at `/admin`, dark default chrome
- Postgres source-of-truth + `revalidateTag` hooks fire on save
- R2 storage via `@payloadcms/storage-s3`
- `ImagePathPreview` with thumbnail + Upload + Clear + Delete-from-R2
- Seed script (`npm run payload:seed`) + Backfill (`npm run payload:backfill-media`)
- `lib/content.ts` reads Payload Local API; 11 callers async-converted

Everything below is the **gap between today's `/admin` and Keystatic's
final state** (the schema Roman is used to from `keystatic.config.ts` +
`KEYSTATIC_IMPROVEMENT_PLAN.md` shipped passes + review-fix passes 1–3 in
`.design/review/2026-05-09-keystatic-tabs/REPORT.md` and
`.design/review/2026-05-08-keystatic-bury-me-behind-the-baseboard/REPORT.md`).

Inherits `STATUS.md` Constraints in full — birthday surprise still gates
cutover; push to main blocked by hook; brutally brief docs.

---

## 0. Goal-backward

When Roman opens `/admin/collections/productions/<id>?locale=ru`:

1. He sees Russian labels and Russian descriptions on every field he edits
   regularly (not English chrome with Russian helper text — the field
   names themselves).
2. The form is tabbed (Identity / Media / Production / Taxonomy / Team /
   Recognition / History / Settings), not a 12 000 px scroll.
3. There is no dead vertical space between elements; the form reads dense
   but not crowded.
4. Image fields show a thumbnail and have visible Upload / Clear / Delete
   buttons — same affordance set Keystatic shipped.
5. `/admin/collections/media` is populated (post-backfill) and lets him
   browse all uploaded images by name + thumbnail.
6. Status bar shows save state ("Unsaved changes" / "Saved 2 s ago") —
   the bug raised in the bury-me review §Visibility of system status.

Each tier below is one PR. Items inside a tier ship together.

---

## Tier 1 — Zero schema-shape change (1 PR, ~3 h) — **SHIPPED 2026-05-14**

Pure cosmetics + descriptions. No Postgres migration; no risk to seeded
content; `npm run payload:generate:types` after merge.

### 1.1 RU labels on every field — **shipped in `49790b3`**

Today `slug`, `year`, `durationMin` etc. show their English schema names
because we only set `label: { ru, en }` on group containers, not leaf
fields.

For every leaf field in `collections/Productions.ts` and globals/About +
Contact, add `label: { ru: 'Слаг', en: 'URL slug' }` patterns. List
below covers the productions schema (most frequent edits):

| field                          | RU label             |
| ------------------------------ | -------------------- |
| `slug`                         | URL-слаг             |
| `year`                         | Год премьеры         |
| `durationMin`                  | Длительность (мин)   |
| `status`                       | Статус               |
| `identity.title`               | Название             |
| `identity.tagline`             | Подзаголовок         |
| `identity.synopsis`            | Синопсис             |
| `identity.directorsNote`       | Записка режиссёра    |
| `identity.body`                | Полный текст         |
| `media.poster.src`             | Постер               |
| `media.poster.credit`          | Автор фото           |
| `media.productionsPhoto.src`   | Обложка для каталога |
| `media.featuredPhoto.src`      | Обложка для главной  |
| `media.gallery`                | Галерея              |
| `media.videos`                 | Видео                |
| `production.theatre.name`      | Театр                |
| `production.theatre.shortName` | Кратко               |
| `production.theatre.city`      | Город                |
| `production.theatre.country`   | Страна (ISO-2)       |
| `production.theatre.url`       | Сайт театра          |
| `production.premiereDate`      | Дата премьеры        |
| `production.ticketsUrl`        | Билеты               |
| `production.ageRating`         | Возраст              |
| `taxonomy.role`                | Роли Романа          |
| `taxonomy.form`                | Форма                |
| `taxonomy.lineage`             | Школа                |
| `taxonomy.tags`                | Теги                 |
| `team.creditsRu/En/De`         | Команда (RU/EN/DE)   |
| `recognition.awards`           | Награды              |
| `recognition.festivals`        | Фестивали            |
| `recognition.press`            | Пресса               |
| `recognition.externalLinks`    | Внешние ссылки       |
| `history.tour`                 | Гастроли             |
| `history.runs`                 | История площадок     |
| `settings.bookingCta`          | Кнопка «Заказать»    |
| `settings.featured`            | На главной           |
| `settings.featuredOrder`       | Порядок на главной   |
| `settings.listOrder`           | Порядок в каталоге   |
| `settings.techRider`           | Тех-райдер (PDF)     |
| `settings.pressKit`            | Пресс-кит            |
| `settings.notionIds`           | Notion IDs (legacy)  |

### 1.2 RU descriptions — port from `keystatic.config.ts` — **shipped in `9c9a745`**

Today only some groups have descriptions. Port every `desc(ru, en)` call
from `keystatic.config.ts` to `admin.description: { ru, en }` on the
matching Payload field. Mechanical sweep — no judgement calls.

Reference: `keystatic.config.ts` lines 165–1054 contain every existing
description. Mirror verbatim; the editor is the same person.

### 1.3 Sidebar grouping (`admin.group`) — **shipped in `4a55e7c`**

Already partial — both `Productions` and `About` carry
`group: { ru: 'Контент' }`. Confirm and finalise:

```
Контент
├── Спектакли          (collection: productions)
├── О режиссёре        (global: about)
└── Контакты           (global: contact)

Медиатека
└── Изображения        (collection: media)

Система
└── Пользователи       (collection: users)
```

Three groups → mirror's Keystatic's `ui.navigation` from the keystatic
review §3 / shipped Tier-1 PR 1. Add `group` to `Users` + `Media`
collections; rename plurals to RU where the label appears.

### 1.4 List-view columns — **shipped in `d4b0d19` (+ `87b64b6` rollback of dotted-path useAsTitle)**

`useAsTitle` stays at `slug` after a same-day rollback — Payload 3.84 did
not surface the localized title cleanly enough to justify the switch.
`defaultColumns` keeps the dotted paths and renders the Russian title in
the list view as intended.

Mirror the shipped Keystatic columns (`year`, `durationMin`, `status`)
but add `identity.title` so the editor reads a real Russian title in the
list, not the slug-as-title fallback:

```ts
admin: {
  useAsTitle: 'identity.title',  // localized → shows current locale
  defaultColumns: [
    'identity.title',
    'year',
    'durationMin',
    'status',
    'settings.featured'
  ]
}
```

Confirm Payload accepts dotted paths in `useAsTitle` — if it doesn't,
fall back to a virtual top-level `displayTitle` field with a
`beforeChange` hook that copies `identity.title.ru` up. (Same fallback
pattern Keystatic used per `keystatic.config.ts:163` comment.)

### 1.5 Conditional fields — **shipped in `2481c7e`**

Hide pointless inputs:

- `settings.bookingCtaLabel` + `settings.bookingCtaUrl` → only when
  `settings.bookingCta === true`.
- `settings.featuredOrder` → only when `settings.featured === true`.

Payload's `admin.condition` is a function `({ siblingData }) => bool`. No
storage-shape change — empty values stay in Postgres but the form hides
them.

### 1.6 Russian admin chrome — **shipped in `ad74687`**

Live: `i18n.supportedLanguages: { ru, en }` with `fallbackLanguage: 'en'`.
Roman picks RU at top-right; missing keys fall through to EN.

Payload supports `i18n.supportedLanguages` to add a locale to the admin
chrome itself ("Save" → "Сохранить", etc.). Russian isn't ship-built
into Payload but `@payloadcms/translations` includes a community RU. Try:

```ts
import { ru } from '@payloadcms/translations/languages/ru'

i18n: {
  supportedLanguages: { en: enTranslations, ru },
  fallbackLanguage: 'ru'
}
```

Per-user preference flips at top-right of the admin. If the RU pack ships
incomplete (likely — community-maintained), fall back to EN chrome and
keep the field-level RU labels from 1.1. Don't block the PR on this.

---

## Tier 2 — Form layout polish (1 PR, ~2 h) — **SHIPPED 2026-05-14**

No schema shape change; same Postgres rows. Layout density only.

### 2.1 Tab strip per top-level group — **shipped in `fc16c51` + `1fc6de2`**

Final shape: eight unnamed tabs wrap the original groups, and the four
list-view scalars (`slug`, `year`, `durationMin`, `status`) live inside
the tab they semantically belong to (Идентичность / Продакшен / Настройки)
rather than floating above the strip. Unnamed tabs are layout-only so
data shape stays flat — `defaultColumns` + `useAsTitle` still resolve by
top-level name.

Today every group renders inline, stacked: Identity → Media → Production
→ Taxonomy → Team → Recognition → History → Settings. ~8 sections
top-to-bottom = ~10 k px scroll, same problem Keystatic had pre-WS-6.

Payload's `type: 'tabs'` field is the native answer. The current globals
About uses it already. Refactor `collections/Productions.ts`:

```ts
fields: [
  // Top-level scalars stay outside any tab (slug, year, durationMin,
  // status — they own the form header / list columns).
  { name: 'slug', ... },
  { name: 'year', ... },
  { name: 'durationMin', ... },
  { name: 'status', ... },
  {
    type: 'tabs',
    tabs: [
      { label: { ru: 'Идентичность', en: 'Identity' }, fields: [...] },
      { label: { ru: 'Медиа', en: 'Media' }, fields: [...] },
      { label: { ru: 'Продакшен', en: 'Production' }, fields: [...] },
      { label: { ru: 'Таксономия', en: 'Taxonomy' }, fields: [...] },
      { label: { ru: 'Команда', en: 'Team' }, fields: [...] },
      { label: { ru: 'Признание', en: 'Recognition' }, fields: [...] },
      { label: { ru: 'История', en: 'History' }, fields: [...] },
      { label: { ru: 'Настройки', en: 'Settings' }, fields: [...] }
    ]
  }
]
```

Tabs are a layout-only field; Postgres column shape doesn't change. No
migration. `lib/content.ts` reads identical doc shape.

**Mobile gotcha** — keystatic-tabs REPORT.md §3: 8 tabs wrap on narrow
viewports. Payload's tab strip behaves better here (it's a flex row with
overflow-x: auto by default) but verify on 390 px before shipping.

### 2.2 Side-by-side l10n display — **not shipped (path 1 accepted)**

No code change — Payload's built-in locale switcher in the header is the
shipped UX. Optional banner was deemed redundant.

Localized fields in Payload show a locale-switcher dropdown at the top of
the form (one locale visible at a time). Keystatic showed RU / EN / DE
side-by-side in a 3-column `layout: [4, 4, 4]`.

Payload doesn't natively render localized fields side-by-side — its
locale switcher is global to the doc. Two paths:

1. **Accept Payload's locale switcher.** Roman edits in RU (default
   locale), flips to EN, edits EN, flips to DE, saves once. Single
   column, full-width inputs, less visual noise. Matches the bury-me
   review §Recommendations Tier 7 ("admin can be unilingual-per-tab and
   still produce trilingual output") which the review explicitly
   prefers over Keystatic's side-by-side.
2. **Custom Field components** that read all locales and render three
   inputs in a 4-4-4 grid. Heavy lift; not worth it.

**Decision: ship path 1.** Add a banner under the page title showing the
current locale and a CTA "Switch to EN / DE" for clarity.

### 2.3 Dead-space cleanup — **shipped in `3565e1f`**

The keystatic-tabs review §2 documents extra padding after switching
tabs. Payload's tabs don't have the same DOM structure (no
mutation-observer shim needed), but verify there's no visual dead band
under each tab strip. If so, add CSS overrides via
`app/(payload)/custom.scss`:

```scss
.tabs-field__tabs {
  margin-bottom: 0;
}
.tabs-field__tab-content > .render-fields {
  padding-top: 12px;
}
```

Same target as the keystatic shim (`KeystaticEnhancements.tsx` §2 fix).

### 2.4 Visible save state — **not shipped (verified out-of-box)**

Payload's Save button already greys/colours by dirty state — confirmed
in dev, nothing to wire.

Bury-me review §Visibility of system status: editors can't tell whether
the form is dirty.

Payload's `Save` button changes state automatically when the form is
dirty (greys when clean, colors when dirty). Verify this works for us out
of the box; if not, add custom `admin.components.actions` button. Most
likely a no-op — just confirm before shipping.

### 2.5 Live-preview side pane — **shipped in `f1abef8`**

Breakpoints (390 / 768 / 1440, short names `m`/`t`/`d`) configured on
the root `admin.livePreview`. Productions + About inherit; Contact
omitted (four fields — not worth a preview pane).

Already wired in `collections/Productions.ts` via `admin.livePreview.url`
and in `globals/About.ts`. Verify it opens. Add to `globals/Contact.ts`
too if useful (probably not — contact has 4 fields).

Set `admin.livePreview.breakpoints` to match the public site's
breakpoints already in DESIGN.md §6:

```ts
livePreview: {
  url: ({ data, locale }) => `/${locale.code}/productions/${data.slug}`,
  breakpoints: [
    { label: 'Mobile', name: 'm', width: 390, height: 800 },
    { label: 'Tablet', name: 't', width: 768, height: 1024 },
    { label: 'Desktop', name: 'd', width: 1440, height: 900 }
  ]
}
```

---

## Tier 3 — Schema shape changes (1 PR, ~3 h, requires re-seed)

These touch Postgres column shapes; require running
`npm run payload:generate:types` and re-seeding or running a manual
update. Skip until Tier 1+2 are live and stable.

### 3.1 Promote `ageRating` and `theatre.country` to selects

`KEYSTATIC_IMPROVEMENT_PLAN.md` 2026-05-06 decision row documents that
both fields have null entries needing backfill. Pre-Payload: 16 null
ageRatings + 8 null theatre.countries (3 explicit, 5 missing).

Audit again in Postgres before promoting (the seed may have normalised
some). Then:

```ts
{
  name: 'ageRating',
  type: 'select',
  defaultValue: '6+',
  options: [
    { label: '0+', value: '0+' },
    { label: '6+', value: '6+' },
    { label: '12+', value: '12+' },
    { label: '16+', value: '16+' },
    { label: '18+', value: '18+' }
  ]
}
```

`fields.select` with `defaultValue` will silent-fill missing rows on
first edit. To avoid that, audit + backfill nulls in Postgres first via
a one-off script (`scripts/backfill-age-rating.ts`).

### 3.2 `role` promotion review

Currently `taxonomy.role` is `select hasMany`. Keystatic shipped it as
`multiselect` after a flip-flop (decision log entry 2026-05-06 user).
Confirm Payload behaves the same way. No schema change expected.

### 3.3 Tour cities + form/lineage/tags

Today these are stored as `array<{ value: text }>` or `array<{ city:
localized text }>`. The `{ value: ... }` wrapper is editor-hostile —
adding a tag should be one click + type, not "click + expand + type +
collapse".

Two options:

1. Keep wrapper, add `admin.components.RowLabel` that surfaces the
   `value` string on the collapsed row so it reads naturally.
2. Migrate to a flat `string[]` via a custom field implementation.
   Heavy; not worth it.

**Decision: option 1.** Custom RowLabel components on each array field.

### 3.4 Custom upload widget on `gallery[].src`

The Upload button on a single field is already there. On the gallery
array, every gallery item gets its own Upload button independently — the
component already handles this via `useField({ path })`. Verify on a
production with 10+ gallery items; no schema change needed.

### 3.5 Drafts + versions

Payload supports draft/published cycles via `versions: { drafts: true }`
on a collection. Today every save is published live (and triggers
revalidation). For a single-editor site this is fine but means typo'd
edits flash to production for ~1 s before being fixed.

Defer until Roman asks. Not blocking. Note: enabling `drafts` adds a
`_status` column + filters at runtime, so `lib/content.ts` would need
`where: { _status: { equals: 'published' } }`.

---

## Tier 4 — Optional admin chrome theming (deferred, no PR)

The bury-me review §Editorial fit explicitly **forbids** dragging the
public-site Plakat/gorky design into the admin — "importing them into
the admin would be a category error." Payload's default dark chrome is
correct; no theming work needed.

Exception worth keeping in the backlog only: the wordmark in
`/admin`'s top-left could read `boklanov.com` in the site's Unbounded
font as a low-effort brand tie-in (keystatic admin has the equivalent
per the review's §Observations). `admin.components.graphics.Logo` slot
in payload.config; can be a 50-line component. Not Tier 1–3 priority.

---

## Tier 5 — Operational quality (1 PR, ~1 h) — **SHIPPED 2026-05-14 (5.1 + 5.2)**

### 5.1 Auto-regenerate importMap on dev startup — **shipped in `c83e336`**

Every time we add a custom admin component (like `ImagePathPreview` or a
future RowLabel) we have to remember `npm run payload:generate:importmap`
before reloading. Easy to forget. Add a `predev` hook:

```json
"predev": "npm run payload:generate:importmap",
```

Trade-off: adds ~3 s to `npm run dev`. Worth it.

### 5.2 Type-gen in CI — **shipped in `5ee93ff`**

`npm run payload:generate:types` writes `payload-types.ts`. Currently
manual. Add to a `prebuild` hook or a `pretest` so missed regenerations
surface during code review:

```json
"prebuild": "npm run payload:generate:types && npm run payload:generate:importmap"
```

### 5.3 Migration script for null backfills

Before Tier 3.1 can ship, write `scripts/backfill-nulls.ts`:

- Find all productions with `production.ageRating === null` → set to
  `'6+'` (the most common value across the dataset; lets a select
  default win).
- Find all with `production.theatre.country === null` → set to derived
  from `theatre.city` via a lookup table (Moscow→RU, Berlin→DE, Astana→KZ
  …).

Same idempotency rule as the seed: pre-check current value, only set if
null. Verify with `npm run payload:seed --dry-run` (after adding that
flag).

### 5.4 Admin access log

Defer. Payload's audit log requires the paid Cloud product. For two
users we can live with Postgres + git history.

---

## Tier 6 — Cutover prep (must happen before C in PAYLOAD_MIGRATION_PLAN)

These ship together as the final PR before retiring Keystatic.

### 6.1 Verification matrix

Run through `PAYLOAD_MIGRATION_PLAN §11` checklist end-to-end:

- [ ] `/admin` create-edit-save flow works for a production in RU
- [ ] Same in EN + DE via locale switcher
- [ ] About global edit revalidates `/{ru,en,de}/about`
- [ ] Contact global edit revalidates `/{ru,en,de}/contact`
- [ ] Featured-flip on a production revalidates `/{ru,en,de}`
- [ ] Gallery upload via admin lands in R2 at `productions/<slug>/<file>`
- [ ] OG image renders correctly with new data
- [ ] `npm run build` clean — no `content/` fs reads
- [ ] Lighthouse 4×100 holds on home + production page
- [ ] All 54 production slugs present in Postgres
- [ ] `payload-types.ts` has no `any` leaks consumed by `lib/content.ts`

### 6.2 Keystatic deletion

Per `PAYLOAD_MIGRATION_PLAN §C`:

- `npm rm @keystatic/core @keystatic/next`
- `rm keystatic.config.ts`
- `rm -rf app/keystatic`
- `rm app/api/keystatic/route.ts` (the routes still live for now)
- Keep `app/api/keystatic-asset/` — the Payload `ImagePathPreview`
  reuses it. Rename to `app/api/r2-asset/` after Keystatic is gone if
  it grates.
- `rm scripts/audit-keystatic-schema.ts`
- `rm .github/workflows/backup-r2-to-git.yml`
- `rm -rf content/productions content/about content/contact` (Postgres
  is authoritative; git history retains the YAML/MDX)
- Update `middleware.ts` to drop `keystatic` from the matcher exclusion
- Move `content/_PRODUCTION_TEMPLATE.yaml` to `archive/` for reference

### 6.3 Doc updates per `MAP.md §7`

- `STATUS.md` — new phase row "11 CMS swap — Payload". Mark Tier-by-tier shipped.
- `CONTENT.md` — replace Keystatic flow with `/admin` flow.
- `content/AUTHORING.ru.md` — replace "Способ 1: браузер (Keystatic)"
  with `/admin`. Drop "Способ 2: Obsidian" entirely (Postgres-backed
  now; git workflow retired).
- `MAP.md §1` — drop the four `KEYSTATIC_*.md` rows, keep
  `PAYLOAD_MIGRATION_PLAN.md` + this doc. Mark `keystatic.config.ts` +
  `app/keystatic/*` deleted in §3.
- `readme.md` — stack line: Keystatic → Payload. Dev section: env vars.

---

## Open decisions

| #   | Question                                                                                     | Default                                                 | Confirm by |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------- |
| Q7  | Lock the locale switcher to "RU only" until cutover so Roman doesn't see partial EN/DE?      | **No** — full switcher; he'll learn the pattern         | Tier 1     |
| Q8  | Auto-default `ageRating` null → `6+` in 3.1 backfill?                                        | **No** — list nulls to user, let them backfill in admin | Tier 3.1   |
| Q9  | RU admin chrome via `@payloadcms/translations`?                                              | **Try, fall back gracefully** if incomplete             | Tier 1.6   |
| Q10 | Custom admin logo (wordmark) at top-left?                                                    | **Defer to Tier 4** — nice-to-have                      | Tier 4     |
| Q11 | Drafts + versions on Productions?                                                            | **No** — single editor, low risk                        | Tier 3.5   |
| Q12 | Move `content/AUTHORING.ru.md` Способ 2 (Obsidian) into archive on cutover, or keep partial? | **Move to archive** — single source of truth = Postgres | Tier 6.3   |

---

## Risks + mitigations

| Risk                                                                  | Mitigation                                                                                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wrapping fields in `type: 'tabs'` changes Postgres column shape       | Verify in dev — Payload's tabs are a layout-only construct that doesn't reshape data. If it does (named tabs vs un-named), re-seed before merge. |
| Locale switcher confuses Roman                                        | Tier 2.2 adds a banner showing current locale + Switch CTA.                                                                                      |
| Tier 3.1 backfill defaults overwrite legitimate empty values          | Q8 default = don't auto-default; require manual backfill via admin.                                                                              |
| RU translations pack (`@payloadcms/translations/ru`) ships incomplete | Tier 1.6 falls back to EN chrome with RU field labels.                                                                                           |
| `useAsTitle: 'identity.title'` doesn't accept dotted path             | 1.4 fallback: virtual top-level `displayTitle` with a `beforeChange` hook.                                                                       |
| Dotted-path `defaultColumns` rendering ugly                           | Test with 5 productions visible; switch to top-level virtual columns if so.                                                                      |
| Live-preview iframe blocked by CSP                                    | Verify the site's CSP allows `frame-ancestors 'self'` or remove the header in dev.                                                               |

---

## Recommended order

1. ~~**Tier 1**~~ — **shipped 2026-05-14**. RU labels + descriptions + sidebar + columns + conditionals + RU chrome.
2. ~~**Tier 2**~~ — **shipped 2026-05-14**. Tabs + live-preview breakpoints + dead-space cleanup. (2.2/2.4 verified as no-ops.)
3. ~~**Tier 5.1 + 5.2**~~ — **shipped 2026-05-14**. predev + prebuild hooks. (5.3 still pending — only needed before Tier 3.1. 5.4 deferred.)
4. **Tier 3** — Schema shape (selects, RowLabel). One PR, ~3 h. **Pending dogfood feedback from Roman on the shipped Tier 1+2.**
5. **Tier 6** — Cutover prep + Keystatic deletion. Final PR before retiring `/keystatic`.

Tier 4 is deferred indefinitely unless Roman asks for the wordmark.

---

## References

- `PAYLOAD_MIGRATION_PLAN.md` — what's already shipped (P1–P3 + media UX).
- `KEYSTATIC_IMPROVEMENT_PLAN.md` — the Keystatic feature parity target. Decision log + lessons learned still apply.
- `.design/review/2026-05-09-keystatic-tabs/REPORT.md` — three tab bugs (URL slug visibility, dead space, mobile wrap). Pre-emptive fixes baked into Tier 2.
- `.design/review/2026-05-08-keystatic-bury-me-behind-the-baseboard/REPORT.md` — editor-form ergonomics critique. Recommendations 1, 2, 4, 6, 7 inform Tiers 1–3.
- Payload docs (Context7, v3.84.0): `admin.components`, `tabs` field, `i18n.supportedLanguages`, `localization`, `useFormFields`.
- `STATUS.md` Constraints — birthday surprise, RU primary editor, brutally brief docs.
