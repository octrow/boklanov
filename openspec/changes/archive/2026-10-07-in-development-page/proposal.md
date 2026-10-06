# Proposal

## Why

A production with Status "In development" renders as an empty production page: on a phone mcqueen-blood-beneath-skin is a title, "18+ · KAZAKHSTAN", one credit and a call to action, 1,772px tall and mostly footer (fifth critique, P1). It reads as abandoned rather than upcoming. total-fest-4 has the same status and the same empty page.

## What Changes

- Under the title, an in-development production shows a status line: "In development" (same word as its card), followed by "· premiere <date>" when a premiere date is set.
- When such a page has no poster, photos, video or synopsis, it shows one short note instead of empty space: EN "Photos, credits and press will appear here after the premiere." RU «Фото, состав и пресса появятся здесь после премьеры.» DE "Fotos, Besetzung und Presse folgen nach der Premiere." (copy confirmed at apply).
- The production stays in the grid (its card already says "In development"); the call to action comes from `status-booking-cta` ("Ask Roman about the premiere").
- Not in scope, for Roma: total-fest-4 is a festival edition, not a production; it probably belongs in Archived or out of productions.

## Capabilities

### New Capabilities

- `in-development-page`: how a production page looks before its premiere.

### Modified Capabilities

<!-- none -->

## Impact

- `app/[locale]/productions/[slug]/page.tsx` and/or `components/TheatreSlate.tsx` (status line), `page.module.css`, `messages/{en,ru,de}.json` (one note key; status word reuses `productions.availabilityInDevelopment`).
- Apply after `status-booking-cta`.
