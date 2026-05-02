# CONTENT

How content gets into boklanov.com. Updated: 2026-05-02 (session 3).

Owns: live workflow + frontmatter shape.
Roman-facing day-to-day RU: `content/AUTHORING.ru.md`.
History (read-only, do not edit in routine work): `archive/CONTENT_WORKFLOW.md` — 9-option matrix, Q&A, deferred Decap
plan.

## Source of truth

- Vault = repo. Roman edits MDX directly via Obsidian Properties panel.
- One `index.mdx` per production. Frontmatter is single source of truth per field.
- No `metadata.yml` overlay (folded one-shot in Phase 8.3, `c1c4436`).
- No live Notion API. No CMS. No backend.
- Edit -> commit-and-push from obsidian-git sidebar -> Vercel rebuilds `main`.
- WIP: `draft` branch -> Vercel preview URL -> merge to `main` when ready.

## Editor stack

- Obsidian (free, desktop + mobile). License `obsidian.md/license`.
- `obsidian-git` plugin: pull on open, commit + push from sidebar. Manual install by Roman.
- `mdx-as-md` plugin: opens `.mdx` as editable markdown. Manual install.
- `.obsidian/{app,types,community-plugins}.json` committed. Property types defined for `year`, `featured`, `ageRating`,
  `durationMin`, `ticketsUrl`, `form`, `lineage`, `tour`, `tags`. `useMarkdownLinks: true` (no `![[wikilink]]`).
- `scripts/lint-mdx.ts` + `npm run lint-mdx`: CI fails on Obsidian wikilinks in `content/`.

## Image hosting

- Code path: `lib/cdn.ts` `cdnUrl(path)` helper, `<Image>` `src` wrapped, `next.config.js` `images.remotePatterns`
  allows `cdn.boklanov.com`.
- `scripts/upload-images.ts`: S3-compatible upload, `--slug`, `--dry-run`, skip-unchanged-by-size.
  `npm run upload-images`.
- R2 bucket `boklanov-content`, custom domain `cdn.boklanov.com`, public-read.
- Activation blocked: `cdn.boklanov.com` cannot connect to R2 until `boklanov.com` DNS moves to Cloudflare. Currently on
  Spaceship. Deferred.
- Until activation: `NEXT_PUBLIC_CDN_BASE` unset -> images serve from `public/` via Vercel. Authoring drops new files
  into `public/productions/<slug>/`.

## Frontmatter shape

```yaml
---
slug: bury-me-behind-the-baseboard
notionIds: { ru: ..., en: ... }    # historical traceability only
title: { ru: "...", en: "...", de: null }
synopsis: { ru: "...", en: "...", de: null }
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
gallery: [ { src, credit, caption: { ru, en } } ]
videos: [ { provider: youtube, id } ]
awards: [ { name, category, year, city } ]
press: [ { title, outlet, url, language } ]
tour: [ { city } ]                   # Plinth only; empty -> ON TOUR band hidden
directorsNote: { ru: "...", en: "..." }  # optional; italic Lora blockquote below synopsis
runs:                                # optional; mono row above title (run-of-show)
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
---
```

## Editing rules

- Edit `index.mdx` Properties panel. `Cmd+S`. Source Control -> Commit-and-push.
- Add new production: copy existing `content/productions/<slug>/` folder. Latin slug, dashes-not-spaces. Fill
  Properties. Commit.
- New photos: drop into `public/productions/<slug>/`. After R2 activates: `npm run upload-images`. Else: just commit.
- Featured strip: set `featured: true`. Cards without poster filtered out (`p.featured && p.poster.src`).
- About bio + milestones + lineage + marginalia notes: edit `content/about/{ru,en,de}.mdx` directly. `marginalia[]`
  is an optional array (one entry per body paragraph, `null` for no note) that drives the ≥1280px gutter note.
- UI chrome strings: `messages/{ru,en,de}.json`. RU+EN required. DE chrome only.
- Production-card text never translates to DE (IA D4).
- DE bios: only top 5-6 priority shows for v1.

## Retired

- `scripts/sync-from-notion.ts` -> `scripts/_legacy/`, FROZEN header. `npm run sync` echoes stub.
- `notion-data/` -> `archive/notion-export-2026-05` branch (frees ~250 MB from `main`).
- `metadata.yml` overlay -> deleted; folded into frontmatter.

## Deferred

Decap CMS web-admin layer (variant C). Activation triggers: Roman travels + Obsidian Mobile insufficient; second
contributor; browser-edit friction. Locks pre-set: `editorial_workflow: false`, `backend.branch: draft`, no
`_diagnostics.md`. ~2 days when activated. Full plan in `archive/CONTENT_WORKFLOW.md` §6B (history, read-only).
