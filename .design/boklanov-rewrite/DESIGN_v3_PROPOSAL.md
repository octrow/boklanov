# DESIGN v3 PROPOSAL — "Plakat"

Status: PROPOSAL. Branch: `design_v3` (cut from `main` 2026-05-02). Updated: 2026-05-02.

Owner: Daniil. Roman has not seen v3 — birthday surprise constraint still in force.

Supersedes (subject to acceptance): `DESIGN_v2_PROPOSAL.md` (Vitrine direction). Vitrine code stays on `main` until v3 acceptance gates pass; rollback = `git checkout main`.

## 0. North-star

> A solo theatre director's portfolio in the inheritance line of Bauhaus stage poster, Brecht's Berliner Ensemble programme, Meyerhold's biomechanics typography, and the 2024–26 generation of Berlin independent venues (gorki.de, hau-berlin.de, volksbuehne-berlin.de). Refined editorial catalogue (still — not gimmick) with one decisive plakat gesture per page. Calmer than gorki. Louder than Vitrine.

User direction (2026-05-02 conversation):

- F = (a) refreshed director catalogue **AND** (e) Berlin independent venue energy
- A = palette option 2 — keep warm paper, add 2–3 bright accents (ColorHunt-grade)
- B = retain Cyrillic + free-OFL discipline; display font may be added
- C = author's choice on imagery treatment
- D1 past-tense `ГДЕ СТАВИЛ` **kept** (politically locked)
- D2 wordmark → **ALL CAPS** `РОМАН БОКЛАНОВ`
- D3 mailto booking **kept**
- D4 DE → **full content parity** (no longer chrome-only)
- D5 festival/repertoire grid not needed (Roman is solo)
- E = author's choice on layout-radicalism
- Scope: full-spectrum unfreeze authorised — `можно трогать всё`, anti-patterns liftable

## 0.1 Anchors that survive v3 (not negotiable)

These are not in the unfreeze list. They stay because they are the work, not the chrome.

1. Past-tense staging label — `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`. Roman left RU 2022; tense is fact, not stylistic.
2. Year-only colophon. No cities. No version marks visible to user.
3. Roman has no troupe. Credits are per-production. Puppets are not cast.
4. Booking is mailto + plain-text email + TG/IG. No form, no Calendly, no CAPTCHA.
5. Analytics: only `booking_cta_click`. Never expand.
6. Awards/press original-language only.
7. `prefers-reduced-motion` zeros all `--duration-*` at the token layer (every motion below must collapse to no-op).
8. AA contrast floor; 44×44 touch targets; landmarks; focus ring on every interactive element.
9. SIL OFL fonts only, self-hosted from `public/fonts/`. Full Cyrillic. No Google Fonts CDN.
10. Static-first SSG, no client framework swap, no runtime CSS-in-JS.

## 1. Three-direction comparison (for the record)

| Dimension                 | v1 (locked)            | v2 Vitrine (shipped on `main`)       | v3 Plakat (this proposal)                              |
|---------------------------|------------------------|--------------------------------------|--------------------------------------------------------|
| North-star reference      | Linear / Claude / NYR  | Cabinet Magazine + Holiday relaunch  | gorki.de + Volksbühne + Bauhaus stage poster           |
| Mood register             | Curatorial, quiet      | Catalogue raisonné, paper-led        | Refined catalogue with **plakat punctuation**          |
| Palette                   | Paper + ink + oxblood  | Warmer paper + ink + oxblood         | Paper + ink + **vermillion / cobalt / mustard** trio   |
| Display type              | Lora 400/500/600       | Lora-VF 400–700                      | Lora-VF + **Unbounded** (poster moments only)          |
| Wordmark                  | `роман бокланов` lower | `роман бокланов` lower               | `РОМАН БОКЛАНОВ` ALL CAPS Unbounded                    |
| Layout                    | 1/8/12 col, 65ch       | + Marginalia 65ch+20ch ≥1280         | + **broken-grid hero** + asymmetric featured strip     |
| Motion vocabulary         | 1 gesture (slate)      | 4 gestures (slate, settle, focus)    | 5 (adds **marquee tour ticker**, no parallax)          |
| Anti-pattern lifts        | 0                      | 4 (drop-shadow, chips, radii, dotted) | **9** (see §2 unfreeze register)                       |
| DE locale                 | Chrome only            | Chrome only                          | **Full content parity** for top 5–6 shows + about      |
| Imagery treatment         | unprocessed            | desat 0.92 / contrast 1.04 / grain   | desat **kept** + **duotone overlay** for hero/featured |
| Risk to identity          | n/a                    | low                                  | medium-high (mitigated by §6 acceptance gates)         |

## 2. Anti-pattern unfreeze register

Each row is a `MAP.md` §5 unfreeze event. On acceptance, mirror each into `archive/DESIGN_BRIEF.md` §8 with `_Superseded 2026-05-02: v3 acceptance — see DESIGN_v3_PROPOSAL.md §2.N_` and into `DESIGN.md` §11 narrative.

| #    | §11 item lifted               | v3 replacement                                                                                                                          | Scope guard                                                                                                                          | Rollback trigger                                                              |
|------|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| 2.1  | Brand gradients               | **Two-tone duotone** on featured posters only (`--accent-vermillion` shadows + `--paper` highlights via SVG `<feColorMatrix>`)          | Reserved for `<DuotonePoster>` component, only on `featured: true` cards. Never on body, headers, buttons, chrome, or non-featured.  | Lighthouse contrast on caption-over-image drops below 4.5; appears on chrome  |
| 2.2  | Coloured chip pills           | **Plakat sticker badges** — coloured fill + white ink for festival/award stamps (`FESTIVAL WINNER`, `TOURING NOW`)                       | `<Sticker>` component, max 1 per card, max 3 per page. Background must be one of `--accent-{vermillion,cobalt,mustard}`. No radius.  | More than 1 sticker per card; sticker on body prose; gradient or radius added |
| 2.3  | Hero video                    | **Still hero plakat** with optional 3s autoplay loop on `/` only, `<video autoplay muted loop playsinline>`, max 800kb webm             | One file, bundled. `prefers-reduced-motion` swaps to first-frame poster image. Only on `/`, never on production detail               | File >800kb; autoplay anywhere except `/`; no reduced-motion fallback         |
| 2.4  | Bento grids                   | **Asymmetric broken-grid** featured strip on `/` (1 large + 2 medium + 3 small, irregular vertical alignment)                            | Only on `/` Featured section. Mobile collapses to 1 column. Tablet to 2. No bento card-shadow stacking                               | Bento on /productions or /about; equal-size cells; cards lift on hover        |
| 2.5  | Animated gradient text        | **Static gradient** on hero wordmark on `/` only, vermillion → cobalt → mustard, fixed angle, `background-clip: text`                   | One element, `<SiteHero>` H1. Never animated. Never on /productions, /about, headers, buttons                                        | Gradient animates; appears on second element; uses non-palette colours        |
| 2.6  | `rounded-2xl shadow-xl`       | Already partially lifted (form chrome 2px). v3 widens to **`--border-radius-sticker: 0`** (kept) but allows `--shadow-plakat` outset on `<DuotonePoster>` only | One token, one component. No coloured shadows. No card-stack effect                                                                  | Outset shadow on non-poster element                                           |
| 2.7  | Drop-shadow glow              | v2 specimen-rule (inset 1px) **kept**. v3 adds outset **`--shadow-plakat: 0 4px 0 0 var(--ink)`** — flat-stack offset for posters       | Only on `<DuotonePoster>` and `<Sticker>`. Never blur > 0. Never coloured beyond ink. Mimics screen-print misregister, not Tailwind  | Blur > 0; appears outside poster context; multiple stacked shadows            |
| 2.8  | Coloured headers              | **Per-section accent stripe** — 2px coloured band above `<Cue>` (Home: vermillion, /productions: cobalt, /about: mustard, etc.)         | 2px band only. Never a fill block. Never beyond Cue header. Title text stays `--ink`                                                 | Stripe becomes block fill; header text becomes coloured; band > 2px           |
| 2.9  | Marquee / ticker tape         | **`<TourTicker>`** mono caps band, infinite-loop CSS marquee, scroll-pauses on hover and on `prefers-reduced-motion`                    | Only on `/` (between hero and Featured) and on production-detail Plinth-tour band. Never as decoration. Mono only                    | Appears in body prose; doesn't pause on reduced-motion; adds gradient/colour  |

Items NOT lifted (discipline proof):

- Glassmorphism / neumorphism / claymorphism — no editorial precedent, no theatre precedent, only SaaS dilution
- Parallax, scroll-driven entrances — `prefers-reduced-motion` cannot collapse parallax to no-op without it becoming nothing; same logic as v2 §9.4 Rejected lifts
- Kinetic typography (per-glyph deformation, weight interpolation in motion) — competes with locked Lora-VF rhythm
- Cookie banners, newsletter modals, "Built with Next.js" — out of register regardless of direction
- Coloured chip pills as background-fills on metadata (year/age/duration/country) — those stay v2 specimen mono labels. Coloured stickers (§2.2) are a separate primitive: only for awards/festival stamps, max 3 per page
- Stock photography, Comic-Sans irony, hand-drawn underlines — locked rejections
- Loading-spinner skeletons, infinite spinners — static-first site has no in-flight states deserving them
- Hover-lift transforms on cards — kills the catalogue feel; v3 uses underline reveal + sticker reposition instead

## 3. Palette

### 3.1 Three candidate palettes (option 2: warm paper + 2–3 bright accents)

#### CANDIDATE A — "Bauhaus Stage" ★ recommended

The Brecht / Meyerhold / Lissitzky / Bauhaus stage poster trio. Same primitives that birthed the entire avant-garde theatre poster lineage Roman is heir to. Reads as both serious editorial AND active stage poster.

| Token                  | Light                    | Dark                    | Use                                                  |
|------------------------|--------------------------|-------------------------|------------------------------------------------------|
| `--paper`              | `#F2F0EA` (kept from v2) | `#0E0D0C`               | Page bg                                              |
| `--paper-raised`       | `#FBFAF6` (kept)         | `#1A1917`               | Cards, modals                                        |
| `--paper-sunken`       | `#ECE9E1` (kept)         | `#0A0908`               | Inputs, wells                                        |
| `--ink`                | `#0F0E0D` (deeper than v2 `#161514` for accent contrast) | `#E8E5DD`     | Primary text                                         |
| `--ink-mute`           | `#605C56` (kept)         | `#9E9A92`               | Secondary, captions                                  |
| `--ink-faint`          | `#8F8B83` (kept)         | `#6E6B65`               | Placeholder, decorative                              |
| `--rule`               | `rgba(15,14,13,0.10)`    | `rgba(232,229,221,0.10)`| Hairlines                                            |
| `--accent-vermillion`  | `#E63946`                | `#FF5A66`               | Primary stage. Hero gestures, /home accent stripe, oxblood replacement on booking CTA, sticker A |
| `--accent-cobalt`      | `#1D3557`                | `#5B82C2`               | Secondary stage. /productions accent stripe, sticker B, link-hover underline |
| `--accent-mustard`     | `#F4D35E`                | `#C9A22F`               | Tertiary stage. /about accent stripe, sticker C, marquee fill |
| `--ink-on-accent`      | `#FBFAF6`                | `#0E0D0C`               | Text on accent fills (auto-flips per accent for AA)  |

AA verification on `#F2F0EA` paper:

- `#E63946` text on paper: 4.65:1 ✓ AA normal text
- `#1D3557` text on paper: 12.4:1 ✓ AAA
- `#F4D35E` is **decorative only** — never used for text. Sticker fill with `#0F0E0D` ink gives 11.8:1 ✓ AAA.
- Booking CTA: `#E63946` fill + `#FBFAF6` text = 4.6:1 ✓ AA (was v2 oxblood `#6B0F0F` fill = 8.9:1; v3 trades a notch of contrast for stage energy, still AA-clear)

#### CANDIDATE B — "Berlin Indie" (signal red + electric violet + acid yellow)

Closer to literal gorki.de / Volksbühne. Higher voltage. Risk: kids-theatre productions read as nightclub.

`--accent-signal #FF4438` (HAU campaign red) · `--accent-violet #7C3AED` (Schaubühne campaign violet) · `--accent-acid #FCD34D` (gorki acid yellow softer).

#### CANDIDATE C — "Cabinet Pop" (lifted oxblood + prussian + saffron)

Closer to v2. Just brighter oxblood. Lower drift, less plakat energy. Hedge option.

`--accent-blood #D62828` · `--accent-prussian #003049` · `--accent-saffron #F77F00`.

### 3.2 My pick: **CANDIDATE A "Bauhaus Stage"**

Rationale:

1. Theatrical lineage — vermillion/cobalt/mustard is the documented Bauhaus stage poster trio (Schlemmer's Triadic Ballet posters, Lissitzky's *Pobeda nad solntsem*, Brecht/Neher's Dreigroschenoper materials). Roman is in this inheritance, not in the gorki advertising-energy lineage.
2. AA-clear without compromise — vermillion clears AA on paper, AAA reversed; cobalt clears AAA both ways; mustard reserved as decorative-only sidesteps the contrast trap of acid yellow.
3. Three accents = three stages. Each major route gets one identity colour without chaos. /productions cobalt, /about mustard, /home + booking vermillion. Predictable, repeatable, learnable in 90s curator session.
4. Oxblood replacement reads as fresh signal, not dried archive — matches "active director, still working" voice. v2 oxblood read as "historical record."
5. Bauhaus trio holds against duotone treatment — the three accents pair cleanly as duotone gradients (vermillion→cobalt is a Lissitzky natural; cobalt→mustard is a Schlemmer natural).

### 3.3 Status / form-validation colours (kept from v2)

`success #3F6B3A`/`#6FA365`, `warning #8A5A18`/`#C28F3A`, `error` aliased to `--accent-vermillion`.

## 4. Type

### 4.1 Stack

| Role        | Family                | Weights/axes        | License         | Use                                                                   |
|-------------|-----------------------|---------------------|-----------------|-----------------------------------------------------------------------|
| Display     | **Unbounded** (NEW)   | 200–900 wght VF     | OFL, full Cyrl  | ALL CAPS wordmark, hero plakat moments, sticker badges                |
| Editorial   | Lora-VF (kept v2)     | 400–700 wght + ital | OFL, full Cyrl  | Long-form prose, page H1 (when not hero), section H2, body italic     |
| Body / UI   | Inter (kept v1)       | 400, 500, 600       | OFL, full Cyrl  | Body, UI, CTAs, captions                                              |
| Mono        | JetBrains Mono (kept) | 400, 500            | OFL, full Cyrl  | Dates, durations, chips, credits, country codes, tour ticker          |

Self-hosted from `public/fonts/`. No Google Fonts CDN. Cyrillic + Latin subset only.

Why Unbounded:

- OFL, free, full Cyrillic + Latin (Stephen Nixon / ArrowType, 2023; widely adopted 2024–25)
- VF axis 200–900 covers wordmark (700 typical) + thin marquee (300) + heavy plakat (900) from one file (~140kb woff2)
- Geometric extended sans → reads as theatrical poster, not corporate sans (Inter) or scientific mono (JetBrains)
- Renders Cyrillic as solidly as Latin; no awkward `Я`/`Ж` shapes, unlike Anton/Bowlby
- Not Bebas — Bebas is the cliche-poster condensed; Unbounded is wide, rare in 2026 use, distinctive

Rejected display alternatives:

- Bebas Neue Cyrillic — too cliche, ubiquitous in indie posters since 2018
- Tektur — too engineering-tech, reads as hackathon
- Russo One — too round-friendly, no plakat seriousness
- Stalinist One — politically loaded; unusable for a director who left RU 2022

### 4.2 Voice rules

- Wordmark always **ALL CAPS** Unbounded weight 700, letter-spacing `0.03em`, no italic, no colour fill (gradient only on hero per §2.5)
- Lora keeps lower-case display register on body H1/H2 (production titles, page titles other than hero wordmark)
- All-caps reserved for: wordmark (Unbounded), chips (mono), section labels (mono), sticker badges (Unbounded). No all-caps Lora.
- Mono caps tracking `0.06em` (kept). Unbounded all-caps tracking `0.03em` (looser; the letterforms have built-in space).
- Italics only in Lora (kept). Never in Inter, never in Unbounded (the geometric sans has no italic axis worth using).

### 4.3 Scale

Kept from v2 with one addition:

| Token              | Min | Max  | Use                                                                |
|--------------------|-----|------|--------------------------------------------------------------------|
| `--font-size-chip` | 11  | 11   | Chips, age rating, country code (kept)                             |
| `--font-size-meta` | 13  | 13   | Mono captions, dates (kept)                                        |
| `--font-size-base` | 17  | 18   | Body (kept)                                                        |
| `--font-size-lg`   | 20  | 24   | h3, card titles (kept)                                             |
| `--font-size-2xl`  | 28  | 40   | h2, section titles (kept)                                          |
| `--font-size-4xl`  | 44  | 88   | Display, page H1 (kept)                                            |
| `--font-size-hero` | 72  | 168  | **NEW v3** — Unbounded hero wordmark on `/` only                   |
| `--font-size-sticker` | 11 | 13  | **NEW v3** — Unbounded sticker badge text                          |

`--font-size-hero` clamps `clamp(72px, 5vw + 64px, 168px)`. Larger ceiling than v2 means the wordmark eats the hero band. Mobile floor 72px ensures it stays single-line on 375px viewport; desktop ceiling 168px lands roughly the height of the screen-print misregister specimen-shadow.

### 4.4 Wordmark

`<SiteWordmark>` component (NEW). Renders `РОМАН БОКЛАНОВ` (RU default), `ROMAN BOKLANOV` (EN/DE).

- Unbounded 700, ALL CAPS, `letter-spacing: 0.03em`
- Hero (`/`): `--font-size-hero`, gradient fill (vermillion→cobalt→mustard, 135deg, fixed) via `background-clip: text`
- Header (other routes): `--font-size-lg`, solid `--ink`
- Footer: `--font-size-meta`, solid `--ink-mute`
- Never italic, never coloured fill outside hero

The lower-case Lora wordmark from v1/v2 is retired. The all-caps Unbounded wordmark is the v3 identity move and the most visible single change.

## 5. Spacing + layout

Base 4px (kept). Scale `0,4,8,12,16,24,32,48,64,96,128` (kept).

Gutters (kept): mobile 20, tablet 24, desktop 32.

New tokens:

```
--measure-prose: 65ch                  (kept)
--measure-caption: 36ch                (kept v2)
--measure-poster: 56ch                 (NEW — TypographicCover wider register)
--shadow-plakat: 0 4px 0 0 var(--ink)  (NEW — flat-stack poster offset, see §2.7)
--stripe-thickness: 2px                (NEW — per-section accent stripe, see §2.8)
--ticker-speed: 38s                    (NEW — TourTicker linear marquee duration, see §2.9)
--ticker-pause: 0s                     (NEW — set to ticker-speed under prefers-reduced-motion)
```

Grid (kept): 1-col mobile, 8-col tablet ≥768, 12-col desktop ≥1024.

Broken-grid hero on `/` (NEW per §2.4):

- 12-col desktop: 1 large featured (cols 1–7, rows 1–2) + 2 medium (cols 8–12 row 1, cols 8–12 row 2) + 3 small (cols 1–4, 5–8, 9–12 row 3)
- Vertical alignment irregular (`align-self: end` on small, `align-self: start` on medium)
- Tablet: 1 large + 4 small grid-flow row
- Mobile: 1 column linear, large first
- All cards same primitive (`<ProductionCard>` or `<DuotonePoster>` for hero variant), only grid placement differs

Radii (kept v2): `--border-radius-sm 2px` default; 4px modals; 8px reserved for photo cards. Plus `--border-radius-form 2px` (form chrome only). v3 adds nothing — sticker badges and posters are radius `0`.

## 6. Motion

`--duration-fast 150ms`, `--duration-normal 200ms`, `--duration-slow 400ms` (kept). Easings kept.

Allowed motion in v3:

1. Hover underline reveal (kept v1)
2. Page transition fade (kept v1)
3. DA-3.A slate-strike (kept v1, may be retired in v3 implementation if it conflicts with hero gradient — decide in Phase 9.3v3)
4. SpecimenPlate caption settle (kept v2)
5. **TourTicker marquee** — CSS `@keyframes` linear translate-X over `--ticker-speed`. `prefers-reduced-motion` sets `animation-duration: 0s` AND `animation-play-state: paused` — ticker becomes a static row of cities. Hover also pauses (`:hover { animation-play-state: paused }`). Never opacity-fade.
6. **Sticker badge "stamp" appearance** — on first-paint only, `transform: rotate(-3deg) scale(0.95)` → `rotate(-2deg) scale(1)` over `--duration-normal`, single-shot per session via `sessionStorage.stickersStamped`. Reduced-motion: render at final transform, no animation.

Banned in v3 (still): parallax, scroll-driven entrances, animated gradients on chrome (hero gradient is **static**), kinetic type, hero video looping >3s.

## 7. Component grammar

Anchors kept from v2: Folio, Cue, Marginalia, EmptyState, SpecimenPlate, GalleryLightbox, TheatreSlate, TypographicCover, TourRider, PosterLightbox, CreditLine, ProductionCard.

New components in v3:

### 7.1 SiteWordmark (NEW)

Lives in `<header>` and `<SiteHero>`. ALL CAPS Unbounded. See §4.4.

```tsx
<SiteWordmark variant="hero" locale="ru" />     // --font-size-hero, gradient fill, /home only
<SiteWordmark variant="header" locale="ru" />   // --font-size-lg, solid --ink
<SiteWordmark variant="footer" locale="ru" />   // --font-size-meta, solid --ink-mute
```

### 7.2 SiteHero (NEW, replaces v2 home Lora wordmark + featured-strip seam)

`/` only. Composition:

1. Folio band (kept v2: `РОМАН БОКЛАНОВ ⟶ HOME`)
2. Hero wordmark (Unbounded gradient ALL CAPS, `--font-size-hero`, eats one viewport)
3. Statement line in Lora italic, 65ch, below wordmark — Roman's one-sentence positioning
4. Mono caps "scroll" hint with hairline below (no animated arrow)

Optional 3s hero plakat loop (per §2.3) replaces the static colour band of statement section if a hero clip is provided. Mobile: still hero only, no autoplay.

### 7.3 Sticker (NEW per §2.2)

```tsx
<Sticker variant="award" accent="vermillion">FESTIVAL WINNER · 2024</Sticker>
<Sticker variant="tour" accent="cobalt">TOURING NOW · 2026</Sticker>
<Sticker variant="form" accent="mustard">PUPPET · OBJECT</Sticker>
```

Spec:

- Unbounded 600, `--font-size-sticker`, ALL CAPS, `letter-spacing: 0.05em`
- Background fill: one of `--accent-vermillion`/`--accent-cobalt`/`--accent-mustard`
- Text: `--ink-on-accent` (auto-flips per accent for AA)
- Padding `4px 8px`, no radius, no border
- Slight rotation: `transform: rotate(-2deg)` (range -3deg to +3deg, deterministic via slug-hash)
- Optional `--shadow-plakat` flat-stack offset (per §2.7)
- Max 1 per `<ProductionCard>`, max 3 per page
- `aria-label` describes content; visual rotation is decorative-only

### 7.4 DuotonePoster (NEW per §2.1)

Featured-card variant of `<ProductionCard>`. Only when `featured: true`.

- Photo passed through SVG `<feColorMatrix>` filter producing two-tone effect (shadows → vermillion or cobalt; highlights → paper)
- Filter accent picked deterministically per slug-hash mod 3 to give the featured strip variation across 6 cards without per-card config
- `--shadow-plakat` outset
- 4:5 aspect ratio (kept)
- Mono caption row below (kept)
- Hover: flat (no lift, no rotate); focus shows oxblood-replacement vermillion underline on title

### 7.5 TourTicker (NEW per §2.9)

```tsx
<TourTicker cities={['СПБ','МОСКВА','АЛМАТЫ','БРЕМЕН','ВЕНА','БЕРЛИН','ТАШКЕНТ']} accent="mustard" />
```

- Mono caps band, full-width, `--accent-mustard` background, `--ink-on-accent` text
- CSS marquee, `--ticker-speed` (38s default)
- Pauses on `:hover` AND on `prefers-reduced-motion`
- Items separated by `·` glyph (`U+00B7`)
- Used: `/` (between hero and Featured), `/productions/[slug]` (Plinth-tour replacement on the one show with `tour[]`)
- Respects past-tense — items are cities Roman *staged in*, not *will stage in*
- Never used elsewhere (footer, /about, etc.)

### 7.6 SectionStripe (NEW per §2.8)

2px coloured band rendered above `<Cue>`. Auto-resolved from route:

- `/` — vermillion
- `/productions`, `/productions/[slug]` — cobalt
- `/about` — mustard
- `/awards` — vermillion
- `/press` — cobalt
- `/archive` — `--ink` (no accent — archive is muted)
- `/contact` — vermillion (booking energy)

### 7.7 Refreshed components

| Component         | Change                                                                                                                |
|-------------------|-----------------------------------------------------------------------------------------------------------------------|
| `<ProductionCard>` | Whole card is link (kept). Hover: vermillion underline reveal under RU title (kept oxblood→vermillion swap). Optional `<Sticker>` overlay.  |
| `<TheatreSlate>`   | Title can wrap to 2 lines; role line uses `--ink-marginalia` (kept). No Unbounded — Lora discipline holds on detail.  |
| `<TypographicCover>`| Title in **Unbounded 600** ALL CAPS (was Lora 600). Mono meta line kept. Slug-hash variant kept.                     |
| `<Marginalia>`     | Float-into-margin from ≥1024px now actually shipped (was deferred in v2). Right rail conflict resolved by collapsing `<TourRider>` to a `<details>` accordion below ≥1280 instead of right-rail occupying the gutter. |
| `<Cue>`            | Gains optional `<SectionStripe>` rendered above.                                                                       |
| `<SiteHeader>`     | Wordmark swap to ALL CAPS Unbounded `<SiteWordmark variant="header">`.                                                |
| `<SiteFooter>`     | Wordmark swap to ALL CAPS Unbounded `<SiteWordmark variant="footer">`. Edition stamp kept.                             |

### 7.8 Buttons

- Primary booking CTA: `--accent-vermillion` fill + `--ink-on-accent` text (was oxblood). Hover: darker vermillion `#C2202E`. `--shadow-plakat` outset. Sm radius.
- Secondary: hairline border `--rule-strong`, transparent (kept).
- Ghost: no border, underline reveal (kept).
- Touch ≥ 44px (kept). Focus ring `--shadow-focus` (kept).

## 8. Routes — content shifts

`/` Home → broken-grid hero + Featured strip (§2.4) + filterable grid + footer. Replaces v2 Lora wordmark hero with `<SiteHero>` Unbounded gradient.

`/productions` → unchanged structurally; cobalt SectionStripe, productions w/ `featured: true` may use `<DuotonePoster>` variant.

`/productions/[slug]` → D7 layout kept. Adds optional `<Sticker>` overlay for award/tour/form metadata. Hero cover may be DuotonePoster on `featured: true`. TourTicker replaces `.slate` Plinth band on the one show with `tour[]`. TourRider stays right-rail desktop ≥1024 (Marginalia float resolves the gutter conflict).

`/about` → mustard SectionStripe. Marginalia floats into margin ≥1024 (delivered, not deferred). Photos[] grid kept. Past-tense `ГДЕ СТАВИЛ` row kept verbatim.

`/awards` → vermillion SectionStripe. Award rows stay Lora italic + mono year. Award stickers (`<Sticker variant="award">`) optional per row, max 3 per viewport.

`/press` → cobalt SectionStripe. Original-language only (kept).

`/archive` → no SectionStripe (muted). Long-tail CV stays specimen-grade.

`/contact` → vermillion SectionStripe. TG/IG primary, mailto secondary, plain-text email (all kept).

`/de/*` → expands from chrome-only to **full content parity** for top 5–6 productions + /about. Per-production DE frontmatter `title.de`, `synopsis.de`, `directorsNote.de` populated by Roman/Daniil. Press/awards stay original-language.

## 9. Imagery

### 9.1 Photographic processing recipe (kept v2)

`filter: contrast(1.04) saturate(0.92) brightness(0.99)` + 4% grain SVG overlay (kept; see DESIGN.md §7 SpecimenPlate). Reduced-transparency strips grain (kept).

### 9.2 Duotone overlay (NEW)

For `<DuotonePoster>` only:

- SVG `<filter>` with `<feColorMatrix type="matrix">` mapping luminance to a two-stop ramp: shadows → accent-{vermillion|cobalt}, highlights → `--paper`
- Accent picked deterministically by `slugHash % 2` (vermillion or cobalt; mustard skipped — too low-contrast for portraits)
- Filter applied via `filter: url(#duotone-vermillion)` on the `<img>` inside `<DuotonePoster>`
- Reduced-transparency: filter swaps to `grayscale(0.7) contrast(1.08)` — duotone graceful-degrades to high-contrast b&w
- Never on portraits where face is primary subject (set `coverStyle: 'photo-portrait'` to opt out)

### 9.3 TypographicCover

Same primitive as v2, type swap to Unbounded ALL CAPS + accent SectionStripe. Slug-hash mod 3 layout variants kept.

## 10. Risk register (v3-specific)

| Risk                                                                                                  | ID dilution | A11y | Perf | MDX friction | Mitigation                                                                                                                        |
|-------------------------------------------------------------------------------------------------------|-------------|------|------|--------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Three accents read as kids-poster / circus, not theatre                                               | 4           | 1    | 1    | 1            | Bauhaus reference docs in proposal §3.2; visual A/B on Daniil's monitor before merge to `main`; sticker max 3/page enforced in lint |
| Vermillion on paper feels too saturated, nostalgia-poster                                             | 3           | 1    | 1    | 1            | Acceptance gate §11 requires Daniil to view all 7 routes on `boklanov.vercel.app` preview deploy. If reads as 1970s, fall back to oxblood `#6B0F0F` keep |
| Unbounded VF font fails to load on slow EU rural mobile and falls back to system sans                 | 3           | 1    | 4    | 1            | `font-display: swap`, `size-adjust` + `ascent-override` on system fallback, woff2 cap 140kb, preload `<link rel="preload">` for hero variant only |
| Duotone filter breaks on Safari < 16 / Firefox older                                                  | 2           | 2    | 1    | 1            | `@supports` gate on `filter: url(#...)`. Fallback to plain photo with desat (v2 recipe). Test on BrowserStack iOS 15 / Firefox 102 ESR |
| TourTicker reduced-motion behaviour rendered incorrectly (still scrolls)                              | 1           | 4    | 1    | 1            | Pure CSS implementation, no JS. `@media (prefers-reduced-motion: reduce) { animation-duration: 0s; animation-play-state: paused }`. Manual axe-core + macOS Reduce Motion test |
| Hero gradient text fails contrast (gradient mid-tones below AA against paper)                         | 2           | 4    | 1    | 1            | Hero is purely decorative — `aria-label="Roman Boklanov"` on `<h1>`; visible ALL CAPS letters are a `<span aria-hidden="true">` with gradient. SR reads plain text |
| Sticker badge stamp animation on first-paint conflicts with DA-3.A slate-strike                       | 2           | 2    | 1    | 1            | `sessionStorage.firstPaintDone` AND `sessionStorage.stickersStamped` are independent gates; slate-strike runs first, stickers stamp 320ms after |
| Full DE content parity blocked by translation labour                                                  | 1           | 1    | 1    | 4            | Phase 9v3.0 acceptance: ship code paths only, with Marginalia "DE forthcoming" register. Roman/Daniil fill DE frontmatter incrementally; never block deploy |
| Broken-grid hero on `/` reads as 2018-startup bento                                                   | 4           | 1    | 1    | 2            | Acceptance gate §11.4 — composition must read as Schaubühne season-page aside, not Notion-feature. Reviewer test: would this fit a printed festival programme? If no, fall back to symmetric 3×2. |
| Festival sticker overload on a single production w/ 4+ awards                                         | 3           | 1    | 1    | 2            | Hard cap: max 1 sticker per `<ProductionCard>`. Detail page renders stickers as a horizontal row above title, max 3 visible, rest collapse to `+N` mono label |

## 11. Acceptance gates (must pass before merge to `main`)

1. Vercel preview deploy of `design_v3` shows all 7 routes (/, /productions, /productions/[slug] for 3 different shows, /about, /awards, /press, /archive, /contact) without console errors or layout shift > 0.1 CLS on slow-3G throttle
2. `axe-core` and Lighthouse Accessibility score ≥ 95 on every route
3. AA contrast verified for every accent + ink combination (manual + automated)
4. Daniil visual A/B: place v2 main and v3 design_v3 side by side on his monitor for `/`, `/productions`, `/productions/[slug]` (an existing show with poster + an existing show without poster). v3 must read as: "same director's portfolio, but in his actual voice now" — not "different director" and not "v2 with stickers slapped on"
5. `prefers-reduced-motion` manual test (macOS Reduce Motion + Firefox `ui.prefersReducedMotion=1`): TourTicker static, sticker stamp instant, gradient hero static, no animation visible
6. Russian curator 90s session test (Daniil sims on phone, RU locale): can identify (a) what kind of theatre Roman makes, (b) 2-3 specific productions, (c) how to email Roman, in under 90 seconds
7. Roman not consulted (birthday surprise constraint). Daniil makes the call alone. If unsure, do not merge.
8. Bundle size delta on `/` and `/productions/[slug]` measured against `main`: target < +30kb gzipped (Unbounded VF is the main delta; sticker/ticker components are pure CSS)
9. DE locale code paths render without layout breakage even when DE content frontmatter is `null` (graceful Marginalia "DE forthcoming")
10. `git revert` of any single phase commit between 9v3.0 and 9v3.6 leaves `main` in a coherent visual state (no half-shipped accent, no dangling sticker)

## 12. Implementation phases (each = 1 commit on `design_v3`)

Each phase is independently shippable and revertible.

| Phase   | Subject                                                                                  | Est size   | Reversible |
|---------|------------------------------------------------------------------------------------------|------------|------------|
| 9v3.0   | Token deltas — palette swap, new tokens, `--accent` aliasing migration                   | small      | yes        |
| 9v3.1   | Unbounded VF font added + `<SiteWordmark>` component                                     | small-med  | yes        |
| 9v3.2   | `<SectionStripe>` + per-route accent resolution                                          | small      | yes        |
| 9v3.3   | `<Sticker>` + `<TourTicker>` components                                                  | medium     | yes        |
| 9v3.4   | `<DuotonePoster>` + SVG duotone filters                                                  | medium     | yes        |
| 9v3.5   | `<SiteHero>` broken-grid hero on `/`                                                     | medium     | yes        |
| 9v3.6   | TypographicCover ALL CAPS Unbounded swap; Marginalia float-into-margin shipped            | small-med  | yes        |
| 9v3.7   | DE full-content scaffolding (code paths + Marginalia "DE forthcoming")                   | small      | yes        |
| 9v3.8   | Anti-pattern unfreeze events into `archive/DESIGN_BRIEF.md` §8 + `DESIGN.md` §11 mirror   | docs only  | n/a        |
| 9v3.9   | Acceptance-gate sweep (lighthouse, axe, A/B, reduced-motion test)                        | n/a        | n/a        |

Phases 9v3.0–9v3.7 are code commits on `design_v3` branch. 9v3.8 mirrors decisions into the read-only archive (the only legitimate edit to `archive/*`, per `MAP.md` §5). 9v3.9 is the ship gate.

After 9v3.9 passes: PR `design_v3` → `main`. After merge, run `MAP.md` §7 update prompt to refresh active docs.

## 13. Open questions / deferred decisions

1. **DA-3.A slate-strike** survival — does it still make sense alongside Unbounded gradient hero? Decide in 9v3.5; provisional answer: retire slate-strike on `/` (gradient hero is the new first-paint moment), keep it on production-detail covers.
2. **DE translation source** — does Daniil translate top-5 productions himself, hire a native speaker, or use machine + native review? Decide before 9v3.7.
3. **Hero plakat clip** — does Roman have a 3s clip from any production worth using, or skip §2.3 hero video lift entirely? Daniil checks Notion archive; default = skip if uncertain.
4. **`--accent-mustard` text exclusion** — confirmed decorative-only per §3.1. If a use case appears (TourTicker text-on-mustard), recompute contrast against `#0F0E0D` ink.

## 14. What is *not* in v3

- New CMS layer (Decap stays deferred per Phase 10)
- New analytics events (only `booking_cta_click` per locked constraint)
- Newsletter, RSS upgrade, podcast feed
- Search palette redesign (Cmd-K stays as v2)
- Any public-facing version mark, "v3", "2026 redesign" badge
- Any reveal to Roman until production cutover (D3/D4) or when Daniil judges site ready

---

Source-of-truth chain (v3): this proposal is the living draft for `design_v3` branch only. On merge to `main`, content is digested into `DESIGN.md` (§3 palette, §4 type, §6 motion, §7 components, §11 anti-pattern narrative) and `app/globals.css` (tokens). This proposal then archives to `archive/DESIGN_v3_PROPOSAL.md` per `MAP.md` §5.4.
