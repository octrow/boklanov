# Proposal

## Why

Critique 2026-10-06, P2, seen on `/productions/vaikenemisen-kielioppi`:

- the cover photo credit ("Павел Семченко") sits to the right of the poster instead of under it, because `.cover` is a flex row and the `<figcaption>` becomes a second flex item. On a phone it is clipped to "Павел Семчен"; on desktop it floats in empty space;
- for posters without baked variants (admin uploads, change #13) the `next/image` fallback is rendered with `width={0} height={0}`, so no space is reserved before load;
- the poster alt reads "director, Vaikenemisen kielioppi (The Grammar of Silence) , Helsinki 98, 2026 (credit)": a stray space before the comma, and the role leads instead of the title.

## What Changes

- The cover credit renders under the image as a mono caption prefixed by a localized "Photo:" label, never beside it and never clipped.
- Every poster branch passes intrinsic width/height (real dims, else the existing 720×1019 portrait hint).
- Poster alt is title-first, trimmed parts, no stray spaces: "<title>, <theatre>, <year>. Poster" (+ credit).
- Non-goal: transliterating credit names. The credit string is the editor's content; a Cyrillic name on EN pages goes to Roma's content to-dos.

## Capabilities

### New Capabilities

- `production-cover`: how the production poster, its credit and alt text are presented on a production page.

### Modified Capabilities

<!-- none -->

## Impact

`app/[locale]/productions/[slug]/page.tsx` (posterAlt, fallback `<Image>` dims, figcaption label), `page.module.css` (`.cover` → column, `.coverCredit`), `messages/{en,ru,de}.json` ("Photo:" label).
