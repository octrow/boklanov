# DESIGN

Visual identity + IA + token essentials. Updated: 2026-05-03 (9v3.8 - v3 Plakat mirror complete: §1/3/4/5/6/7/8/11/13).

Owns: palette, type, motion, component grammar, anti-patterns, route map, IA rules.
Runtime tokens: `app/globals.css`.

History (read-only, consult for "why"; do not edit in routine work). Read `*_compress.md` first; open full original only if detail is missing:
`.design/boklanov-rewrite/archive/DESIGN_BRIEF_compress.md` (D1-D15), `archive/tokens_compress.md` (per-token rationale),
`archive/INFORMATION_ARCHITECTURE_compress.md` (per-route detail, flows, naming, growth plan),
`archive/DESIGN_AMBITION_compress.md` (Phase 7.5 fingerprints + 7.6 backlog rationale + §13.1 audit).

## 1. Identity

Frame around the work. Warm editorial body + Bauhaus plakat accents. Three stage colours: vermillion / cobalt / mustard (v3 2026-05-03, replace v2 oxblood). Photo carries colour; chrome stays still. One decisive plakat gesture per page. Curator on mobile, 90s: must walk away with what kind of theatre + 2-3 productions + non-Instagram contact.

References (energy): gorki.de, hau-berlin.de, volksbuehne-berlin.de. Grammar (not fingerprints): linear.com, claude.ai (warm), granola.ai.

## 2. Mood axis

| Yes                                                             | No                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| Curatorial, quiet, declarative                                  | Promotional, hyped                                         |
| Warm paper + hairlines                                          | Dark glass + glow                                          |
| Lora display / Inter body / JetBrains Mono metadata             | Variable display fonts, Comic-Sans irony                   |
| Photos carry colour                                             | Brand gradients                                            |
| One signature gesture, fade transitions                         | Parallax, scroll-driven, animated gradients                |
| Hairline rules, sharp corners                                   | Drop-shadows, soft 16px radii, glassmorphism               |
| Production photos credited                                      | Stock "diverse smiling team"                               |
| Spacious, Japanese Ma                                           | Bento grids, marketing density                             |
| Catalogue raisonné register (numbered plates, archival caption) | Catalogue marketing register (collection, "shop the look") |
| Variable-weight Lora as breath, not animation                   | Kinetic interpolation between weights                      |
| Mono labels with hairline underline (no fill, no radius)        | Coloured pill chips, status hue                            |
| 1px low-contrast inset rule on photographic plates              | Outset shadow, blur radius >0, hover lift                  |

## 3. Colour

v3 Plakat (2026-05-03): Bauhaus trio replaces v2 oxblood. `--ink` deepened for accent contrast.

**Two themes. `gorky` is default; `paper` is opt-in via ThemeToggle.** `[data-theme]` attr on `<html>` selects; legacy `theme=dark` migrates to gorky, legacy `theme=light` migrates to paper. D11 brief decision was superseded in 9v3.0 (`2827654`); annotation backfilled in `archive/DESIGN_BRIEF.md` D11 2026-05-04. D10 (soft black, never pure black) holds - gorky `--paper #080706` is `rgb(8,7,6)`, not `#000`.

Gorky (default, dark plakat register):

- `--paper #080706` near-black (one notch deeper than v3 dark `#0E0D0C` - Theatre-Gorky aesthetic; D10 floor preserved)
- `--paper-raised #161413` cards/modals
- `--paper-sunken #040303` inputs/wells
- `--ink #F4F0E8` primary text (warmer than v3 `#E8E5DD` for editorial register on near-black)
- `--ink-mute #A8A49C` secondary
- `--ink-faint #7A7771` placeholder, decorative
- `--ink-marginalia rgba(244,240,232,0.55)`
- `--rule rgba(244,240,232,0.10)` hairlines
- `--rule-strong rgba(244,240,232,0.18)`
- `--accent-vermillion #FF5A66` primary stage. AA on `#080706` ≈ 6.1:1 ✓ (was AA on `#0E0D0C` ≈ 5.4:1; tighter paper improves contrast). Booking CTA, hover underline, focus ring.
- `--accent-cobalt #5B82C2` secondary stage. AAA on gorky paper.
- `--accent-mustard #C9A22F` tertiary, decorative only.
- `--ink-on-accent #080706` text on accent fills (AA, matches new paper)

Paper (opt-in, light editorial register - current v2 Vitrine, unchanged):

- `--paper #F2F0EA` warm off-white
- `--paper-raised #FBFAF6` cards/modals
- `--paper-sunken #ECE9E1` inputs/wells
- `--ink #0F0E0D` primary text (v3: was `#161514`, deepened for accent contrast)
- `--ink-mute #605C56` secondary, dates, captions
- `--ink-faint #8F8B83` placeholder, disabled, decorative metadata
- `--ink-marginalia rgba(15,14,13,0.55)` marginalia secondary register
- `--rule rgba(15,14,13,0.10)` hairlines
- `--rule-strong rgba(15,14,13,0.18)` hover/active borders
- `--accent-vermillion #CC2530` primary stage. Booking CTA fill, `/` + `/awards` + `/contact` SectionStripe, link-hover underline, focus ring, Sticker A. AA on paper 4.76:1 ✓. (v3.9.fix: was `#E63946` 3.66:1 - proposal claimed 4.65 in error.)
- `--accent-cobalt #1D3557` secondary stage. `/productions` SectionStripe, Sticker B. AAA on paper 12.4:1 ✓.
- `--accent-mustard #F4D35E` tertiary stage. `/about` SectionStripe, TourTicker fill, Sticker C. **Decorative only - never for text** (AA fail on paper). Use `--ink-on-mustard` for text on mustard fills.
- `--ink-on-accent #FBFAF6` text on accent fills (auto-selected per accent for AA)

Status (muted, form-validation only): success `#3F6B3A`/`#6FA365`, warning `#8A5A18`/`#C28F3A`, error aliased to `--accent-vermillion`.

Components reference semantic aliases, not raw paper/ink.

## 4. Type

Self-hosted from `public/fonts/`. SIL OFL. Full Cyrillic. No Google Fonts CDN.

Brief D13 locks three families (Lora / Inter / JetBrains Mono). v3 extends with
**Unbounded** scoped to hero wordmark + Sticker badges only — see §13.

| Role    | Family         | Weights       | Use                                                                                                  |
| ------- | -------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Plakat  | **Unbounded**  | 200–900 VF    | Hero wordmark on `/` only, Sticker badges (v3)                                                       |
| Display | Lora-VF        | 400–700 axis  | Header + footer wordmark (lowercase), page H1, section H2, editorial prose, italic press attribution |
| Body/UI | Inter          | 400, 500, 600 | Long-form prose, UI, CTAs                                                                            |
| Mono    | JetBrains Mono | 400, 500      | Dates, durations, chips, credits, country codes                                                      |

Brief deviation (weights): Lora is now a single VF axis 400–700 (commit `f1613b1`,
Phase 9.2). Brief §5.3 locked 400/500/600; the VF swap superseded that for
weight-set flexibility at zero file-size cost. Unbounded/Inter/JetBrains Mono
match brief lock.

Voice rules:

- Hero wordmark on `/`: Unbounded 700 ALL CAPS, gradient fill, `letter-spacing: 0.03em` - `РОМАН БОКЛАНОВ` / `ROMAN BOKLANOV`. Never italic. Static gradient - never animated.
- Header + footer wordmark: Lora medium **lowercase** - `роман бокланов` / `roman boklanov`. v3 fix-pass `2388511`: ALL CAPS Unbounded reverted at chrome scale (read as too tech, broke editorial register). Hero is the only Unbounded surface in chrome.
- All-caps reserved for: hero wordmark (Unbounded), chips (mono), section labels (mono), Sticker badges (Unbounded). No all-caps Lora.
- Italics only in Lora. Never in Inter or Unbounded.
- Mono for any number that's not a price.

Scale (10 tokens) — fluid `clamp(min@375, mid, max@1280)` unless marked fixed.
Source: `app/globals.css`. Final collapse from 14 → 10 tokens by Wave 2 of
`FONT_FIX_PLAN_2026-05-18`. Within editorial-ideal budget (6 brief-locked
semantic + 4 role-named).

**Brief-locked semantic core (6):**

| Token              | Min | Max | Use                                     |
| ------------------ | --- | --- | --------------------------------------- |
| `--font-size-chip` | 11  | 11  | Chips, age rating, country code (fixed) |
| `--font-size-meta` | 13  | 13  | Mono captions, dates (fixed)            |
| `--font-size-body` | 17  | 18  | Reading prose                           |
| `--font-size-h3`   | 20  | 24  | h3, card titles                         |
| `--font-size-h2`   | 28  | 40  | h2, section titles                      |
| `--font-size-h1`   | 36  | 60  | Page H1 — see brief deviation below     |

**Role-named extensions (4):**

| Token                 | Min | Max | Use                                                                                                                                 |
| --------------------- | --- | --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--font-size-caption` | 14  | 14  | Sans secondary text — between body and meta, not mono (fixed)                                                                       |
| `--font-size-nav`     | 13  | 16  | Header nav links — desktop scale-up                                                                                                 |
| `--font-size-hero`    | 36  | 80  | **v3** Unbounded hero wordmark on `/` only — retuned `2388511` (was 48–96; mobile-cropped and desktop-oversized at the brief value) |
| `--font-size-sticker` | 11  | 13  | **v3** Unbounded Sticker badge text                                                                                                 |

Brief deviation (scale): `--font-size-h1` is **36→60**, not the brief's **44→88**.
The brief's display ceiling was never implemented in code; the de-facto page H1
(formerly `--font-size-3xl`) has always been 36→60. The actual display ceiling
is now `--font-size-hero` on `/` only. Brief §5.4 listed 6 semantic steps —
this scale honors that (chip/meta/body/h3/h2/h1) plus 4 explicit role
extensions, not t-shirt-sized intermediates.

Tracking: `--letter-spacing-tight -0.015em` (Lora display), `--letter-spacing-wide 0.06em` (mono caps),
`--letter-spacing-meta 0.01em` (mono captions). Unbounded ALL CAPS: `0.03em`.
Line-heights: tight 1.15, snug 1.3, normal 1.55, relaxed 1.7 (`/about` prose).

## 5. Spacing + layout

Base 4px. Scale: `0,4,8,12,16,24,32,48,64,96,128` -> `--space-0..10`.

Gutters: mobile 20px, tablet 24px, desktop 32px.

Reading measure: `--max-width-prose 65ch`. Content: 1080px. Wide hero: 1280px. Hard ceiling: 1440px. v2 additions: `--measure-caption 36ch` (SpecimenPlate captions), `--gutter-margin-pull -1.25rem` (Marginalia float-into-margin ≥1024px). v3 additions: `--measure-poster 56ch` (TypographicCover wider register), `--shadow-plakat: 0 4px 0 0 var(--ink)` (flat-stack poster offset, §11 unfreeze §2.6/§2.7), `--stripe-thickness: 2px` (SectionStripe band), `--ticker-speed: 38s` (TourTicker marquee duration).

Grid: 1-col mobile, 8-col tablet (≥768), 12-col desktop (≥1024).

Radii (sharp wins): `--border-radius-sm 2px` default (chips, buttons), `4px` modals, `8px` reserved (photo cards). No
`rounded-2xl`. v2 addition (per §11 unfreeze 9.0c): `--border-radius-form 2px` allowed on `<input>`, `<textarea>`, `<select>`, `<dialog>`, `kbd` only — never on cards, images, buttons.

Shadows hairline-first: `--shadow-sm` low lift, `--shadow-md` Cmd-K + dropdowns, `--shadow-lg` modals only,
`--shadow-focus 0 0 0 2px var(--paper), 0 0 0 4px var(--accent)`. v2 addition (per §11 unfreeze 9.0a): `--specimen-rule inset 0 0 0 1px rgba(22,21,20,0.08)` allowed on photographic plates only — scoped to `SpecimenPlate.module.css`, ≥768px, never blur >0, never outset.

Z: `--z-base 0`, `--z-raised 10`, `--z-sticky 100`, `--z-overlay 500`, `--z-modal 1000`, `--z-toast 2000`.

## 6. Motion

`--duration-fast 150ms` hover, `--duration-normal 200ms` page-fade, `--duration-slow 400ms` gesture ceiling.
Easing: `--easing-default cubic-bezier(0.4,0,0.2,1)`, `--easing-editorial cubic-bezier(0.22,0.61,0.36,1)`.

Allowed:

1. Hover underline reveal (150ms, primary links + CTAs only).
2. Page transition fade (200ms, no slide).
3. DA-3.A slate-strike + DA-3.C edition-frame fallback (320ms, home first paint, once per session). Gated by
   `sessionStorage.firstPaintDone`, `?gesture=off`, and `prefers-reduced-motion`.
4. SpecimenPlate caption focus settle (Phase 9.x polish, `5d49f4e`): 2px y-translate on caption when `.plate:focus-within`, `--duration-fast` with `--easing-editorial`. Plate itself does not move; only the caption "shifts in its slot." Scoped to `SpecimenPlate.module.css`.

5. **TourTicker marquee** (v3, `c892efd`): CSS `@keyframes` linear translate-X over `--ticker-speed 38s`. `prefers-reduced-motion` sets `animation-duration: 0s` AND `animation-play-state: paused` — static row of cities. `:hover` also pauses. Never opacity-fade.
6. **Sticker badge stamp** (v3, `c892efd`): on first-paint only, `rotate(-3deg) scale(0.95)` → `rotate(-2deg) scale(1)` over `--duration-normal`, single-shot via `sessionStorage.stickersStamped`. Reduced-motion: render at final transform, no animation.

Banned: parallax, scroll-driven entrances, animated gradients (static hero gradient is the one exception per §11 §2.5), kinetic type, hero video looping >3s (§2.3).

`prefers-reduced-motion` zeros all `--duration-*` at the token layer. Components must reference tokens, never hardcode
ms.

## 7. Component grammar

Page chrome is a frame. Hairline rules separate sections. Header sticky on production detail only. Footer minimal: three
columns of mono links + colophon. No newsletter signup, no "Built with Next.js".

**v3 components (2026-05-03, branch `design_v3`):** SiteWordmark (`b20d501`; fix-pass `2388511`) — variant=hero (Unbounded 700 ALL CAPS gradient) | header + footer (Lora medium lowercase, v1/v2 register restored). SiteHero (`c8fffc7`) — `/` only: SR h1 + aria-hidden gradient wordmark + Lora italic statement + mono hint. SectionStripe (`6f7fc30`; fix-pass `2388511`) — 2px per-route accent band, rendered once inside `<SiteHeader>` below the header rule (was per-page inside `<main>` — constrained by max-width-content; now spans 100vw). Sticker (`c892efd`; fix-pass `2388511` adds production-detail call-site; `2b1e3c9` adds `layout="inline"` prop) — Unbounded 600 ALL CAPS badge, fill one accent, no radius, `--shadow-plakat`. `layout="floating"` (default) absolute-positioned over `.cover`; `layout="inline"` for production-detail row above title (no absolute escape). Max 1/card on grid + max 2/page on detail. DuotonePoster (`e73ab4f`; visibility tuning `8fa36c3`) — SVG `feColorMatrix` two-tone, slugHash%2 picks accent, applied directly via attribute selector (no `@supports` gate; modern browser baseline handles `filter: url()` natively, missing-sprite is a no-op fallback). Linear luminance → duotone (no S-curve — softened 2026-05-03 from punched mid-tone version). Selector `:is(img, [data-cover-style])` covers `<img>` and TypographicCover. `prefers-reduced-transparency` swaps to grayscale+contrast. TourTicker (`c892efd`) — CSS marquee mono caps band, pauses on hover + reduced-motion. FeaturedStrip (`c8fffc7`; fix-pass-2 `2b1e3c9` rolled back to equal cells; **fix-pass-3 `22ebed1` re-attempts §2.4 broken-grid via custom-property override**): mobile 1-col, tablet 2-col `grid-template-areas` (h h / h m1 / h m2 / s1 s2 / s3 .), desktop 12-col (hero cols 1–7 spanning 2 rows, mediums cols 8–12 stacked, smalls 1–4/5–8/9–12). Hero cell publishes `--card-height: 100%` + `--cover-aspect: auto` + `--cover-flex: 1 1 0` so the hero card fills the 2-row stack defined by medium cards' natural 4:5 height — fixes the dead-space-below-hero geometry that triggered fix-pass-2. ProductionCard.module.css adds three custom-prop hooks (defaults preserve every other call-site byte-for-byte) plus `@container card (min-width: 600px)` upscaling hero `.titleRu` to `--font-size-2xl` and `.meta` to `--font-size-sm` — fires only on the desktop hero cell (~686px). Pivot from `:global(.card)` (broken under CSS-Modules class hashing) to custom-properties (cascade through hashing + DuotonePoster's `display:contents`); root-cause + ranked options + implementation log in `.design/boklanov-rewrite/FEATURED_STRIP_GRID_RESEARCH.md`. Pending §11.4 visual gate ("Schaubühne not Notion"); rollback path = single-file revert of `FeaturedStrip.module.css` + `ProductionCard.module.css`. Cells stay block grid items (not flex containers — fix `43deafc` for first-cell Sticker shrink).

ProductionGrid (v2 component; v3 prop addition `8c78b02`+`8fa36c3`): default 2/3/4-col grid (mobile/tablet/desktop). `duotoneAll` prop wraps every card in DuotonePoster — used on home below-fold so `/` reads as a single Bauhaus plakat surface; default-off everywhere else (`/productions`, `FilteredProductionsPanel` keep photos as-shot). Featured cards are NOT auto-wrapped (was implicit before `8fa36c3`; tinted 9 cards on `/productions` unwantedly). FeaturedStrip wraps independently and is unaffected by this gate.

Folio (Phase 7.5, `c7a1b50`; updated session 5): mono caps running line above nav in `<header>`, `aria-hidden="true"`. Format: `РОМАН БОКЛАНОВ ⟶ SECTION ⟶ 01 / 24`. Home page shows just `РОМАН БОКЛАНОВ` (no section arrow). `folioFor()` in `lib/folio.ts`. Footer mirrors with `2026 EDITION` / `2026 ИЗДАНИЕ` / `AUSGABE 2026`. Year only. No cities.

Edition stamp (footer): `<small class="colophon">` mono caps, hairline above.

Cue marks (Phase 7.5): `<Cue mark="CUE I">` wrapping H2 on `/about`, `/awards`, `/productions/[slug]`. Mono caps +
hairline below mark. `aria-hidden="true"` on the span.

Production card:

- 4:5 cover top, no radius, no border.
- Lora RU title, Inter EN title `--ink-mute`.
- Mono meta row: `theatre · PREM YYYY · ageRating · countryCode`. `font-variant-numeric: tabular-nums`.
- Whole card is the link. Hover: vermillion underline reveal under RU title (v3: vermillion replaces oxblood), no card lift. Optional `<Sticker>` overlay.
- No-poster fallback = deliberate typographic treatment via `<TypographicCover>` (Phase 9.8, `components/TypographicCover.tsx`). Slug-hash mod 3 picks one of three layout variants (top / centre / bottom-set title placement) so productions sharing theatre+year don't render visually identical plates. Triggered when `poster.src && poster.lqip` is false.

Marginalia (Phase 7.6, `00c2501`; 9.4 API `36546d9`; v3 9v3.6 float shipped `8ed4c56`): `<Marginalia kind="note|pull|run">`. Default `kind="note"` — `<Marginalia note="...">{prose}</Marginalia>`. **v3 (9v3.6):** float-into-margin breakpoint lowered to ≥1024px (was ≥1280px); TourRider collapses to `<details>` at ≥1280px to free gutter. ≥1024px: two-column grid (`minmax(0,65ch) minmax(0,20ch)`), note in right column, `border-left`, mono meta. Below 1024px: note inline as italic Lora. `aria-hidden="true"` on `<aside>`. DE forthcoming: `note={tAbout('deForthcoming')}` on lead paragraph when `de.yaml` absent.

EmptyState (Phase 7.6 + 9.5 refresh, `806d1a0`): editorial empty-state register. Top + bottom hairline rules → italic Lora body at `--font-size-base` (55ch max-width) → optional `action` slot. `role="status"` + `aria-live="polite"` for filter call-sites. Used on `ProductionGrid` (filter empty + clear-filters ghost button), archive, awards, press. ERRATA mono chip dropped in 9.5 — body reads as prose, not UI state. `CommandPalette` no-results uses equivalent inline markup for layout containment reasons.

SpecimenPlate (Phase 9.6, `c866152`; polish `5d49f4e`): photographic plate with archival caption. `<figure>` + `<img>` wrapped in `.frame` carrying `--specimen-rule` (inset 1px ≥768px, scoped here per §11 unfreeze 9.0a). `<figcaption>` is never empty: zero-padded mono index `07 / 24` plus optional credit (`--ink-marginalia`). `break-inside: avoid` + `margin-bottom` keep CSS columns masonry intact. Photographic processing recipe (proposal §6.1): `filter: contrast(1.04) saturate(0.92) brightness(0.99)` on `.frame img` + `::after` static SVG grain overlay (`/img/grain-tile-128.svg`, 128×128, 4% alpha encoded in SVG, `mix-blend-mode: multiply`). `prefers-reduced-transparency: reduce` strips the grain. Caption focus settle motion (proposal §5.2): 2px y-translate via `.plate:focus-within .caption`, `--duration-fast` with `--easing-editorial`. Used on `/productions/[slug]` gallery (composes inside `GalleryLightbox`) and `/about` photos[] grid. `--specimen-rule` scope guarded by `npm run lint-tokens`.

GalleryLightbox (post-9.x polish): `<GalleryLightbox items={[{src, alt, credit}]}>` client component. Renders masonry grid (`columns: 2` ≥768px) of `<SpecimenPlate>` thumbnails. Single shared overlay state — clicking any thumbnail opens the lightbox at that index. Overlay: `--z-overlay 500`, `rgba(0,0,0,0.92)` backdrop, click-outside to close. Navigation: ← / → arrow buttons (44×44 touch targets, `--border-radius-sm`, hidden when `total === 1`); keyboard `ArrowLeft` / `ArrowRight` / `Escape`. Focus: on open moves to close button; on close returns to the clicked thumbnail. Meta bar below image: mono counter `01 / 07` + optional credit in muted rgba. Replaced per-image `PosterLightbox` wrappers in the gallery section.

TourRider (Phase 9.7, `4210970`; v3 `8ed4c56`): production tech-rider sheet — replaces inline right-rail `.slate` (DA-2.B). Mono key/value rows in a bordered `<dl>`, desktop-only (≥1024px). **v3:** `<details>` accordion at ≥1280px (was always-visible right-rail) — collapses to free gutter for Marginalia float. Rows short-circuit on null fields: `PRODUCTION nn / nn` header → YEAR / RUN / AGE / COUNTRY / LANGUAGE / FORM / LINEAGE / TOURING SOLO / TECH RIDER (PDF link, `aria-label`) / PRESS KIT (ZIP link, `aria-label`). Keys use `--ink-marginalia`. `font-variant-numeric: tabular-nums`. Mobile chips row carries year/age/duration; TourRider stays hidden.

TheatreSlate (Phase 9.3, `49eb04c`): four-line typographic record on production detail — heading via `as` prop (`h1` on detail, `h2` on index when adopted), titleEn (Inter `--ink-mute`), titleDe (Inter `--ink-faint`), theatre line (mono meta with optional URL link), role line (mono uppercase, `--ink-marginalia`, `--letter-spacing-wide`, NEW), premiereDate (mono meta). Top + bottom hairlines. Role labels via i18n `productions.role*` (`roleSketch` added in 9.3).

TypographicCover (Phase 9.8, `778677c`; polish `046aae9`; v3 `8ed4c56`): canonical cover for productions without a photographic poster — not a fallback. 4:5 aspect, **Unbounded 600 ALL CAPS** title `--font-size-2xl` (v3: was Lora 600), mono meta line `theatre · countryCode · year`. Slug-hash mod 3 selects one of three layout variants (top / centre / bottom-set title placement) so productions sharing theatre+year don't render identical plates. Optional 1-line italic Lora `synopsis` line above meta when `production.synopsis` present (truncated 60 chars, single-line ellipsis) — proposal §6.2 collision-buster on top of mod-3 variants. Triggered by `ProductionCard` when `poster.src && poster.lqip` is false. `aria-hidden="true"` (visible `<h3>` carries title for SR).

PosterLightbox (session 5): `<PosterLightbox src alt>` client component wrapping the production cover. Click opens a full-image overlay (`--z-overlay 500`, dark backdrop). Close via `✕` button (44px touch target, 2px radius), click on backdrop, or Escape. `cursor: zoom-in` on trigger. On open: focus moves to close button, body scroll locked. On close: focus returns to trigger.

CreditLine (Phase 9.x polish, `e73379a`): `<CreditLine photographer year>` mono caption primitive per proposal §6.3. Renders only fields that exist, em-dash separated; null inputs collapse to nothing. Available for greenfield call-sites (press credits, structured photographer/year split) — current SpecimenPlate caption handles unstructured `gallery[].credit` strings directly so this primitive is unused on existing routes.

Production detail (D7 layout, top -> bottom):

1. Cover: `max-height: 65vh`, `object-fit: contain`, centered. Natural aspect ratio, no cropping. `PosterLightbox` wraps for click-to-expand.
2. Run-of-show row (Phase 7.6): optional `runs[]` frontmatter. Mono chip row above title: `RUN · venue · city · yearFrom–yearTo · count`. Hidden when `runs[]` empty.
   2b. Sticker row (v3 fix-pass `2388511`): optional plakat badges above title. `aria-hidden="true"`. Vermillion `FESTIVAL AWARD · N` when `awards.length > 0`; cobalt `TOURING` when `tour.length > 0`. Max 2 stickers; canonical sources are TourRider + awards list. Translation keys: `productions.stickerAward` + `productions.stickerTour` (RU/EN/DE).
3. Title block: `<TheatreSlate>` component (Phase 9.3, `components/TheatreSlate.tsx`) — RU display Lora + smaller EN + DE if present, theatre line (mono meta with optional URL link), role line (mono uppercase, `--ink-marginalia`, `--letter-spacing-wide`), premiereDate (mono meta). Top + bottom rules. Heading element via `as` prop (`h1` on detail, `h2` on index when adopted).
4. Chips row mono caps: `[18+] [2020] [90 MIN] [RU]`. Sharp corners.
5. Synopsis Lora italic.
   5b. Director's note (Phase 7.6): optional `directorsNote.{ru,en}` frontmatter. Italic Lora `<blockquote>` with 2px hairline left rule + mono attribution `— РОМАН БОКЛАНОВ`. Hidden when field absent.
6. Credits as `<dl>` with leader-dot rows. `Director ........ Roman Boklanov`. Cast sub-block under hairline. No "in
   order of appearance". No puppet-as-cast.
7. Action bar: Watch/listen (oxblood primary), Tech rider (PDF), Press kit (ZIP). Hide when asset absent.
8. ON TOUR band: `<TourTicker>` CSS marquee (v3, replaces static `.slate` Plinth band). Driven by `tour[]`; empty -> hidden. No links. Pauses on hover + reduced-motion.
9. Press: Lora italic link + mono outlet, hairline rules between items. Hidden when `press[]` empty.
10. Gallery: `columns: 2` masonry tablet+, original aspect. Each item is a `<SpecimenPlate>` inside `<GalleryLightbox>` — single shared navigable overlay, ← / → arrows + keyboard. Hidden when `gallery[]` empty.
11. Awards: list, mono year + name + city.
12. External theatre links: single mono row.
13. Recommends: 3 cards. Same form -> same age bucket -> most recent year. Lineage = tiebreaker.
14. Sticky CTA `Email Roman about touring this show`. Mailto with prefilled subject + show name. `IntersectionObserver`
    on cover. Right-rail grid on desktop, fixed bottom on mobile. `--z-sticky 100`.

Theatre slate / right rail (desktop): see TourRider (Phase 9.7) above. Replaces the inline `.slate` div from `app/[locale]/productions/[slug]/page.tsx`.

Chips: JetBrains Mono uppercase, `letter-spacing: 0.06em`, `--paper-sunken` bg, `--border-radius-sm`. No coloured chips.
No status hue. Per §11 unfreeze 9.0b, mono labels with `border-bottom 1px var(--rule)` + no fill + no radius are the new specimen-label register for non-chip metadata; existing chip styling stays for the production-detail age/year/duration/country row.

Buttons:

- Primary: `--accent-vermillion` fill (v3: was oxblood), `--paper` text, sm radius. Hover `#C2202E`. `--shadow-plakat` outset (§11 unfreeze §2.6).
- Secondary: hairline border `--rule-strong`, transparent. Hover fills `--paper-raised`.
- Ghost: no border, underline reveal on hover.
- Touch ≥ 44px mobile. Focus ring mandatory (`--shadow-focus`).

Forms: none. Booking is mailto + copy-paste. Cmd-K palette is the only form-like element (mono input, hairline border,
`--paper-raised` bg).

Cmd-K: keyboard-only end-to-end. Groups: Productions, Awards, Press, Theatres. Cyrillic<->Latin transliteration index in
`lib/search.ts`. Suppress webkit `<input[type=search]>` cancel button globally.

## 8. Routes

```
/                       Home: hero + featured strip + grid below fold
/productions            Filterable grid (?role,form,age,country,year)
/productions/[slug]     Detail (D7 layout)
/about                  Bio + photos[] grid + lineage + ГДЕ СТАВИЛ row
/awards                 Award timeline (by-production default, by-year toggle)
/press                  Card grid, language filter, original-language only
/archive                Long-tail CV: readings, sketches, workshops
/contact                TG + IG primary, mailto secondary, plain-text email

/en/*                   Full parity
/de/*                   Full content parity code paths (v3, `badafb0`). `lib/content.ts` — explicit-null contract: `title.de`, `synopsis.de`, `directorsNote.de`, `tagline.de`. Render paths fall through to `<Marginalia note="Deutsche Übersetzung folgt">` when DE absent. `hreflang` stays RU↔EN only until ≥5 productions have real DE copy.

/api/og/[slug]          Per-production OG (1200x630, satori `ImageResponse`)
/sitemap.xml            hreflang RU↔EN only; DE URLs present but without alternates until content parity reached.
/feed                   RSS RU + EN; DE excluded
/robots.txt
```

Locale: RU = default, no prefix (`/`). Middleware rewrites `/` -> `/ru` internally; canonical URL stays prefix-free.

Slugs: from RU title transliterated, or clean EN title. Set once, never changed. RU/EN sibling Notion pages merge into
one record (`notionIds: {ru, en}`).

Filter params (deep-linkable): `?role=`, `?form=`, `?age=`, `?country=ISO2`, `?year=`. Comma-separated multi-values.

`/productions/[slug]/#gallery|#awards|#press` anchors auto-generated.

## 9. IA per page essentials

- Home: 1) Lora wordmark + meta + statement above fold. 2) 4-6 featured cards (`featured: true`). 3) Filterable grid. 4)
  Footer.
- `/productions`: filter bar with mono caps group labels (`РОЛЬ`, `ФОРМА`, `ВОЗРАСТ`, `СТРАНА`) ≥768px. Active filter
  chips dismissable. Grid 2/3/4 cols mobile/tablet/desktop. Empty state:
  `Нет спектаклей по этим фильтрам / No productions match.`
- `/about`: portrait, Lora lead, Inter body, ГДЕ СТАВИЛ mono row (
  `СПБ · МОСКВА · АЛМАТЫ · БРЕМЕН · ВЕНА · БЕРЛИН · ТАШКЕНТ`), milestones, lineage cards. Past-tense label (RU
  `ГДЕ СТАВИЛ`, EN `STAGED IN`, DE `INSZENIERTE IN`) is locked.
- `/contact`: TG + IG primary (oxblood), mailto secondary, plain-text email visible + copy. No form, no CAPTCHA.

Naming (RU/EN):

- Spectacle/Production. Director/Режиссёр. Performer/Роль. Co-director/Со-режиссёр. Sketch/Эскиз. Theatre/Театр. Touring
  inquiry/Запрос о гастролях. Photo: [Name]/Фото: [Name]. Age 3+/6+/12+/18+ identical across locales.

## 10. Imagery

- 419 images, 250 MB local export. Dedup RU/EN siblings = same production.
- Only 4 productions have a poster. Typographic fallback is deliberate, not a placeholder.
- Photo credits unstructured in export. Roman fills `gallery[].credit` via Obsidian.
- Featured cards pull from top-coverage band (`Nikita 33`, `Дель-Арте 28`, `Лина-Марлина 27`, `Гипс 25`,
  `Злая собака 25`, `Ape Star 25`, `Хаврошечка 24`). Never feature a no-poster show.
- Full-bleed reserved for production-detail covers. Grid covers contained 4:5. Galleries masonry, original aspect.
- LQIP via `sharp`, inline in frontmatter.

## 11. Anti-patterns (do NOT ship)

- AI-purple/pink gradients
- Glassmorphism, neumorphism, claymorphism
- "AI-Native UI" chips, animated gradient text, kinetic gradient meshes — _v3 narrowed 2026-05-03: DuotonePoster SVG duotone (§2.1) + static hero gradient (§2.5) allowed. See DESIGN_v3_PROPOSAL.md §2.1 + §2.5._
- Hero video — _v3 narrowed 2026-05-03: approved but skipped — no clip available. See DESIGN_v3_PROPOSAL.md §2.3._
- Bento grids on home — _v3 §2.4 unfreeze ROLLED BACK 2026-05-03 (fix-pass-2 `2b1e3c9`); **RE-ATTEMPTED 2026-05-03 (fix-pass-3 `22ebed1`)** via custom-property override (Option B in `FEATURED_STRIP_GRID_RESEARCH.md` §3): hero cell drops `aspect-ratio` on its cover and lets the card fill the 2-row stack defined by medium cards' natural 4:5 height. Defaults in ProductionCard.module.css preserve all other call-sites byte-for-byte. Pending §11.4 visual gate ("Schaubühne not Notion"); single-file rollback path. Bento ban still applies to `/productions`, `/about`, equal-size cells, and hover lift — those rollback triggers are unchanged. See DESIGN_v3_PROPOSAL.md §2.4._
- Tailwind defaults `rounded-2xl shadow-xl` — _narrowed 2026-05-02_: `--border-radius-form: 2px` allowed on `<input>`, `<textarea>`, `<select>`, `<dialog>`, `kbd` only. NEVER on cards, images, buttons. Outset `shadow-xl` remains banned (specimen-rule inset is the only exception per §11 drop-shadow narrowing). See `DESIGN_v2_PROPOSAL.md` §2.3. _v3 narrowed 2026-05-03: `--shadow-plakat` outset allowed on `DuotonePoster` only. See DESIGN_v3_PROPOSAL.md §2.6._
- Stock photography
- Comic-Sans-as-irony, "puppet show" pastiche, hand-drawn underlines
- Loading-spinner skeletons that animate forever
- Cookie banner taking bottom 20%
- Newsletter modal on first visit
- "Built with Next.js" in footer
- Coloured chip pills (status -> font weight, not hue) — _narrowed 2026-05-02_: chips become specimen mono labels — `text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-mono); font-size: var(--font-size-chip); padding: 0; border-bottom: 1px solid var(--rule); background: none; border-radius: 0`. NEVER background-fill. NEVER coloured beyond `--ink-mute`. Multiple labels separated by em-dash. See `DESIGN_v2_PROPOSAL.md` §2.2. _v3 narrowed 2026-05-03: `<Sticker>` Unbounded ALL CAPS badges allowed (one accent fill, no radius). See DESIGN_v3_PROPOSAL.md §2.2._
- Drop-shadow glow on cards, neon focus — _narrowed 2026-05-02_: `--specimen-rule: inset 0 0 0 1px rgb(22 21 20 / 0.08)` allowed on photographic plates only (`coverStyle === 'photo'` AND ≥768px), scoped to `SpecimenPlate.module.css`. NEVER `blur > 0`, NEVER outset, NEVER coloured, NEVER on hover. Outer drop-shadow remains banned. See `DESIGN_v2_PROPOSAL.md` §2.1. _v3 narrowed 2026-05-03: `--shadow-plakat` extends to `<Sticker>` + `<DuotonePoster>`. See DESIGN_v3_PROPOSAL.md §2.7._
- Coloured headers with white text — _v3 narrowed 2026-05-03: `<SectionStripe>` 2px per-route accent band above `<Cue>` allowed (not a header fill). See DESIGN_v3_PROPOSAL.md §2.8._
- Marquee / ticker tape — _v3 narrowed 2026-05-03: `<TourTicker>` CSS marquee on `/` and production-detail `tour[]` only. Pauses on hover + reduced-motion. See DESIGN_v3_PROPOSAL.md §2.9._

History only: Phase 7.5 fingerprint audit table at `archive/DESIGN_AMBITION_compress.md` §13.1 (read-only; full: `archive/DESIGN_AMBITION.md`).

## 12. Accessibility floor

Non-negotiable.

- Body text ≥ 7:1 (AAA) where possible, ≥ 4.5:1 (AA) always.
- Focus ring on every interactive element. No `outline: none`.
- Touch targets ≥ 44x44 CSS px mobile.
- `lang` per locale. `hreflang` RU<->EN.
- Image alt: `{role} {production title}, {theatre}, {year} ({photographer})`.
- `prefers-reduced-motion` disables gestures entirely (token-level zero).
- Cmd-K keyboard-only end-to-end.
- Landmarks: header, nav, main, footer.

## 13. Wordmark

No logo. `<SiteWordmark>` component. Two registers (v3 fix-pass `2388511`):

- **Hero** (`/` only): Unbounded 700 ALL CAPS, `letter-spacing: 0.03em`, `--font-size-hero` clamp(36px, 23+4vw, 80px) (retuned 2026-05-03 — see §4 hero row). Static gradient fill (vermillion→cobalt→mustard, 135deg). RU: `РОМАН БОКЛАНОВ`. EN/DE: `ROMAN BOKLANOV`. `aria-hidden`; SR h1 companion carries the plain text.
- **Header + footer**: Lora medium **lowercase**, `letter-spacing: --letter-spacing-tight`, solid colour (header `--ink`, footer `--ink-mute`). RU: `роман бокланов`. EN/DE: `roman boklanov`. Never italic. Never gradient.

The lowercase Lora register at chrome scale is the v1/v2 anchor; ALL CAPS Unbounded was tried on every variant in 9v3.1 but reverted to hero-only after visual review (read as too tech, broke editorial register).

## 14. Source-of-truth chain

This doc is the live source. `app/globals.css` mirrors §3-6 tokens. Components must obey §7 + §11. The `archive/` folder is read-only history; read `*_compress.md` first, open the full original only if detail is missing, never edit during routine work.

If a component contradicts this doc, fix the component. If reality contradicts this doc (a locked decision is genuinely
changing), that is a `MAP.md` §5 unfreeze event — surface it, don't silent-edit the brief.
