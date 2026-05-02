# FEATURED STRIP — BROKEN GRID RESEARCH

Status: ACTIVE — research doc for `FeaturedStrip` broken-grid re-implementation. Branch: `design_v3`. Updated: 2026-05-03.

Context: `<FeaturedStrip>` broken grid (§2.4 of `DESIGN_v3_PROPOSAL.md`) was rolled back twice. This doc records root-cause analysis and ranked implementation options for the next attempt.

---

## 1. Root cause of both rollbacks

`components/ProductionCard.module.css:27`:

```css
.cover { aspect-ratio: 4 / 5; }
```

In a broken grid, cells have different widths. Different widths × fixed `4/5` ratio = different heights. The large cell and the medium cells cannot simultaneously satisfy `aspect-ratio: 4/5` AND align with each other across rows.

**Geometry proof at W=1200px, g=32px (12-col grid):**

| Cell | Cols spanned | Width | Height (4:5) |
|---|---|---|---|
| Large | 1–7 | ~687px | **858px** |
| One medium | 8–12 | ~481px | **601px** |
| Two mediums + row-gap | — | — | **1235px** |

858 ≠ 1235. The large card cannot span exactly two medium-card rows while keeping `aspect-ratio: 4/5`. CSS Grid cannot reconcile this: it either leaves dead space below the large card or clips the mediums. Both rollbacks hit this exact constraint.

**The fix**: for the hero cell only, drop `aspect-ratio` from `.cover` and let CSS Grid row heights (defined by the medium cards' natural `4/5` ratio) determine the large card's height. The image fills via `object-fit: cover` which is already set on `.coverImg`.

---

## 2. Target grid layout

Per `DESIGN_v3_PROPOSAL.md` §2.4 / §5:

```
Desktop (≥1024):
  Row 1: [ large (cols 1–7) ] [ medium (cols 8–12) ]
  Row 2: [ large (cols 1–7) ] [ medium (cols 8–12) ]
  Row 3: [ small (1–4) ] [ small (5–8) ] [ small (9–12) ]

Tablet (≥768, <1024):
  Row 1: [ large ] [ medium ]
  Row 2: [ large ] [ medium ]
  Row 3: [ small ] [ small ]
  Row 4: [ small ] [ .     ]

Mobile (<768): 1-column linear, large first
```

Row heights are determined by the medium cells (cols 8–12, `aspect-ratio: 4/5`). The large cell spans rows 1–2 and fills whatever height that produces. Small cells are their own `4/5` row below.

---

## 3. Ranked implementation options

### Option A — `grid-template-areas` + `:global()` pierce ★ recommended

Zero changes to `ProductionCard.tsx`. Override only in `FeaturedStrip.module.css`.

```css
/* FeaturedStrip.module.css */

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-7);
}

.cell { display: flex; min-width: 0; }
.cell > * { flex: 1 1 auto; min-width: 0; }

/* Tablet: 2-col with large spanning 2 rows */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      "h  m1"
      "h  m2"
      "s1 s2"
      "s3 .";
    gap: var(--gutter-tablet);
  }
  .cell:nth-child(1) { grid-area: h;  }
  .cell:nth-child(2) { grid-area: m1; }
  .cell:nth-child(3) { grid-area: m2; }
  .cell:nth-child(4) { grid-area: s1; }
  .cell:nth-child(5) { grid-area: s2; }
  .cell:nth-child(6) { grid-area: s3; }

  /* Hero override: fill grid area, drop intrinsic aspect-ratio */
  .cell:nth-child(1) :global(.card)  { height: 100%; }
  .cell:nth-child(1) :global(.cover) { aspect-ratio: unset; height: 100%; min-height: 0; }
}

/* Desktop: 12-col broken grid */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(12, 1fr);
    grid-template-areas:
      "h h h h h h h m1 m1 m1 m1 m1"
      "h h h h h h h m2 m2 m2 m2 m2"
      "s1 s1 s1 s1 s2 s2 s2 s2 s3 s3 s3 s3";
    gap: var(--gutter-desktop);
  }
  .cell:nth-child(1) { grid-area: h;  }
  .cell:nth-child(2) { grid-area: m1; }
  .cell:nth-child(3) { grid-area: m2; }
  .cell:nth-child(4) { grid-area: s1; }
  .cell:nth-child(5) { grid-area: s2; }
  .cell:nth-child(6) { grid-area: s3; }

  /* Same hero override on desktop */
  .cell:nth-child(1) :global(.card)  { height: 100%; }
  .cell:nth-child(1) :global(.cover) { aspect-ratio: unset; height: 100%; min-height: 0; }
}
```

`FeaturedStrip.tsx` is unchanged except removing the old rollback-era comment.

**Why `:global()` is appropriate here**: `FeaturedStrip` is the only caller that places `ProductionCard` in a spanning hero position. The override is layout-context-specific, not a change to the card's default appearance. CSS Modules `:global()` is the standard Next.js pattern for exactly this.

---

### Option B — CSS custom property override (no `:global`)

Add custom properties to `ProductionCard.module.css` with defaults:

```css
/* ProductionCard.module.css */
.cover {
  aspect-ratio: var(--cover-aspect, 4 / 5);
  height: var(--cover-height, auto);
}
```

Then in `FeaturedStrip.module.css`:

```css
.cell:nth-child(1) { --cover-aspect: unset; --cover-height: 100%; }
.cell:nth-child(1) :global(.card) { height: 100%; }
```

One change to `ProductionCard.module.css`. Cleaner API — the card advertises that its cover dimensions are overridable.

---

### Option C — `variant` prop on `ProductionCard`

Add `variant?: 'default' | 'hero'` to `ProductionCardProps`:

```tsx
// ProductionCard.tsx
<div className={`${styles.cover} ${variant === 'hero' ? styles.coverHero : ''}`}>
```

```css
/* ProductionCard.module.css */
.coverHero { aspect-ratio: unset; height: 100%; }
```

Pass `variant="hero"` from `FeaturedStrip` for the first card. Explicit contract, zero globals. Costs a prop on a shared component for a single call-site.

---

## 4. What does NOT apply (from generic broken-grid advice)

Evaluated against this stack (Next.js 15, CSS Modules, no Tailwind, no runtime JS, static-first):

| Generic advice | Why not applicable |
|---|---|
| Tailwind utility classes | Stack constraint: CSS Modules only. No Tailwind. |
| Bootstrap grid | Stack constraint: no third-party CSS framework. |
| Flexbox + negative margins | Worse alignment than CSS Grid; no structural column axis. |
| Overlapping columns (`6 / span 6` crossing `1 / span 7`) | Creates z-index layering — focus rings on "lower" cards buried by overlapping cards. Violates §0.1 anchor 8 (focus ring on every interactive element). |
| `grid-auto-rows: minmax(100px, auto)` as the sole fix | Insufficient. Defines row heights at grid level but `.cover { aspect-ratio: 4/5 }` inside `ProductionCard.module.css` still overrides them. Both constraints fight; the card's own CSS wins. |
| JS masonry libraries | Static-first constraint. No runtime layout JS. |
| `data: any` TypeScript | `ProductionView` type defined in `lib/content.ts`. Use it. |
| `prefers-reduced-motion` snippet | Already handled at token layer in `app/globals.css`. All `--duration-*` zero automatically. |
| LQIP `blurDataURL` setup | Already wired: `ProductionCard.tsx:73` inlines LQIP as `backgroundImage`. |
| `priority` prop wiring | Already in `FeaturedStrip.tsx` — `priorityFirst && i === 0` passed through. |

---

## 5. Decision

Implement **Option A** (no changes to `ProductionCard`). Switch from Option A to Option B if a second call-site ever needs hero override — the custom-property API generalises better at that point.

Rollback trigger (per proposal §2.4): bento on `/productions` or `/about`; equal-size cells; cards lift on hover. Option A is scoped entirely to `FeaturedStrip.module.css` — rollback is a single file revert.
