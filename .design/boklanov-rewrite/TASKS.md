# Build Tasks: boklanov.com / boklanov.ru rewrite

Generated from: `.design/boklanov-rewrite/DESIGN_BRIEF.md`
References: `DESIGN.md` (repo root), `tokens.md`, `INFORMATION_ARCHITECTURE.md`, `PLAN.md`
Date: 2026-04-30

> **Codebase reality check (run before this list).** The current `main`
> branch is the Notion-renderer site. **Nothing in `components/`, `lib/`,
> or `pages/` is reusable** for v2 — everything there is `react-notion-x`
> plumbing or boilerplate that gets deleted in Phase 4. Reusable assets
> are: `public/fonts/Inter-Regular.ttf`, `public/fonts/Inter-SemiBold.ttf`,
> `pages/api/social-image.tsx` (port the OG-image logic, drop the page
> wrapper), `next.config.js` (adjust). The OG plumbing already worked —
> port, do not rewrite.
>
> **Content source = local export, NOT live Notion.** The complete Notion
> export already lives at `notion-data/Роман Бокланов/site map database/`
> (253 MB, 89 entries — `.md` files + per-production asset folders + the
> `_all.csv` index). All 419 images referenced by `photo-audit.md` are
> already on disk. F4 parses these local files; we do **not** call
> `notion-client` or hit the Notion API at build. If Roman edits content
> later, he re-exports from Notion → drops the new export into
> `notion-data/` → re-runs the sync. No runtime coupling to Notion.
>
> **Missing deps** to install in F1: `next-intl`, `next-mdx-remote`,
> `gray-matter`, `sharp`. Already installed: `@vercel/og`,
> `lqip-modern`, `posthog-js`, `fathom-client` (pick one in S2 per
> brief Q7, drop the other).
>
> Aesthetic philosophy for every UI task: **warm editorial + brutalist
> metadata accents** (DESIGN.md §2). Reject AI-purple gradients,
> glassmorphism, `rounded-2xl shadow-xl`, hero video, bento grids.

---

## Progress log

| Phase | Status | Commit | Notes |
|-------|--------|--------|-------|
| F1 — App Router shell | ✅ done | `234e22d` | `/`, `/en`, `/de` serve smoke; legacy `pages/[pageId].tsx` parked at `pages/p/[pageId].tsx` until F8 |
| F2 — Self-hosted fonts | ✅ done | `06af4f7` | Lora 400/500/600 + 400 italic, Inter 500 (woff2), JetBrains Mono 400/500. Inter 400/600 keep existing TTFs. unicode-range splits keep Cyrillic off `/en`+`/de` |
| F3 — Locale routing | ✅ done | `a0c89a4` | next-intl v4, RU canonical at `/`, EN/DE prefixed. `/ru` → 307 → `/`. `<html lang>` per route |
| F4 — sync-from-notion | ✅ done | `65f0d22` | 29 paired productions, 22 with posters. RU+EN merge by `-en` slug suffix. Generated outputs gitignored — re-run `npm run sync` |
| F5 — metadata.yml overlay | ✅ done | `ea58b40` | — |
| F6 — content loader | ✅ done | `34514c2` | — |
| F7 — base styles + reset | ✅ done | `728ea69` | — |
| F8 — cut legacy renderer | ✅ done | `93c5afd` | `pages/`, legacy `components/`, `lib/notion*.ts`, `lib/config.ts`, `lib/types.ts`, `site.config.ts`, `styles/notion.css`, `styles/prism-theme.css`, `styles/global.css` deleted. `react-notion-x` + `notion-{client,types,utils}` removed (plus transitively-only-Notion deps). `next.config.js` ignoreBuildErrors / ignoreDuringBuilds dropped — `npx next build` clean under strictNullChecks. `pages/api/social-image.tsx` stubbed (501) until S3. |

**Foundation = 8 / 8 done.**

### Core UI

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| C1 — Production card + grid | ✅ done | `11fc081` | `<ProductionCard>` + `<ProductionGrid>` per DESIGN §7.2; rendered at `/[locale]/productions`. 4:5 cover, Lora RU title with oxblood underline reveal on hover (150ms), Inter EN subtitle in `--ink-mute`, mono `theatre · year · ageRating · countryCode` row, hairline rule between cards. Typographic fallback for productions without a poster. Whole card is the link. Grid: 1-col / 2-col / 3-col responsive. |
| C2 — Production detail | ✅ done | _pending_ | `app/[locale]/productions/[slug]/page.tsx` per DESIGN §7.3. Cover → title block (RU/EN/DE) → mono chips → Lora-italic synopsis → action bar (Watch/Tech rider/Press kit, conditional) → photos gallery with mono credits → press list (Lora italic blockquote-grade) → awards (mono year/name/city) → external links → sticky oxblood booking CTA with prefilled `mailto:roman@boklanov.ru` (subject + body include show title, year, role; tour-window/venue/notes prompts). 84 detail pages × 3 locales pre-rendered. | Phase 4 (Core UI vertical slices) is gated on
F6 + F7. F8 is gated on Phase 4 having at least one App Router page
rendering real content.

**Tech-debt parked during F1–F4** (must clean up by/with F8):
- `next.config.js`: `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` set true while legacy renderer exists
- `components/NotionPage.tsx`: `@ts-nocheck` + `mapPageUrl(site!, recordMap!, …)` non-null assertions
- `pages/p/[pageId].tsx`: legacy route under `/p/` to dodge slug collision with `app/[locale]/`

---

## Foundation (Phase 3 prep + content pipeline)

- [x] **F1 — Install deps and scaffold App Router shell**: Add `next-intl`,
  `next-mdx-remote`, `gray-matter`, `sharp` to `package.json`. Create empty
  `app/[locale]/layout.tsx` returning `{children}` plus `<html lang>`, and
  `app/[locale]/page.tsx` rendering "hello". Move `tokens.css` →
  `app/globals.css` and import it from the layout. Keep `pages/` running in
  parallel until F8 cuts it. _New files; deletes nothing yet._

- [x] **F2 — Self-host Lora + JetBrains Mono + Inter Medium**: Drop OFL
  `.woff2` files into `public/fonts/` (Lora 400/500/600, JetBrains Mono
  400/500, Inter Medium 500 to complete the existing 400/600 set). Wire
  `@font-face` declarations in `app/globals.css` with `font-display: swap`
  and matching `unicode-range` for Cyrillic + Latin. _Reuses existing
  Inter 400/600 files._

- [x] **F3 — Locale routing + RU default**: Configure `next-intl` with
  locales `[ru, en, de]`, default `ru`, no prefix on default per IA §URL
  Strategy. Wire `app/[locale]/layout.tsx` to read locale from route, set
  `<html lang>`, expose `useTranslations`. Stub `messages/{ru,en,de}.json`
  with three keys (nav.productions, nav.about, nav.contact) for smoke
  test. _New; foundational for every page below._

- [x] **F4 — `scripts/sync-from-notion.ts` (brief D3)**: Parses the
  **local Notion export** at `notion-data/Роман Бокланов/site map database/`
  (no live API call). For each `<Production Name> <notion-id>.md` file:
  read the markdown, parse the title row, extract images from the sibling
  asset folder of the same name, **merge RU+EN siblings into one record
  by Notion-id pair from `_all.csv`** (brief §6 — 24 of 56 records are
  EN-mirror duplicates). Emits `content/productions/<slug>.mdx` with the
  frontmatter shape from brief §7. Heuristic-extract `ageRating`, `year`,
  `country`, `durationMin`, `role` from the MD body. Copies images to
  `public/productions/<slug>/`, runs `sharp` to generate 4:5 grid covers
  + originals + lqip placeholders. _New; re-runnable when Roman re-exports
  from Notion; the workhorse of Phase 3._

- [ ] **F5 — `metadata.yml` overlay + manual-pass workflow**: After F4
  produces `content/productions/*.mdx`, generate one
  `content/productions/<slug>/metadata.yml` per production with the
  fields the heuristic missed (brief D6) — `lineage[]`, `form[]`,
  `featured`, photo `credits[]`, `techRider`, `pressKit`, video URLs.
  Loader merges MDX frontmatter + metadata.yml at build time, metadata
  wins. Document the workflow in `content/README.md` so Roman can hand
  back the credit list once. _New; closes brief Q1, Q2, Q8._

- [ ] **F6 — Content loader API**: `lib/content.ts` with three functions —
  `getAllProductions(locale)`, `getProduction(slug, locale)`,
  `getRelatedProductions(production, n)` (the recommends algorithm from
  brief D9: same age bucket + same form + same lineage, 3 cards). Pure
  functions over the merged content tree, no I/O outside build. _New;
  every page route calls this._

- [ ] **F7 — `app/globals.css` reset + base styles**: Minimal CSS reset,
  `body { background: var(--paper); color: var(--ink); font-family: var(--font-family-body); }`,
  selection colours, scrollbar styles in editorial paper tones (replace
  the legacy `styles/global.css` `::-webkit-scrollbar` block which uses
  Notion's `--bg-color`). Set `:focus-visible` ring to `--shadow-focus`
  globally. _Replaces `styles/global.css`._

- [x] **F8 — Cut the legacy renderer**: Remove `react-notion-x`,
  `notion-client`, `notion-types`, `notion-utils` from deps. Delete
  `pages/[pageId].tsx`, `pages/index.tsx`, `pages/feed.tsx`, all
  `components/Notion*.tsx`, `components/PageA*.tsx`, `lib/notion*.ts`,
  `lib/get-site-map.ts`, `lib/preview-images.ts`,
  `lib/resolve-notion-page.ts`, `lib/map-*.ts`, `styles/notion.css`,
  `styles/prism-theme.css`. Keep `pages/api/social-image.tsx` until S3
  ports it. **Do this only after F1–F7 land and at least one App Router
  page renders content.** _Deletes legacy; irreversible on this branch._

---

## Core UI (Phase 4 — vertical slices in DESIGN.md §15 order)

- [x] **C1 — Production card + grid**: Single `<ProductionCard>` per
  DESIGN.md §7.2 — 4:5 cover (no radius, no border), Lora RU title,
  Inter EN subtitle in `--ink-mute`, mono metadata row
  `theatre · year · ageRating · countryCode`, hairline rule between cards.
  Hover = oxblood underline reveal under RU title (150ms). Whole card is
  the link. `<ProductionGrid>` is a CSS-grid wrapper: 1-col mobile, 2-col
  ≥768, 3-col ≥1024. Render at `app/[locale]/productions/page.tsx`
  reading from `getAllProductions()`. Empty state = "no productions match"
  in mono. _Depends on F1, F3, F6, F7. Establishes aesthetic — review
  before C2._

- [x] **C2 — Production detail page**: `app/[locale]/productions/[slug]/page.tsx`,
  layout per DESIGN.md §7.3 (cover → title block → chips → synopsis →
  credits → action bar → photos → critic quotes → awards → external
  links → sticky CTA). Sticky `Email Roman about touring this show`
  button (mailto with `subject` + `body` prefilled — show title, tour
  window, role) — sticks to bottom on mobile, right column on desktop ≥1024.
  Conditionally hide action-bar buttons whose assets aren't present.
  _Depends on C1 (reuses chip + button styles). The money page._

- [ ] **C3 — Home (artistic-statement landing)**: `app/[locale]/page.tsx`
  per IA — short artistic-statement block, **4–6 hand-curated featured
  cards** (pulled by `featured: true` in metadata.yml), then the
  filterable grid below the fold defaulted to `role=director` (brief D5).
  Hero is type-led: oversized lowercase wordmark in Lora display, no
  photo overlay. Featured cards reuse `<ProductionCard>` from C1; only
  pull from the top-coverage band (brief §6 table). _Depends on C1._

- [ ] **C4 — Filter panel + URL-state**: `<ProductionFilters>` driving
  the grid in C1 / C3. Filters: role (default `director`, toggleable),
  ageBucket (3+/6+/12+/18+), country (RU/KZ/DE/ES/AT/BY), form (puppet/
  object/solo/ensemble), year range. **Filters serialize to query
  string** (deep-linkable per IA). Mono labels, sharp-corner checkboxes,
  oxblood reserved for clear-all only when active. _Depends on C1, C3._

- [ ] **C5 — About page + lineage block**: `app/[locale]/about/page.tsx`
  — long-form bio at `--max-width-prose` (65ch), Lora display heading,
  Inter body, mono pull-quotes for years/training milestones. Dedicated
  **lineage section** (brief D5: Кудашов / БТК / РГИСИ) with portrait +
  three named institutions. Bio content from `content/about.{ru,en}.mdx`.
  _Depends on F3, F7._

- [ ] **C6 — Awards page**: `app/[locale]/awards/page.tsx` — timeline
  grouped by production, mono year + name + city + category, hairline
  rules between productions, no decoration. Aggregates `awards[]` across
  all productions via `getAllProductions()`. _Depends on F6, C1
  (typography reuse)._

- [ ] **C7 — Press page**: `app/[locale]/press/page.tsx` — card grid,
  Lora italic blockquote (when there's a pull-quote), mono attribution
  (outlet · date), oxblood underline on outlet link hover. **Original
  language only, no translation** (brief D4). Aggregates `press[]` from
  all productions. _Depends on F6._

- [ ] **C8 — Contact page**: `app/[locale]/contact/page.tsx` per brief
  D8 — prefilled mailto button (oxblood, primary), copy-pasteable email
  in mono with copy-button (mono caption confirms on click), Telegram
  + Instagram secondary. **No form, no backend.** _Depends on F7._

- [ ] **C9 — Archive page**: `app/[locale]/archive/page.tsx` — long-tail
  CV (readings, sketches, workshops, festival sketches per brief D5).
  Filters out `role=director` productions. Treatment is denser than the
  main grid: mono table-like rows, year + title + theatre + role,
  hairline rules. _Depends on F6._

- [ ] **C10 — Layout shell**: `<SiteHeader>` (lowercase Lora wordmark
  left, nav links centre on ≥768px / hamburger sheet on mobile, language
  switch + theme toggle right, hairline rule below). `<SiteFooter>`
  (three mono columns: nav repeat, social, copyright). Wire into
  `app/[locale]/layout.tsx`. Sticky behaviour reserved for production
  detail; everywhere else the header is fixed-not-sticky. _Depends on
  F3. Last so navigation links are tested against real pages._

- [ ] **C11 — Cmd-K palette (brief D9)**: `<CommandPalette>` keyboard-
  first, mono input on `--paper-raised`, hairline border, results
  grouped (Productions / Awards / Press / Theatres / Cities) with mono
  caps section labels. Indexes a **transliterated** map (Кириллица ↔
  Latin) so `bury` finds `Похороните`. Lazy-loaded on first `Cmd+K`.
  _Depends on F6, C10. Build last in Core UI._

---

## Interactions & States

- [ ] **I1 — Hover & focus states**: Audit every interactive element to
  ensure (a) oxblood underline reveal at 150ms on primary links and
  CTAs, (b) `--shadow-focus` ring on every focusable element, (c) no
  card-lift, no shadow growth, no glow. Covers: hover, focus-visible,
  active, disabled. _Depends on C1–C10._

- [ ] **I2 — Theme toggle + persistence**: Three-state toggle (system /
  light / dark) writing `[data-theme]` to `<html>` and persisting to
  `localStorage`. Token CSS already supports both branches; this is the
  toggle UI + the inline `<script>` in `<head>` that prevents flash on
  load. _Depends on F1, C10._

- [ ] **I3 — Language switch**: Toggle in header that swaps locale
  prefix (`/` ↔ `/en` ↔ `/de`) preserving the current path. **DE
  switches only show on routes that exist for DE** (productions list,
  about, contact per IA). _Depends on F3, C10._

- [ ] **I4 — Empty + loading + error states**: Empty filter results in
  `ProductionGrid` (mono "no productions match these filters · clear
  all"). Image loading uses lqip placeholders from F4 (no spinner per
  brief §8). Error pages: `app/[locale]/not-found.tsx` linking back to
  `/productions` and `/`. _Depends on C1–C9._

- [ ] **I5 — Signature gesture (brief Q3, design.md §13)**: Prototype
  paper-cut transition vs string-line vs no-gesture on home-page first
  paint. ≤ 400ms total, runs once, never on scroll, fully disabled by
  `prefers-reduced-motion`. Decision in design review (R1) — **if it
  tests as gimmicky, cut it entirely.** _Depends on C3. Optional._

---

## Responsive & Polish

- [ ] **P1 — Mobile-first layout pass**: Every page tested at 375px
  before any larger breakpoint (the brief's #1 user opens on mobile in
  90s). Touch targets ≥ 44×44 CSS px. Sticky CTA on `[slug]` reachable
  with one thumb. Cmd-K accessible via on-screen button on mobile (no
  Cmd key). Breakpoints: 375 → 768 → 1024 → 1280. _Depends on C1–C11._

- [ ] **P2 — Accessibility pass (DESIGN.md §12)**: Body contrast ≥ 7:1
  where possible, ≥ 4.5:1 always. Focus ring on every interactive
  element. Image alt text format
  `{role} {production title}, {theatre}, {year} ({photographer})`
  generated by F4 with metadata.yml override. `hreflang` on RU↔EN page
  pairs only (DE excluded). Keyboard-only operation of Cmd-K. Screen-
  reader landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`). Run
  axe-core on each page route. _Depends on C1–C11, I1._

- [ ] **P3 — Lighthouse mobile ≥ 95**: Per PLAN.md Phase 4 artifact.
  Optimise font subsetting (Cyrillic + Latin only, drop unused
  ranges). Inline critical CSS for `app/[locale]/page.tsx`. Verify
  `sharp`-generated images are AVIF + WebP with JPEG fallback. _Depends
  on F2, F4, P1._

---

## Phase 5 — i18n + SEO + OG (PLAN.md Phase 5)

- [ ] **S1 — Sitemap + robots + RSS**: `app/sitemap.ts` emitting
  `hreflang` for RU↔EN production pairs only (IA: DE excluded).
  `app/robots.ts`. `app/[locale]/feed/route.ts` emitting RSS for
  productions in RU + EN (DE excluded — chrome-only locale). _Depends
  on F6._

- [ ] **S2 — JSON-LD schemas**: `Person` schema on `/about` (Roman),
  `CreativeWork` schema on each production detail with `inLanguage`,
  `productionCompany` (theatre), `dateCreated` (year), `audience`
  (ageRating mapped to `audienceType`). _Depends on C2, C5._

- [ ] **S3 — Per-production OG images**: Port
  `pages/api/social-image.tsx` → `app/api/og/[slug]/route.ts` using
  `@vercel/og`. Composition: poster (or typographic fallback), Lora
  title, mono `[ageRating] [year] [countryCode]` band, oxblood accent
  bar. **Test on Telegram preview** — that is the user-#1 share vector
  per brief §2. _Depends on F4, C2._

- [ ] **S4 — Analytics pick (brief Q7)**: Decide PostHog or Fathom or
  none; remove the unused dep. If kept, instrument **only the booking-
  CTA conversion** (mailto click on production detail + contact page)
  — that is the only real metric per brief Q7. _Depends on C2, C8._

- [ ] **S5 — DE chrome translations (brief Q4)**: ~80 strings — nav,
  buttons, chips, metadata labels. Daniil-owned. Populates
  `messages/de.json`. Production-card text stays RU/EN per IA. _Depends
  on F3, C10._

---

## Review

- [ ] **R1 — `/design-review` against the brief**: Code-level + screenshot
  critique of home, productions index, one production detail, about,
  press. Verify no anti-patterns (DESIGN.md §11) shipped: no
  glassmorphism, no AI-purple, no hero video, no bento grid, no
  `rounded-2xl shadow-xl`, no Comic-Sans irony, no animated gradient
  text. Decide signature-gesture fate (I5). Output:
  `.design/boklanov-rewrite/DESIGN_REVIEW.md`. _Depends on C1–C11, P1–P3._

- [ ] **R2 — Real-device manual QA**: iPhone SE / iPhone 14 Pro / iPad /
  13" laptop / 27" desktop. Daniil + Roman. Check the 90-second
  curator scenario end-to-end on iPhone SE: open Instagram-DM-shaped
  link → home → see featured shows → tap one → reach booking CTA. Time
  it. _Depends on R1 fixes._

---

## Phase 7 — Deploy + cutover

- [ ] **D1 — Vercel preview from `rewrite/v2`**: Push branch, configure
  Vercel preview env, share URL with Roman. Verify Cyrillic fonts
  render on real Vercel edge (not just localhost). _Depends on R2._

- [ ] **D2 — Hosting decision (brief Q6)**: Confirm Vercel vs Cloudflare
  Pages vs Yandex Cloud given CN/RU access. Fix `next.config.js`
  output mode if switching off Vercel. _Depends on D1._

- [ ] **D3 — Domain decision (brief Q5)**: `.ru` only or also `.com`.
  Configure both as aliases or pick one canonical with 301. _Depends
  on D2._

- [ ] **D4 — Cutover + archive legacy**: Merge `rewrite/v2` → `main`,
  swap DNS, archive `legacy/notion-renderer` branch as a fallback tag
  (`legacy-2026-04-30`). Document rollback procedure in
  `contributing.md`. _Depends on D3._

---

## Sequencing notes

- **F1 → F8 are sequential within Phase 3.** F4 is the longest single
  task; consider running it in a fork while F2/F3/F7 are built.
- **C1 is the aesthetic checkpoint.** Build it, eyeball it against
  DESIGN.md §3, fix the grammar before C2–C11 inherit it.
- **C10 (layout shell) is built last in Core UI** so the nav links
  point at pages that already exist — avoids the "skeleton site with
  404s" anti-pattern.
- **Phase 5 (S1–S5) and Phase 6 (R1) can overlap** — analytics +
  sitemap don't block design review.
- **Roman owes us three things to unblock Phase 3 verification**: photo
  credits per image (Q1), tech rider / press kit PDFs (Q2), photo
  legal language (Q8). F5's `metadata.yml` workflow is the channel.