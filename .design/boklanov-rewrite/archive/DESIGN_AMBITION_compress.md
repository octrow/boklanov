# DESIGN_AMBITION_compress.md

**STATUS**: Phase 7.5 Shipped 2026-05-02
**METAPHOR**: Site as printed theatre programme. Quiet, curatorial, paper-led, photo-led.
**Full version (original)**: .design/boklanov-rewrite/archive/DESIGN_AMBITION.md

## LOCKED CONSTRAINTS
*   **No Troupe**: Roman is solo director. Credits are per-production. Puppets are NOT cast members.
*   **Geography Logic**: Roman absent from RU since 2022 mobilization. RU cities exist in historical work. Label MUST be past tense (`STAGED IN` / `ГДЕ СТАВИЛ`). No active RU work claims.
*   **Colophon Logic**: Invariant. Year only (`2026 EDITION`). NO cities. NO `v2` version marks.
*   **CMS Source**: Obsidian (variant F) ONLY. Decap deferred. Frontmatter is single source of truth.

## IMPLEMENTATION SYSTEM (SHIPPED R1-R3)

### 1. Folio (Running Header/Footer)
*   **Location**: `SiteHeader.tsx`, `SiteFooter.tsx`.
*   **Top Format**: `ROMAN BOKLANOV ⟶ PRODUCTIONS ⟶ 01 / 24`
*   **Bottom Format**: `2026 EDITION` / `2026 ИЗДАНИЕ` / `AUSGABE 2026`
*   **Specs**: `font-family: var(--font-family-mono); font-variant-numeric: tabular-nums; text-transform: uppercase; color: var(--ink-faint); letter-spacing: var(--letter-spacing-wide); font-size: var(--font-size-chip);`.
*   **HTML**: `<div aria-hidden="true">` above navigation, inside `<header>`/`<footer>`.

### 2. Cue Numbers (Section Openers)
*   **Usage**: `/about`, `/awards`, `/productions/[slug]`.
*   **Format**: `CUE I`, `CUE II`, `CUE 2017`.
*   **HTML**: Wrap H2 in `<header>`. Prepend `<span aria-hidden="true">CUE X</span>`.
*   **Specs**: Mono caps, `--ink-faint`, hairline border-bottom (`1px solid var(--rule)`). `min-width: 4rem;`. Sits ABOVE heading text.

### 3. Production Credits Block (Dramatis Personae)
*   **Usage**: Production detail.
*   **HTML**: Semantic `<dl>`. Role in `<dt>`, Name in `<dd>`.
*   **Specs**: Left-align role, right-align name. `border-bottom: 1px dotted var(--rule)` for leader-dots. Hairline rule between credit sections.

### 4. Theatre Slate (Spec Sheet)
*   **Usage**: Right-rail or mobile-top metadata block.
*   **Format**: Boxed. Hairline border, inset padding. Top index line: `ROMAN BOKLANOV | PRODUCTION 14 / 24`.
*   **Specs**: Mono throughout. `font-variant-numeric: tabular-nums;`.

### 5. Two Geographies Split
*   **Staging Geography**: `/about` + Home page echo.
    *   **Locked Cities**: `СПБ · МОСКВА · АЛМАТЫ · БРЕМЕН · ВЕНА · БЕРЛИН · ТАШКЕНТ`.
    *   **Label**: Past-tense ONLY. `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`.
    *   **Format**: Mono row. Hover-link to `?city=` filter.
*   **Plinth Tour (Solo Show)**: `/productions/bury-me-behind-the-baseboard` only.
    *   **Label**: `ON TOUR`. Hairline rule top/bottom. Max 10 cities.
    *   **Data**: Sourced from `tour[]` array in `index.mdx` frontmatter. Hide block if array empty. No links.

### 6. Edition Stamp
*   **Location**: `SiteFooter.tsx`.
*   **HTML**: Semantic `<small class="colophon">`.
*   **Format**: `2026 EDITION`. Sits below 3-column links, above copyright.

### 7. Premiere Mark
*   **Usage**: `<ProductionCard>`.
*   **Format**: Replace generic `year` with `PREM YYYY·MM`. Tabular mono.

### 8. Slate-Strike First-Paint Gesture
*   **Trigger**: Home page first paint ONLY. Gated by `sessionStorage.firstPaintDone`.
*   **Animation**: 320ms drop of wordmark "slate top" (`::before`/`::after` translation). Static identical end-state.
*   **Accessibility**: Gate with `@media (prefers-reduced-motion: no-preference)`.
*   **Fallback**: Static Edition Frame. `1px` rectangle, 24px inset, `№ 14` top-left. Fades out at 600ms or first scroll.

## PHASE 7.6 BACKLOG (POST-LAUNCH POLISH)
*   **DA-7.6.A Marginalia**: `>1280px` layout. Move photo credits, cross-refs, dates to right margin aside.
*   **DA-7.6.B Print Stylesheet**: `@media print`. Paper white, ink black, hairlines 0.5pt, 18mm margins.
*   **DA-7.6.C Director's Note**: Italic Lora blockquote below synopsis. Mono attribution `— РОМАН БОКЛАНОВ`. Data: `directorsNote.{lang}`.
*   **DA-7.6.D Run-of-show Row**: Bookers' metadata above title. Format: `RUN · BTK · СПБ · 2020–2024 · ~80 PERFORMANCES`.
*   **DA-7.6.E Award Cue Count**: Append count to cue. `CUE 2021 · 4 НАГРАДЫ`.
*   **DA-7.6.F Slate Language Row**: Add `LANGUAGE` to Theatre Slate block.
*   **DA-7.6.G Card Fallback Anchor**: `margin-top: auto` on year mark for cards without posters.
*   **DA-7.6.H DE Chrome Audit**: Verify `INSZENIERTE IN` wrapping at 1024px.
*   **DA-7.6.I OG Image Upgrade**: Add Satori hairline rules, mono slugs, oxblood colophon.
*   **DA-7.6.J Editorial Empty States**: Replace generic "No matches" with hairline rule, italic Lora, mono ghost link.

## STRICT ANTI-PATTERNS (DO NOT DO)
*   NO parallax, scroll-driven animations, or kinetic typography.
*   NO gradients (AI-purple or otherwise).
*   NO bento grids.
*   NO video backgrounds.
*   NO tinted card backgrounds (chrome must remain neutral; photos carry color).
*   NO puppet mascots.
*   NO custom display fonts (Lora locked).
*   NO hover-hidden photographer credits.
*   NO string-line pull animations.
*   NO watermark specimen text hero blocks.
*   NO fake theatrical 404 errata pages.
