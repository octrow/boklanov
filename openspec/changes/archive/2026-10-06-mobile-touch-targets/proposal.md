# Proposal

## Why

Critique 2026-10-06, P2. Measured on prod at 390×844, several inline links are well under the 44px minimum that change #8/#15 set for chips, footer and 404 links:

- `/press` production group links: 23px tall (×10);
- `/awards` production links: 37px (×10);
- the production slate's theatre link ("Helsinki 98 · Helsinki"): 18px, with a nested 17px link;
- `/archive` title rows and credit-name links on production pages: 17–18px.

A curator on a phone, one-handed, misses these or hits the neighbour.

## What Changes

- Every standalone link or row link on these pages gets a hit area of at least 44px tall (padding or a pseudo-element hit area), without changing the visual type size or the line rhythm.
- The slate's nested link-inside-link is removed: one link per target.
- Inline links inside running prose stay as they are (WCAG 2.5.8 inline exception).

## Capabilities

### New Capabilities

- `touch-targets`: minimum hit-area rule for standalone links across the public site.

### Modified Capabilities

<!-- none -->

## Impact

`app/[locale]/press/page.module.css`, `app/[locale]/awards/page.module.css`, `app/[locale]/archive/page.module.css` (+ `page.tsx` if rows need a wrapping link), `components/TheatreSlate.tsx` + `.module.css`, credits block in `app/[locale]/productions/[slug]/page.tsx` + `.module.css`. CSS only, apart from the slate markup.
