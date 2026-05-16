# Lighthouse improvement plan — boklanov.com

Status: **shipped 2026-05-04** (commits `d630514`, `ca3f6bc`). All four pillars hit **100/100/100/100** on the prod re-test (`archive/lighthouse_050426_3.josn`).

Baseline: `archive/lighthouse_050426.json` (run 2026-05-04, paper theme, mobile, LH 13.0.2). Score lift was **A11y 90 → 100, SEO 83 → 100, Perf 99 → 100**; Best Practices stayed at 100.

Verified Core Web Vitals (prod, home): FCP 0.4 s, LCP 0.6 s, TBT 0 ms, CLS 0, SI 0.7 s.

## Findings (raw)

| #   | Audit                             | Score | Category   | Estimated savings / impact             |
| --- | --------------------------------- | ----- | ---------- | -------------------------------------- |
| 1   | `document-title`                  | 0     | A11y / SEO | weight 7 (a11y) + 1 (seo)              |
| 2   | `meta-description`                | 0     | SEO        | weight 1                               |
| 3   | `heading-order`                   | 0     | A11y       | weight 3                               |
| 4   | `color-contrast`                  | 0     | A11y       | weight 7                               |
| 5   | `image-delivery-insight`          | 0.5   | Perf       | 529 KiB                                |
| 6   | `lcp-discovery-insight`           | 0     | Perf       | LCP — `fetchpriority=high` not set     |
| 7   | `network-dependency-tree-insight` | 0     | Perf       | longest chain 1200 ms (Lora-Italic-VF) |
| 8   | `render-blocking-insight`         | 0.5   | Perf       | 3 CSS files block render               |
| 9   | `legacy-javascript-insight`       | 0.5   | Perf       | 20 KiB                                 |
| 10  | `unminified-javascript`           | 0.5   | Perf       | 24 KiB (third-party)                   |
| 11  | `unused-javascript`               | 0.5   | Perf       | 200 KiB                                |
| 12  | `non-composited-animations`       | 1     | Perf       | 2 elements (informational)             |
| 13  | `long-tasks`                      | 1     | Perf       | 1 long task (informational)            |

Run was against the **paper** theme (`<html data-theme="paper">`) — contrast and font issues are theme-conditional.

## Fixes ordered by impact / risk

> All shipped fixes landed in commits `d630514` (initial pass) and `ca3f6bc` (paper contrast re-fix after a linter reverted globals.css + production-detail meta-description fallback). Re-test JSON: `archive/lighthouse_050426_3.josn` (4×100).

### 1. Add `<title>` and meta description on the home page (A11y +7, SEO +2) — shipped `d630514`

**Root cause:** `app/[locale]/layout.tsx` and `app/[locale]/page.tsx` export no `metadata`. Other routes (`about`, `productions/[slug]`) do — root + home don't.

**Fix:**

- Add `generateMetadata` to `app/[locale]/layout.tsx` returning a localized template (`title.template`, `title.default`, `description`, `openGraph`, `alternates.canonical`/`languages`) keyed off `locale`. New translation keys `meta.title.default`, `meta.title.template`, `meta.description` in `messages/en.json` + `messages/ru.json`.
- Optional: route-level `generateMetadata` on `app/[locale]/page.tsx` for a more specific home-page title.

**Risk:** zero — purely additive. Confirm OG tags don't conflict with anything in `Analytics`.

**Shipped:** `generateMetadata` added in `app/[locale]/layout.tsx`; `meta.{siteName,siteDescription,homeTitle,homeDescription}` keys added to `messages/{en,ru,de}.json`. `template: '%s'` keeps existing route-level titles (about, productions/[slug]) absolute. Production-detail `description` now falls back to `"{title} · {theatre} · {year}"` when synopsis is empty (`ca3f6bc`).

### 2. Fix heading order on home grid (A11y +3) — shipped `d630514`

**Root cause:** `SiteHero` emits `<h1>` (sr-only). Section labels are `<p>` (`styles.sectionLabel`). `ProductionCard.tsx:87` jumps straight to `<h3>` → axe flags h1→h3.

**Fix (lowest-blast option):** change `ProductionCard.tsx:87` `<h3>` → `<h2>`. CSS class `.titleRu` stays the same — visual unchanged. Same change applies on `productions/[slug]` detail (verify tree first).

**Risk:** low — `ProductionCard.module.css` targets the class, not the tag. Safe.

**Shipped:** `ProductionCard.tsx` `<h3>` → `<h2>`. Detail page `TheatreSlate as='h1'` and other sections already use `<h2>` — order verified clean.

### 3. Bump paper-theme `--ink-faint` for AA contrast (A11y +7) — shipped `d630514` + `ca3f6bc`

**Root cause:** `app/globals.css:433` `--ink-faint: #8F8B83` on `--paper: #F2F0EA` ≈ 2.8:1. Used in `SiteFooter.copyright` (the failing element) and elsewhere.

**Fix:** darken to `#6E6B64` (≈ 4.6:1 on `#F2F0EA`). Gorky theme value (`#7A7771` on `#080706` ≈ 5.0:1) is already AA — leave it.

**Risk:** low but design-visible. Spot-check `Marginalia`, `CreditLine`, footer colophon, `meta` chips on paper before committing. Roman picked the value intentionally — user may want to review the new shade.

**Shipped:** paper `--ink-faint` `#8F8B83` → `#6E6B64`. Second-pass detail-page audit (`lighthouse_050426_2.json`) flagged `TheatreSlate.role` text (`--ink-marginalia` α 0.55, computes to `#757470` on paper, 4.1:1) — bumped α 0.55 → 0.7 in `ca3f6bc`. Note: an auto-formatter reverted the first `--ink-faint` edit between commits; re-applied + verified in prod re-test.

### 4. Tighten image `sizes` on production cards (Perf — 529 KiB savings) — shipped `d630514`

**Root cause:** `ProductionCard.tsx:70` uses `sizes='(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'`. With `--max-width-page` capped, displayed widths at 1693px viewport are ~317px (small cells) and ~405px (large hero cell), but Next picks the 640w srcset entry. 33vw of 1693 = 558px → forces 640w.

**Fix:** add an optional `sizes` prop to `ProductionCard` so `FeaturedStrip` vs `ProductionGrid` each declare actual widths.

- featured small cells: `(min-width:1024px) 320px, (min-width:768px) 50vw, 100vw`
- featured hero cell: `(min-width:1024px) 420px, (min-width:768px) 50vw, 100vw`
- grid: `(min-width:1024px) 320px, (min-width:768px) 50vw, 100vw`

**Risk:** low. Verify by reloading at 1024 / 1280 / 1693 / 1920 viewports — wrong sizes only causes blurry images, never breaks.

**Shipped:** `ProductionCard` accepts a `sizes?: string` prop (default `(min-width:1024px) 320px, (min-width:768px) 50vw, 100vw`). `FeaturedStrip` now passes per-cell sizes (`FEATURED_SIZES` array) — hero 600px, mediums 420px, smalls 320px. `ProductionGrid` keeps the 320px default. Re-test residual: 183 KiB image savings still on the table (informational, doesn't move the score).

### 5. Confirm `fetchpriority="high"` actually lands on the LCP card (Perf — LCP) — shipped `d630514`

**Root cause:** Lighthouse `lcp-discovery-insight` reports `priorityHinted: false` even though `priority` is wired through `FeaturedStrip` → `ProductionCard` → `<Image>`.

**Fix:** pass `fetchPriority="high"` explicitly on the Image when `priority` is true. Next 15 accepts the prop and propagates it to the rendered `<img>`.

**Risk:** none. Adds one attribute.

**Shipped:** `<Image fetchPriority={priority ? 'high' : undefined}>` in `ProductionCard`. Re-test confirms `lcp-discovery-insight` now passes.

### 6. Drop legacy JS transpile targets (Perf — 20 KiB) — shipped `d630514`

**Root cause:** `legacy-javascript-insight` reports 20 KB of polyfills. Likely a too-broad `browserslist`.

**Fix:** add to `package.json`:

```json
"browserslist": [
  "chrome >=110",
  "edge >=110",
  "firefox >=110",
  "safari >=15.6",
  "ios_saf >=15.6"
]
```

**Risk:** low if you stay above ES2022 baseline. Don't drop iOS 15.6 (still common).

**Shipped:** `browserslist` field added to `package.json`. Re-test residual: 20 KiB legacy JS still flagged (informational); needs a deeper audit to find which dep ships transpiled output despite the new targets.

### 7. (Deferred) Lazy-load client-only chrome to cut unused JS (Perf — 200 KiB unused)

**Root cause:** `CommandPaletteProvider`, lightboxes, etc. are in the layout bundle. Most are not needed for first paint or LCP.

**Fix:** wrap in `next/dynamic` with `ssr: false` where possible. Defer command palette mount until first `cmd+k` or click on a trigger. Confirm via `ANALYZE=true bun run build`.

**Risk:** medium. CommandPalette key listener must still mount eagerly. Test palette open/close both locales.

**Status:** deferred — needs careful audit of palette wiring; separate pass after the safe wins land.

### 8. (Deferred) Remove the `Lora-Italic-VF.woff2` render-blocking chain (Perf — LCP)

**Root cause:** longest critical chain (1200 ms) is `document → CSS → Lora-Italic-VF.woff2 (92 KB)`. Layout preloads `Lora-VF.woff2` but italic VF is what blocks.

**Fix options:**

- (a) Preload `Lora-Italic-VF.woff2` in `LocaleLayout` head — only if italic Lora is actually above the fold.
- (b) Use `font-display: swap` and let italic lazy-load.
- (c) Drop the `Lora-VF.woff2` preload too if not used above the fold.

**Status:** deferred — needs visual audit of which Lora cuts (italic vs roman) actually paint above the fold on each page before changing preloads.

### 9. (Skip) Minify JS — 24 KiB

Likely third-party (Vercel Analytics). Not in our control.

### 10. (Skip) Long task + non-composited animations

Both already score 1 (informational). Will be revisited if perf drops below 99.

## Verification (run 2026-05-04, prod, home `/`, mobile, LH 13.0.2)

JSON: `archive/lighthouse_050426_3.josn`. Re-test scores **100 / 100 / 100 / 100**. Core Web Vitals: FCP 0.4 s, LCP 0.6 s, TBT 0 ms, CLS 0, SI 0.7 s.

| Audit          | Before | After   |
| -------------- | ------ | ------- |
| Performance    | 99     | **100** |
| Accessibility  | 90     | **100** |
| Best Practices | 100    | **100** |
| SEO            | 83     | **100** |

Localhost re-test on `/productions/bury-me-behind-the-baseboard` (`archive/lighthouse_050426_2.json`) showed 65 / 93 / 73 / 92, but the Perf and BP drops were dev-mode artefacts (HMR bundle, no minify, no prod headers for CSP/HSTS/COOP, `localhost` cookies). Real signal from that run was the second contrast offender (`TheatreSlate.role` on paper) — fixed in `ca3f6bc`.

## Residual (informational, do not affect score)

- `image-delivery` 183 KiB still on the table — minor `sizes`/DPR refinement.
- `unminified-javascript` 24 KiB + `unused-javascript` 212 KiB — Vercel Analytics + RUM scripts; out of our control.
- `legacy-javascript-insight` 20 KiB — needs a per-dep audit despite tightened `browserslist`.
- `network-dependency-tree-insight` longest chain still surfaces (not score-blocking now).
- `render-blocking-insight` informational; CSS chain unchanged.

## Deferred follow-ups (do not need; revisit only if a future run drops below 100)

### Lazy-load client-only chrome (Perf — 200 KiB unused)

**Root cause:** `CommandPaletteProvider`, lightboxes, etc. are in the layout bundle. Most are not needed for first paint or LCP.

**Fix:** wrap in `next/dynamic` with `ssr: false` where possible. Defer command palette mount until first `cmd+k` or click on a trigger. Confirm via `ANALYZE=true bun run build`.

**Risk:** medium. CommandPalette key listener must still mount eagerly. Test palette open/close both locales.

### Remove the `Lora-Italic-VF.woff2` render-blocking chain (Perf — LCP)

**Root cause:** longest critical chain (1200 ms in baseline) was `document → CSS → Lora-Italic-VF.woff2 (92 KB)`. Layout preloads `Lora-VF.woff2` but italic VF was what blocked.

**Fix options:**

- (a) Preload `Lora-Italic-VF.woff2` in `LocaleLayout` head — only if italic Lora is actually above the fold.
- (b) Use `font-display: swap` and let italic lazy-load.
- (c) Drop the `Lora-VF.woff2` preload too if not used above the fold.

**Status:** deferred — needs visual audit per page. LCP came in at 0.6 s without this, so it isn't on the critical path on home. If the production-detail page LCP drifts, revisit.

### Skipped (not in our control or already informational)

- `unminified-javascript` 24 KiB → third-party (Vercel Analytics).
- `non-composited-animations` (2) and `long-tasks` (1) → already score 1.

## What NOT to touch

- The Best Practices section is at 100 — don't fiddle with CSP/HSTS/COOP unless something else regresses them.
- Don't change the `<h1>` strategy in `SiteHero` — sr-only h1 is intentional for the gradient wordmark.
- Don't strip `priority` from any ProductionCard — it's the right call; just ensure `fetchPriority="high"` lands.
- Don't broaden `next.config.js images.remotePatterns` while in here.

## Re-test protocol (for future regressions)

1. `bun run build` locally — no type errors.
2. Smoke `/en` and `/ru` (toggle theme on each).
3. Re-run Lighthouse against the deployed Vercel preview, **both themes** if possible (paper-theme reveals contrast issues that gorky hides).
4. Save the new JSON to `.design/boklanov-rewrite/archive/lighthouse_<date>.json` for diffing.
5. Localhost dev-mode runs are NOT comparable — Perf/BP drift ~30 pts from artefacts.

---

# Round 2 — `feature/payloadcms` (2026-05-17)

Different branch + different CMS than the 2026-05-04 round above. Round 1 shipped on `main` (Keystatic). This round targets `feature/payloadcms`, which has its own pipeline (Payload Local API + pre-baked AVIF variants served direct from R2). Goal: 98-100 across all 5 URLs × {mobile, desktop} on the Vercel preview.

## Baseline (scout pass, single run each, preview)

Captured 2026-05-17 0353 (`.design/boklanov-rewrite/archive/lh_scout_17052026_0353_*.json`).

| page      | ff      | Perf   | A11y | BP  | SEO    | FCP    | LCP    | TBT | CLS       |
| --------- | ------- | ------ | ---- | --- | ------ | ------ | ------ | --- | --------- |
| root      | desktop | 93     | 100  | 100 | 100    | 1.16 s | 1.42 s | 0   | 0         |
| root      | mobile  | 87     | 100  | 100 | 100    | 1.91 s | 3.68 s | 53  | 0         |
| ru        | desktop | 94     | 100  | 100 | 100    | 1.02 s | 1.40 s | 0   | 0         |
| ru        | mobile  | 88     | 100  | 100 | 100    | 2.14 s | 3.60 s | 54  | 0         |
| de        | desktop | 95     | 100  | 100 | 100    | 0.98 s | 1.27 s | 0   | 0         |
| de        | mobile  | 90     | 100  | 100 | 100    | 2.09 s | 3.33 s | 36  | 0         |
| ru_about  | desktop | 95     | 100  | 100 | **92** | 1.01 s | 1.17 s | 0   | 0         |
| ru_about  | mobile  | 92     | 100  | 100 | **92** | 2.57 s | 2.57 s | 44  | 0         |
| ru_detail | desktop | 91     | 100  | 100 | 100    | 1.31 s | 1.47 s | 0   | 0         |
| ru_detail | mobile  | **62** | 100  | 100 | 100    | 3.18 s | 3.63 s | 19  | **0.540** |

Two non-variance hard fails plus a uniform Perf shortfall on mobile.

## Structural ceiling — Vercel preview rewrite-cache 307 tax

Every page reports a `redirects` LCP "opportunity" of 400-1300 ms and a `document-latency-insight` of 450-570 ms. Per `LIGHTHOUSE_RUNBOOK.md` ("Vercel preview gotchas"), this is the platform's `x-vercel-enable-rewrite-caching` handshake: a one-time 307 on cold RSC-keyed navigations that headless Lighthouse hits but real users don't. Confirmed by `network-requests` — first two items are `/ru` → 307 → `/ru` → 200, same URL.

**Real-user-equivalent LCP** ≈ measured − 1.0 s on mobile, − 0.4 s on desktop. The tax is structural: `380f0f0` (disable locale detection) was tried for this and reverted in `d7b30be` with no measurable improvement.

Implication for the 98-100 goal: on the preview as-measured, hitting Perf ≥ 98 requires pushing real LCP low enough that even with the tax we stay under the score curve (mobile LCP ≤ 2.5 s on the report → real ≤ 1.5 s). Post-merge prod will be ~1 s better on mobile, ~0.4 s on desktop — 98-100 should come more naturally there.

## Findings & fixes (this round)

### F1. `ru_detail` mobile P=62, CLS=0.54 — detail-page poster lacks reserved space

**Root cause:** `app/[locale]/productions/[slug]/page.tsx` poster `<img>` (variants branch — the path actually hit on the preview) renders with `width: auto, height: auto, max-height: 65vh` and no `width`/`height` attrs. Browser reserves zero vertical space until image loads, then pushes a 6,283 px layout div downward — Lighthouse measured shift score 0.537. `layout-shifts` audit attributed it to "Media element lacking an explicit size."

**Fix:** in `app/[locale]/productions/[slug]/page.module.css`, `.cover img` declares `aspect-ratio: var(--cover-aspect, 5 / 7)`. Default 5/7 covers the typical theatrical-poster portrait. In `page.tsx`, when `production.poster.width/height` are known (LQIP-derived), they're written to `--cover-aspect` on the `<figure>` and as `width`/`height` attrs on the `<img>` — overrides the default with exact dims for zero post-load adjustment.

**Risk:** low. CSS-only impact when dims are missing; visible only as a small post-load adjustment for off-aspect posters.

### F2. `ru_about` SEO=92 — missing meta description

**Root cause:** `app/[locale]/about/page.tsx` `generateMetadata` sets `description: paragraphs[0] ?? undefined`. On the preview, the RU bio's first paragraph resolves empty, so Next emits no `<meta name="description">` and Lighthouse's `meta-description` audit fails (weight 1 → 92). Confirmed by `curl /ru/about | grep description`.

**Fix:** fall back to the existing localized `meta.homeDescription` i18n key when `paragraphs[0]` is empty. Home pages already use this key and score SEO 100.

**Risk:** zero — purely additive, fires only when the bio body is empty.

### F3. Mobile Perf 87-92 — srcset picking 828 w when 720 w fits

**Root cause:** images inside `.page` (which has `padding: 0 var(--gutter-mobile)`, `--gutter-mobile: 20px`) actually render at `viewport − 40 px ≈ 90.3 vw` on a 412-px Moto G Power viewport — not the `100vw` their `sizes` attribute declared. The picker rounded up: 412 × 1.75 DPR = 721 physical px → matched `w828` (~102 KiB) instead of `w720` (~78 KiB). Same 30 % bloat across every full-width image. Mirrors `408904c` (detail-page poster fix).

**Fix:** every `100vw` mobile sizes entry → `90vw`:

- `components/FeaturedStrip.tsx` — all 6 `FEATURED_SIZES` (hero is the LCP; mediums + smalls stack 1-col on mobile, all render 90 vw).
- `app/[locale]/page.tsx` — home preload `imageSizes` (kept in sync with `FEATURED_SIZES[0]`).
- `components/ProductionCard.tsx` — `DEFAULT_SIZES` (below-fold director grid on home + listings).
- `components/SpecimenPlate.tsx` — default `sizes` (about-page photos).
- `app/[locale]/about/page.tsx` — portrait `Image sizes` (LCP element on `/about`).

`GalleryLightbox.tsx` thumbs (`50vw` mobile) left untouched — they're below-fold lazy; bumping their byte budget would hurt Perf, not help.

**Risk:** zero on Perf, low on quality — only changes which srcset variant the browser picks. Every Image consumer renders inside `.page` or `.section`, both of which inherit page gutters; verified.

## Re-measure protocol for this round

1. Commit + push to `feature/payloadcms` — triggers Vercel preview rebuild (~2 min).
2. Warm preview with two `curl` hits per URL.
3. Scout matrix (5 URLs × {mobile, desktop} = 10 cells, single-run) — confirms which cells crossed 98.
4. Median-of-3 on any cell still below 98 — rules out Fluid Compute cold-start variance.
5. Append the post-fix score table here when verified green.

## First rescout (post-F1/F2/F3, commit `14fd732`)

Captured 2026-05-17 0419 (`.design/boklanov-rewrite/archive/lh_rescout_17052026_0419_*.json`). **Single-shot scout was dominated by cold-Function spin-ups** — sequential 10-cell run takes ~6 min, Fluid Compute spun down between URLs, so each new URL hit a cold start with FCP ≈ LCP ≈ 4-26 s. Per the runbook ("Single run shows perf 50-60 in an otherwise 80-90 range"), single-shot data is not actionable here. Two real signals nevertheless surfaced through the noise:

**F1 confirmed:** `ru_detail` mobile CLS **0.540 → 0.002** ✓ (poster now reserves space).

**F2 confirmed:** `ru_about` SEO **92 → 100** on both form factors ✓ (`<meta name="description">` ships via the i18n fallback).

**F3 not verifiable** from this scout — LCP was dominated by cold-start TTFB, not image fetch.

### New issues uncovered by the rescout

**F5 (BP regression on `ru_detail` desktop, 100 → 96):** `image-aspect-ratio` audit fires on `poster.720.avif`. Root cause: F1's CSS `aspect-ratio: var(--cover-aspect, 5 / 7)` default forces 0.7143 aspect on posters whose LQIP dims aren't set. Natural aspect for `bury-me-behind-the-baseboard/poster.720.avif` is 720/1019 = 0.7066 — small diff but Lighthouse flags any rendered-vs-natural mismatch.

**F6 (SEO regression on `ru_detail` desktop, 100 → 92):** `robots-txt` audit reports "robots.txt is not valid." `app/robots.ts` emits `host: BASE`. `host:` is a Yandex extension, not part of the robots.txt RFC; Lighthouse fails the audit when it's present. (Note: this audit was inconsistent across cells — flagged `ru_detail desktop` in the rescout but not other pages. Fix it once for correctness regardless of audit consistency.)

## Findings & fixes — second wave (F5 + F6)

### F5. Replace CSS aspect-ratio default with width/height-attr hint

**Root cause:** see above.

**Fix:** drop `aspect-ratio` from `.cover img` CSS. In `page.tsx`, pass `width`/`height` attrs on the `<img>` always: actual `production.poster.width/height` when LQIP-derived, else fall back to `720 × 1019` (typical theatrical-poster portrait). Browsers use `width`/`height` attrs as a pre-load aspect hint only — once the real image loads, the natural aspect takes over, so there's no rendered-vs-natural distortion. CLS reservation is preserved by the pre-load aspect hint.

**Risk:** very low. Posters whose natural aspect differs from `720 × 1019` get a tiny post-load adjustment (a few px); CLS stays under 0.02 across realistic poster aspects.

### F6. Drop `host:` from `app/robots.ts`

**Root cause:** see above.

**Fix:** remove the `host: BASE` line from the `robots()` export.

**Risk:** zero. Yandex now reads canonical tags / redirects instead of `host:`; site has neither audience nor crawl dependency on the directive.

## First median-of-3 attempt (2026-05-17 0425) — cold-start swamps median

Captured `lh_med3_17052026_0425_*.json`. Pre-warmed with 3 parallel curl rounds; ran median-of-3 sequentially per cell. **Result: every cell's three runs showed 1-2 cold-Function outliers and only 1 truly warm run.** Median picks the middle of three — when 2/3 are cold-starts, the median IS a cold-start. So the median table looked catastrophic (Perf 55-82) even though the per-run breakdown told a different story:

| cell      | per-run Perf scores | best of 3      |
| --------- | ------------------- | -------------- | ------ |
| root      | desktop             | `[55, 82, 95]` | **95** |
| root      | mobile              | `[82, 85, 55]` | 85     |
| ru        | desktop             | `[62, 55, 56]` | 62     |
| ru        | mobile              | `[67, 87, 55]` | 87     |
| de        | desktop             | `[57, 56, 91]` | 91     |
| de        | mobile              | `[55, 58, 80]` | 80     |
| ru_about  | desktop             | `[55, 85, 55]` | 85     |
| ru_about  | mobile              | `[58, 89, 60]` | 89     |
| ru_detail | desktop             | `[55, 56, 92]` | 92     |
| ru_detail | mobile              | `[50, 75, 57]` | 75     |

**Diagnosis:** the Vercel preview is the only traffic source for this deployment; Fluid Compute spins down idle instances between Lighthouse runs (each ~30-60 s) — the 2-curl pre-warm doesn't survive. **The runbook's median-of-3 advice assumes the function stays warm across the 3 runs**; with no organic traffic it doesn't.

### Wins confirmed despite the cold-start noise

- **F1 confirmed:** CLS 0.000-0.002 across every cell (was 0.540 on `ru_detail` mobile, baseline).
- **F2 confirmed:** SEO 100 on every cell (was 92 on `ru_about` baseline).
- **F5 still visible:** `ru_detail` BP 96 (the F5 fix is local-only, not yet deployed).
- **F3 (90 vw):** can't read through cold-start noise — verifying requires warm functions.

## Revised re-measure protocol — keep-alive ping loop

The runbook should be amended (see deferred items) to recommend running a **continuous keep-alive curl loop in parallel** with Lighthouse audits on the preview, so Fluid Compute doesn't spin down between runs. Pattern:

```bash
# Background pinger: hit a representative URL every 3-5 s while audits run.
PREVIEW=...
( while :; do curl -s -o /dev/null "$PREVIEW/ru"; sleep 4; done ) &
PING_PID=$!
# ... run all 30 (or N) Lighthouse audits ...
kill "$PING_PID"
```

This keeps a warm instance pinned to the deployment for the whole audit window. Without it, sequential audits on a low-traffic preview measure cold-start behaviour, not application performance.

## Deferred / out of scope this round

- **Font preload trimming.** Layout preloads three VFs per locale (~270 KiB total) including `Lora-Italic-VF.woff2` (90 KiB) which appears in every page's top-5 transfers. Worth investigating whether above-fold paint actually needs it. TBT is already 0-53 ms across the board, so not urgent. Separate pass.
- **Variant dimensions metadata.** F1 falls back to 5/7 when LQIP dims are missing (most preview content). Proper fix: store actual W/H per variant in `bake-image-variants` output. F1's default is close enough to drop CLS to ~0.
- **Gallery thumb sizing.** `50 vw` mobile mis-targets the 1-col mobile rendering (~90 vw), causing minor thumb upscaling. Doesn't affect Perf (lazy, below-fold). Quality-only fix; revisit only if visible.
