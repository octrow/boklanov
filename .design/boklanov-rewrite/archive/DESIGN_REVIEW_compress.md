Full version (original): .design/boklanov-rewrite/archive/DESIGN_REVIEW.md
STATUS: R1/R2 CLOSED (2026-05-02). Verified `boklanov.vercel.app`.
BRANCH: `rewrite/v2` HEAD: `6ddb466`.
SHIPPED: `73620e6` `871f287` `09d5005` `c7a1b50` `0bebf3c` `7c26402`.
BACKLOG: Phase 7.6 (10 polish tasks, schedule: post-D4 cutover).

MUST FIX

- Lift desktop sticky CTA to right rail. File: `app/[locale]/productions/[slug]/page.module.css:348-365`. Remove CTA
  from `.column`. Create sibling CSS grid `[content 720px] [rail 1fr]`. Apply `position: sticky; top: var(--space-7);`
  anchored to title block top. Maintain mobile `position: fixed; bottom`.
- Fix cover credit visual collision. Add `padding-top` or top rule to `.titleBlock` when `production.poster.credit` is
  null to match explicit credit spacing.

SHOULD FIX

- Populate desktop right rail. Move meta chips (year, duration, ageRating, countryCode) from prose column to vertical
  left-aligned stack above sticky CTA. File: `app/[locale]/productions/[slug]/page.tsx:240-258`.
- Differentiate `/productions` filter groups. Add mono-caps group labels (`РОЛЬ`, `ФОРМА`, `ВОЗРАСТ`, `СТРАНА`) above
  chip clusters. Use `--font-size-chip` and `--ink-mute`. Reference `CommandPalette.module.css .groupLabel`.
- Strip native Chromium search reset icon. Apply
  `input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; display: none }` in
  `components/CommandPalette.module.css` or `globals.css`.
- Resolve LQIP `next/image` dev race condition. Verify priority preload `<link rel="preload" as="image">` resolution on
  `next build && next start`. Audit AVIF/WebP negotiation in `next.config.js` if blur persists.
- Fix `ThemeToggle` ambiguity. Replace `●`/`○` glyphs with 14x14 `currentColor` hollow inline-SVG sun/moon in
  `components/ThemeToggle.tsx`.
- Block LQIP render on typographic fallbacks. Gate `coverStyle` assignment strictly on `poster.src && poster.lqip` in
  `components/ProductionCard.tsx:68-71`.
- Monitor layout hydration warning. Triggered by `data-theme` script + external browser extensions. Ensure suppressed in
  production build.

COULD IMPROVE (V2 POLISH)

- Implement masonry production gallery. Update `app/[locale]/productions/[slug]/page.module.css:208-217` from
  `grid-template-columns: repeat(2, 1fr)` to CSS columns or `grid-auto-flow: dense`.
- Normalize chip units. Change source `100 MIN` to `100 min`. Rely on global chip CSS `text-transform: uppercase`.
- Fix Press card link inheritance. Override global `a { text-decoration-thickness: 1px }` affecting mono italic
  reference in `app/[locale]/press/page.module.css`.
- Enforce header token discipline. Replace `letter-spacing: -0.015em` with `var(--letter-spacing-tight)` in
  `SiteHeader.module.css:40`.

VALIDATED ARCHITECTURE & DECISIONS

- Cut I5 (Signature Gesture). Mark `[~]` (declined) in `TASKS.md`. Rationale: Prevents SaaS gimmick, preserves
  curatorial tone.
- Zero `DESIGN.md` §11 anti-patterns verified. Zero hardcoded hex, zero `backdrop-filter`, zero Tailwind generic
  radii/shadows, zero hero videos.
- Token architecture strict. 100% custom properties (`--space-*`, `--font-size-*`, `--ink`, `--paper`, `--accent`,
  `--rule`). Unified `--shadow-focus`. Standardized touch targets `min-height: 44px`.
- Typography stack correct. Lora 500 (display), JetBrains Mono (meta), Inter 17-18px (body/65ch limit).
- Dark mode accurate. `#0E0D0C` paper, `#E8E5DD` ink, `#A82626` oxblood. Zero FOUC via `<head>` anti-flash inline
  script.
- Cmd-K transliteration operational. Cyrillic queries group correctly across PRODUCTIONS/AWARDS/PRESS schemas.
