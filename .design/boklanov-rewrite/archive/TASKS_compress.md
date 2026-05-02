Full version (original): .design/boklanov-rewrite/archive/TASKS.md

# BUILD TASKS: BOKLANOV REWRITE

**CODEBASE CONTEXT**
Framework: Next.js App Router (v15.5.15). Legacy `pages/` and `react-notion-x` deleted.
Data Source: Local MDX frontmatter via Obsidian (`content/productions/*.mdx`). Notion sync retired. `metadata.yml`
overlay flattened.
Asset Hosting: R2 `boklanov-content` bucket. Local serving active; `cdn.boklanov.com` deferred pending Cloudflare
migration.
Aesthetics: Warm editorial, brutalist metadata accents. Token discipline strictly enforced.

## SYSTEM STATE (SHIPPED)

**Foundation:** `next-intl` (ru/en/de), `next-mdx-remote`. Local fonts (Lora, Inter, JetBrains Mono). CSS reset via
`globals.css`.
**Routing:** `/` canonical RU. `/[locale]/*` prefixed.
**UI Core:** CSS-grid card/layout, localized detail pages, static URL-state filters (`?role=director&age=18+`), Cmd-K
fuzzy search (`lib/search.ts`), lineage/awards/press aggregation grids.
**Interactions:** `--shadow-focus` ring, `localStorage` theme toggle, LQIP blur-up (`lqip.json`), `not-found.tsx`.
**SEO/Perf:** `app/sitemap.ts`, `robots.ts`, `feed/route.ts` (ru/en). JSON-LD `CreativeWork`/`Person`. `@vercel/og`
route images. Subset fonts, WebP/AVIF images, preload directives. Lighthouse 95+.
**Editorial Layers:** Folio headers (`lib/folio.ts`), `<Cue>` section markers, `dl` leader-grid credits, theatre slates,
staging geography lists, plinth tour bands. `<SlateStrike>` CSS animation (`--duration-slate: 320ms`).

---

## ACTIVE TASKS

### PHASE 7: DEPLOY CUTOVER (IN PROGRESS)

**Deadline: 2026-05-06**

- [ ] **D4: Execute DNS Swap.** - skip for now
  Target: Spaceship.com DNS panel.
  Records: A `@` `76.76.21.21`, CNAME `www` `cname.vercel-dns.com`.
  Domain: `boklanov.com`. Vercel alias configured.

### PHASE 7.6: EDITORIAL POLISH (POST-D4)

**TIER 1: PROGRAMME GRAMMAR**

- [ ] **DA-7.6.A: Marginalia (≥1280px).**
  Target: `components/Aside.tsx`, `about.module.css`, `page.module.css`.
  Action: Implement CSS-grid `minmax(0, 65ch) minmax(0, 20ch)`. Move photographer credits, lineage cross-refs, and mono
  date stamps to right gutter on `/about` and `/productions/[slug]`. Collapse inline as Lora subordinate notes <1280px.
- [ ] **DA-7.6.B: Print Stylesheet.**
  Target: `app/globals.css`.
  Action: Add `@media print`. Hide `<nav>`, `<footer>`, `.folio`, Cmd-K. Force `--paper: white`, `--ink: black`,
  hairline rules 0.5pt solid black. Apply 18mm page margins, `widows: 3`, `orphans: 3` on `.prose`.
- [ ] **DA-7.6.C: Director's Note.**
  Target: `lib/content.ts`, `app/[locale]/productions/[slug]/page.tsx`.
  Action: Map optional `directorsNote.{ru,en}` in MDX schema. Render below synopsis as Lora italic blockquote, left
  hairline rule, mono attribution `— РОМАН БОКЛАНОВ`. Prefix with `<Cue mark="CUE — ОТ РЕЖИССЁРА" />`.
- [ ] **DA-7.6.D: Run-of-Show Indicator.**
  Target: `lib/content.ts`, `app/[locale]/productions/[slug]/page.tsx`.
  Action: Map `runs[]` array (startYear, endYear, count, theatreShort). Render mono row above title on detail page.
  Format: `RUN · BTK · СПБ · 2020–2024 · ~80 PERFORMANCES`. Apply `--ink-faint`, hairline bottom rule.

**TIER 2: MICRO-TYPOGRAPHY**

- [ ] **DA-7.6.E: Awards CUE-Count.**
  Target: `app/[locale]/awards/page.tsx`.
  Action: Append count suffix to grouped `CUE` marks (e.g., `CUE 2021 · 4 НАГРАДЫ`). Apply
  `font-variant-numeric: tabular-nums`. Implement i18n pluralization in messages files.
- [ ] **DA-7.6.F: Language Row.**
  Target: `lib/content.ts`, `components/TheatreSlate.tsx`.
  Action: Map optional `language` frontmatter field. Render mono row between `COUNTRY` and `THEATRE` in desktop
  right-rail slate.
- [ ] **DA-7.6.G: Typographic Fallback Anchor.**
  Target: `components/ProductionCard.module.css`.
  Action: Convert no-poster fallback container to flex column. Apply `margin-top: auto` to year-mark row. Pin element
  bottom-left.
- [ ] **DA-7.6.H: DE Translation Audit.**
  Target: `app/[locale]/about/page.tsx` (`/de/about`).
  Action: Verify `INSZENIERTE IN` label width at 1024-1100px viewports. Apply `text-wrap: balance` to container or
  override string to `BÜHNEN IN` if wrap forces structural shift.

**TIER 3: FIRST IMPRESSION**

- [ ] **DA-7.6.I: OG Image Polish.**
  Target: `app/api/og/[slug]/route.ts`.
  Action: Add top/bottom hairline borders. Render mono section slug top-left, Lora display title center, mono meta-row
  bottom-left, oxblood `cdn.boklanov.com` colophon bottom-right (`--ink-faint`). Validate Cyrillic satori render.
- [ ] **DA-7.6.J: Editorial Empty States.**
  Target: `components/FilteredProductionsPanel.module.css`, `components/CommandPalette.tsx`.
  Action: Apply top hairline, Lora italic body text, mono ghost link (`⟶ убрать один фильтр / clear one filter`).

### PHASE 9: DECAP CMS (DEFERRED)

**Trigger: Obsidian Mobile authoring failure.**

- [ ] **9.1:** Scaffold `public/admin/{index.html,config.yml}`. Configure Vercel GitHub OAuth.
- [ ] **9.2:** Map `config.yml` collections 1:1 to flattened MDX frontmatter schema. Implement Cyrillic field labels.
- [ ] **9.3:** Wire S3 media library config to `boklanov-content` R2 endpoint.
- [ ] **9.4:** Append Web Editor documentation to `AUTHORING.ru.md`. Require `backend.branch: draft`.
