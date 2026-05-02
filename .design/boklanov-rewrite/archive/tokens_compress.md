Full version (original): .design/boklanov-rewrite/archive/tokens.md
Move `tokens.css` to `app/globals.css` on Phase 4.
Bind components to semantic aliases (e.g., `--color-bg-primary`). Reject direct `--paper`/`--ink` references.
Apply `--accent` exclusively to: booking CTA fills, primary link hover underlines, focus rings.

## COLORS (Light / Dark)

`--paper`: `#F4F2EC` / `#0E0D0C` (Page BG)
`--paper-raised`: `#FBFAF6` / `#161413` (Cards, modals)
`--paper-sunken`: `#ECE9E1` / `#080706` (Inputs, wells)
`--ink`: `#161514` / `#E8E5DD` (Primary text)
`--ink-mute`: `#605C56` / `#9E9A92` (Secondary text)
`--ink-faint`: `#8F8B83` / `#6B6862` (Disabled)
`--rule`: `ink@10%` / `ink@10%` (Hairline rules)
`--rule-strong`: `ink@18%` / `ink@18%` (Hover borders)
`--accent`: `#6B0F0F` / `#A82626` (Restricted)
`--overlay`: `ink@45%` / `#000@60%` (Modals)
`--color-status-success`: `#3F6B3A` / `#6FA365`
`--color-status-warning`: `#8A5A18` / `#C28F3A`
`--color-status-error`: `#6B0F0F` / `#C95151`
`--color-status-info`: `var(--ink-mute)`

## FONTS

Self-host SIL OFL fonts in `public/fonts/`. Reject Google Fonts CDN. Subset ru/en/de.
Lora (Display, 400/500/600): Titles, H1/H2.
Inter (Body, 400/500/600): UI text, prose.
JetBrains Mono (Caption, 400/500): Metadata, chips.

## TYPOGRAPHY SCALE

Clamp fluidly between 375px and 1280px.
`--font-size-chip`: 11px
`--font-size-meta`: 13px
`--font-size-base`: 17px-18px
`--font-size-lg`: 20px-24px
`--font-size-2xl`: 28px-40px
`--font-size-4xl`: 44px-88px
`--line-height-tight`: 1.15
`--line-height-snug`: 1.3
`--line-height-normal`: 1.55
`--line-height-relaxed`: 1.7
`--letter-spacing-tight`: -0.015em
`--letter-spacing-wide`: 0.06em
`--letter-spacing-meta`: 0.01em

## SPACING

`--space-1`: 4px
`--space-2`: 8px
`--space-3`: 12px
`--space-4`: 16px
`--space-5`: 24px
`--space-6`: 32px
`--space-7`: 48px
`--space-8`: 64px
`--space-9`: 96px
`--space-10`: 128px
`--gutter-mobile`: 20px
`--gutter-tablet`: 24px
`--gutter-desktop`: 32px

## LAYOUT

`--max-width-prose`: 65ch
`--max-width-content`: 1080px
`--max-width-wide`: 1280px
`--max-width-page`: 1440px
Define raw pixel breakpoints in `@media`: 375, 768 (8-col grid), 1024 (12-col grid), 1280, 1536.

## BORDERS & SHADOWS

Apply pure black shadows in dark mode.
`--border-radius-none`: 0
`--border-radius-sm`: 2px (Default)
`--border-radius-md`: 4px
`--border-radius-lg`: 8px
`--border-radius-full`: 999px (Pills only)
`--shadow-sm`: Scroll sticky
`--shadow-md`: Cmd-K palette, dropdown
`--shadow-lg`: Modals
`--shadow-focus`: Focus ring

## MOTION

`--duration-fast`: 150ms
`--duration-normal`: 200ms
`--duration-slow`: 400ms
`--easing-default`: `cubic-bezier`
`--easing-editorial`: `cubic-bezier(0.22, 0.61, 0.36, 1)`
Execute signature gesture once on page load. Zero durations via `prefers-reduced-motion`. Block scroll-driven entrances
and parallax.

## Z-INDEX

`--z-base`: 0
`--z-raised`: 10
`--z-sticky`: 100
`--z-overlay`: 500
`--z-modal`: 1000
`--z-toast`: 2000
Reference tokens. Reject raw z-index integers in components.

## THEME RESOLUTION

Toggle dark mode via `[data-theme="dark"]` persisting to `localStorage`.
Fallback to `@media (prefers-color-scheme: dark)` scoped to `:root:not([data-theme="light"])`.

## ANTI-PATTERNS (REJECT)

Gradients. Glass/blur backdrops. Heavy `rounded-2xl shadow-xl` combinations. Animated accent colors. Drop-shadow glows.
Neon outlines.
