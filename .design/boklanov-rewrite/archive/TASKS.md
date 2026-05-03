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

> **2026-05-01 — R1 design review complete.** Output:
> `DESIGN_REVIEW.md`. Zero §11 anti-patterns shipped. Two Must-Fix items
> tracked as `R1.fix`. **I5 (signature gesture) cut formally** per
> `DESIGN.md` §13. Next: land R1.fix → R2 real-device QA → D1 Vercel
> preview.
>
> **2026-05-01 — R1.fix complete** (`73620e6`, `871f287`). Both Must-Fix
> items landed: (1) desktop sticky CTA now in a real CSS-grid right rail,
> visible from landing; (2) `.titleBlock` top rule added. Optional Should-Fix
> also landed: filter group labels (РОЛЬ/ФОРМА/ВОЗРАСТ/СТРАНА) above chip
> groups on ≥768px. Polish commit: ThemeToggle sun/moon SVG, search ×
> suppression, LQIP gating on `poster.src`. Build clean.
>
> **2026-05-01 — Final polish complete** (`09d5005`). All remaining
> `DESIGN_REVIEW.md` items exhausted: Should-Fix #1: mono spec sheet in right
> rail (year / duration / age / country, one token per line, `.rail` wrapper
> is `position:sticky` on desktop — whole right column sticks as a unit).
> Could-Improve #2: gallery masonry via CSS `columns: 2` on tablet+ — original
> aspect ratios preserved. Could-Improve #5: SiteHeader wordmark
> `letter-spacing` raw value → `var(--letter-spacing-tight)` token. Build
> clean. **DESIGN_REVIEW.md fully resolved.**
>
> **2026-05-01 — Post-R1 manual QA (Daniil) surfaced Q1–Q7.** Sync emits
> non-production sub-pages (Q1); RU↔EN merge silently leaks EN string
> into `title.ru` (Q2); synopsis renders raw Markdown URL (Q3); awards
> page mixes RU/EN strings with junk entries (Q4); about-page chronology
> dates impossible (Q5); poster-less fallback reads placeholder-y (Q6);
> Roman responds faster on TG/IG than email (Q7). Full task list
> appended below. **Blocks R2 sign-off; D1 preview can still proceed
> in parallel.**
>
> **2026-05-02 — Q1–Q7 all shipped.** Commits `10f951f` (Q1 + Q2 sync
> filter and RU↔EN merge), `b3bded7` (Q3 synopsis), `fdbae94` (Q4
> awards + overlay path in `lib/content.ts`), `99299de` (Q5 about
> chronology), `8dae0b2` (Q6 brutalist no-poster fallback),
> `c7647bf` (Q7 contact TG+IG primary). Production-detail routes
> dropped 84 → 72 (4 bogus slugs × 3 locales). Zero language
> pollution in awards. 24 productions clean. Build clean.
>
> **2026-05-02 — Q8: production-detail content depth.** Daniil
> noticed that `/productions/sugar-kid` showed only title + chips +
> one-line synopsis despite the source MD carrying a full credit
> set, theatre attribution, premiere date, and tickets URL. Root
> cause: `extractTheatre` only matched БТК; no extractor existed
> for credits / premiere / tickets; the MDX body was loaded into
> `prod.body` but never reached the DOM. Fix landed: generic
> `extractTheatre` (4 → 6 productions covered), new `extractCredits`
> (per-locale, walks bold-label + cast list patterns), new
> `extractPremiereDate` and `extractTicketsUrl`. Page now renders a
> Credits section per DESIGN §7.3 (mono two-column, role on left,
> name on right with oxblood hover underline on linked names),
> theatre name in title block links to `theatre.url`, premiere
> date appears under theatre, Tickets button in the action bar.
> `lib/content.ts` types extended; overlay paths added so
> hand-fixes survive resync. Build clean.
>
> **R2 real-device QA is unblocked.** Two known follow-ups in this
> doc: festival-in-plain-prose awards for cinderella + sugar-kid
> need hand-overlay via the new `metadata.yml` `awards:` block;
> Roman to confirm RGISI / first-BTK milestone years before R2.
> Open content: 18 productions still show no theatre line because
> their MD source has no `[Name](url)` theatre link — Roman can
> add a `theatre:` block in the per-production `metadata.yml` to
> fill this in.
>
> **2026-05-02 — Phase 7.5 Round 3 + D1 shipped.** DA-3.A slate-strike
> landed (`7c26402`). `rewrite/v2` merged → `main` (PR #2); Next.js
> patched 15.5.6 → 15.5.15 (PR #3). Site live at
> https://boklanov.vercel.app/. `main` auto-deploys. R2 real-device QA
> is next; `?gesture=off` gate on slate-strike stays active until R2
> sign-off.

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

### Phase 5 — SEO / OG

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| S1 — Sitemap + robots + RSS | ✅ done | `576d401` | `app/sitemap.ts` (105 URLs, hreflang RU↔EN, DE no-alternate), `app/robots.ts`, `app/[locale]/feed/route.ts` (RU+EN only, DE→404). |
| S2 — JSON-LD schemas | ✅ done | `4a66296` | `Person` on `/about` (name, jobTitle, email, sameAs). `CreativeWork` on each production (inLanguage, productionCompany, dateCreated, audience, image, director). |
| S3 — Per-production OG images | ✅ done | `bda0628` | `app/api/og/[slug]/route.tsx` — ImageResponse, 1200×630. Poster or oxblood typographic fallback. Lora title + JetBrains Mono chips + accent bar. `generateMetadata` on production + about pages. |
| S4 — Analytics (PostHog) | ✅ done | `19c79ad` | PostHog, autocapture/pageview/recording disabled. `booking_cta_click` only via `data-ph-event` delegation. No key = silent no-op. |
| S5 — DE chrome translations | ✅ done | (in-place) | All 44 keys complete in `messages/de.json`. All 8 namespaces verified. |

**Phase 5 = 5 / 5 done.**

### Phase 6 — Interactions & Polish

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| I1 — Hover & focus audit | ✅ done | `df6dda1` | Unified `--shadow-focus` ring across all 13 interactive elements (eliminated double-ring from per-component `outline` overrides). Oxblood hover parity on CTAs and press links. contact mailtoButton hover → `--accent-hover`. pressLink transition added. |
| I4 — Empty + loading + error states | ✅ done | `7b691c6` | `ProductionGrid` empty state: "no match · clear" with inline oxblood reset (only when `hasActiveFilters`). LQIP blur-up: `poster.lqip` loaded from `public/productions/<slug>/lqip.json` into content type; CSS background on card covers — no spinner. `app/[locale]/not-found.tsx` with RU/EN/DE translations linking home + productions. |
| I5 — Signature gesture | 🚫 cut | — | Cut formally in R1 per `DESIGN.md` §13 (*"if it tests as gimmicky in design review, cut it"*). The build reads as quietly curatorial without one; adding motion on first paint risks the SaaS-flourish register the brief warns against. Rationale in `DESIGN_REVIEW.md` § "I5 (Signature Gesture) — formal decision". |
| P1 — Mobile-first layout pass | ✅ done | — | Mobile search button (on-screen Cmd-K trigger via CommandPaletteContext). Touch targets ≥44px: filter chips, clearAll, mobile nav links, locale links in drawer, contact copyButton, productionGrid emptyReset, home viewAll link, contact mailtoButton full-width on mobile. emailSection flex-wrap for narrow viewports. |
| P2 — Accessibility pass | ✅ done | — | Contrast: locale links + CommandPalette groupLabel/noResults fixed from --ink-faint (2.86:1) to --ink-mute (5.46:1 AA). Landmarks: localeSwitcher div→nav, footer nav col→nav. CommandPalette: aria-label on input + listbox, Tab focus trap. Alt text: ProductionCard + detail cover use full DESIGN §12 format (role, title, theatre, year, photographer). Decorative sep spans aria-hidden. hreflang RU↔EN confirmed in generateMetadata (DE excluded). |
| P3 — Lighthouse mobile ≥ 95 | ✅ done | `6ddb466` | Inter TTF (303KB+309KB) → subset woff2 per-script (cyrillic/latin/latin-ext) — saves ~476KB. `next/image` with `fill`+`sizes` on ProductionCard → AVIF/WebP served via `/_next/image`. `priority` on first grid card (`priorityFirst` prop on ProductionGrid) → `<link rel="preload" as="image">` injected for LCP image. Cover on detail page upgraded to `next/image` with stored dimensions (lqip.json extended with `posterWidth`/`posterHeight`). Font preloads (`<link rel="preload" as="font">`) in layout head, locale-aware (Cyrillic on /ru, Latin on /en+/de). |

**Phase 6 = 5 / 5 done (4 ✅ + I5 🚫 cut).**

### Review

| Task | Status | Output | Notes |
|------|--------|--------|-------|
| R1 — Design review against brief | ✅ done | `.design/boklanov-rewrite/DESIGN_REVIEW.md` | Zero §11 anti-patterns shipped. Token discipline excellent. Two **Must-Fix** items: (1) desktop sticky CTA on `/productions/[slug]` only enters viewport after deep scroll — needs real right-rail (`page.module.css:348-365`); (2) cover→title-block separator missing when `poster.credit` is null. Seven **Should-Fix**: empty desktop right column, filter chip groups need labels, native search `×` button leaks into Cmd-K, dev-mode LQIP race on first card, hydration-warning verification, ThemeToggle glyph ambiguity, ProductionCard LQIP gating. **I5 cut.** |
| R1.fix — Land Must-Fix items | ✅ done | `73620e6` `871f287` | Must-Fix #1: CSS-grid right rail for sticky CTA. Must-Fix #2: `.titleBlock` top rule. Optional: filter group labels. Polish: ThemeToggle SVG, search × suppression, LQIP gating. |
| R1.polish — Remaining DESIGN_REVIEW items | ✅ done | `09d5005` | Should-Fix #1: spec sheet in right rail. Could-Improve #2: gallery masonry (CSS columns). Could-Improve #5: wordmark letter-spacing token. All DESIGN_REVIEW.md items resolved. |
| R2 — Real-device manual QA | ✅ done | 2026-05-02 | Daniil checked desktop + mobile on https://boklanov.vercel.app/. Site looks correct. `?gesture=off` gate lifted — slate-strike animation live for all users. |

### Core UI

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| C1 — Production card + grid | ✅ done | `11fc081` | `<ProductionCard>` + `<ProductionGrid>` per DESIGN §7.2; rendered at `/[locale]/productions`. 4:5 cover, Lora RU title with oxblood underline reveal on hover (150ms), Inter EN subtitle in `--ink-mute`, mono `theatre · year · ageRating · countryCode` row, hairline rule between cards. Typographic fallback for productions without a poster. Whole card is the link. Grid: 1-col / 2-col / 3-col responsive. |
| C2 — Production detail | ✅ done | `c7d58ae` | `app/[locale]/productions/[slug]/page.tsx` per DESIGN §7.3. Cover → title block (RU/EN/DE) → mono chips → Lora-italic synopsis → action bar (Watch/Tech rider/Press kit, conditional) → photos gallery with mono credits → press list (Lora italic blockquote-grade) → awards (mono year/name/city) → external links → sticky oxblood booking CTA with prefilled `mailto:boklanov.roman@mail.ru` (subject + body include show title, year, role; tour-window/venue/notes prompts). _Detail page count post-Q1: 24 productions × 3 locales = 72 routes (was 84 before bogus slugs filtered)._ |
| C3 — Home | ✅ done | `2943216` | `app/[locale]/page.tsx`: type-led Lora wordmark (`--font-size-4xl`, lowercase), mono genre meta, Inter prose statement (65ch). Featured strip: `filter(featured && poster.src).slice(0, 6)` — no typographic fallback above the fold. Director-role grid below the fold (brief D5 default). Ghost "all →" link to /productions. 3 locales × SSG. |
| C4 — Filter panel + URL state | ✅ done | `05600f1` | `<FilteredProductionsPanel>` Client Component with useSearchParams. Role radio (director default), form/age-bucket/country multi-select. Chips: JetBrains Mono uppercase, 2px radius, active = paper-raised + rule-strong border. Clear-all = oxblood only. Suspense boundary keeps build fully SSG. |
| C5 — About + lineage | ✅ done | `cb0aaab` | `app/[locale]/about/page.tsx`: Lora display heading, Inter bio at 65ch (first para as Lora lead), mono milestones timeline, lineage grid (Кудашов/БТК/РГИСИ) in paper-sunken cards. Inline loader with RU→EN→DE fallback. `content/about/{ru,en}.mdx` with portrait/milestones/lineage frontmatter. |
| C6 — Awards | ✅ done | `c7b80c5` | `app/[locale]/awards/page.tsx`: Lora page heading lowercase, awards aggregated from `getAllProductions()`, grouped by production with Lora `--font-size-xl` grouping header linked to detail page. Each award row: mono year (>1900 guard) · name · city/category. Hairline rules between groups and rows. 3 locales × SSG. |
| C7 — Press | ✅ done | `2225975` | `app/[locale]/press/page.tsx`: card grid (1/2-col), Lora italic blockquote pull-quote (article title), mono outlet attribution with oxblood underline hover. Outlet falls back to URL domain. Mono production reference link. 3 locales × SSG. |
| C8 — Contact | ✅ done | `292552f`; reordered `c7647bf` | `app/[locale]/contact/page.tsx`. Original C8: oxblood primary mailto + mono Telegram/Instagram secondary. **Reordered post-Q7 (2026-05-02):** Telegram + Instagram are now the oxblood primaries (side-by-side ≥768px), mailto demoted to hairline-bordered secondary under a mono "or by email" subhead. `CopyEmailButton` Client Component flashes "✓" on copy. PostHog `booking_cta_click` fires on all three channels with `data-ph-channel`. No form, no backend. 3 locales × SSG. |
| C9 — Archive | ✅ done | `40dec94` | `app/[locale]/archive/page.tsx`: filters out `role=director`, year-ascending mono table (year · title · theatre · role). Hairline rules. Theatre column hidden below 480px. 3 locales × SSG. |
| C10 — Layout shell | ✅ done | `941fcdf` | `<SiteHeader>` (Client Component): Lora wordmark left, mono nav links centre (≥768px), locale switcher (RU/EN/DE) + `<ThemeToggle>` right; hamburger drawer on mobile; hairline rule below. Anti-flash theme script in `<head>`. `<SiteFooter>` (Server Component): three mono columns — nav · social · copyright. Wired into `app/[locale]/layout.tsx`. |
| C11 — Cmd-K palette | ✅ done | `ab2ce8b` | `<CommandPaletteProvider>` (Client): global Cmd+K/Ctrl+K listener, lazy-loads palette via `next/dynamic`. Search index built server-side via `lib/search.ts buildSearchIndex()`. `<CommandPalette>`: JetBrains Mono input on `--paper-raised`, hairline border, results grouped (PRODUCTIONS/AWARDS/PRESS/THEATRES/CITIES) with mono-caps labels, ↑↓ keyboard navigation, Cyr↔Lat transliteration. |

**Core UI = 11 / 11 done. Phase 4 complete.**

**Tech-debt cleared by F8:** all three items below (`ignoreBuildErrors`,
`@ts-nocheck` on legacy components, `pages/p/[pageId].tsx`) were retired
when the legacy renderer was deleted. The build is clean under
`strictNullChecks` + ESLint without any escape hatches.

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

- [x] **F5 — `metadata.yml` overlay + manual-pass workflow**: After F4
  produces `content/productions/*.mdx`, generate one
  `content/productions/<slug>/metadata.yml` per production with the
  fields the heuristic missed (brief D6) — `lineage[]`, `form[]`,
  `featured`, photo `credits[]`, `techRider`, `pressKit`, video URLs.
  Loader merges MDX frontmatter + metadata.yml at build time, metadata
  wins. Document the workflow in `content/README.md` so Roman can hand
  back the credit list once. _New; closes brief Q1, Q2, Q8._

- [x] **F6 — Content loader API**: `lib/content.ts` with three functions —
  `getAllProductions(locale)`, `getProduction(slug, locale)`,
  `getRelatedProductions(production, n)` (the recommends algorithm from
  brief D9: same age bucket + same form + same lineage, 3 cards). Pure
  functions over the merged content tree, no I/O outside build. _New;
  every page route calls this._

- [x] **F7 — `app/globals.css` reset + base styles**: Minimal CSS reset,
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

- [x] **C3 — Home (artistic-statement landing)**: `app/[locale]/page.tsx`
  per IA — short artistic-statement block, **4–6 hand-curated featured
  cards** (pulled by `featured: true` in metadata.yml), then the
  filterable grid below the fold defaulted to `role=director` (brief D5).
  Hero is type-led: oversized lowercase wordmark in Lora display, no
  photo overlay. Featured cards reuse `<ProductionCard>` from C1; only
  pull from the top-coverage band (brief §6 table). _Depends on C1._

- [x] **C4 — Filter panel + URL-state**: `<ProductionFilters>` driving
  the grid in C1 / C3. Filters: role (default `director`, toggleable),
  ageBucket (3+/6+/12+/18+), country (RU/KZ/DE/ES/AT/BY), form (puppet/
  object/solo/ensemble), year range. **Filters serialize to query
  string** (deep-linkable per IA). Mono labels, sharp-corner checkboxes,
  oxblood reserved for clear-all only when active. _Depends on C1, C3._

- [x] **C5 — About page + lineage block**: `app/[locale]/about/page.tsx`
  — long-form bio at `--max-width-prose` (65ch), Lora display heading,
  Inter body, mono pull-quotes for years/training milestones. Dedicated
  **lineage section** (brief D5: Кудашов / БТК / РГИСИ) with portrait +
  three named institutions. Bio content from `content/about.{ru,en}.mdx`.
  _Depends on F3, F7._

- [x] **C6 — Awards page**: `app/[locale]/awards/page.tsx` — timeline
  grouped by production, mono year + name + city + category, hairline
  rules between productions, no decoration. Aggregates `awards[]` across
  all productions via `getAllProductions()`. _commit `c7b80c5`_

- [x] **C7 — Press page**: `app/[locale]/press/page.tsx` — card grid,
  Lora italic blockquote (article title as pull-quote), mono outlet
  attribution (falls back to URL domain), oxblood underline on outlet
  link hover. **Original language only, no translation** (brief D4).
  Aggregates `press[]` from all productions. _commit `2225975`_

- [x] **C8 — Contact page**: `app/[locale]/contact/page.tsx` per brief
  D8 — prefilled mailto button (oxblood, primary, locale-aware subject),
  copy-pasteable email in mono + `CopyEmailButton` Client Component
  (flashes ✓ on copy), Telegram + Instagram secondary. **No form, no
  backend.** _commit `292552f`_

- [x] **C9 — Archive page**: `app/[locale]/archive/page.tsx` — long-tail
  CV (performer / co-director / reader / sketch). Filters out
  `role=director` productions. Dense mono table: year · title · theatre
  · role, hairline rules. Theatre column hidden below 480px.
  _commit `40dec94`_

- [x] **C10 — Layout shell**: `<SiteHeader>` Client Component — lowercase
  Lora wordmark left, mono nav links centre ≥768px / hamburger drawer
  on mobile, locale switcher (RU/EN/DE) + `<ThemeToggle>` right,
  hairline rule below. Anti-flash `<script>` in `<head>`. `<SiteFooter>`
  Server Component — three mono columns (nav · social · copyright).
  Wired into `app/[locale]/layout.tsx`. _commit `941fcdf`_

- [x] **C11 — Cmd-K palette (brief D9)**: `<CommandPaletteProvider>`
  registers global Cmd+K/Ctrl+K, lazy-loads palette via `next/dynamic`
  (ssr: false). Search index built server-side in layout via
  `lib/search.ts buildSearchIndex()`. `<CommandPalette>`: JetBrains Mono
  input on `--paper-raised`, hairline border, results grouped
  (PRODUCTIONS / AWARDS / PRESS / THEATRES / CITIES) with mono-caps
  labels, ↑↓ keyboard navigation, Enter to navigate, Esc to close.
  Cyr↔Lat transliteration. _commit `ab2ce8b`_

---

## Interactions & States

- [x] **I1 — Hover & focus states**: Unified `--shadow-focus` ring (paper
  gap + oxblood) across all 13 interactive elements; eliminated double-ring
  from component outline overrides. Oxblood hover parity on CTAs and press
  links. contact mailtoButton hover fixed to `--accent-hover`. pressLink
  transition added. _commit `df6dda1`_

- [x] **I2 — Theme toggle + persistence**: `<ThemeToggle>` Client
  Component writes `[data-theme]` to `<html>`, persists to
  `localStorage`. Anti-flash inline `<script>` in `<head>` prevents
  FOUC on reload. Token CSS handles both branches. _Shipped in C10,
  commit `941fcdf`_

- [x] **I3 — Language switch**: RU/EN/DE switcher in `<SiteHeader>`
  uses next-intl `<Link locale={loc}>` preserving current pathname.
  All three locales show on every route (SSG covers all). _Shipped in
  C10, commit `941fcdf`_

- [x] **I4 — Empty + loading + error states**: `ProductionGrid` empty state
  shows "no match · clear" with inline oxblood reset button (only when active
  filters exist). LQIP blur-up loaded from `public/productions/<slug>/lqip.json`
  into `poster.lqip` and rendered as CSS background on card covers — no
  spinner. `app/[locale]/not-found.tsx` with RU/EN/DE translations linking
  home + productions. _commit see below_

- [~] **I5 — Signature gesture (brief Q3, design.md §13)**: 🚫 **Cut in R1.**
  The brief explicitly authorised the cut (*"if it tests as gimmicky in
  design review, cut it entirely"*). The build reads as quietly curatorial
  without it; adding a paper-cut / string-line on first paint would risk
  the SaaS-flourish register `DESIGN.md` §3 warns against. Rationale:
  `.design/boklanov-rewrite/DESIGN_REVIEW.md` § "I5 (Signature Gesture) —
  formal decision". _Cut, not deferred._

---

## Responsive & Polish

- [x] **P1 — Mobile-first layout pass**: Mobile search button (on-screen
  Cmd-K trigger via `CommandPaletteContext`). Touch targets ≥44px: filter
  chips, clearAll, mobile nav links, locale links in drawer, contact
  `copyButton`, `productionGrid` emptyReset, home viewAll link, contact
  mailtoButton full-width on mobile. `emailSection` flex-wrap for narrow
  viewports.

- [x] **P2 — Accessibility pass (DESIGN.md §12)**: Contrast: locale links +
  CommandPalette `groupLabel`/`noResults` fixed from `--ink-faint` (2.86:1)
  to `--ink-mute` (5.46:1 AA). Landmarks: `localeSwitcher` div→`<nav>`,
  footer nav col→`<nav>`. CommandPalette: `aria-label` on input + listbox,
  Tab focus trap. Alt text: `ProductionCard` + detail cover use full DESIGN
  §12 format (`role, title, theatre, year (photographer)`). Decorative `sep`
  spans `aria-hidden`. `hreflang` RU↔EN confirmed in `generateMetadata`
  (DE excluded).

- [x] **P3 — Lighthouse mobile ≥ 95**: Inter TTF (303 KB + 309 KB) →
  subset woff2 per-script (cyrillic/latin/latin-ext) — saves ~476 KB.
  `next/image` with `fill`+`sizes` on `ProductionCard` → AVIF/WebP served
  via `/_next/image`. `priority` on first grid card (`priorityFirst` prop)
  → `<link rel="preload" as="image">` injected for LCP image. Cover on
  detail page upgraded to `next/image` with stored dimensions (`lqip.json`
  extended with `posterWidth`/`posterHeight`). Font preloads in layout
  head, locale-aware (Cyrillic on `/ru`, Latin on `/en`+`/de`).
  _commit `6ddb466`_

---

## Phase 5 — i18n + SEO + OG (PLAN.md Phase 5)

- [x] **S1 — Sitemap + robots + RSS**: `app/sitemap.ts` emitting
  `hreflang` for RU↔EN production pairs only (IA: DE excluded).
  `app/robots.ts`. `app/[locale]/feed/route.ts` emitting RSS for
  productions in RU + EN (DE excluded — chrome-only locale). _Depends
  on F6._

- [x] **S2 — JSON-LD schemas**: `Person` schema on `/about` (Roman),
  `CreativeWork` schema on each production detail with `inLanguage`,
  `productionCompany` (theatre), `dateCreated` (year), `audience`
  (ageRating mapped to `audienceType`). _Depends on C2, C5._

- [x] **S3 — Per-production OG images**: Port
  `pages/api/social-image.tsx` → `app/api/og/[slug]/route.ts` using
  `@vercel/og`. Composition: poster (or typographic fallback), Lora
  title, mono `[ageRating] [year] [countryCode]` band, oxblood accent
  bar. **Test on Telegram preview** — that is the user-#1 share vector
  per brief §2. _Depends on F4, C2._

- [x] **S4 — Analytics pick (brief Q7)**: Decide PostHog or Fathom or
  none; remove the unused dep. If kept, instrument **only the booking-
  CTA conversion** (mailto click on production detail + contact page)
  — that is the only real metric per brief Q7. _Depends on C2, C8._

- [x] **S5 — DE chrome translations (brief Q4)**: ~80 strings — nav,
  buttons, chips, metadata labels. Daniil-owned. Populates
  `messages/de.json`. Production-card text stays RU/EN per IA. _Depends
  on F3, C10._

---

## Review

- [x] **R1 — `/design-review` against the brief**: Code + visual critique
  of home, productions index, `/productions/lina-marlina`, about, press,
  contact, Cmd-K, dark mode at 1280×800. Output:
  `.design/boklanov-rewrite/DESIGN_REVIEW.md`. **Verdict: zero §11
  anti-patterns shipped.** Token discipline exceptional. Two Must-Fix
  items (sticky-CTA right-rail; cover→title separator). I5 cut formally.
  Mobile-emulated screenshots blocked by MCP viewport — deferred to R2
  real-device pass.

- [x] **R1.fix — Land R1 Must-Fix items before R2** (`73620e6`, `871f287`):
  1. ✅ Desktop sticky CTA right-rail: `.layout` grid wrapper splits page
     into `[minmax(0,720px)] [1fr]`; CTA has `position:sticky; align-self:start;
     margin-top:--space-8` — visible from landing on desktop.
  2. ✅ Cover → title-block separator: `border-top + padding-top` on
     `.titleBlock` — consistent editorial breath with or without credit row.
  3. ✅ Filter group labels (`РОЛЬ/ФОРМА/ВОЗРАСТ/СТРАНА`) on ≥768px — highest-
     impact Should-Fix also landed. Plus: ThemeToggle SVG, search × suppression,
     LQIP gating. _Depends on R1. All done._

- [ ] **R2 — Real-device manual QA**: iPhone SE / iPhone 14 Pro / iPad /
  13" laptop / 27" desktop. Daniil + Roman. Check the 90-second
  curator scenario end-to-end on iPhone SE: open Instagram-DM-shaped
  link → home → see featured shows → tap one → reach booking CTA. Time
  it. Also verify:
  - Spec sheet (year / duration / age / country) visible in right rail
    above CTA on desktop (≥1024px).
  - Gallery images retain original aspect ratios (masonry, not uniform grid).
  - **R1 Should-Fix #4 (LQIP/preload race on first featured card)** on a
    `next build && next start` production build — R1 saw the LQIP blur
    persist in dev mode; verify it resolves in production.
  _Depends on R1.fix + R1.polish + Q1–Q7 (see below)._

---

## Post-R1 QA findings (2026-05-01)

Surfaced during a manual `next dev` walkthrough by Daniil. All seven
**block R2 sign-off** — fix in this order, then re-run R2 on a
production build before D1.

- [x] **Q1 — Sync emits non-production sub-pages as productions.**
  ✅ done. `scripts/sync-from-notion.ts` now declares
  `NON_PRODUCTION_SLUGS` and skips matching groups during the CSV
  pass. Confirmed dropped: `contacts`, `roman-boklanov-english`,
  `puppet-director` (role overview, references multiple shows),
  `total-fest-dialogs` (festival listing, `Author` empty,
  `Description` empty). Kept as real productions: `online`
  (`Online ` — director-credited puppet show) and `pre-theatre`
  (`ДОТЕАТР` / `DOTHEATRE` — director-credited reconstruction
  piece). Sync log reports the filter count (`filtered 6
  non-production rows`). Production-detail routes dropped from 84 →
  72 (12 = 4 slugs × 3 locales). Their committed stub `metadata.yml`
  files removed via `git rm -r`. _Future blocklist additions:
  add the slug to `NON_PRODUCTION_SLUGS`, re-run `npm run sync`,
  then `git rm -r content/productions/<slug>`._

- [x] **Q2 — RU↔EN sibling merge silently emits EN string as
  `title.ru`.** ✅ done. Two distinct sub-bugs fixed:
  (a) `detectLocale(body, name)` was sniffing the first 500 chars of
  body for Cyrillic and returning `'ru'` when it found any — false
  positive on EN pages whose body quoted Russian cast names or
  caption text, which then overwrote `prod.title.ru` with the EN
  `Name`. Replaced with `rowLocale(row)` driven by the CSV `Slug`
  suffix (`-en` / `-eng` → EN, otherwise Cyrillic-name detection).
  (b) `slugify("Сахарный ребёнок")` returned empty (`\w` doesn't
  match Cyrillic) so the RU sibling was dropped at grouping and the
  EN sibling stayed as a singleton. Added `MANUAL_SIBLING_PAIRS`
  table to attach orphan RU rows to their EN sibling's group:
  `Сахарный ребёнок` → `sugar-kid`, `Каштанка` → `kasztanka`.
  Verified: `sugar-kid`, `jagger-jagger`, `kasztanka` now have
  correct `title: { ru: "<Cyrillic>", en: "<Latin>" }` pairs;
  `notionIds` has both `ru` and `en` ids populated. _Future
  unsluggable RU rows: add the row's `Name` and target slug to
  `MANUAL_SIBLING_PAIRS`._

- [x] **Q3 — Synopsis renders as raw Markdown when it contains a
  link.** ✅ done. Root cause was upstream of the page render: the
  sync's `extractSynopsis()` was picking the first MD paragraph that
  cleared a 60-char floor *measured against the raw MD source*, so
  `[https://youtu.be/...](url)` (URL doubled as link text) and
  `**Tickets: [[website]](url)**` cleared the floor on length alone
  and got emitted into `synopsis`. Three productions hit it
  (`sugar-kid`, `the-giving-tree`, `the-old-man-and-the-sea`).
  _Fix shipped:_ `scripts/sync-from-notion.ts` now (a) strips
  Markdown link syntax `[X](Y)` and Notion's nested `[[X]](Y)`
  variant before measuring length; (b) skips paragraphs that are
  URL-only or start with promo-tag prefixes (`tickets`/`билеты`/
  `premiere`/`премьера`/`age`/`возраст`/`duration`/`продолжительность`/
  `category`); (c) skips Notion-style cast lists (paragraphs with
  ≥3 internal newlines where the majority of lines have a
  role–name dash separator); (d) strips `<aside>`/`<details>` HTML
  tags Notion emits around editorial blurbs. Verified post-resync:
  `sugar-kid` now has real RU+EN prose synopses; `the-giving-tree`
  is empty in both locales (correct — its body is metadata + cast
  list only); `the-old-man-and-the-sea` has the real EN director's
  quote. Audit across all 24 productions: zero remaining pollution.
  _Note for later:_ `lib/content.ts:230-238` extracts MDX body into
  `production.body`, but the detail page never renders it — dead
  data path. Not blocking; flag for v2 cleanup.

- [x] **Q4 — Awards page mixes RU and EN strings.** ✅ done. Took
  option (b) — normalise to RU canonical form (DESIGN §3 "original
  language" rule). Sync now extracts awards from `prod.body.ru` first
  (was `primaryBody`, which often pointed at the EN sibling and
  pulled in mixed-language transliterated festival annotations). The
  `extractAwards` heuristic was rewritten:
  - `/u` flag on emoji char classes (without it, `🏅` shared its
    surrogate `\uD83C` with `🏆` and press-citation lines slipped
    through — that was the source of `«Собака.ru»` showing up as an
    award);
  - year clamped to `19[9]\d|20[0-3]\d` (kills the `year: 1281`
    parsed from `sobaka.ru/.../128165`);
  - festival picked from the LAST `[text](url)` link, with
    `isPersonLink()` filter (URL contains `/pers/` OR text matches
    Cyrillic "First Last" pattern) — drops `Maxim Morozov`,
    `Константин Кожев`, `Лидия Клирикова`, `Александра Черных` from
    the awards list;
  - falls back to FIRST quoted phrase when no link (subsequent
    quotes are nomination categories or play titles);
  - `**bold**` and trailing punctuation stripped from final name.
  Verified across 24 productions: zero language mixing, zero person
  names, zero out-of-range years, zero press-citation bleed.
  Two festival-in-plain-prose patterns remain unextractable by
  heuristic (`Лучший спектакль о добре` for cinderella and
  `За важное художественное высказывание` for sugar-kid — both are
  nomination categories the heuristic picked because the festival
  name is in unmarked Cyrillic prose).
  _Overlay path added:_ `lib/content.ts:217` now `pick`s
  `overlay.awards` over `fm.awards`. The metadata stub generator
  emits a commented-out `awards:` block listing the auto-extracted
  values so Roman/Daniil can uncomment + edit to override per
  production. Hand-fixing those 2 edge cases is a content-level
  follow-up, not a sync bug.

- [x] **Q5 — About-page chronology dates wrong.** ✅ done. The
  Notion bio (`notion-data/Роман Бокланов d997…935b.md`) gives firm
  anchors: born 7 May 1993 in Ust-Kamenogorsk, returned to Almaty
  in 2022. Both `2003 — РГИСИ` and `2008 — БТК director` were
  impossible (Роман would have been 10 and 15 in those years) —
  these were placeholder values from F4 that never got verified.
  Replaced both `content/about/{ru,en}.mdx` milestone lists with
  five dates anchored either in the Notion bio (1993, 2022) or in
  hard production data (2017 Golden Mask as performer, 2018
  Istropolitana Bratislava as performer, 2020 Bury Me Behind
  premiere at BTK). Comment block in each file flags the remaining
  unverified anchors (year of RGISI enrolment, year first directed
  at BTK) for Roman to confirm before R2.

- [x] **Q6 — Missing-poster fallback feels placeholder-y at grid
  scale.** ✅ done. Re-composed the fallback as a newspaper
  title-card. Title moved from bottom-flush to top-flush, set in
  display Lora at `--font-size-xl`. A hairline rule (`1px solid
  var(--rule)`) underlines the title, and the production year sits
  below it in JetBrains Mono caps at `--font-size-chip` with
  `--letter-spacing-meta`. Removed the bottom-fade gradient — the
  rule + mono mark do the editorial work without needing a tonal
  trick. Background stays `--paper-sunken` per DESIGN §5.3. The
  card now reads as a composed title-card whether or not a poster
  exists — visible in the post-fix grid where the ~12 poster-less
  cards (filtered by `getAllProductions().filter(p => !p.poster.src)`)
  no longer queue as "missing assets". Title in fallback is
  `aria-hidden` because the visible `<h3>` below the cover already
  names the show, so screen readers don't double-read.

- [x] **Q8 — Production detail page rendered too thin a slice of the
  Notion source.** ✅ done. User flagged that
  `/productions/sugar-kid` (and others) showed only title + chips +
  one-line synopsis even though `notion-data/.../Сахарный
  ребёнок….md` carries a full credit set, theatre attribution,
  premiere date, and tickets URL. Root cause: the detail page
  rendered eight structured frontmatter fields and **never** the
  MDX body (which holds the credits / cast / theatre prose), so all
  that content was dead-data. `extractTheatre` only matched БТК;
  no `extractCredits`, no `extractPremiereDate`, no
  `extractTicketsUrl` existed at all.
  _Fix shipped:_
  - `extractTheatre` rewritten as a generic three-step heuristic:
    BTK fast-path → inline-context pattern (`театра [Name](url)`
    catches `ARTиШОК`, `Старый дом`) → first link whose text
    contains "театр" / "theatre" / "theater". Search restricted to
    body content BEFORE the first `Пресса` / `Награды` heading;
    candidate length capped at 60 chars; person-link patterns
    (`/pers/` URLs, "First Last" Cyrillic / Latin pairs) filtered.
    Coverage: 4 → 6 productions get a theatre line (BTK ×3 + new:
    `Новый Молодежный Нижнетагильский театр`, `Baltic House Theatre`,
    `ARTиШОК`). The other 18 have no theatre link in their MD source.
  - New `extractCredits()` walks `**Role:** Value` and
    `**Role -** Value` lines plus the cast section under
    `В спектакле участвуют` / `Actor` / `Cast` / `Состав`. Skips
    metadata labels (Tickets, Premiere, Age, Duration, Category).
    Cast members get the trigger label as their role; later credits
    bring full names with optional URLs. Per-locale: extracted
    separately from RU and EN bodies so role labels read in source
    language (Режиссёр / Director, Художник / Artist).
  - `extractPremiereDate()` returns the trimmed date string; per-
    locale (RU and EN format differently). Initial regex form
    captured `:` because non-greedy `+?` plus optional `:?` found a
    1-char shortest match — fixed by anchoring with the `m` flag
    and proper line boundaries.
  - `extractTicketsUrl()` returns the URL from
    `**Tickets:** [...](url)` / `**Билеты:** [...](url)` lines
    (handles Notion's nested `[[label]](url)` form).
  - `lib/content.ts`: `Production` and `ProductionView` extended
    with `credits`, `premiereDate`, `ticketsUrl`. `merge()` adds
    overlay paths for `theatre`, `credits`, `premiereDate`,
    `ticketsUrl` — hand-fixes survive resync. `project()` picks
    per-locale credits and premiere date with RU→EN fallback.
  - `app/[locale]/productions/[slug]/page.tsx` renders three new
    page sections: theatre name in title block links to
    `theatre.url`; premiere-date line under theatre; **Credits
    section** between synopsis and action bar (DESIGN §7.3 #5 —
    JetBrains Mono, two-column ≥768px, role on left, name on
    right, oxblood hover underline on linked names); **Tickets
    button** added to the action bar. New `tickets` translation
    key in all three locales. Verified post-resync: sugar-kid
    shows theatre, credits (Ринат Кияков director / Анастасия
    Копылова designer / Роман Бокланов puppetry director / cast),
    premiere date "10 октября 2022 г." in RU, tickets button.
    Lina-Marlina shows 14 RU credit entries. Build clean.

- [x] **Q7 — Contact-page primary action is now Telegram + Instagram,
  not mailto.** ✅ done (conservative scope per the recommendation
  in this row's earlier draft). Standalone `/contact` only — the
  production-detail sticky CTA stays mailto so the prefilled
  subject auto-fills with the show name (booking magnet, brief D1).
  Implementation: two oxblood `.primaryButton`s side-by-side on
  ≥768px (stacked on mobile), `flex: 1` so they share the row; the
  former `.mailtoButton` is replaced by a hairline-bordered
  `.mailtoLink` under a mono-caps `emailLabel` subhead ("или по
  электронной почте" / "or by email" / "oder per E-Mail"). New
  translation keys added in all three locales: `telegramCta`,
  `instagramCta`, `emailLabel`. PostHog `booking_cta_click` fires
  on all three channels with `data-ph-channel="telegram"`,
  `"instagram"`, `"email"` so analytics can split conversion by
  contact channel. _If the user later wants the production-detail
  sticky CTA to also flip to TG+IG, that's a separate change in
  `app/[locale]/productions/[slug]/page.tsx` — flag it in a new
  task; the current commit deliberately leaves it untouched._

---

## Phase 7 — Deploy + cutover

- [x] **D1 — Vercel deploy from `main`**: ✅ done (2026-05-02).
  `rewrite/v2` merged → `main` via PR #2; Next.js patched 15.5.6 → 15.5.15
  via PR #3 to clear Vercel security check. Live at
  https://boklanov.vercel.app/ (Vercel project: `octrows-projects/boklanov`).
  `main` auto-deploys on push. Cyrillic fonts pending real-device
  verification (R2 QA item).

- [x] **D2 — Hosting decision**: ✅ Vercel stays. No migration. Decided 2026-05-02.

- [x] **D3 — Domain decision**: ✅ `boklanov.com` canonical (`.ru` deferred).
  www.boklanov.com → 301 redirect via Vercel alias. Decided 2026-05-02.

- [ ] **D4 — Cutover + DNS swap** 🟡 **IN PROGRESS — deadline 6 May 2026**:
  DNS currently at Spaceship.com. Old Notion site still live — OK to cut.
  Steps: (1) Vercel → Settings → Domains → add `boklanov.com` + `www.boklanov.com`;
  (2) Spaceship DNS: A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`;
  (3) Wait for propagation (~5 min – few hours at TTL 300).
  Note: cdn.boklanov.com R2 connection skipped — boklanov.com not yet on
  Cloudflare. Revisit if/when DNS moves to Cloudflare. _Depends on D3._

---

## Phase 7.5 — Editorial fingerprints (DESIGN_AMBITION)

> Locked 2026-05-02 in `.design/boklanov-rewrite/DESIGN_AMBITION.md`
> §0.5. Three rounds elevating the chrome from "generic editorial"
> to "theatre programme" while staying inside `DESIGN.md` §11
> anti-patterns. Brief is unchanged. Total ~3.5 days, sequenced
> alongside R2 / D1 — does not block deploy.
>
> **Sequence:** Round 1 → R2 → Round 2 → D1 → Round 3. **All three rounds + D1 done.**

### Round 1 — Publication chrome (~1 day, ships **before R2**)

- [x] **DA-1.A — Folio (§3.A)**: `lib/folio.ts` — `folioFor(pathname,
  productions)` → `{ sectionKey, index? }`. `<div class="folio"
  aria-hidden="true">` inserted above the `.inner` row in
  `SiteHeader.tsx`; shows `SECTION ⟶ 01 / 24` on section pages,
  hidden on home. `SiteHeader` now accepts `productions: { slug }[]`
  prop; layout passes `productions.map(p => ({slug: p.slug}))`.
  `.folio` CSS in `SiteHeader.module.css` — mono caps, `--font-size-chip`,
  `--letter-spacing-wide`, `--ink-faint`, `font-variant-numeric: tabular-nums`.
  No new tokens.

- [x] **DA-1.B — Cue numbers (§3.C)**: New `components/Cue.tsx` +
  `components/Cue.module.css`. `<Cue mark="CUE I">` wraps section
  heads on `/about` (CUE I chronology / CUE II lineage), `/awards`
  (CUE I–N per production group), `/productions/[slug]` (CUE I photos /
  CUE II press / CUE III awards / CUE IV links). `<span>` is
  `aria-hidden="true"` — `<h2>` carries the screen-reader name. `first`
  prop suppresses top margin when Cue opens a padded section.

- [x] **DA-1.C — Edition stamp (§3.H, year-only)**: `<small
  className={styles.colophon}>{tFooter('colophon')}</small>` added to
  `SiteFooter.tsx` after the 3-column `.inner`, before closing
  `<footer>`. i18n in new `footer` namespace:
  RU `2026 ИЗДАНИЕ`, EN `2026 EDITION`, DE `AUSGABE 2026`.
  Year-only — no cities, no version mark (A14.1 → γ).

### Round 2 — Theatrical move (~1.5–2 days, after R2 / before D1)

- [x] **DA-2.A — Production credits block (§3.B)**: ✅ done
  `0bebf3c` (2026-05-02). Replaced `<ul>` credits with `<dl>` leader
  grid: `<dt className={creditsRole}>` / `<dd className={creditsName}>`,
  two-column grid on ≥768px (`minmax(140px,1fr) 2fr`), hairline rule
  between rows. `<Cue>` header (`CREDITS` / `кредиты`) above the `<dl>`.
  `.creditsLink` class for `<a>` inside `<dd>` — oxblood hover underline.
  No troupe claim; no puppet-as-cast naming (A6 NOPE).

- [x] **DA-2.B — Theatre slate (§3.F)**: ✅ done `0bebf3c`
  (2026-05-02). Replaced `.specSheet` / `.specItem` with `.slate`
  bordered box (desktop ≥1024px only; `display:none` on mobile — chips
  row in prose column carries same data for screen readers).
  `.slateHeader` shows `PRODUCTION 01 / 24` index derived via
  `getAllProductions(locale).findIndex(p => p.slug === slug)`.
  Rows: YEAR / RUN / AGE / COUNTRY / TOURING (TOURING · SOLO appears
  only when `production.tour.length > 0`). `aria-hidden="true"`.

- [x] **DA-2.C — Staging geography (§3.G.1)**: ✅ done `0bebf3c`
  (2026-05-02). `/about/page.tsx`: new `<section className={geographySection}>`
  between bio and milestones — `tAbout('stagedIn')` label + city list.
  Home `page.tsx`: compressed echo `<p className={geographyEcho}>`
  after statement, `aria-hidden="true"`. City list locked:
  `СПБ · МОСКВА · АЛМАТЫ · БРЕМЕН · ВЕНА · БЕРЛИН · ТАШКЕНТ`.
  Labels past-tense: RU `ГДЕ СТАВИЛ` · EN `STAGED IN` · DE `INSZENIERTE IN`.
  No city links (C4 has no `city=` filter param — links deferred).
  New `about` i18n namespace in all three locales (`stagedIn`,
  `chronology`, `lineage`). About page `milestonesLabel` / `lineageLabel`
  refactored to `tAbout('chronology')` / `tAbout('lineage')`.

- [x] **DA-2.D — Plinth tour band (§3.G.2)**: ✅ done `0bebf3c`
  (2026-05-02). `tour[]` wired in `lib/content.ts` `merge()` with
  `pick(overlay.tour, fm.tour ?? [])` — overlay wins, so seed data
  lives in `metadata.yml` (not `index.mdx` which is gitignored).
  Seed 9 cities added to
  `content/productions/bury-me-behind-the-baseboard/metadata.yml`.
  `<section className={tourBand}>` inserted above gallery section
  on the production detail page — `t('onTour')` label + cities joined
  by ` · `. Hides when `tour.length === 0`. New `productionDetail.onTour`
  key in all three locales.

- [x] **DA-2.E — Premiere mark on cards (N1)**: ✅ done `0bebf3c`
  (2026-05-02). `components/ProductionCard.tsx`: replaced bare
  `production.year` in the meta row with `premMark = production.year ?
  \`PREM ${production.year}\` : null`. No CSS change needed — mono caps
  already applied.

### Round 3 — The opening cue (~1 day, after D1, optional)

- [x] **DA-3.A — Slate-strike (§4.1.A) + edition-frame fallback
  (§4.1.C)**: ✅ done `7c26402` (2026-05-02). `components/SlateStrike.tsx`
  + `SlateStrike.module.css`. 320ms one-shot CSS animation: `::before`
  slate-top drops 1.5em, `::after` hairline rule fades in. Gated by
  `sessionStorage.firstPaintDone`, `?gesture=off`, and
  `prefers-reduced-motion: reduce`. `<Suspense fallback={null}>` boundary
  wraps `<SlateStrike>` in home page (required by `useSearchParams`).
  `--duration-slate: 320ms` token in `globals.css`. Static edition-frame
  end-state (hairline rule, no motion) present in all three fallback paths.
  `?gesture=off` gate **lifted** — R2 QA signed off 2026-05-02. Animation live.

### Cuts (do not build)

- ❌ §3.D specimen-hero (watermark) — deferred indefinitely. Highest
  risk of "too clever," lowest brief-margin (A8).
- ❌ §3.J errata 404 — vanishingly small audience (A8).
- ❌ §4.1.B string-line pull — reads as a progress bar.
- 💤 §3.E marginalia — deferred. Above 1280px only; needs a real
  desktop test cohort post-R2 to evaluate.
- 💤 §13.4 N2 run-of-show row — deferred to post-D1, optional.

### Sequencing within Phase 7.5

- DA-1.A · 1.B · 1.C are independent; can land in one PR or three.
- DA-2.* are independent of each other but all depend on Round 1
  shipping (cue system is reused by 2.A's `CREDITS` header).
- DA-3.A can ship behind a flag any time after Round 1; honest
  evaluation is post-D1 with the curator test described in
  `DESIGN_AMBITION.md` §4.2.

---

## Phase 7.6 — Editorial polish (post-D4)

> Added 2026-05-02 after Phase 7.5 Round 1–3 shipped. Each task is
> brief-compatible (audited against `DESIGN.md` §11) and continues the
> theatre-programme metaphor. **Schedule: post-D4 cutover (after
> 6 May).** None of these are blockers for the birthday-surprise
> launch — they are post-launch compounding moves. Daniil may promote
> any single task to pre-D4 if bandwidth allows, but the default is
> "ship the launch first, polish after."
>
> Effort tags: XS = ≤ 1h · S = ≤ ½ day · M = ≤ 1 day · L = > 1 day.

### Tier 1 — programme-grammar continuations (highest signal)

- [ ] **DA-7.6.A — Marginalia (§3.E activation)** — M.
  Was deferred at lock-time pending a real desktop test cohort. Round
  1+2 chrome has settled and curators have eyes on `boklanov.vercel.app`,
  so the cohort exists. Activate gutter notes above 1280px on `/about`
  long-form prose and on each `productions/[slug]` synopsis section.
  Right-margin slot holds: photographer-credit line, lineage cross-refs
  (`see also: Идём вдвоём ↗`), date stamps in mono. Below 1280px the
  same content collapses inline as italic Lora subordinate notes.
  Implementation: new `<Aside>` component + CSS-grid template on the
  prose container (`minmax(0, 65ch) minmax(0, 20ch)`). No new tokens.
  Files: `components/Aside.tsx` (new), `app/[locale]/about/about.module.css`,
  `app/[locale]/productions/[slug]/page.module.css`.

- [ ] **DA-7.6.B — Print stylesheet** — S.
  A theatre-programme metaphor that doesn't print is a half-truth.
  Curators do print press kits and bio sheets. Add `@media print`
  block in `app/globals.css`: hide nav + footer + folio + Cmd-K
  trigger, keep wordmark + main + colophon, force `--paper` to white
  and `--ink` to black, hairline rules to 0.5pt black, mono caps stay
  mono caps, page margins 18mm, `widows: 3; orphans: 3` on long
  prose. Test against `/about`, `/productions/bury-me-behind-the-
  baseboard`, `/awards` in browser print preview. Niche but very
  on-brand.

- [ ] **DA-7.6.C — Director's note block** — S (data-driven by Roman).
  Optional `directorsNote.{ru,en}` field in production frontmatter.
  When present, render below the synopsis on production detail as
  italic Lora blockquote with a hairline left rule (mirrors the
  critic-quote treatment from D7 step 8) — but attribution is mono
  `— РОМАН БОКЛАНОВ` instead of an outlet. Distinguishes editorial
  third-person synopsis from the director's own voice. Requires a
  one-shot Roman pass via Obsidian after Phase 8.4.
  Files: `lib/content.ts` (add field), `app/[locale]/productions/
  [slug]/page.tsx`, new section in `Cue` system (`CUE — ОТ
  РЕЖИССЁРА` / `FROM THE DIRECTOR`).

- [ ] **DA-7.6.D — Run-of-show indicator (N2 reactivation)** — S.
  Reactivate the deferred §13.4 N2 proposal. Tiny mono row above the
  title on production detail: `RUN · BTK · СПБ · 2020–2024 ·
  ~80 PERFORMANCES`. Data-driven by a new `runs[]` array in
  frontmatter (start year, end year, performance count, theatre
  shortName). Hides when array is empty. Reads as bookers'
  metadata, not as boasting. Single row, mono caps, `--ink-faint`,
  hairline rule under.
  Files: `lib/content.ts`, `app/[locale]/productions/[slug]/page.tsx`,
  i18n `productionDetail.runOfShow` strings.

### Tier 2 — micro-typography polish

- [ ] **DA-7.6.E — Awards CUE-count tag** — XS.
  Each `CUE 2017` / `CUE 2020` heading on `/awards` gets a count
  suffix in mono: `CUE 2021 · 4 НАГРАДЫ` / `CUE 2021 · 4 AWARDS` /
  `CUE 2021 · 4 PREISE`. Pulls the cue system from "decoration" into
  "informative metadata" with one extra string per group. Tabular-nums
  required so single-digit counts don't shift the surrounding line.
  Files: `app/[locale]/awards/page.tsx`, i18n `awards.cueCount` plural
  rules per locale.

- [ ] **DA-7.6.F — Theatre slate LANGUAGE row** — XS (data-driven).
  Add an optional `language` field on production frontmatter (e.g.
  `silent`, `ru+en`, `de+ru bilingual`). When present, the right-rail
  theatre slate gets a `LANGUAGE` row between `COUNTRY` and
  `THEATRE`. Useful for international touring decisions; silent
  puppet shows are a meaningful subset. No row when field is null.
  Files: `lib/content.ts`, `components/TheatreSlate.tsx` (or wherever
  the slate lives), i18n strings.

- [ ] **DA-7.6.G — Typographic-fallback card year-anchor** — XS.
  No-poster cards (Q6 brutalist fallback) currently have title flush
  top-left and year flush below. When titles run long, the year
  drifts down inconsistently across the grid row. Pin the year-mark
  to the bottom of the card with `margin-top: auto` inside a flex
  column — title sticks top-left, year sticks bottom-left, regardless
  of title length. Pure CSS, no markup change.
  Files: `components/ProductionCard.module.css` only.

- [ ] **DA-7.6.H — DE chrome length audit** — XS.
  `INSZENIERTE IN` is 13 characters vs `STAGED IN` 9 vs `ГДЕ СТАВИЛ`
  10. At narrow desktop widths (1024–1100px) the §3.G.1 row label can
  push the city list onto a second wrap. Audit at 1024 / 1280 / 1440
  on `/de/about`; if it wraps, add a `text-wrap: balance` rule on the
  staging-row container or shorten the German label to `BÜHNEN IN`.
  Same audit for the folio top line in DE. Pure CSS or i18n string
  edit, ~30 minutes.

### Tier 3 — first-impression polish

- [ ] **DA-7.6.I — OG image chrome upgrade** — M.
  Curators share productions on Telegram and Slack; the OG card is
  often the first impression. Push `app/api/og/[slug]/route.ts` from
  baseline to programme-grammar: hairline rule top + bottom, mono
  caps section slug top-left (`PRODUCTION · 14 / 24` or just
  `PRODUCTION`), Lora-display title centred, mono meta line bottom-
  left (`2021 · 60 MIN · 6+ · KZ`), oxblood `cdn.boklanov.com` colophon
  bottom-right at `--ink-faint` opacity. Same paper-cream background
  as the site. Verify Cyrillic renders correctly via the satori font-
  loading path.
  Files: `app/api/og/[slug]/route.ts`.

- [ ] **DA-7.6.J — Editorial empty states** — S.
  Filter empty (`/productions` with no matches), search empty (Cmd-K
  no results), archive year with no entries — currently render a
  plain "Нет результатов / No matches" line. Push into editorial
  register: hairline rule top, Lora italic body line, mono ghost
  link below (`⟶ убрать один фильтр / clear one filter` for
  `/productions`; `⟶ показать недавние / show recent` for Cmd-K).
  Reuses tokens, no new components — just elevates a tone we already
  almost have.
  Files: `components/FilteredProductionsPanel.module.css`,
  `components/CommandPalette.tsx`, i18n strings.

### Sequencing notes for Phase 7.6

- All tasks are independent of each other and of Phase 8 — pick any
  order, ship in any combination. None blocks anything.
- Tier 1 has the highest editorial signal; Tier 2 is one-hour micro-
  polish; Tier 3 is shareable-first-impression work.
- DA-7.6.C and DA-7.6.D are **gated by Roman content**: notes per
  show + run counts. They ship when Roman fills the data via Obsidian
  (Phase 8.4 onboarding).
- Total Tier-1 effort: ~3 days. Tier-2: ~2 hours. Tier-3: ~1.5 days.
  All ten together fit a single quiet week post-launch.

---

## Phase 8 — Authoring handoff (Obsidian + R2)

> Locked 2026-05-02 in `.design/boklanov-rewrite/CONTENT_WORKFLOW.md`.
> **Source of truth: F (Obsidian + obsidian-git, vault = repo).**
> **Image hosting: R2** (`cdn.boklanov.com`).
> **`metadata.yml` overlay folded into MDX frontmatter** (Phase 8.3
> one-shot merge; overlay deprecated, single source of truth per field).
> **Editorial workflow:** trust-on-publish + `draft` branch.
> **Decap (C) deferred** as a later second admin surface — see Phase 9.
> Total ~2.5 days. Runs after Phase 7 deploy.

- [x] **8.1 — Vault layout + Properties schema** ✅ done `11bef4d` (2026-05-02):
  `.obsidian/app.json` (`useMarkdownLinks:true`, spellcheck ru+en, source view).
  `.obsidian/types.json` (year/featured/ageRating/durationMin/ticketsUrl/form/
  lineage/tour/tags typed). `.obsidian/community-plugins.json`
  (`["obsidian-git","mdx-as-md"]` — Roman installs manually).
  `.gitignore` updated (ignore workspace.json, cache, plugins/).
  `scripts/lint-mdx.ts` CI guard against `![[wikilink]]`.
  `npm run lint-mdx` script added.

- [x] **8.2 — R2 image migration** ✅ code done `8339141` (2026-05-02),
  **CDN activation pending** (boklanov.com not on Cloudflare):
  R2 bucket `boklanov-content` created (account `534e18f3…`, EEUR).
  `lib/cdn.ts`: `cdnUrl()` helper (prepends `NEXT_PUBLIC_CDN_BASE` or no-op).
  `scripts/upload-images.ts`: S3-compatible upload via `@aws-sdk/client-s3`;
  size-based skip, `--slug`/`--dry-run` flags; `npm run upload-images`.
  `ProductionCard` + production detail: all `poster.src` + gallery `src`
  wrapped in `cdnUrl()`. `next.config.js`: `remotePatterns` → cdn.boklanov.com.
  `.env.example`: `NEXT_PUBLIC_CDN_BASE` + `R2_*` documented.
  **cdn.boklanov.com custom domain SKIPPED** — boklanov.com DNS at Spaceship,
  not Cloudflare; R2 zone-link fails. Revisit after D4 + DNS migration.
  Images currently served from `public/` via Vercel (zero cost, sufficient).

- [x] **8.3 — Fold overlay + retire Notion sync** ✅ done (2026-05-02):
  `scripts/fold-overlay.ts` ran — all 24 `metadata.yml` files folded
  into `index.mdx` frontmatter (overlay-wins logic); files deleted.
  `lib/content.ts` simplified: `merge()` + `pick()` removed, replaced
  with lean `fromFm()` that reads frontmatter directly (no overlay step).
  `scripts/sync-from-notion.ts` → `scripts/_legacy/` with FROZEN header.
  `npm run sync` → `echo "sync retired — edit in Obsidian"`.
  `content/README.md` rewritten to point at `AUTHORING.ru.md`.
  Build clean (98/98 pages). Awards override verified correct for
  `cinderella` + `sugar-kid`. `notion-data/` already gitignored —
  no archive branch needed.

- [x] **8.4 — `content/AUTHORING.ru.md`** ✅ done (2026-05-02):
  Russian-language onboarding written covering: one-time install
  (desktop + mobile), open vault, edit Properties/prose, commit +
  push, draft branch workflow, add new productions, swap photos,
  troubleshooting (5 common failure modes), contact.

- [x] **8.5 — Cyrillic-only-Name orphan audit** ✅ audit log created
  (2026-05-02): `.design/boklanov-rewrite/orphan-audit-2026-05.md`
  lists the two orphan slugs (`sugar-kid`, `kasztanka`), the workflow
  for Roman to confirm titles in Obsidian, and the log table to fill
  on confirmation. Actual confirmation happens when Roman gets Obsidian
  access — the audit is one-shot, never repeated.

---

## Phase 9 — Decap CMS layer (deferred; activate on demand)

> **Not on the active roadmap.** Activation triggers (any one):
> Roman travels and finds Obsidian Mobile insufficient; a second
> contributor refuses to install Obsidian; browser-based copy-edits
> become friction. Plan in CONTENT_WORKFLOW.md §6B (~2 days when
> activated). Locks: `editorial_workflow: false`, `backend.branch:
> draft` from day one, no `_diagnostics.md`.

- [ ] **9.1 — Decap setup**: `public/admin/{index.html,config.yml}`,
  GitHub OAuth via free Vercel serverless function.
- [ ] **9.2 — Schema mapping**: collections mirror Phase 8.3
  flattened MDX frontmatter; Cyrillic field labels.
- [ ] **9.3 — Media library wired to R2**: S3-compatible endpoint
  → same R2 bucket Phase 8.2 created.
- [ ] **9.4 — Append "веб-редактор" section to AUTHORING.ru.md**.

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
