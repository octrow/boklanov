# `content/` — Russian editor docs

Post Phase 11 (2026-05-14), production data lives in Postgres (Neon),
not on disk. Editing happens at `boklanov.com/admin`. This directory
is reduced to two Russian-facing docs.

## Contents

- `AUTHORING.ru.md` — Roman's editing guide. Covers logging into
  `/admin`, changing production fields, adding new productions,
  editing About + Contact globals, image uploads, locale switcher,
  live preview, and what to do if something goes wrong.
- `README.md` — this file.

## Retired (history preserved in git)

- `_PRODUCTION_TEMPLATE.yaml` → moved to
  `.design/boklanov-rewrite/archive/_PRODUCTION_TEMPLATE.yaml`.
  Reference only — Payload's «Создать» button renders empty defaults
  in `/admin/collections/productions`.
- `productions-index.json` — flat index for the legacy content
  loader. The Payload Local API (`lib/content.ts`) reads Postgres
  directly; no on-disk index needed.
- `productions/<slug>/index.yaml` + `body.{ru,en,de}.md` (54
  directories) — replaced by the `productions` collection in
  Postgres. Git history preserves every revision through commit
  `eaf5a37`.
- `about/{ru,en,de}.{yaml,md}` — replaced by the `about` global.
- `contact/index.yaml` — replaced by the `contact` global.
- `metadata.yml` overlays — folded into frontmatter pre-Phase 11.
- `index.mdx` — split into `index.yaml` + `body.{ru,en,de}.md`
  pre-Phase 11.

## Schema reference

The current schema lives in `collections/Productions.ts`,
`globals/About.ts`, and `globals/Contact.ts`. TypeScript types are
auto-generated into `payload-types.ts` by `npm run payload:generate:types`.

The shape consumed by page renderers (`Production`, `AboutData`,
`ContactData`) lives in `lib/content.ts` — that file is the
boundary between Payload's wire shape and the renderer-facing shape.

## Workflow doc

`.design/boklanov-rewrite/CONTENT.md` covers:

- Hooks + revalidation map (which tag busts which fetcher).
- TourRider null-field contract.
- Featured-strip + image-fallback chains.
- Per-field locale rules (what's localized vs not).
