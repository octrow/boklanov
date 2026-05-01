# DESIGN.md — boklanov.com / boklanov.ru

> Canonical visual-identity document for the v2 rewrite. **Locked 2026-04-30.**
>
> **Source-of-truth chain:**
> `DESIGN_BRIEF.md` (locked decisions, why) →
> `DESIGN.md` (this file — visual identity, how it looks and feels) →
> `tokens.css` / `tokens.md` (runnable values + reference) →
> `app/globals.css` (Phase 4 integration target).
>
> If a component contradicts this doc, that's a brief change and needs explicit
> sign-off in `DESIGN_BRIEF.md` first — not a unilateral pivot during build.

---

## 1. The one-paragraph identity

The site is a **frame around the work**. Roman makes puppet theatre, theatre of
objects, and contemporary work for kids and teens — physical, hand-made,
quiet-then-loud. The site has to feel like that, not like a Notion theme and
not like another SaaS portfolio. It is **warm editorial** in its body — paper
white, ink black, generous breathing room, transitional serif headlines — with
**brutalist mono accents** for everything machine-like (dates, durations, age
ratings, country codes, credits). One reserved colour: oxblood, used only where
a curator needs to act. No gradients, no glass, no hero video, no kinetic type.
The work brings the colour; the chrome stays still.

A festival curator opening the site on mobile in 90 seconds should feel: *this
person is serious, this body of work is real, I know how to email them.*

---

## 2. Aesthetic family

**(α) Warm editorial** as the base + **(δ) Brutalist accents** for metadata.
Locked in brief D10. References (read for tone, do not copy):

- `linear.com` — restraint, hairline rules, mono metadata
- `claude.ai` (warm side) — paper background, generous spacing
- `granola.ai` — indie editorial typography
- `the-newyorker.com` — display-serif voice, mono captions

**Reference cribbing rules.** Borrow the *grammar* (mono captions under photos,
oversized serif page titles, rules-not-shadows for layering). Do **not** borrow
the *fingerprints* (Linear's purple, Claude's coral, NYT's typeface licensing).

---

## 3. Mood-board axis

| Axis             | This site                                          | Not this site                              |
| ---------------- | -------------------------------------------------- | ------------------------------------------ |
| Voice            | Curatorial, quiet, declarative                     | Promotional, hyped, exclamation-heavy      |
| Page texture     | Warm paper + hairlines                             | Dark glass + glow                          |
| Type voice       | Lora display, Inter body, JetBrains Mono metadata  | Display variable-fonts, Comic-Sans irony   |
| Colour role      | Photos carry colour; chrome is neutral             | Brand gradients carry colour               |
| Motion           | One signature gesture, hover underlines, fade      | Parallax, scroll-driven, animated gradients |
| Layering         | Hairline rules, sharp corners                      | Drop-shadows, soft 16px radii, glassmorphism |
| Imagery posture  | Production photos, full-bleed, credited           | Stock "diverse smiling team"               |
| Density          | Spacious — Japanese Ma                             | Bento grid, marketing density              |

---

## 4. Typography

Locked in brief §5.3. All three families are SIL OFL with full Cyrillic;
self-hosted from `public/fonts/`. No Google Fonts CDN.

| Role     | Family            | Weights        | Used for                                |
| -------- | ----------------- | -------------- | --------------------------------------- |
| Display  | **Lora**          | 400, 500, 600  | Hero name, page H1, section H2          |
| Body     | **Inter**         | 400, 500, 600  | Long-form prose, UI text, CTAs          |
| Caption  | **JetBrains Mono**| 400, 500       | Dates, durations, age chips, credits, country codes |

A/B alternates kept in reserve for a future refresh: **PT Serif** (display) and
**Spectral** (body). Both have first-class Cyrillic. Do not introduce them in v1.

### 4.1 Type voice rules

- **Display always lowercase for the wordmark** (`роман бокланов` /
  `roman boklanov`). Anywhere else, sentence case.
- **All-caps reserved for chips** (age ratings, country codes), set in
  JetBrains Mono with `letter-spacing: 0.06em`.
- **Italics in Lora** for press-quote attribution and production subtitles.
  Never italic in Inter body — it weakens the read.
- **Mono for any number that's not a price** — durations, years, run lengths,
  award counts. Numbers in serif read as decoration; numbers in mono read as
  data.

Full scale and tracking: `tokens.md` §2.

---

## 5. Colour

Locked in brief §5.1, §5.2.

### 5.1 Palette

```
Light:                            Dark:
  paper      #F4F2EC                paper      #0E0D0C  (soft, never #000)
  ink        #161514                ink        #E8E5DD
  ink-mute   #605C56                ink-mute   #9E9A92
  rule       ink @ 10%              rule       ink @ 10%
  accent     #6B0F0F (oxblood)      accent     #A82626 (lifted oxblood)
```

### 5.2 The accent rule

Oxblood lives in **exactly three places**:

1. Booking CTA fills (`Email Roman about touring this show`, contact page CTA)
2. Underline reveal on hover for primary links and CTAs
3. Focus ring (visible 2-step ring with paper gap, see `--shadow-focus`)

Nowhere else. Not on chips. Not on the wordmark. Not on hover icons. Not on
the language switch. If a designer reaches for `--accent` to add visual
interest, **the design is wrong** — the page needs more breathing room or a
better photo, not more red.

### 5.3 Photo-led colour

Brief D11: **chrome stays neutral; colour comes from production photos.** This
is load-bearing. It means:

- The home page hero is a portrait or production photo, full-bleed, no overlay.
- Production card grid lets cover art carry the visual rhythm. No tinted card
  backgrounds, no coloured borders.
- Posters where they exist (4 of 56 records — see `photo-audit.md`) get
  prominent placement. Productions without posters get a typographic treatment
  (display title over `--paper-sunken`), never a stock illustration.

### 5.4 Dark-mode posture

Dark is its own palette, not an inverted light. Rules:

- `#0E0D0C` is warm-leaning soft black. Never `#000` — it's harsh and breaks
  the editorial feel.
- Text contrast is intentionally lower than light mode. `#E8E5DD` on `#0E0D0C`
  reads ~13:1 — comfortable for long-form Russian prose where letterforms are
  denser than English.
- Shadows in dark mode use plain black, not tinted ink — black reads cleaner
  on `#0E0D0C` than a tinted shadow would.
- Lifted oxblood (`#A82626`) preserves AA contrast against `#0E0D0C` for the
  CTA fill.

---

## 6. Layout & grid

Locked in brief §5.5.

| Breakpoint | Grid                        | Gutter | Notes                                        |
| ---------- | --------------------------- | ------ | -------------------------------------------- |
| ≥ 375px    | Single column                | 20px   | Mobile-first; 90s curator scenario           |
| ≥ 768px    | 8-col                        | 24px   | Tablet — productions grid switches to 2-up   |
| ≥ 1024px   | 12-col                       | 32px   | Desktop — productions grid 3-up              |
| ≥ 1280px   | 12-col, hero up to 1280px wide | 32px | Hero rows can full-bleed; content stays 1080px |
| ≥ 1536px   | Same; hard ceiling 1440px    | 32px   | Don't go wider; long lines hurt prose        |

**Reading measure: 65ch** for `/about`, press body, archive entries — anywhere
prose runs more than three lines.

**Spacing scale** is the brief's locked `4, 8, 12, 16, 24, 32, 48, 64, 96,
128`. The `--space-*` tokens in `tokens.css` index this scale 1:1. Never
hand-roll spacing values.

---

## 7. Component grammar

These are the visual rules every component must follow. Component-by-component
specs land in Phase 4; this section is the *grammar* that keeps them coherent.

### 7.1 The page chrome is a frame

- Hairline rule (`--rule`, 1px) separates major sections. Do not use shadows
  or background tints to do the same job.
- Page header: lowercase wordmark left, language switch + theme toggle right,
  hairline rule below. Sticky on production detail page only (because the
  booking CTA is also sticky); fixed-not-sticky everywhere else.
- Page footer: minimal — three columns of links, mono small. No newsletter
  signup, no social megaphones, no "made with" attribution larger than the
  copyright line.

### 7.2 Production card

- **4:5 cover image** at top, no rounded corners, no border. Image carries.
- **RU title** in Lora, sentence case, `--font-size-lg`.
- **Smaller EN title** below in Inter, `--ink-mute`.
- **Metadata row** in JetBrains Mono `--font-size-meta`: `theatre · year · ageRating · countryCode`.
- **No CTA** on the card itself — the whole card is the link.
- Hover: oxblood underline reveal under the RU title (150ms, `--easing-default`),
  no card lift, no shadow.

### 7.3 Production detail (the money page)

Locked in brief D7. Layout from top:

1. **Cover** — full-bleed, original aspect ratio respected.
2. **Title block** — RU title (display Lora), smaller EN title, even smaller DE
   title if present.
3. **Chips row** — JetBrains Mono caps: `[18+] [2020] [90 MIN] [RU]`. Sharp
   corners (`--border-radius-sm`).
4. **One-line synopsis** — Lora italic, `--font-size-md`.
5. **Credits block** — JetBrains Mono, two-column on tablet+ (role on left,
   name on right).
6. **Action bar** — three buttons in this order: `Watch / listen` (primary,
   oxblood fill), `Tech rider (PDF)` (secondary, hairline border), `Press kit
   (ZIP)` (secondary). Hidden when the asset isn't present.
7. **Photos** — gallery, credit visible (not on hover) under each image in
   mono.
8. **Critic quotes** — Lora italic blockquote with hairline left rule, mono
   attribution.
9. **Awards** — list, mono year + name + city, no decoration.
10. **External theatre links** — single mono row.
11. **Sticky CTA** — `Email Roman about touring this show`, oxblood fill, sticks
    to bottom on mobile, sticks to right column on desktop.

### 7.4 Chips

- Always JetBrains Mono, always uppercase, always `letter-spacing: 0.06em`.
- Padding: `--space-1` vertical, `--space-2` horizontal.
- Background: `--paper-sunken`. Border: none. Radius: `--border-radius-sm`
  (2px, **not** pill-shaped — that reads as a SaaS UI tag).
- No coloured chips. Status passes through type weight, not hue.

### 7.5 Buttons

- Primary (booking CTA): oxblood fill, `--paper` text, `--border-radius-sm`,
  `--space-3` vertical / `--space-5` horizontal, Inter 500. Hover lifts to
  `--accent-hover`, no shadow.
- Secondary: hairline border (`--rule-strong`), `--ink` text, transparent
  background. Hover fills with `--paper-raised`.
- Ghost (used for archive nav, language switch): no border, just underline
  reveal on hover.
- Touch target ≥ 44px on mobile (line-height + padding combined).
- Focus ring is mandatory — `--shadow-focus` on every interactive element.

### 7.6 Forms

The site has **no form** (brief D8 — booking is mailto + copy-paste). The only
form-like element is the Cmd-K palette (D9):

- Mono input, hairline border, `--paper-raised` background.
- Results grouped by type (Productions, Press, Awards, Theatres, Cities) with
  mono caps section labels.
- Keyboard navigation mandatory; arrow keys, Enter to open, Escape to close.

---

## 8. Motion

Locked in brief §5.6. The site is mostly still. Motion is reserved for three
things:

1. **Hover underline reveal** — 150ms, `--easing-default`, primary links and
   CTAs only. Not on every link.
2. **Page transition fade** — 200ms, no slide, no direction. The page changes;
   the chrome doesn't move.
3. **The signature gesture** — a single subtle paper-cut or string-line
   transition on home-page first paint. ≤ 400ms total, runs once, never on
   scroll, decided in Phase 4 with prototypes (brief Q3). This is the *one*
   place the site is allowed to delight.

`prefers-reduced-motion` zeros all transition durations — handled at the token
level in `tokens.css`. Do not hardcode durations in component CSS; always
reference `--duration-*` so the reduced-motion override propagates.

---

## 9. Imagery

Brief §6 + `photo-audit.md`. The honest constraints:

- **419 images, 250 MB**, locally exported. Deduplicate on Phase 3 sync (RU+EN
  Notion siblings = same production).
- **Only 4 productions have a named poster.** The grid must look intentional
  whether or not a poster exists — typographic fallback is a **deliberate
  treatment**, not a placeholder.
- **Photo credits are unstructured** in the export. Phase 3 needs a manual
  pass with Roman: every gallery image gets a `credits[]` entry. The gallery
  component **displays the credit visibly** (mono caption under the image),
  not on hover.
- **Featured shows** for the home-page above-the-fold pull from the
  top-coverage band (brief §6 table — `Nikita looking for the sea`,
  `Комедия Дель-Арте`, `Лина-Марлина`, `Гипс`, `The Ape Star`, `Aiaccio`).
  Never feature a low-coverage show that would force a typographic fallback.

Full-bleed treatment is reserved for production-detail covers. Grid covers are
contained 4:5. Galleries on detail pages are masonry — original aspect ratios
preserved, no cropping.

---

## 10. Wordmark

Brief D15: **no logo.** The site title is the name set in Lora, all-lowercase,
language-aware:

- RU default: `роман бокланов`
- EN: `roman boklanov`
- DE: `roman boklanov` (Roman name, not transliterated)

Letter-spacing tight (`-0.015em`), `--font-size-lg` in the header,
`--font-size-4xl` only on the home-page hero. Never set in caps. Never
italicised. Never coloured.

---

## 11. Anti-patterns (do NOT ship)

Brief §8, repeated here because they are the AI-default fingerprints the
design must actively reject:

- AI-purple / pink gradients
- Glassmorphism, neumorphism, claymorphism
- "AI-Native UI" chips, animated gradient text, kinetic gradient meshes
- Hero video backgrounds
- Bento grids on the home page
- Tailwind defaults: `rounded-2xl shadow-xl`, soft 16px radii everywhere
- Stock photography of "diverse smiling team" — we have real production photos
- Comic-Sans-as-irony, "puppet show" pastiche typography, cute hand-drawn
  underlines
- Loading-spinner skeletons that animate forever
- Cookie banner taking the bottom 20% of the viewport
- Newsletter modal on first visit
- "Built with Next.js" in the footer
- Chip pills with coloured fills (status colours don't go on chips)
- Drop-shadow glow on cards, neon outlines on focus
- Coloured headers with white text (e.g. dark-themed hero band) — chrome is neutral

If a Phase-4 prompt produces any of these, reject and re-prompt with this list
attached.

---

## 12. Accessibility floor

Non-negotiable in v1:

- Body text contrast ≥ 7:1 (AAA) where possible, ≥ 4.5:1 (AA) always.
- Focus ring visible on **every** interactive element. No `:focus { outline: none }`.
- Touch targets ≥ 44×44 CSS px on mobile.
- Lang attribute set per locale; `hreflang` on RU↔EN pairs.
- Image alt text required — for production photos, format is
  `{role} {production title}, {theatre}, {year} ({photographer})`. The sync
  script generates a default; a manual pass refines.
- `prefers-reduced-motion` disables the signature gesture entirely.
- Cmd-K palette is keyboard-only operable end-to-end.
- Screen-reader landmarks: header, nav, main, footer.

---

## 13. The signature gesture (deferred to Phase 4)

Brief Q3. One subtle paper-cut or string-line transition on home-page first
paint. Decision deferred to Phase 4 prototypes. **Constraints:**

- Total duration ≤ 400ms.
- Runs once on first paint, never on scroll, never on navigation.
- Disabled by `prefers-reduced-motion`.
- No external library — CSS or a single SVG path animation.
- If it tests as gimmicky in design review, **cut it**. The site survives
  without a signature gesture; it doesn't survive a gimmick.

---

## 14. Open questions tracked from the brief

These don't block Phase 3; they need answers before Phase 5–7:

| #   | Question                                                                  | Owner    | Phase |
| --- | ------------------------------------------------------------------------- | -------- | ----- |
| Q1  | Photographer credits per image                                            | Roman    | 3     |
| Q2  | Tech riders / press kits as PDFs                                          | Roman    | 3     |
| Q3  | Signature-gesture decision (paper-cut vs string-line vs neither)          | Designer | 4     |
| Q4  | DE UI-chrome translations (~80 strings)                                   | Daniil   | 5     |
| Q5  | Domain — `.ru` only or also `.com`                                        | Roman    | 7     |
| Q6  | Hosting — Vercel / Cloudflare Pages / Yandex Cloud                        | Daniil   | 7     |
| Q7  | Analytics pick — PostHog, Fathom, or none                                 | Daniil   | 5     |
| Q8  | Legal language for press / production photos                              | Roman    | 3     |

---

## 15. Phase 4 component build order

Per PLAN.md §3 Phase 4, build in this order — most-repeated unit first so the
grammar gets stress-tested early:

1. Production card + production grid
2. Production detail page
3. Home (hero + featured strip + filterable grid below the fold)
4. About (long-form bio, lineage section, portrait)
5. Awards + Press + Contact + Archive
6. Layout shell (header, footer, nav, language switch, theme toggle, Cmd-K)

Each page must produce a vertical slice (page + components + tokens consumed)
and pass mobile-first 375 → 768 → 1024 → 1280 layout review before moving on.

---

_DESIGN.md locked: 2026-04-30. Authors: Daniil Petrov + Claude Opus 4.7._
_Reconciled from: DESIGN_BRIEF.md (locked decisions) + tokens.md (visual system) + INFORMATION_ARCHITECTURE.md (route structure)._