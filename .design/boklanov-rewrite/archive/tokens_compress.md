# Design tokens — boklanov rewrite

Reference doc for the token system. The runnable source is
[`tokens.css`](./tokens.css); this document explains what each token is for,
why the values were chosen, and the rules for using them. On Phase 4
integration, `tokens.css` moves to `app/globals.css`.

> Philosophy: **warm editorial base + brutalist metadata accents** (BRIEF
> §5, D10). Quiet, photo-led chrome. One reserved accent (oxblood) for
> booking CTAs only. No gradients, no glass, no shadows-as-glow.

---

## 1. Colour

### 1.1 Paper / ink palette (locked by brief §5.1, §5.2)

| Token            | Light       | Dark         | Use                                           |
|------------------|-------------|--------------|-----------------------------------------------|
| `--paper`        | `#F4F2EC`   | `#0E0D0C`    | Page background. Warm off-white / soft black. |
| `--paper-raised` | `#FBFAF6`   | `#161413`    | Cards, modals, raised surfaces.               |
| `--paper-sunken` | `#ECE9E1`   | `#080706`    | Inputs, code wells, sunken zones.             |
| `--ink`          | `#161514`   | `#E8E5DD`    | Primary text.                                 |
| `--ink-mute`     | `#605C56`   | `#9E9A92`    | Secondary text, dates, captions.              |
| `--ink-faint`    | `#8F8B83`   | `#6B6862`    | Placeholder, disabled.                        |
| `--rule`         | `ink @ 10%` | `ink @ 10%`  | Hairline section rules.                       |
| `--rule-strong`  | `ink @ 18%` | `ink @ 18%`  | Hover / active borders.                       |
| `--accent`       | `#6B0F0F`   | `#A82626`    | **Reserved**: booking CTAs, hover underlines. |
| `--overlay`      | `ink @ 45%` | `#000 @ 60%` | Modal / dropdown backdrop.                    |

**The accent rule.** Oxblood appears in exactly three places: (1) booking
CTA fills, (2) underline reveal on hover for primary links, (3) focus
ring. Nowhere else. If a designer reaches for `--accent` for a chip,
badge, or icon — that is a brief change.

**Dark-mode shift.** `#A82626` is a lifted oxblood that holds AA contrast
on `#0E0D0C`. We did not invert; the dark palette is its own choice.

### 1.2 Semantic mapping

The semantic layer (`--color-bg-primary`, `--color-text-secondary`, etc.)
is what components reference. The paper/ink layer above is what *changes*
between light and dark. Components should never reference `--paper` or
`--ink` directly — always go through the semantic alias. This keeps theme
swaps cheap and prevents accidental hardcoding.

### 1.3 Status colours

Muted on purpose. The site is editorial, not a dashboard. Status colours
appear only in form validation and toasts.

| Token                    | Light        | Dark         |
|--------------------------|--------------|--------------|
| `--color-status-success` | `#3F6B3A`    | `#6FA365`    |
| `--color-status-warning` | `#8A5A18`    | `#C28F3A`    |
| `--color-status-error`   | `#6B0F0F`    | `#C95151`    |
| `--color-status-info`    | `--ink-mute` | `--ink-mute` |

---

## 2. Typography

### 2.1 Families (locked by brief §5.3)

| Role    | Family             | Weights       | Notes                              |
|---------|--------------------|---------------|------------------------------------|
| Display | **Lora**           | 400, 500, 600 | Page titles, hero name, h1/h2.     |
| Body    | **Inter**          | 400, 500, 600 | Long-form prose, UI text.          |
| Caption | **JetBrains Mono** | 400, 500      | Metadata, dates, durations, chips. |

All three are SIL OFL, full Cyrillic. Self-hosted from `public/fonts/`;
no Google Fonts CDN. Variable subsets for ru + en + de scripts.

### 2.2 Type scale

The scale is **fluid** between mobile (375px) and desktop (1280px) using
`clamp()`. Min/max anchors come straight from brief §5.4.

| Token              | Min (375px) | Max (1280px) | Use                                         |
|--------------------|-------------|--------------|---------------------------------------------|
| `--font-size-chip` | 11px        | 11px         | Age rating chip, country code (mono, fixed) |
| `--font-size-meta` | 13px        | 13px         | Mono captions, dates (fixed)                |
| `--font-size-base` | 17px        | 18px         | Body                                        |
| `--font-size-lg`   | 20px        | 24px         | h3 / card titles                            |
| `--font-size-2xl`  | 28px        | 40px         | h2 / section titles                         |
| `--font-size-4xl`  | 44px        | 88px         | Hero name, page H1 (display)                |

Intermediate steps (`xs`, `sm`, `md`, `xl`, `3xl`) exist to handle press
quotes, form labels, and CTA text without inventing new values per
component. They are not mandatory landing points.

### 2.3 Line-height and tracking

| Token                    | Value    | Use                               |
|--------------------------|----------|-----------------------------------|
| `--line-height-tight`    | 1.15     | Display, h1/h2                    |
| `--line-height-snug`     | 1.3      | h3, card titles                   |
| `--line-height-normal`   | 1.55     | UI body                           |
| `--line-height-relaxed`  | 1.7      | Long-form prose (`/about`, press) |
| `--letter-spacing-tight` | -0.015em | Lora display                      |
| `--letter-spacing-wide`  | 0.06em   | Mono caps, chips                  |
| `--letter-spacing-meta`  | 0.01em   | Mono captions                     |

Lora at display sizes wants slight negative tracking to keep the
calligraphic warmth from looking loose. Mono caps/chips want positive
tracking to look intentional and not just smaller text.

---

## 3. Spacing

**4px base, scale `0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128`** (brief
§5.5). Tokens map by index:

| Token        | Px  | Typical use                                |
|--------------|-----|--------------------------------------------|
| `--space-1`  | 4   | Inline icon gaps                           |
| `--space-2`  | 8   | Tight stacks, chip padding                 |
| `--space-3`  | 12  | Form-field internal padding                |
| `--space-4`  | 16  | Card padding, default rhythm               |
| `--space-5`  | 24  | Section sub-gaps, gallery gutters          |
| `--space-6`  | 32  | Section padding, card-to-card on desktop   |
| `--space-7`  | 48  | Section dividers                           |
| `--space-8`  | 64  | Hero top padding mobile, section breathing |
| `--space-9`  | 96  | Hero top padding desktop                   |
| `--space-10` | 128 | Page-edge breathing on wide layouts        |

Layout gutters are separate tokens, not space-scale entries:
`--gutter-mobile: 20px`, `--gutter-tablet: 24px`, `--gutter-desktop: 32px`.

---

## 4. Layout

| Token                 | Value  | Use                                    |
|-----------------------|--------|----------------------------------------|
| `--max-width-prose`   | 65ch   | `/about`, press body, long-form text   |
| `--max-width-content` | 1080px | Productions index, default page chrome |
| `--max-width-wide`    | 1280px | Hero rows, full-bleed photo bands      |
| `--max-width-page`    | 1440px | Hard ceiling                           |

Grid (informational; CSS uses raw breakpoints):

- Mobile: single column, 20px gutters.
- Tablet (≥ 768px): 8-col, 24px gutters.
- Desktop (≥ 1024px): 12-col, 32px gutters.

---

## 5. Borders, radii, shadows

### 5.1 Radii

Editorial + brutalist => sharp wins. Most components use `--border-radius-sm`
(2px) or none. Avoid the Tailwind-default `rounded-2xl` look — see brief §8.

| Token                  | Value | Use                                     |
|------------------------|-------|-----------------------------------------|
| `--border-radius-none` | 0     | Photos, full-bleed bands                |
| `--border-radius-sm`   | 2px   | Default for chips, inputs, buttons      |
| `--border-radius-md`   | 4px   | Modals, cards                           |
| `--border-radius-lg`   | 8px   | Reserved (photo cards, if any)          |
| `--border-radius-full` | 999px | Pills only (chips use `sm`, not `full`) |

### 5.2 Shadows

Hairline-first system. Rules and outlines do most layering work; shadows
are subtle, never glow.

| Token            | Use                             |
|------------------|---------------------------------|
| `--shadow-sm`    | Sticky CTA on scroll, low lift  |
| `--shadow-md`    | Cmd-K palette, dropdowns        |
| `--shadow-lg`    | Modals only                     |
| `--shadow-focus` | Focus ring (paper gap + accent) |

In dark mode, shadows use plain black, not the dark ink colour — black
reads cleaner against `#0E0D0C` than a tinted shadow would.

---

## 6. Motion (brief §5.6)

| Token                | Value                               | Use                                   |
|----------------------|-------------------------------------|---------------------------------------|
| `--duration-fast`    | 150ms                               | Hover underline reveal, button hover  |
| `--duration-normal`  | 200ms                               | Page transition fade                  |
| `--duration-slow`    | 400ms                               | Signature gesture (paper-cut) ceiling |
| `--easing-default`   | std cubic-bezier                    | Most transitions                      |
| `--easing-editorial` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Signature gesture                     |

**Hard rules from the brief:**

- No parallax. No scroll-driven entrances. No animated gradients.
- Signature gesture runs **once on home-page load**, never on scroll.
- `prefers-reduced-motion` zeros out all transition durations
  (handled in `tokens.css`).

---

## 7. Z-index scale

| Token         | Value | Use                                   |
|---------------|-------|---------------------------------------|
| `--z-base`    | 0     | Document flow                         |
| `--z-raised`  | 10    | Hover-elevated cards                  |
| `--z-sticky`  | 100   | Sticky booking CTA on production page |
| `--z-overlay` | 500   | Backdrop                              |
| `--z-modal`   | 1000  | Cmd-K palette, modal dialogs          |
| `--z-toast`   | 2000  | Toast notifications                   |

Components must reference these tokens, not literal numbers.

---

## 8. Breakpoints

`375 / 768 / 1024 / 1280 / 1536`. Exposed as custom properties for
reference; CSS media queries use the raw px values (custom properties
don't work inside `@media` conditions).

---

## 9. Dark-mode strategy

Two activation paths, both in `tokens.css`:

1. `[data-theme="dark"]` — explicit user toggle (persisted in
   `localStorage`).
2. `@media (prefers-color-scheme: dark)` scoped to
   `:root:not([data-theme="light"])` — system preference, unless the user
   explicitly chose light.

This lets a manual toggle override system, and a manual *light* choice
sticks even when the OS is dark.

---

## 10. Anti-patterns (token-level reminders from brief §8)

These tokens explicitly do **not** exist; if a component asks for them,
push back:

- Gradient tokens (no AI-purple/pink, no kinetic gradient meshes).
- Glass / blur backdrops.
- Heavy `rounded-2xl shadow-xl` combos.
- Animated colour-changing accents.
- Drop-shadow glow / neon outlines.

---

## 11. Deviations from the brief

None. Every locked value (colours §5.1/§5.2, families §5.3, scale anchors
§5.4, spacing scale §5.5, motion durations §5.6) is preserved verbatim.
The only choices made on top of the brief are:

- Added `paper-raised` / `paper-sunken` and `ink-faint` (the brief gave
  three colour tokens; components need at least six surface/text levels
  to avoid hardcoding).
- Status colours (the brief is silent; they're sized down to fit the
  warm-editorial palette so error states don't shout).
- Radii max at 8px and shadows kept hairline-first — direct read of
  D10 + §8 anti-patterns.
- Z-index scale (the brief is silent; standard practice).

All deviations are additive. No locked value was changed.
