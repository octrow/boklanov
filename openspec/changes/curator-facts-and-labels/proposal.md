# Proposal

## Why

Critique 2026-10-06 (H2 "match the real world" 2/4, H6 "recognition" 2/4, EU-curator persona). A curator is asked to decode labels and is not shown the facts that decide a tour:

- countries appear as ISO codes (AT, DE, ES, FI, KZ, RU) in the /productions filter and on cards;
- production cards show "theatre · city · year · age" but not duration, which touring programmers check first; it is only on the detail page's chips;
- the 404 page's `<title>` is the home title, so a lost tab is mislabelled;
- the home title uses "Roman Boklanov - theatre director" with a hyphen while every other page uses an em dash.

## What Changes

- Country codes are shown as localized country names (EN/RU/DE) wherever a visitor reads them, through `Intl.DisplayNames` (no new dependency). Filter values and URLs keep the ISO code.
- Production cards add duration when known ("80 min"), after age, in the existing meta line.
- The 404 page gets its own localized `<title>`.
- The home `<title>` uses the same em-dash separator as other pages (metadata only; nothing on the home page layout changes).

Out of scope (recorded so nothing is lost):

- the "PICK" sticker and the Featured block: on the home page, which the owner asked not to touch (2026-10-06);
- the header folio ("10 / 55"): an aria-hidden running head that is part of the v3 Plakat system;
- award lines that name a performer in brackets, the "puppet" form count (6 of 55), "Holiday recipe" vs "Holiday Recipe", CV/timeline on /about, Cyrillic credits on EN pages: content decisions for Roma, listed in DESIGN_REVIEW_CHANGELOG.md content to-dos.

## Capabilities

### New Capabilities

- `curator-facts`: which production facts and labels the public site shows a visitor, and in what form.

### Modified Capabilities

<!-- none -->

## Impact

`lib/countryCode.ts` (+ a `countryName(code, locale)` helper), `components/FilteredProductionsPanel.tsx`, `components/ProductionCard.tsx` (and whatever renders `countryCode` on cards), `app/[locale]/not-found.tsx` (metadata), `messages/{en,ru,de}.json` (`homeTitle`, `notFound.title`, duration unit).
