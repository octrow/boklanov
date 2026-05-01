# Handoff prompt — boklanov.ru rewrite, continue Phase 4 from C3

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Foundation (F1–F8) and the first two Core UI slices (C1, C2) are
committed and verified.** The site builds clean under
`strictNullChecks` + ESLint (no `ignoreBuildErrors`). 84 production
detail pages × 3 locales pre-render successfully.

I need you to continue Phase 4 — **C3 (Home) next**, then through
C4–C11 in DESIGN.md §15 order.

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — canonical ordered task list.
   Top of the file has the **Progress log** table. Each F-task and
   C-task has acceptance prose beneath the checklist.
2. `.design/boklanov-rewrite/DESIGN_BRIEF.md` — locked brief (D1–D15
   decisions, §5 tokens, §7 frontmatter shape, §6 content audit).
   **Source of truth for any visual or content question.**
3. `DESIGN.md` (repo root) — visual identity contract. Warm editorial
   + brutalist metadata. §15 = Phase 4 build order.
4. `.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md` — URL
   strategy, navigation, page hierarchy. RU canonical at `/`, EN/DE
   prefixed.
5. `.design/boklanov-rewrite/tokens.md` — token rationale. Bundled
   token CSS is `app/globals.css`.

### What's already shipped

- **Foundation (F1–F8)** — App Router shell, i18n (`as-needed` prefix),
  self-hosted fonts, sync pipeline, content loader, base styles, all
  legacy Notion code removed. Build is type-clean under strict mode.
- **C1** — `<ProductionCard>` + `<ProductionGrid>` at
  `app/[locale]/productions/page.tsx`. 4:5 cover, Lora RU title with
  oxblood underline reveal, mono metadata, hairline rules between
  cards, typographic fallback when no poster. (commit `11fc081`)
- **C2** — `app/[locale]/productions/[slug]/page.tsx` per DESIGN §7.3:
  cover, title block, mono chips, italic synopsis, action bar (watch /
  tech rider / press kit, conditional on assets), photo gallery with
  mono credits, press list, awards grid, external links, sticky
  oxblood mailto CTA with prefilled subject + body. (commit `c7d58ae`)

### Your task — start with C3

Work through C3 → C4 → … → C11 in DESIGN.md §15 order. For each:
implement, verify (`npx next build` + smoke-test on dev server),
commit with a focused message, update the Progress log table in
`TASKS.md`, and check the `[ ]` box.

**Crucially, before C3:** the brief calls C1 the *aesthetic
checkpoint*. Eyeball the rendered productions list and detail page
against DESIGN.md §3 mood-board axis and §11 anti-patterns. Fix
grammar drift here so C3–C11 inherit a clean baseline.

### Constraints from the brief (do not violate)

- No live Notion API anywhere; content is static MDX from F4/F5.
- Aesthetic: warm editorial + brutalist metadata. Reject AI-purple
  gradients, glassmorphism, `rounded-2xl shadow-xl`, hero video,
  bento grids, generic Tailwind shape language. Sharp corners,
  hairline rules, mono captions.
- Oxblood `#6B0F0F` (light) / `#A82626` (dark) is reserved for the
  booking CTA, hover underline reveals, and the focus ring. Nowhere
  else.
- Three locales (`ru`, `en`, `de`); RU canonical at `/`. Production
  card text stays RU/EN regardless of UI locale (per IA §URL Strategy
  + S5).
- Component grammar: Read DESIGN.md §7. Do not invent drop-shadows or
  border-radii outside the token set.

### Recent commits on `rewrite/v2` for context

```
c7d58ae  C2: production detail page at /[locale]/productions/[slug]
11fc081  C1: production card + grid at /[locale]/productions
93c5afd  F8: cut legacy Notion renderer
728ea69  F7: app/globals.css reset + base styles (warm editorial)
34514c2  F6: lib/content.ts — content loader API
ea58b40  F5: metadata.yml overlay + manual-pass workflow
65f0d22  F4: scripts/sync-from-notion.ts — local export → MDX pipeline
```

Proceed with C3.

---

## Notes for the operator (you, the human)

- The handoff above intentionally does **not** include full file
  contents — the new conversation should read the docs itself so
  context isn't bloated by paste.
- If the new conversation drifts on aesthetic or scope, paste back
  the "Constraints from the brief" block.
- C10 (layout shell) is built last in Core UI so the nav links point
  at pages that already exist. Until then there is no global header/
  footer — productions list and detail are the only navigable pages.
- After C1 the brief recommends a design eyeball before inheriting
  the grammar across C3–C11. Worth a 5-minute look on mobile width
  (375px), tablet (768), desktop (1024) before pushing forward.
