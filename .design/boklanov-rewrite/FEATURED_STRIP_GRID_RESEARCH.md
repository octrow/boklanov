# FEATURED STRIP — BROKEN GRID RESEARCH

Status: ACTIVE — research doc for `FeaturedStrip` broken-grid re-implementation. Branch: `design_v3`. Updated:
2026-05-03 (§13 implementation log added).

Context: `<FeaturedStrip>` broken grid (§2.4 of `DESIGN_v3_PROPOSAL.md`) was rolled back twice. This doc records
root-cause analysis and ranked implementation options for the next attempt.

---

## 1. Root cause of both rollbacks

`components/ProductionCard.module.css:27`:

```css
.cover {
  aspect-ratio: 4 / 5;
}
```

In a broken grid, cells have different widths. Different widths × fixed `4/5` ratio = different heights. The large cell
and the medium cells cannot simultaneously satisfy `aspect-ratio: 4/5` AND align with each other across rows.

**Geometry proof at W=1200px, g=32px (12-col grid):**

| Cell                  | Cols spanned | Width  | Height (4:5) |
|-----------------------|--------------|--------|--------------|
| Large                 | 1–7          | ~687px | **858px**    |
| One medium            | 8–12         | ~481px | **601px**    |
| Two mediums + row-gap | —            | —      | **1235px**   |

858 ≠ 1235. The large card cannot span exactly two medium-card rows while keeping `aspect-ratio: 4/5`. CSS Grid cannot
reconcile this: it either leaves dead space below the large card or clips the mediums. Both rollbacks hit this exact
constraint.

**The fix**: for the hero cell only, drop `aspect-ratio` from `.cover` and let CSS Grid row heights (defined by the
medium cards' natural `4/5` ratio) determine the large card's height. The image fills via `object-fit: cover` which is
already set on `.coverImg`.

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

Row heights are determined by the medium cells (cols 8–12, `aspect-ratio: 4/5`). The large cell spans rows 1–2 and fills
whatever height that produces. Small cells are their own `4/5` row below.

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

.cell {
  display: flex;
  min-width: 0;
}

.cell > * {
  flex: 1 1 auto;
  min-width: 0;
}

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

  .cell:nth-child(1) {
    grid-area: h;
  }

  .cell:nth-child(2) {
    grid-area: m1;
  }

  .cell:nth-child(3) {
    grid-area: m2;
  }

  .cell:nth-child(4) {
    grid-area: s1;
  }

  .cell:nth-child(5) {
    grid-area: s2;
  }

  .cell:nth-child(6) {
    grid-area: s3;
  }

  /* Hero override: fill grid area, drop intrinsic aspect-ratio */
  .cell:nth-child(1) :global(.card) {
    height: 100%;
  }

  .cell:nth-child(1) :global(.cover) {
    aspect-ratio: unset;
    height: 100%;
    min-height: 0;
  }
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

  .cell:nth-child(1) {
    grid-area: h;
  }

  .cell:nth-child(2) {
    grid-area: m1;
  }

  .cell:nth-child(3) {
    grid-area: m2;
  }

  .cell:nth-child(4) {
    grid-area: s1;
  }

  .cell:nth-child(5) {
    grid-area: s2;
  }

  .cell:nth-child(6) {
    grid-area: s3;
  }

  /* Same hero override on desktop */
  .cell:nth-child(1) :global(.card) {
    height: 100%;
  }

  .cell:nth-child(1) :global(.cover) {
    aspect-ratio: unset;
    height: 100%;
    min-height: 0;
  }
}
```

`FeaturedStrip.tsx` is unchanged except removing the old rollback-era comment.

**Why `:global()` is appropriate here**: `FeaturedStrip` is the only caller that places `ProductionCard` in a spanning
hero position. The override is layout-context-specific, not a change to the card's default appearance. CSS Modules
`:global()` is the standard Next.js pattern for exactly this.

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
.cell:nth-child(1) {
  --cover-aspect: unset;
  --cover-height: 100%;
}

.cell:nth-child(1) :global(.card) {
  height: 100%;
}
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
.coverHero {
  aspect-ratio: unset;
  height: 100%;
}
```

Pass `variant="hero"` from `FeaturedStrip` for the first card. Explicit contract, zero globals. Costs a prop on a shared
component for a single call-site.

---

## 4. What does NOT apply (from generic broken-grid advice)

Evaluated against this stack (Next.js 15, CSS Modules, no Tailwind, no runtime JS, static-first):

| Generic advice                                           | Why not applicable                                                                                                                                                                           |
|----------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tailwind utility classes                                 | Stack constraint: CSS Modules only. No Tailwind.                                                                                                                                             |
| Bootstrap grid                                           | Stack constraint: no third-party CSS framework.                                                                                                                                              |
| Flexbox + negative margins                               | Worse alignment than CSS Grid; no structural column axis.                                                                                                                                    |
| Overlapping columns (`6 / span 6` crossing `1 / span 7`) | Creates z-index layering — focus rings on "lower" cards buried by overlapping cards. Violates §0.1 anchor 8 (focus ring on every interactive element).                                       |
| `grid-auto-rows: minmax(100px, auto)` as the sole fix    | Insufficient. Defines row heights at grid level but `.cover { aspect-ratio: 4/5 }` inside `ProductionCard.module.css` still overrides them. Both constraints fight; the card's own CSS wins. |
| JS masonry libraries                                     | Static-first constraint. No runtime layout JS.                                                                                                                                               |
| `data: any` TypeScript                                   | `ProductionView` type defined in `lib/content.ts`. Use it.                                                                                                                                   |
| `prefers-reduced-motion` snippet                         | Already handled at token layer in `app/globals.css`. All `--duration-*` zero automatically.                                                                                                  |
| LQIP `blurDataURL` setup                                 | Already wired: `ProductionCard.tsx:73` inlines LQIP as `backgroundImage`.                                                                                                                    |
| `priority` prop wiring                                   | Already in `FeaturedStrip.tsx` — `priorityFirst && i === 0` passed through.                                                                                                                  |
/cl
---

## 5. Decision

Implement **Option A** (no changes to `ProductionCard`). Switch from Option A to Option B if a second call-site ever
needs hero override — the custom-property API generalises better at that point.

Rollback trigger (per proposal §2.4): bento on `/productions` or `/about`; equal-size cells; cards lift on hover. Option
A is scoped entirely to `FeaturedStrip.module.css` — rollback is a single file revert.

---

## 6. Gap: proposal §5 stagger is missing from all three options

`DESIGN_v3_PROPOSAL.md:230` reads:

> Vertical alignment irregular (`align-self: end` on small, `align-self: start` on medium)

None of Options A/B/C produce this. With `grid-template-areas`, each cell fills its named area; if the area's track is
sized to the card's natural height, `align-self` has no slack to act on. Two ways to recover the stagger:

1. **Oversized rows + `align-self`.** Define the desktop grid with `grid-auto-rows: minmax(601px, auto)` (the medium
   card's natural height). Each row is at least one medium tall; small-card row also gets `601px` minimum. Now small
   cards have ~120px of vertical slack to drop to the bottom (`align-self: end`) and mediums have slack to anchor up
   (`align-self: start`). Side effect: visible whitespace bands between rows, which is *the point* — that's the
   plakat-board breathing.
2. **`padding-block` offsets per cell.** Cheaper but less grid-honest.
   `cell:nth-child(2) { padding-block-start: var(--space-7) }` pushes medium-1 down. Reads the same; loses the
   auto-relationship to row height.

Approach 1 is the right answer if the stagger ships. Add to Option A's desktop block.

```css
@media (min-width: 1024px) {
  .grid {
    grid-auto-rows: minmax(0, auto);
    /* Hero rows take medium's height; small row gets the same so align-self has slack */
    grid-template-rows: repeat(2, minmax(min-content, 1fr)) minmax(min-content, 1fr);
  }

  .cell:nth-child(2),  /* medium-1 */
  .cell:nth-child(3) { /* medium-2 */
    align-self: start;
  }

  .cell:nth-child(4),  /* small-1 */
  .cell:nth-child(5),  /* small-2 */
  .cell:nth-child(6) { /* small-3 */
    align-self: end;
  }
}
```

**Risk.** With the hero override (`.cell:nth-child(1) :global(.cover) { aspect-ratio: unset; height: 100% }`), the hero
*defines* row height, so `align-self: start` on mediums has no slack inside row 1 and row 2 individually — it only
matters on the small row. If that's all the stagger we get, the proposal §5 line is over-promising; flag for design
amendment rather than chasing it.

---

## 7. CSS Subgrid — the alignment win the research doc missed

The hero/medium height mismatch (§1) is the *layout* problem. There is a separate *rhythm* problem: even when the grid
geometry resolves, every card's internal structure (cover · title · meta · hairline) is rendered at independent Y
positions because each `<ProductionCard>` is its own block formatting context. Result: the bottom hairlines across the
small-card row don't align horizontally if titles wrap to different line counts. That's the exact ragged-newspaper look
the brutalist editorial register is meant to reject.

**Fix: CSS Subgrid Level 2.** Promote `<ProductionCard>` to subgrid the parent's row tracks:

```css
/* FeaturedStrip.module.css — desktop */
.grid {
  /* Five named row tracks per "card row unit": cover · gap · titleRu · titleEn · meta */
  grid-template-rows: auto auto auto auto auto;
}

.cell {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 5; /* one card row unit */
}

.cell:nth-child(1) {
  grid-row: span 10; /* hero spans two card row units */
}
```

Then `.card` itself becomes the subgrid container and assigns its children to inherited rows:

```css
.card {
  display: grid;
  grid-template-rows: subgrid;
}
.cover      { grid-row: 1 }
.titleStack { grid-row: 3 / span 2 }
.metaWrap   { grid-row: 5 }
```

Outcome: every title baseline, every meta line, every bottom hairline on the small-card row sits on the same Y.
Editorial typography meets editorial layout. This is the "Schaubühne season-page aside" register §11.4 is gating
against — the bento smell comes from cards *not* sharing baselines.

**Browser support (2026-05).** Subgrid baseline-supported in Chromium 117+, Firefox 71+, Safari 16+. ~95% global.
Safe to ship without fallback for this site's audience (theatre/festival editorial). Cards already render fine without
subgrid; absent subgrid, you get §1's geometry but lose only the cross-cell baseline alignment — graceful degradation.

**Cost.** Subgrid composes cleanly with Option A (`grid-template-areas` + `:global()`). The hero gets
`grid-row: span 10` instead of `grid-area: h`; named-area placement converts to `grid-column` + `grid-row`.
Rewrite cost: ~30 lines.

**Recommendation.** Adopt subgrid alongside Option A. The aesthetic uplift is exactly the difference between "looks like
a Notion page" and "looks like a printed programme."

---

## 8. Container queries for hero typographic scaling

The hero cell is roughly 2× the width of a medium. With shared `<ProductionCard>` styles, its `<h3>` renders at
`--font-size-lg` — visually undersized for that mass. The proposal doesn't call this out, but the absence of a
`variant="hero"` prop (Option C) means *something* has to scale type by cell context.

**Container queries solve this without a prop or a global pierce:**

```css
/* ProductionCard.module.css */
.card {
  container-type: inline-size;
  container-name: card;
}

@container card (inline-size > 600px) {
  .titleRu { font-size: var(--font-size-2xl); }
  .meta    { font-size: var(--font-size-sm); }
}
```

The card *itself* decides "if my column is wider than 600px, I'm in a hero context." No prop, no global, no nth-child
fragility. Works for any future call-site that gives the card a wider track.

**Browser support (2026-05).** Baseline 2023. Safe.

**Pairs with.** Option B (custom-property API) — both express "the card adapts to its container" rather than "the parent
reaches into the card." Conceptually cleaner than Option A's `:global()` for this *typographic* concern, even if
Option A remains right for the *layout* concern.

**Recommendation.** Add container-query type scaling to `ProductionCard.module.css` regardless of which option ships for
the layout. It's orthogonal and small.

---

## 9. Aesthetic variants beyond the proposal §5 blocking

Once the geometry is solved, the design space opens. Ranked by fit to the "festival programme, not bento" target:

### 9a — Schaubühne stagger (proposal §5, with §6 row sizing)

What §5 already specifies: hero (1–7, rows 1–2) + mediums anchored top + smalls anchored bottom. With §6 oversized rows
this produces visible breathing bands between rows. **Closest to the printed-programme reference.** Recommended default.

### 9b — Mondrian bands

Hero col-span 7, medium-1 col-span 5 row 1 + medium-2 col-span 5 row 2 with a `2px` `var(--rule)` ledge running between
all cells (border-right + border-bottom on cells, with `--rule` being the existing hairline token). Reads like
mid-century De Stijl programme art. Higher commitment to the "broken" register; harder to back out of.

### 9c — Slug-hash hero rotation

Computed at build-time: `production.slug.charCodeAt(0) % 6` picks which of the six featured productions occupies the
hero slot. Same six cards, different layout per page-build. Adds editorial liveness ("this week's pick") without runtime
JS. Trivially compatible with Option A — just sort the array before render.

### 9d — Plakat-overlap (rejected)

Cards overlapping with rotation + z-index. **Rejected** in §4 already on focus-ring grounds (anchor 8). Re-confirmed.

### 9e — Asymmetric on `<DuotonePoster>` only

Skip ProductionCard layout entirely; render hero as standalone `<DuotonePoster>` with embedded H2/meta typography (more
poster, less card). Grid below it is a clean 5-card 1fr 1fr 1fr 1fr 1fr row. **Easier to ship**, but loses the
proposal's "all cards same primitive" anchor (§5 line 233). Reserve as fallback if §6 stagger amendment is rejected.

---

## 10. Tools / libraries evaluated against constraints

Briefly, so this doesn't keep getting reopened. All rejected for this codebase:

| Tool                               | Why not                                                                                      |
|------------------------------------|----------------------------------------------------------------------------------------------|
| `react-masonry-css`                | JS runtime layout. Violates static-first. Pin-row layout, not broken-grid, anyway.           |
| `masonic`                          | JS virtualisation for thousands of items. Wrong scale (6 cards) and wrong constraint.        |
| `react-grid-layout`                | Drag-resize dashboard library. Off-axis use case.                                            |
| `gridstack.js`                     | Same as above. Imperative layout API.                                                        |
| `react-photo-album`                | Justified-rows photo gallery. Wrong shape — wants varied aspect ratios as input.             |
| `packery` / `isotope`              | Commercial JS layout. Static-first violation + license.                                      |
| Tailwind v4 grid utilities         | Stack already excludes Tailwind. Would still hit §1 root cause.                              |
| `@container` + `clamp()` only      | Solves §7 (typography), not §1 (geometry).                                                   |
| `houdini` `CSS.paintWorklet`       | Worklet support shipped Chromium-only. Not cross-browser. Overkill for layout.               |

**Verdict:** the right tooling is browser CSS — Grid Level 2 (subgrid), container queries, named areas. Everything else
in this table is solving a different problem.

---

## 11. Native CSS masonry status (2026-05)

Worth a one-line check because masonry would be the only library-free way to land a *truly* irregular plakat wall:

- WebKit shipped `grid-template-rows: masonry` (Safari 17.5+).
- Chromium and Firefox flagged behind dev-flags. Spec contested between Apple's syntax (`masonry` value on existing grid
  property) and Microsoft's proposed `masonry-template-tracks` separate property.
- W3C CSS WG expected to converge in 2026 H2; shippable cross-browser default no earlier than 2027.

**Verdict:** skip for this milestone. Re-evaluate when one syntax wins. The §6 broken-grid + §7 subgrid combination
ships the same aesthetic intent today without a polyfill.

---

## 12. Updated decision

**Ship layer 1 (geometry):** Option A as written in §3, **plus** §6 row-sizing for the proposal §5 stagger.

**Ship layer 2 (rhythm):** §7 subgrid promotion in `<ProductionCard>` and `.cell`. ~30 LOC, baseline-supported, zero
runtime cost, removes the bento smell.

**Ship layer 3 (typography):** §8 container queries on `.card`. Orthogonal, safe regardless of layer 1 choice.

**Defer:** §10 native masonry until cross-browser convergence. §9b/c/d aesthetic variants until the §11.4 acceptance
test lands a verdict on §9a (the proposal default).

Rollback for all three layers is still single-file: `git restore components/FeaturedStrip.module.css
components/ProductionCard.module.css`.

---

## 13. Implementation log (2026-05-03)

What actually shipped, what changed during implementation, what got deferred.

### 13.1 Option A pivoted to Option B during implementation

§3 Option A specified `:global(.card)` and `:global(.cover)` selectors inside `FeaturedStrip.module.css`. This was
verified during implementation to **not work** with the project's CSS Modules setup: Next.js auto-hashes class names
(e.g., `.card` → `ProductionCard_card__abc123`), so the rendered DOM has no element with literal class `card`. A
selector `:global(.card)` matches nothing.

The fix was to ship the **Option B mechanism** (custom-property override) under Option A's *layout structure*. Custom
properties cascade through `display: contents` (DuotonePoster's wrapper) and through any class-hashing, so the chain
`.cell → .card → .cover` works regardless of CSS-Modules opacity.

Concrete contract added to `ProductionCard.module.css`:

```css
.card  { height:        var(--card-height,  auto); }
.cover { aspect-ratio:  var(--cover-aspect, 4 / 5);
         flex:          var(--cover-flex,   0 1 auto); }
```

Hero override in `FeaturedStrip.module.css`:

```css
.cell:nth-child(1) {
  --card-height:  100%;
  --cover-aspect: auto;
  --cover-flex:   1 1 0;
}
```

Defaults preserve every existing call-site exactly (ProductionGrid, FilteredProductionsPanel, etc.).

### 13.2 Layer 3 (container queries) shipped

`@container card (min-width: 600px)` in `ProductionCard.module.css` upscales `.titleRu` to `--font-size-2xl` and `.meta`
to `--font-size-sm` only inside hero-sized cells. Validated against width math: desktop hero ~686px ✓, desktop medium
~481px (no fire), desktop small ~286px (no fire), ProductionGrid 3-col ~378px (no fire). Tablet hero ~500px does not
fire — acceptable; tablet hero typography stays at default register.

### 13.3 Layer 2 (subgrid) deferred

Implementation analysis surfaced a CSS Grid limitation that the research §7 sketch glossed over: subgrid rows inherit
the parent's `gap` uniformly. The card's *internal* gap (cover-to-title 12px) and the strip's *external* gap
(card-to-card 32–64px) cannot both be expressed when card and strip share a row track-list under subgrid. Workarounds
(wrapping rows with empty gap-tracks, using padding-block instead of gap) make the implementation cost outweigh the
"newspaper-grade rhythm" payoff for this milestone.

§12 layer 2 recommendation stands as a **future polish item** when one of the following changes:
- ProductionCard standardises on grid layout (would unlock subgrid composition)
- A polish pass introduces oversized rows per §6 (would already produce the visual rhythm without subgrid)
- The card's internal gap matches the strip's row-gap (collapses both into a single uniform track)

Until then: cards align cell-to-cell by virtue of equal column widths in row 3 and matching aspect-ratios in rows 1/2.
Cross-row alignment of internal title/meta baselines remains content-dependent.

### 13.4 Files changed

- `components/FeaturedStrip.module.css` — full rewrite (Option B + §6 stagger directive, no-op until row-sizing
  amendment per research §6).
- `components/ProductionCard.module.css` — added 3 custom-prop hooks + container query block. No default behaviour
  changed.
- `components/FeaturedStrip.tsx` — replaced rollback header with one-line pointer to the css/research docs.

### 13.5 §11.4 acceptance test reminder

The §2.4 unfreeze rolled back twice already. This third attempt must clear `DESIGN_v3_PROPOSAL.md §11.4`: composition
reads as "Schaubühne season-page aside, not Notion-feature." Reviewer test: would this fit a printed festival
programme? If no, fall back to symmetric 3×2 (the layout fix-pass-2 shipped). Single-file revert path still applies.
