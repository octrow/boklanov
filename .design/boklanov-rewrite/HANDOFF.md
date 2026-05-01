# Handoff prompt — boklanov.ru rewrite, continue Phase 4 from C6

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Foundation (F1–F8) and Core UI slices C1–C5 are committed and
verified.** The site builds clean under `strictNullChecks` + ESLint
(no `ignoreBuildErrors`). 96 static pages × 3 locales pre-render
successfully.

I need you to continue Phase 4 — **C6 (Awards) next**, then through
C7–C11 in DESIGN.md §15 order.

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

- **Foundation (F1–F8)** — App Router shell, i18n (`as-needed` prefix
  via `i18n/routing.ts` + `i18n/navigation.ts`), self-hosted Lora /
  Inter / JetBrains Mono with Cyrillic/Latin unicode-range splits,
  sync pipeline (`scripts/sync-from-notion.ts` over local export),
  manual `metadata.yml` overlay, content loader (`lib/content.ts` —
  `getAllProductions`, `getProduction`, `getRelatedProductions`),
  warm-editorial base styles in `app/globals.css`. All legacy Notion
  code removed in F8. Build type-clean under `strictNullChecks` + ESLint.
- **C1** — `<ProductionCard>` + `<ProductionGrid>` at
  `app/[locale]/productions/page.tsx`. 4:5 cover, Lora RU title with
  oxblood underline reveal (150ms), Inter EN subtitle in `--ink-mute`,
  mono `theatre · year · ageRating · countryCode`, hairline rule between
  cards, typographic fallback when no poster. `countryCode()` helper
  exported for reuse. (commit `11fc081`)
- **C2** — `app/[locale]/productions/[slug]/page.tsx` per DESIGN §7.3.
  Cover → title block (RU/EN/DE) → mono chips → Lora-italic synopsis →
  action bar (watch / tech rider / press kit, conditional) → photos
  gallery with mono credits → press list → awards grid → external links
  → sticky oxblood `mailto:roman@boklanov.ru` CTA. 84 detail pages × 3
  locales SSG. (commit `c7d58ae`)
- **C3** — `app/[locale]/page.tsx`. Type-led Lora wordmark at
  `--font-size-4xl` (lowercase), mono genre meta row, Inter prose
  artistic statement (65ch). Featured strip: `productions.filter(p =>
  p.featured && p.poster.src).slice(0, 6)` — poster required so no
  typographic fallback above the fold. Below-fold: director-role grid
  (brief D5 default), ghost "all →" link to `/productions`. (commit
  `2943216`)
- **C4** — `<FilteredProductionsPanel>` Client Component on
  `/productions`. Role radio-group (director default), form/age-
  bucket/country multi-select toggles. Chips: JetBrains Mono uppercase,
  2px radius, active = `--paper-raised` + `--rule-strong` border (NOT
  oxblood). Clear-all = `--accent` only. `useSearchParams` URL state;
  `<Suspense>` boundary keeps build fully SSG. (commit `05600f1`)
- **C5** — `app/[locale]/about/page.tsx`. Lora display heading, Inter
  bio prose at `--max-width-prose` (65ch), Lora lead on first paragraph,
  mono milestones timeline, lineage grid (Кудашов / БТК / РГИСИ) in
  `--paper-sunken` cards. `content/about/{ru,en}.mdx` with
  portrait/milestones/lineage frontmatter; inline loader with
  RU→EN fallback for DE. (commit `cb0aaab`)

### Your task — start with C6

Work through C6 → C7 → C8 → C9 → C10 → C11 in DESIGN.md §15 order.
For each: implement, verify (`npx next build`), commit with a focused
message, update the Progress log table in `TASKS.md`, and check the
`[ ]` box.

### C6–C11 acceptance notes

- **C6 — Awards** (`app/[locale]/awards/page.tsx`): timeline grouped by
  production, mono year + name + city + category, hairline rules between
  productions, no decoration. Aggregates `awards[]` from
  `getAllProductions()`. Production name as Lora grouping header.
- **C7 — Press** (`app/[locale]/press/page.tsx`): card grid, Lora italic
  blockquote (pull-quote field), mono outlet · date attribution, oxblood
  underline on outlet link hover. Original language only, no translation.
  Aggregates `press[]` from all productions.
- **C8 — Contact** (`app/[locale]/contact/page.tsx`): oxblood primary
  mailto button, copy-pasteable email in mono + copy-button (confirms
  with "copied" on click — the one Client Component touch), Telegram +
  Instagram secondary. No form, no backend.
- **C9 — Archive** (`app/[locale]/archive/page.tsx`): filters OUT
  `role=director` (shows co-director, performer, reader, sketch, reading
  — the long-tail CV). Dense mono table rows: year · title · theatre ·
  role. Hairline rules. Document feel, not feature feel.
- **C10 — Layout shell** (`<SiteHeader>` + `<SiteFooter>` wired into
  `app/[locale]/layout.tsx`): lowercase Lora wordmark left, nav links
  centre on ≥768px / hamburger on mobile, lang switch + theme toggle
  right, hairline rule below. Footer: three mono columns (nav, social,
  copyright). Header is fixed-not-sticky everywhere (sticky only on
  production detail — already handled in C2). **Build last** so all nav
  links target real pages.
- **C11 — Cmd-K palette**: `<CommandPalette>` lazy-loaded on `Cmd+K`,
  JetBrains Mono input on `--paper-raised`, hairline border, results
  grouped (Productions / Awards / Press / Theatres / Cities) with mono
  caps section labels. Transliterated index (Кириллица ↔ Latin). Depends
  on C10.

### Key file map for C6–C11

```
app/[locale]/
├── page.tsx                 # C3 ✅
├── home.module.css          # C3 ✅
├── productions/
│   ├── page.tsx             # C1+C4 ✅
│   └── [slug]/page.tsx      # C2 ✅
├── about/page.tsx           # C5 ✅
├── awards/page.tsx          # C6 ← next
├── press/page.tsx           # C7
├── contact/page.tsx         # C8
├── archive/page.tsx         # C9
└── layout.tsx               # C10 (last)

components/
├── ProductionCard.tsx        # ✅
├── ProductionGrid.tsx        # ✅
├── FilteredProductionsPanel.tsx  # ✅
├── SiteHeader.tsx            # C10
├── SiteFooter.tsx            # C10
└── CommandPalette.tsx        # C11

content/
├── productions/<slug>/       # ✅ 28 productions
└── about/{ru,en}.mdx         # ✅
```

### Constraints from the brief (do not violate)

- No live Notion API anywhere; content is static MDX from F4/F5.
- Aesthetic: warm editorial + brutalist metadata. Reject AI-purple
  gradients, glassmorphism, `rounded-2xl shadow-xl`, hero video,
  bento grids. Sharp corners, hairline rules, mono captions.
- Oxblood `#6B0F0F` (light) / `#A82626` (dark) reserved for booking
  CTA fills, hover underline reveals, focus ring. Nowhere else.
- Three locales (`ru`, `en`, `de`); RU canonical at `/`. Production
  card text stays RU/EN regardless of locale.
- Component grammar: DESIGN.md §7. No drop-shadows or border-radii
  outside the token set.

### Recent commits on `rewrite/v2` for context

```
7749600  docs: mark C4+C5 done in TASKS.md progress log
cb0aaab  C5: about page + lineage block
05600f1  C4: filter panel + URL state on /productions
129f97d  docs: mark C3 done in TASKS.md progress log
2943216  C3: home — hero + featured strip + director grid
3746c3f  docs: sync TASKS.md / PLAN.md / HANDOFF.md with reality after C2
c7d58ae  C2: production detail page at /[locale]/productions/[slug]
11fc081  C1: production card + grid at /[locale]/productions
```

Proceed with C6.

---

## Notes for the operator (you, the human)

- The handoff above intentionally does **not** include full file
  contents — the new conversation reads the docs itself so context
  isn't bloated by paste.
- If the new conversation drifts on aesthetic or scope, paste back
  the "Constraints from the brief" block.
- **C10 (layout shell) is built last** in Core UI so nav links point
  at pages that actually exist. Until C10 there is no global header /
  footer — each page is a standalone `<main>`.
- **About content** (`content/about/{ru,en}.mdx`) is placeholder text.
  Roman should write the real bio before the site goes live; the
  frontmatter schema (portrait / milestones / lineage) is final.
- **No portrait image** exists yet (`portrait.src: null` in both MDX
  files). The about page handles this gracefully (skips the image block).
  Roman needs to supply a photo before D1 (Vercel preview).
- `pages/api/social-image.tsx` is still the 501 stub — do not touch it
  during C6–C11. S3 ports it to `app/api/og/[slug]/route.ts`.
