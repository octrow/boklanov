Full version (original): .design/boklanov-rewrite/archive/TASKS.md

# BUILD TASKS: BOKLANOV REWRITE

**CODEBASE CONTEXT**
Framework: Next.js App Router (v15.5.15). Legacy `pages/` and `react-notion-x` deleted.
Data Source: Local YAML data + sibling markdown prose via Obsidian (`content/productions/<slug>/index.yaml` + `body.{ru,en,de}.md`). *(2026-05-02 was MDX frontmatter at `content/productions/*.mdx`; split 2026-05-04.)* Notion sync retired. `metadata.yml`
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

### PHASE 7: DEPLOY CUTOVER (DEFERRED)

- [ ] **D3/D4: DNS Swap + R2 activation.** Deferred — site stays at `boklanov.vercel.app`.
  DNS: Spaceship.com → A `@` `76.76.21.21`, CNAME `www` `cname.vercel-dns.com`. Vercel: add `boklanov.com` + `www`.
  R2 CDN (`cdn.boklanov.com`) activates once `boklanov.com` moves to Cloudflare DNS.

### PHASE 7.6: EDITORIAL POLISH (DONE)

**TIER 1: PROGRAMME GRAMMAR** — `00c2501`

- [x] **DA-7.6.A** Marginalia 65ch+20ch grid ≥1280px on `/about` bio; inline italic below.
- [x] **DA-7.6.B** `@media print` — 18mm margins, palette override, header/CTA/rail hidden.
- [x] **DA-7.6.C** Director's note block (italic Lora + left rule + mono attribution), gated by `directorsNote.{ru,en}`.
- [x] **DA-7.6.D** Run-of-show row above title, gated by `runs[]`.

**TIER 2: MICRO-TYPOGRAPHY** — `3106d26`

- [x] **DA-7.6.E** CUE-count tag on `/awards`.
- [x] **DA-7.6.F** Theatre slate `LANGUAGE` row.
- [x] **DA-7.6.G** No-poster card year-anchor `margin-top: auto`.
- [x] **DA-7.6.H** DE chrome audited at 1024–1100px — no overflow.

**TIER 3: FIRST IMPRESSION**

- [x] **DA-7.6.I** OG image: mono slug + hairlines + Lora title centred + meta/colophon row. `0288258`
- [x] **DA-7.6.J** `EmptyState`: hairline + ERRATA label + italic Lora body + action slot. Filter, search, archive, awards, press. `e1920af`

### PHASE 9: DECAP CMS (DEFERRED)

**Trigger: Obsidian Mobile authoring failure.**

- [ ] **9.1:** Scaffold `public/admin/{index.html,config.yml}`. Configure Vercel GitHub OAuth.
- [ ] **9.2:** Map `config.yml` collections 1:1 to flattened MDX frontmatter schema. Implement Cyrillic field labels.
- [ ] **9.3:** Wire S3 media library config to `boklanov-content` R2 endpoint.
- [ ] **9.4:** Append Web Editor documentation to `AUTHORING.ru.md`. Require `backend.branch: draft`.
