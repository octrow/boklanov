# CONTENT

How content gets into boklanov.com. Updated: 2026-05-14 (Phase 11 — Payload swap shipped).

Owns: live workflow + content shape.
Roman-facing day-to-day RU: `content/AUTHORING.ru.md`.
History (read-only): `archive/CONTENT_WORKFLOW_compress.md` (Obsidian-era plan), `KEYSTATIC_*.md` references in `archive/` (intermediate stage). Both superseded.

## Source of truth

- **Postgres (Neon)** is the authoritative store. Three Payload entities:
  - `productions` collection (`collections/Productions.ts`) — 54 documents.
  - `about` global (`globals/About.ts`) — bio, portrait, photos, milestones, lineage, marginalia.
  - `contact` global (`globals/Contact.ts`) — intro, email, Telegram, Instagram URLs.
- Schemas are the source of truth for both the DB shape and the `/admin` form layout. Edit them → `npm run payload:generate:types` (auto-run by `prebuild`).
- No `content/{productions,about,contact}` YAML/MDX fixtures (retired in `eaf5a37`). No Obsidian flow. No Keystatic.
- Page renderers (`app/[locale]/{productions,about,contact}/**`) read via Payload Local API in `lib/content.ts` — `fetchAllProductions`, `getAbout`, `getContact`. All cached via `unstable_cache` + tagged.

## Authoring stack

- **`/admin`** at `https://boklanov.com/admin` (Payload 3 in-process with Next.js). Russian chrome via `@payloadcms/translations/ru`; per-user EN fallback.
- **Locale switcher** in the doc header — Roman edits RU, flips to EN, flips to DE, saves once per locale. `localized: true` Payload fields store all three locales side-by-side in Postgres.
- **Live preview** pane wired to `/{locale}/productions/<slug>` and `/{locale}/about` at 390/768/1440 breakpoints. Edit → preview updates without saving.
- **Save** triggers Payload `afterChange` hook (`hooks/revalidate.ts`) → `revalidateTag('productions' | 'about' | 'contact')` → next request rebuilds the relevant routes. Editor sees the change on the live site within a few seconds.
- No git commits per save. Postgres is mutable.

## Image hosting

- R2 bucket `boklanov-content`, custom domain `cdn.boklanov.com` (DNS pending — currently served via dev URL or Vercel `public/`).
- Uploads in `/admin` go through `components/admin/ImagePathPreview.tsx` → `POST /api/keystatic-asset` (route name kept for now; rename to `/api/r2-asset` deferred). Stores under `productions/<slug>/` or `about/`.
- `lib/cdn.ts` `cdnUrl(path)` wraps every `<Image>` `src`. `next.config.js` `images.remotePatterns` allows `cdn.boklanov.com`.
- 291 files migrated 2026-05-02. New uploads stack on top via `/admin`.
- Set `NEXT_PUBLIC_CDN_BASE` in Vercel to activate CDN serving. Unset = images serve from `public/` via Vercel.

## Production fields (Postgres → `lib/content.ts` `Production` shape)

Top-level scalars: `slug`, `year`, `durationMin`, `status`.

Tabs in `/admin` (layout-only, flat at storage time):

- **Основное** — `identity.{title, body, tagline, synopsis, directorsNote}` (richText Lexical for body/tagline/synopsis/directorsNote; title is localized text).
- **Медиа** — `media.{poster, productionsPhoto, featuredPhoto, gallery, videos}`.
- **Продакшен** — `production.{theatre.{name,shortName,city,country,url,year}, premiereDate, ageRating, ticketsUrl}`. `theatre.country` is a select with 22 ISO-2 options (extend in `collections/Productions.ts`).
- **Таксономия** — `taxonomy.{role, form, lineage, tags}`. Arrays of `{value: string}` rendered with custom RowLabels.
- **Команда** — `team.creditsRu` / `team.creditsEn` / `team.creditsDe` — parallel arrays of `{role, name, url?}`.
- **Признание** — `recognition.{awards, festivals, press, externalLinks}`.
- **История** — `history.{tour[], runs[]}`.
- **Настройки** — `settings.{featured, featuredOrder, listOrder, bookingCta + bookingCtaLabel + bookingCtaUrl, techRider, pressKit, notionIds}`. `bookingCtaLabel/Url` only show when `bookingCta` toggle is on; `featuredOrder` only when `featured` is on.

## Editing rules

- Open `/admin` → `Спектакли` → pick or create. Title is the localized field per current locale; the slug column owns identity.
- Add a production: «Создать» button — slug is the only required field; everything else can be filled later in any order.
- Featured strip: toggle `settings.featured` on, set `featuredOrder` for the slot. Cards without `media.poster.src` are filtered at render time (`p.featured && p.poster.src`).
- About bio prose: edit `body` in `/admin/globals/about` (per locale via switcher). First paragraph is the lead; the rest are body. `marginalia[]` is an optional array (one entry per body paragraph, `null` for no note) that drives the ≥1280px gutter note.
- DE bios: only top 5-6 priority shows for v1 — leave `body.de` empty for the rest; the renderer falls back to EN and shows the «Deutsche Übersetzung folgt» Marginalia cue.
- UI chrome strings stay in `messages/{ru,en,de}.json`. RU+EN required. DE chrome only. Production-card text never translates to DE (IA D4).

## Hooks + revalidation

- Every `afterChange` (collection + global) calls `revalidateTag` for the entity-wide tag plus a slug-specific tag where relevant. See `hooks/revalidate.ts`.
- `lib/content.ts` cached fetchers are tagged with the same names; cache flushes on save.
- Bulk operations (seed, backfill) set `context.disableRevalidate = true` to suppress the storm.

## TourRider null-field contract

The right-rail TourRider on `/productions/[slug]` (Phase 9.7) reads the
mapped `Production` shape and short-circuits null fields. Omitting a
field omits the row — the component never renders a placeholder, never
an empty `<a>`. Conversely, populating a field surfaces a new row
without touching component code:

| Field              | Surfaces row               | Notes                                           |
| ------------------ | -------------------------- | ----------------------------------------------- |
| `year`             | `YEAR`                     | Mono, tabular-nums.                             |
| `durationMin`      | `RUN  nn MIN`              | Thin-space before `MIN`.                        |
| `ageRating`        | `AGE  3+ / 6+ / 12+ / 18+` | Plain string.                                   |
| `theatre.country`  | `COUNTRY`                  | ISO-2 via `countryCode` mapper.                 |
| `theatre.country`  | `LANGUAGE`                 | Derived (DE/AT/CH→`DE`, KZ→`RU`, default `RU`). |
| `form[]`           | `FORM`                     | Joined `·` uppercase.                           |
| `lineage[]`        | `LINEAGE`                  | Joined `·` uppercase.                           |
| `tour[]` not empty | `TOURING SOLO`             | Plinth-tier indicator.                          |
| `techRider`        | `TECH RIDER  PDF`          | Anchor `aria-label="Technical rider, PDF"`.     |
| `pressKit`         | `PRESS KIT  ZIP`           | Anchor `aria-label="Press kit, ZIP"`.           |

Empty `tour[]`, missing `techRider`, missing `pressKit` are the most
common omissions; render is silent until populated.

## Retired

- Keystatic admin (`app/keystatic/`, `keystatic.config.ts`, `@keystatic/*` deps) — Phase 11 swap, `a3535b0`.
- `content/{productions,about,contact}/` YAML/MDX — replaced by Postgres, `eaf5a37`. Git history preserves every revision.
- Obsidian editing flow (`obsidian-git` push-on-save) — superseded by `/admin` saves into Postgres.
- `scripts/sync-from-notion.ts` (Notion era) — `scripts/_legacy/`, FROZEN header.
- `metadata.yml` overlay — deleted; folded into frontmatter pre-Payload.
- `index.mdx` (frontmatter + body in one file) — split, then ported to Payload.
- `scripts/audit-keystatic-schema.ts`, `.github/workflows/backup-r2-to-git.yml` — Phase 11.
