# CONTENT

How content gets into boklanov.com. Updated: 2026-05-04 (mdx→yaml split).

Owns: live workflow + content shape.
Roman-facing day-to-day RU: `content/AUTHORING.ru.md`.
History (read-only, do not edit in routine work): `archive/CONTENT_WORKFLOW_compress.md` — 9-option matrix, Q&A,
deferred Decap plan (full: `archive/CONTENT_WORKFLOW.md`).

`content/about/{ru,en}.yaml` `photos[]` array — `- src: /path.jpg\n  credit: "…"`. Rendered as 2-col masonry
below the geography block. Empty array = section hidden.

## Source of truth

- Vault = repo. Per production: `index.yaml` (data) + `body.{ru,en,de}.md` (prose, optional per locale).
- `index.yaml` is single source of truth per data field. Each `body.<locale>.md` is single source of truth for that locale's long-form prose.
- No `metadata.yml` overlay (folded one-shot in Phase 8.3, `c1c4436`).
- No `body` field inside frontmatter (split into sibling `.md` files in 2026-05-04 mdx→yaml migration).
- No live Notion API. No CMS. No backend.
- Edit -> commit-and-push from obsidian-git sidebar -> Vercel rebuilds `main`.
- WIP: `draft` branch -> Vercel preview URL -> merge to `main` when ready.

## Editor stack

- Obsidian (free, desktop + mobile). License `obsidian.md/license`.
- `obsidian-git` plugin: pull on open, commit + push from sidebar. Manual install by Roman.
- `body.<locale>.md` open as plain markdown in Obsidian (native).
- `index.yaml` opens as plain text — no Properties panel; YAML is hand-edited (`key: value` syntax). The `mdx-as-md` plugin was retired in the 2026-05-04 migration.
- `.obsidian/{app,community-plugins}.json` committed. `useMarkdownLinks: true` (no `![[wikilink]]`).
- `scripts/lint-content.ts` + `npm run lint-content`: CI fails on Obsidian wikilinks in `content/**/*.md`.

## Image hosting

- Code path: `lib/cdn.ts` `cdnUrl(path)` helper, `<Image>` `src` wrapped, `next.config.js` `images.remotePatterns`
  allows `cdn.boklanov.com`.
- `scripts/upload-images.ts`: S3-compatible upload, `--slug`, `--dry-run`, skip-unchanged-by-size.
  `npm run upload-images`.
- R2 bucket `boklanov-content`, custom domain `cdn.boklanov.com`, public-read.
- 291 files uploaded 2026-05-02. Bucket public-read enabled.
- Dev URL (rate-limited, no Cloudflare cache): `https://pub-eaffa56b38f2484cb3a48ab54ac582b0.r2.dev`
- Production URL `cdn.boklanov.com` blocked until `boklanov.com` DNS moves to Cloudflare (currently Spaceship).
- Set `NEXT_PUBLIC_CDN_BASE` in Vercel to activate CDN serving. Unset = images serve from `public/` via Vercel.
- New photos: drop into `public/productions/<slug>/`, then `npm run upload-images -- --slug <slug>`.

## File shape

Per production:
```
content/productions/<slug>/
  index.yaml          # all data fields (see below)
  body.ru.md          # long-form prose, RU
  body.en.md          # long-form prose, EN
  body.de.md          # long-form prose, DE (optional; only when present)
```

`index.yaml` shape (no leading `---` delimiters — pure YAML):

```yaml
slug: bury-me-behind-the-baseboard
notionIds: { ru: ..., en: ... }    # historical traceability only
title: { ru: "...", en: "...", de: null }
synopsis: { ru: "...", en: "...", de: null }
# body lives in sibling files, not here:
#   body.ru.md, body.en.md, body.de.md (optional)
theatre: { name: "...", shortName: "...", city: "...", country: "RU", url: "..." }
year: 2020
premiereDate: { ru: "...", en: "..." }
ticketsUrl: "..."
ageRating: "18+"
durationMin: 90
role: director                     # director | co-director | performer | reader | sketch
form: [ puppet, solo ]
lineage: [ btk, kudashov ]
credits: { ru: [ { role, name, url? } ], en: [ ... ] }
poster: { src: "/...", credit: null }
productionsPhoto: { src: "/...", credit: null }  # optional; overrides poster on /productions cards
featuredPhoto: { src: "/...", credit: null }      # optional; overrides on home featured strip (chain: featuredPhoto → productionsPhoto → poster → typographic)
gallery: [ { src, credit, caption: { ru, en } } ]
videos: [ { provider: youtube, id } ]
awards: [ { name, category, year, city } ]
press: [ { title, outlet, url, language } ]
tour: [ { city } ]                   # Plinth only; empty -> ON TOUR band hidden
directorsNote: { ru: "...", en: "..." }  # optional; italic Lora blockquote below synopsis
runs: # optional; mono row above title (run-of-show)
  - venue: "БТК"
    city: "СПБ"
    yearFrom: 2020
    yearTo: 2024
    count: "~80 спектаклей"
externalLinks: [ { label, url } ]
techRider: null                    # PDF path
pressKit: null                     # ZIP path
featured: true                     # home strip selector
status: undefined                  # `withdrawn` -> hide from grids+CmdK, suppress CTA
tags: [ ]
```

## Editing rules

- Edit `index.yaml` as plain text in any editor (Obsidian opens it as text). `Cmd+S`. Source Control -> Commit-and-push.
- Edit prose: `body.{ru,en,de}.md` as plain markdown in Obsidian. `Cmd+S`. Same commit flow.
- Add new production: copy `content/_PRODUCTION_TEMPLATE.yaml` to `content/productions/<slug>/index.yaml`. Latin slug,
  dashes-not-spaces. Fill fields. Create `body.ru.md` + `body.en.md` (and `body.de.md` if applicable). Commit.
- New photos: drop into `public/productions/<slug>/`, run `npm run upload-images -- --slug <slug>`, commit.
- Featured strip: set `featured: true`. Cards without poster filtered out (`p.featured && p.poster.src`).
- About bio prose: `content/about/{ru,en,de}.md`. `marginalia` array, milestones, lineage, photos: `content/about/{ru,en,de}.yaml`.
  `marginalia[]` is an optional array (one entry per body paragraph, `null` for no note) that drives the ≥1280px gutter note.
  `photos[]` — `- src: /path.jpg\n  credit: "Name"` — add once photos are ready; empty array = section hidden.
- UI chrome strings: `messages/{ru,en,de}.json`. RU+EN required. DE chrome only.
- Production-card text never translates to DE (IA D4).
- DE bios: only top 5-6 priority shows for v1.

## TourRider null-field contract

The right-rail TourRider on `/productions/[slug]` (Phase 9.7) reads
frontmatter directly and short-circuits null fields. Omitting a field
omits the row — the component never renders a placeholder, never an
empty `<a>`. Conversely, populating a field surfaces a new row without
touching component code:

| Field              | Surfaces row               | Notes                                           |
|--------------------|----------------------------|-------------------------------------------------|
| `year`             | `YEAR`                     | Mono, tabular-nums.                             |
| `durationMin`      | `RUN  nn MIN`              | Thin-space before `MIN`.                        |
| `ageRating`        | `AGE  3+ / 6+ / 12+ / 18+` | Plain string.                                   |
| `theatre.country`  | `COUNTRY`                  | ISO-2 via `countryCode` mapper.                 |
| `theatre.country`  | `LANGUAGE`                 | Derived (DE/AT/CH→`DE`, KZ→`RU`, default `RU`). |
| `form[]`           | `FORM`                     | Joined ` · ` uppercase.                         |
| `lineage[]`        | `LINEAGE`                  | Joined ` · ` uppercase.                         |
| `tour[]` not empty | `TOURING SOLO`             | Plinth-tier indicator.                          |
| `techRider`        | `TECH RIDER  PDF`          | Anchor `aria-label="Technical rider, PDF"`.     |
| `pressKit`         | `PRESS KIT  ZIP`           | Anchor `aria-label="Press kit, ZIP"`.           |

Empty `tour[]`, missing `techRider`, missing `pressKit` are the most
common omissions; render is silent until populated.

## Retired

- `scripts/sync-from-notion.ts` -> `scripts/_legacy/`, FROZEN header. `npm run sync` echoes stub.
- `notion-data/` -> `archive/notion-export-2026-05` branch (frees ~250 MB from `main`).
- `metadata.yml` overlay -> deleted; folded into frontmatter.
- `index.mdx` (frontmatter + body in one file) -> split into `index.yaml` + `body.{ru,en,de}.md` (2026-05-04). Legacy migrators (`scripts/migrate-body-to-frontmatter.ts`, `scripts/fold-overlay.ts`) -> `scripts/_legacy/`. `gray-matter` removed from `package.json`. `mdx-as-md` Obsidian plugin removed.
- `scripts/lint-mdx.ts` -> renamed `scripts/lint-content.ts`; `npm run lint-mdx` -> `npm run lint-content`.

## Deferred

Decap CMS web-admin layer (variant C). Activation triggers: Roman travels + Obsidian Mobile insufficient; second
contributor; browser-edit friction. Locks pre-set: `editorial_workflow: false`, `backend.branch: draft`, no
`_diagnostics.md`. ~2 days when activated. Full plan in `archive/CONTENT_WORKFLOW_compress.md` §6B (history, read-only;
full: `archive/CONTENT_WORKFLOW.md`).
