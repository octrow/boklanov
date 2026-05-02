# DESIGN

Visual identity + IA + token essentials. Updated: 2026-05-02 (session 3).

Owns: palette, type, motion, component grammar, anti-patterns, route map, IA rules.
Runtime tokens: `app/globals.css`.

History (read-only, consult for "why"; do not edit in routine work). Read `*_compress.md` first; open full original only if detail is missing:
`.design/boklanov-rewrite/archive/DESIGN_BRIEF_compress.md` (D1-D15), `archive/tokens_compress.md` (per-token rationale),
`archive/INFORMATION_ARCHITECTURE_compress.md` (per-route detail, flows, naming, growth plan),
`archive/DESIGN_AMBITION_compress.md` (Phase 7.5 fingerprints + 7.6 backlog rationale + §13.1 audit).

## 1. Identity

Frame around the work. Warm editorial body + brutalist mono accents. One reserved colour: oxblood. Photo carries colour;
chrome stays still. Curator on mobile, 90s: must walk away with what kind of theatre + 2-3 productions + non-Instagram
contact.

References borrowed for grammar, never fingerprints: linear.com, claude.ai (warm), granola.ai, the-newyorker.com.

## 2. Mood axis

| Yes                                                 | No                                           |
|-----------------------------------------------------|----------------------------------------------|
| Curatorial, quiet, declarative                      | Promotional, hyped                           |
| Warm paper + hairlines                              | Dark glass + glow                            |
| Lora display / Inter body / JetBrains Mono metadata | Variable display fonts, Comic-Sans irony     |
| Photos carry colour                                 | Brand gradients                              |
| One signature gesture, fade transitions             | Parallax, scroll-driven, animated gradients  |
| Hairline rules, sharp corners                       | Drop-shadows, soft 16px radii, glassmorphism |
| Production photos credited                          | Stock "diverse smiling team"                 |
| Spacious, Japanese Ma                               | Bento grids, marketing density               |

## 3. Colour

Light (`--paper`/`--ink`/`--accent`):

- `--paper #F4F2EC` warm off-white
- `--paper-raised #FBFAF6` cards/modals
- `--paper-sunken #ECE9E1` inputs/wells
- `--ink #161514` primary text
- `--ink-mute #605C56` secondary, dates, captions
- `--ink-faint #8F8B83` placeholder, disabled, decorative metadata
- `--rule rgba(22,21,20,0.10)` hairlines
- `--rule-strong rgba(22,21,20,0.18)` hover/active borders
- `--accent #6B0F0F` oxblood. Reserved for: (1) booking CTA fills, (2) hover underline reveal on primary links, (3)
  focus ring. Nowhere else.

Dark (auto via `prefers-color-scheme`, manual via `[data-theme="dark"]`):

- `--paper #0E0D0C` soft black, never `#000`
- `--ink #E8E5DD`
- `--ink-mute #9E9A92`
- `--rule rgba(232,229,221,0.10)`
- `--accent #A82626` lifted oxblood, AA on `#0E0D0C`

Status (muted, form-validation only): success `#3F6B3A`/`#6FA365`, warning `#8A5A18`/`#C28F3A`, error `#6B0F0F`/
`#C95151`.

Components reference semantic aliases (`--color-bg-primary`, `--color-text-secondary`), not raw paper/ink.

## 4. Type

Self-hosted from `public/fonts/`. SIL OFL. Full Cyrillic. No Google Fonts CDN.

| Role    | Family         | Weights       | Use                                             |
|---------|----------------|---------------|-------------------------------------------------|
| Display | Lora           | 400, 500, 600 | Hero name, page H1, section H2                  |
| Body    | Inter          | 400, 500, 600 | Long-form prose, UI, CTAs                       |
| Mono    | JetBrains Mono | 400, 500      | Dates, durations, chips, credits, country codes |

Voice rules:

- Wordmark always lowercase: `роман бокланов` / `roman boklanov`.
- All-caps reserved for chips, mono caps, `letter-spacing: 0.06em`.
- Italics only in Lora (press attribution, subtitles). Never in Inter body.
- Mono for any number that's not a price.

Scale (fluid `clamp(min@375, mid, max@1280)`):

| Token              | Min | Max | Use                             |
|--------------------|-----|-----|---------------------------------|
| `--font-size-chip` | 11  | 11  | Chips, age rating, country code |
| `--font-size-meta` | 13  | 13  | Mono captions, dates            |
| `--font-size-base` | 17  | 18  | Body                            |
| `--font-size-lg`   | 20  | 24  | h3, card titles                 |
| `--font-size-2xl`  | 28  | 40  | h2, section titles              |
| `--font-size-4xl`  | 44  | 88  | Display, page H1                |

Tracking: `--letter-spacing-tight -0.015em` (Lora display), `--letter-spacing-wide 0.06em` (mono caps),
`--letter-spacing-meta 0.01em` (mono captions).
Line-heights: tight 1.15, snug 1.3, normal 1.55, relaxed 1.7 (`/about` prose).

## 5. Spacing + layout

Base 4px. Scale: `0,4,8,12,16,24,32,48,64,96,128` -> `--space-0..10`.

Gutters: mobile 20px, tablet 24px, desktop 32px.

Reading measure: `--max-width-prose 65ch`. Content: 1080px. Wide hero: 1280px. Hard ceiling: 1440px.

Grid: 1-col mobile, 8-col tablet (≥768), 12-col desktop (≥1024).

Radii (sharp wins): `--border-radius-sm 2px` default (chips, buttons), `4px` modals, `8px` reserved (photo cards). No
`rounded-2xl`.

Shadows hairline-first: `--shadow-sm` low lift, `--shadow-md` Cmd-K + dropdowns, `--shadow-lg` modals only,
`--shadow-focus 0 0 0 2px var(--paper), 0 0 0 4px var(--accent)`.

Z: `--z-base 0`, `--z-raised 10`, `--z-sticky 100`, `--z-overlay 500`, `--z-modal 1000`, `--z-toast 2000`.

## 6. Motion

`--duration-fast 150ms` hover, `--duration-normal 200ms` page-fade, `--duration-slow 400ms` gesture ceiling.
Easing: `--easing-default cubic-bezier(0.4,0,0.2,1)`, `--easing-editorial cubic-bezier(0.22,0.61,0.36,1)`.

Allowed:

1. Hover underline reveal (150ms, primary links + CTAs only).
2. Page transition fade (200ms, no slide).
3. DA-3.A slate-strike + DA-3.C edition-frame fallback (320ms, home first paint, once per session). Gated by
   `sessionStorage.firstPaintDone`, `?gesture=off`, and `prefers-reduced-motion`.

Banned: parallax, scroll-driven entrances, animated gradients, kinetic type, hero video.

`prefers-reduced-motion` zeros all `--duration-*` at the token layer. Components must reference tokens, never hardcode
ms.

## 7. Component grammar

Page chrome is a frame. Hairline rules separate sections. Header sticky on production detail only. Footer minimal: three
columns of mono links + colophon. No newsletter signup, no "Built with Next.js".

Folio (Phase 7.5, `c7a1b50`; updated session 5): mono caps running line above nav in `<header>`, `aria-hidden="true"`. Format: `РОМАН БОКЛАНОВ ⟶ SECTION ⟶ 01 / 24`. Home page shows just `РОМАН БОКЛАНОВ` (no section arrow). `folioFor()` in `lib/folio.ts`. Footer mirrors with `2026 EDITION` / `2026 ИЗДАНИЕ` / `AUSGABE 2026`. Year only. No cities.

Edition stamp (footer): `<small class="colophon">` mono caps, hairline above.

Cue marks (Phase 7.5): `<Cue mark="CUE I">` wrapping H2 on `/about`, `/awards`, `/productions/[slug]`. Mono caps +
hairline below mark. `aria-hidden="true"` on the span.

Production card:

- 4:5 cover top, no radius, no border.
- Lora RU title, Inter EN title `--ink-mute`.
- Mono meta row: `theatre · PREM YYYY · ageRating · countryCode`. `font-variant-numeric: tabular-nums`.
- Whole card is the link. Hover: oxblood underline reveal under RU title, no card lift.
- No-poster fallback = deliberate typographic treatment. `coverStyle` only when `poster.src && poster.lqip`.

Marginalia (Phase 7.6, `00c2501`): `<Marginalia note="...">` wraps prose on `/about`. ≥1280px:
`grid-template-columns: minmax(0,65ch) minmax(0,20ch)`, note in right column with `border-left: 1px solid var(--rule)`,
mono `--font-size-meta`. Below 1280px: note renders as italic Lora subordinate text inline. `aria-hidden="true"` on
`<aside>`. `rowSingle` (no note) constrains to `--max-width-prose`.

EmptyState (Phase 7.6, `e1920af`): editorial empty-state register. Top hairline rule → `ERRATA` mono caps chip
(`aria-hidden="true"`) → italic Lora body (55ch max-width) → optional `action` slot (ReactNode). Used on
`ProductionGrid` (filter empty + clear-filters ghost button), archive, awards, and press pages. `CommandPalette`
no-results uses equivalent inline markup for layout containment reasons.

PosterLightbox (session 5): `<PosterLightbox src alt>` client component wrapping the production cover. Click opens a full-image overlay (`--z-overlay 500`, dark backdrop). Close via `✕` button (44px touch target, 2px radius), click on backdrop, or Escape. `cursor: zoom-in` on trigger. On open: focus moves to close button, body scroll locked. On close: focus returns to trigger.

Production detail (D7 layout, top -> bottom):

1. Cover: `max-height: 65vh`, `object-fit: contain`, centered. Natural aspect ratio, no cropping. `PosterLightbox` wraps for click-to-expand.
2. Run-of-show row (Phase 7.6): optional `runs[]` frontmatter. Mono chip row above title: `RUN · venue · city · yearFrom–yearTo · count`. Hidden when `runs[]` empty.
3. Title block: RU display Lora + smaller EN + DE if present. Top rule on `.titleBlock`.
4. Chips row mono caps: `[18+] [2020] [90 MIN] [RU]`. Sharp corners.
5. Synopsis Lora italic.
5b. Director's note (Phase 7.6): optional `directorsNote.{ru,en}` frontmatter. Italic Lora `<blockquote>` with 2px hairline left rule + mono attribution `— РОМАН БОКЛАНОВ`. Hidden when field absent.
6. Credits as `<dl>` with leader-dot rows. `Director ........ Roman Boklanov`. Cast sub-block under hairline. No "in
   order of appearance". No puppet-as-cast.
6. Action bar: Watch/listen (oxblood primary), Tech rider (PDF), Press kit (ZIP). Hide when asset absent.
7. ON TOUR band (Plinth only): mono caps row of cities, hairline above + below. Driven by `tour[]`; empty -> hidden. No
   links.
8. Gallery: `columns: 2` masonry tablet+, original aspect. Credit visible (mono caption under), not hover.
9. Critic quotes: Lora italic `<blockquote>` with hairline left rule, mono attribution.
10. Awards: list, mono year + name + city.
11. External theatre links: single mono row.
12. Recommends: 3 cards. Same form -> same age bucket -> most recent year. Lineage = tiebreaker.
13. Sticky CTA `Email Roman about touring this show`. Mailto with prefilled subject + show name. `IntersectionObserver`
    on cover. Right-rail grid on desktop, fixed bottom on mobile. `--z-sticky 100`.

Theatre slate (right rail desktop): bordered mono spec sheet. `PRODUCTION 14 / 24` index, title block,
`YEAR/RUNTIME/AGE/COUNTRY/THEATRE/PREMIERE` rows, optional `TOURING SOLO`. `font-variant-numeric: tabular-nums`.

Chips: JetBrains Mono uppercase, `letter-spacing: 0.06em`, `--paper-sunken` bg, `--border-radius-sm`. No coloured chips.
No status hue.

Buttons:

- Primary: oxblood fill, `--paper` text, sm radius. Hover -> `--accent-hover`. No shadow.
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
/de/*                   Chrome only. /de/productions/[slug] grid only; card text stays RU/EN. /de/about full DE for top 5-6 shows v2.

/api/og/[slug]          Per-production OG (1200x630, satori `ImageResponse`)
/sitemap.xml            hreflang RU<->EN only; DE excluded
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
- "AI-Native UI" chips, animated gradient text, kinetic gradient meshes
- Hero video
- Bento grids on home
- Tailwind defaults `rounded-2xl shadow-xl`
- Stock photography
- Comic-Sans-as-irony, "puppet show" pastiche, hand-drawn underlines
- Loading-spinner skeletons that animate forever
- Cookie banner taking bottom 20%
- Newsletter modal on first visit
- "Built with Next.js" in footer
- Coloured chip pills (status -> font weight, not hue)
- Drop-shadow glow on cards, neon focus — _narrowed 2026-05-02_: `--specimen-rule: inset 0 0 0 1px rgb(22 21 20 / 0.08)` allowed on photographic plates only (`coverStyle === 'photo'` AND ≥768px), scoped to `SpecimenPlate.module.css`. NEVER `blur > 0`, NEVER outset, NEVER coloured, NEVER on hover. Outer drop-shadow remains banned. See `DESIGN_v2_PROPOSAL.md` §2.1.
- Coloured headers with white text

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

No logo. Lora, all-lowercase, language-aware. RU `роман бокланов`, EN `roman boklanov`, DE `roman boklanov` (not
transliterated). Header `--font-size-lg`, hero `--font-size-4xl`. Never caps, italic, or coloured.

## 14. Source-of-truth chain

This doc is the live source. `app/globals.css` mirrors §3-6 tokens. Components must obey §7 + §11. The `archive/` folder is read-only history; read `*_compress.md` first, open the full original only if detail is missing, never edit during routine work.

If a component contradicts this doc, fix the component. If reality contradicts this doc (a locked decision is genuinely
changing), that is a `MAP.md` §5 unfreeze event — surface it, don't silent-edit the brief.
