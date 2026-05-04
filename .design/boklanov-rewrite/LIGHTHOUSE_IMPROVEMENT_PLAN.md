# Lighthouse improvement plan — boklanov.com

Status: **shipped 2026-05-04** (commits `d630514`, `ca3f6bc`). All four pillars hit **100/100/100/100** on the prod re-test (`archive/lighthouse_050426_3.josn`).

Baseline: `archive/lighthouse_050426.json` (run 2026-05-04, paper theme, mobile, LH 13.0.2). Score lift was **A11y 90 → 100, SEO 83 → 100, Perf 99 → 100**; Best Practices stayed at 100.

Verified Core Web Vitals (prod, home): FCP 0.4 s, LCP 0.6 s, TBT 0 ms, CLS 0, SI 0.7 s.

## Findings (raw)

| # | Audit | Score | Category | Estimated savings / impact |
|---|---|---|---|---|
| 1 | `document-title` | 0 | A11y / SEO | weight 7 (a11y) + 1 (seo) |
| 2 | `meta-description` | 0 | SEO | weight 1 |
| 3 | `heading-order` | 0 | A11y | weight 3 |
| 4 | `color-contrast` | 0 | A11y | weight 7 |
| 5 | `image-delivery-insight` | 0.5 | Perf | 529 KiB |
| 6 | `lcp-discovery-insight` | 0 | Perf | LCP — `fetchpriority=high` not set |
| 7 | `network-dependency-tree-insight` | 0 | Perf | longest chain 1200 ms (Lora-Italic-VF) |
| 8 | `render-blocking-insight` | 0.5 | Perf | 3 CSS files block render |
| 9 | `legacy-javascript-insight` | 0.5 | Perf | 20 KiB |
| 10 | `unminified-javascript` | 0.5 | Perf | 24 KiB (third-party) |
| 11 | `unused-javascript` | 0.5 | Perf | 200 KiB |
| 12 | `non-composited-animations` | 1 | Perf | 2 elements (informational) |
| 13 | `long-tasks` | 1 | Perf | 1 long task (informational) |

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

| Audit | Before | After |
|---|---|---|
| Performance | 99 | **100** |
| Accessibility | 90 | **100** |
| Best Practices | 100 | **100** |
| SEO | 83 | **100** |

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
