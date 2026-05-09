# Design review — Keystatic admin: tab system bugs — 2026-05-09

`/keystatic/collection/productions/item/*` · admin · dark theme · captured 2026-05-09 · branch `main`

Three regressions in the WS-6 tab system found after the `feat/keystatic-ux-rewrite` merge.

---

## Findings

### 1 — URL slug visible on every tab (should be Settings-only)

**Screenshot:** `url-slug.png`

The `URL slug` field and its input appear above the tab strip on every tab, not just Settings.

**Root cause:** `initTabs()` in `KeystaticEnhancements.tsx` locates non-group grid children by scanning
`gridContainer.children`, where `gridContainer = groups[0].parentElement?.parentElement`. Keystatic renders
`fields.slug` outside the inner CSS grid that contains the `fields.object` groups — in a parent container.
The scan never finds the slug cell, so it is never added to `settings.cells` and never hidden.

**Fix:** After the `gridContainer.children` scan, a fallback locates the slug cell directly via
`button[aria-label="regenerate"]` (same anchor `hideSlugRegenerate()` already uses). Walk: `regenBtn →
regenCol → slugRow → outerCol → slugCell`. If the cell is not yet assigned to any tab, it is added to
`settings.cells` before `applyTabVisibility` runs.

---

### 2 — Extra blank space between tab strip and first field

**Screenshot:** `tab-extra-space.png`

After switching tabs, ~20-30 px of dead space appears between the tab strip's bottom border and the section
description text.

**Root cause:** Each `fields.object` group renders inside `[role="group"]` with `padding-top` and `margin-top`
sized to accommodate the section heading. The heading is hidden with `display:none` (which collapses its own
height) but the container's spacing is unchanged.

**Fix:** When hiding `labelEl`, immediately zero `paddingTop` and `marginTop` on both the `[role="group"]`
element and its wrapper cell (`wrapperCell = group.parentElement`).

---

### 3 — Tab strip wraps to two rows on mobile

**Screenshot:** `mobile-tabs-menu.png`

With 8 tabs the tab strip wraps to two rows on narrow viewports, breaking the sticky layout.

**Fix:** Changed `.ks-tabs` from `flex-wrap: wrap` to `flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none`
(hidden scrollbar via `scrollbar-width` + `::-webkit-scrollbar { display: none }`). Added
`flex-shrink: 0` to `[role="tablist"] [data-ks-tab]` so buttons hold their natural width and the strip
scrolls instead of compressing.

---

## Files changed

| File                                      | Change                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `app/keystatic/KeystaticEnhancements.tsx` | Slug fallback lookup via regen button; zero top padding on hidden headings  |
| `app/keystatic/keystatic-shim.css`        | `nowrap` + horizontal scroll on `.ks-tabs`; `flex-shrink: 0` on tab buttons |
