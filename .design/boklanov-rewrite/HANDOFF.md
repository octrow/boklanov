# Handoff prompt — boklanov.ru rewrite, mid-Foundation

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue from F4.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Foundation phases F1–F4 are committed and verified.** I need you to
pick up at **F5** and continue through **F8**. After that, Phase 4 (Core
UI vertical slices C1–C11) begins.

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — the canonical ordered task
   list. Top of the file has a **Progress log** table showing what's
   done and which commits landed it. Each F-task has acceptance prose
   beneath the checklist.
2. `.design/boklanov-rewrite/DESIGN_BRIEF.md` — locked brief (D1–D15
   decisions, §5 tokens, §7 frontmatter shape, §6 content audit).
   **Source of truth for any visual or content question.**
3. `DESIGN.md` (repo root) — visual identity contract. Aesthetic
   philosophy: warm editorial + brutalist metadata accents. §15 has
   the Phase 4 build order.
4. `.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md` — URL
   strategy, navigation, page hierarchy. Note especially §URL Strategy
   (RU is canonical at `/` with no prefix; EN/DE prefixed).
5. `.design/boklanov-rewrite/tokens.md` — design token rationale. The
   bundled token CSS is `app/globals.css`.

### What's already in the repo

- **App Router shell** (`app/[locale]/{layout,page}.tsx`) — async
  params (Next 15), `<html lang>` set per route, `NextIntlClientProvider`
  wrapping children. Page is a smoke test using inline styles + tokens.
- **i18n** (`i18n/routing.ts`, `i18n/request.ts`, `middleware.ts`,
  `messages/{ru,en,de}.json`) — next-intl v4, `localePrefix: 'as-needed'`,
  `defaultLocale: 'ru'`. Three nav keys per locale.
- **Self-hosted fonts** in `public/fonts/` — Lora 400/500/600 (+ 400
  italic), Inter 500 woff2 (400/600 keep existing TTFs), JetBrains
  Mono 400/500. `@font-face` block at the top of `app/globals.css`
  with Google-Fonts canonical `unicode-range` splits.
- **Sync pipeline** (`scripts/sync-from-notion.ts`, `npm run sync`) —
  parses `notion-data/Роман Бокланов/` into `content/productions/<slug>.mdx`
  + `content/productions-index.json` + `public/productions/<slug>/`.
  29 paired productions; 22 have posters. Generated outputs are
  gitignored — re-run `npm run sync` to rebuild.

### Tech debt parked during F1–F4 (must clean up by F8)

- `next.config.js`: `typescript.ignoreBuildErrors: true` and
  `eslint.ignoreDuringBuilds: true` while the legacy Notion renderer
  is still in the tree.
- `components/NotionPage.tsx`: `@ts-nocheck` plus
  `mapPageUrl(site!, recordMap!, ...)` non-null assertions on line 182.
- `pages/p/[pageId].tsx`: legacy renderer was renamed from
  `pages/[pageId].tsx` to dodge a slug-name collision with
  `app/[locale]/`. F8 deletes this file along with the rest of the
  legacy renderer.
- `next.config.js` has the legacy `react`/`react-dom` webpack alias
  removed (it broke RSC). If F8 reintroduces issues, leave it gone.

### Your task

Work through **F5 → F6 → F7 → F8** in that order. For each:

1. Read the task line in `TASKS.md` for full acceptance criteria.
2. Implement.
3. Verify (build / dev server / type-check, as appropriate).
4. Commit with a focused message (see existing commits on `rewrite/v2`
   for tone — phase tag, what changed, what was verified).
5. Update the Progress log table at the top of `TASKS.md` with the
   commit SHA and any non-obvious notes.
6. Tick the `[ ]` → `[x]` on the F-task line.

**F5** generates per-production `metadata.yml` overlays so Roman can
fill in photo credits, lineage, form, etc. without touching the
generated MDX. **F6** is the loader API every page route will call.
**F7** is the global reset + base styles (replaces the legacy
`styles/global.css` Notion-themed block). **F8** is the irreversible
deletion of the legacy renderer; do not run it until F1–F7 are green
**and** at least one App Router page renders real content from the
loader (a quick smoke at `app/[locale]/productions/page.tsx` is fine).

### Constraints from the brief (do not violate)

- No live Notion API anywhere in build or runtime. All content comes
  from `notion-data/` via `scripts/sync-from-notion.ts`.
- Aesthetic: warm editorial + brutalist metadata. Reject AI-purple
  gradients, glassmorphism, `rounded-2xl shadow-xl`, hero video,
  bento grids, generic Tailwind shape language. Sharp corners,
  hairline rules, mono captions.
- Oxblood `#6B0F0F` is reserved for the booking CTA only.
- Three locales (`ru`, `en`, `de`); RU canonical at `/`.
- `lib/content.ts` is pure functions over the merged content tree —
  no I/O outside build.

### Recent commits on `rewrite/v2` for context

```
65f0d22  F4: scripts/sync-from-notion.ts — local export → MDX pipeline
a0c89a4  F3: locale routing + RU default (next-intl v4)
06af4f7  F2: self-host Lora + Inter Medium + JetBrains Mono (woff2 + OFL)
234e22d  Phase 2 + F1: design tokens, brief reconciliation, App Router shell
5606e21  Phase 1: design brief + photo audit
c4968e9  Phase 0: install design skills and create rewrite branch
```

Proceed with F5.

---

## Notes for the operator (you, the human)

- The handoff above intentionally does **not** include the full file
  contents — the new conversation should read the docs itself so
  context isn't bloated by paste.
- If the new conversation drifts on aesthetic or scope, paste back the
  "Constraints from the brief" block.
- If a phase needs more than one commit, that's fine — `TASKS.md`
  Progress log can list multiple SHAs.
- After F8 lands: drop `typescript.ignoreBuildErrors`,
  `eslint.ignoreDuringBuilds`, and the entire `pages/` directory in a
  single follow-up commit, and verify `npx next build` is type-clean.
