# `content/` — production data

This directory holds the merged content that page routes render. The
shape is:

```
content/
├── README.md                          ← you are here
├── productions-index.json             ← (gitignored, regenerated)
└── productions/
    └── <slug>/
        ├── index.mdx                  ← (gitignored, regenerated)
        └── metadata.yml               ← (committed, hand-edited)
```

## How content gets here

1. **Source of truth:** `notion-data/Роман Бокланов/` (the local Notion
   export, committed to the repo). Roman re-exports from Notion when he
   adds or edits a production and drops the new export into that folder.

2. **Sync command:**

   ```bash
   npm run sync
   ```

   Runs `scripts/sync-from-notion.ts`. For every public production, the
   script:

   - parses the markdown body and `_all.csv` index
   - **filters non-production sub-pages** via `NON_PRODUCTION_SLUGS`
     (contact page, bio mirror, role overviews, festival listings —
     edit the set in the script when a new orphan slips through)
   - merges RU + EN siblings into one record by stripping the
     `-en` / `-eng` slug suffix; orphan Cyrillic-only rows whose
     CSV `Slug` is empty get attached to their EN sibling via
     `MANUAL_SIBLING_PAIRS` (see the script for the table)
   - resolves locale from the CSV slug suffix (`-en` / `-eng` → EN,
     otherwise Cyrillic-name detection); body content is **not**
     used to detect locale because EN pages often quote Russian
     cast lists and would mis-classify
   - heuristic-extracts `year`, `durationMin`, `ageRating`, `theatre`,
     `role`, `form`, `lineage`, `awards` (RU body preferred for
     canonical festival names per DESIGN §3), `press`, `videos`
   - cleans synopsis text — strips `[X](Y)` and Notion's nested
     `[[X]](Y)` link forms, skips URL-only / promo / cast-list
     paragraphs, strips `<aside>` HTML
   - copies images to `public/productions/<slug>/`
   - generates an LQIP (low-quality blurred placeholder) for the poster
   - writes `content/productions/<slug>/index.mdx` (frontmatter + body)
   - writes `content/productions/<slug>/metadata.yml` **only if absent**
   - writes `content/productions-index.json` (a flat, locale-aware list
     for the loader)

3. **Render:** `lib/content.ts` (F6) loads `index.mdx` and `metadata.yml`,
   merges them with metadata winning, and exposes the result to page
   routes.

## What goes in `metadata.yml`?

The fields the auto-sync **can't** infer reliably. Currently:

| Field | What it is | Why manual |
|---|---|---|
| `gallery[].credit` | Photographer name per image | Notion captions don't carry these (brief Q1) |
| `gallery[].caption.{ru,en}` | Optional caption per image | Same — needed for editorial gallery views |
| `poster.credit` | Photographer / designer of the poster | Same |
| `featured` | Editor's choice for the home-page featured row | A curatorial call, not data |
| `form` | `puppet \| object \| solo \| ensemble \| family \| reading \| sketch` | Tags don't always cover this |
| `lineage` | `btk \| rgisi \| kudashov \| dotheatre \| ...` | For the recommends algorithm (brief D9) |
| `role` | `director \| co-director \| performer \| reader \| sketch` | Auto-detect is naive |
| `ageRating` | `0+ \| 3+ \| 6+ \| 12+ \| 16+ \| 18+` | Auto-extract sometimes misses |
| `durationMin` | Integer minutes | Auto-extract sometimes misses |
| `techRider` | Path to PDF, or `null` (brief Q2) | Roman uploads or links |
| `pressKit` | Path to ZIP, or `null` | Same |
| `title.de` | German title | Only filled for v2 priority shows |
| `synopsis.de` | German synopsis | Same |
| `videos[]` | Extra video URLs (Vimeo, etc.) | Auto-extract only catches YouTube |
| `awards[]` | Override the auto-extracted award list | Heuristic can't extract festivals that sit in unmarked plain prose (no link, no quote). The metadata stub emits the auto-extracted list as commented-out lines — uncomment + edit to override (see Q4 follow-ups in `.design/boklanov-rewrite/TASKS.md`). Setting this replaces the entire list, overlay-wins. |

Each `metadata.yml` has every field as a stub — fill what you have,
leave the rest as `null` or `[]`. The loader treats `null` / `[]` as
"no overlay, fall through to frontmatter".

## Workflow when Roman edits a production

1. Edit in Notion as usual.
2. Re-export the database from Notion → drop the new ZIP into
   `notion-data/Роман Бокланов/` (replacing the old export).
3. Run `npm run sync`. The new MDX is written; existing `metadata.yml`
   files are untouched.
4. If the production is **new**, a fresh `metadata.yml` stub appears
   in `content/productions/<new-slug>/`. Fill in the manual-pass
   fields, then commit just that yml file.
5. If a production was **renamed** (slug changed): the old folder
   becomes orphaned. Delete it manually after copying any
   hand-edited `metadata.yml` content into the new slug's folder.

## What is NOT in `metadata.yml`

- **The body text.** Body comes from the MDX. Edit the source markdown
  in Notion, then resync.
- **Frontmatter the script CAN infer.** The overlay should not duplicate
  the entire frontmatter — only fields the script gets wrong or can't
  see. Less duplication, fewer drift points.
