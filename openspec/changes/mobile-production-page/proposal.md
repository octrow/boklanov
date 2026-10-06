# Proposal

## Why

On a phone the production page is the decision point for the curator, and it is now the weakest page (fourth critique, P1). On `/productions/bury-me-behind-the-baseboard` at 390×844 the portrait poster takes 585px and pushes the title below the first screen, 11 photos stack at full width, and the page runs about 9,280px (~11 screens). The tour cities sit in a band far below the chips, so "where has it played" is split from "year, age, duration".

## What Changes

- Phones (< 768px): a portrait poster is capped at about 45% of the viewport height, so the title slate (H1, theatre, premiere) is in the first screen. Desktop keeps the current 65vh cap.
- Phones: the photo gallery shows the first 3 photos and a "All N photos" button that opens the existing lightbox at photo 4; desktop keeps the full grid.
- The tour band (city ticker) moves up to sit right after the chips, before the media, on all viewports.
- Order, copy and the booking CTA behaviour are otherwise unchanged (the sticky CTA still appears after the slate scrolls out).

## Capabilities

### New Capabilities

- `production-page-mobile`: how a production page fits a phone: title in the first screen, short gallery, tour facts next to the other facts.

### Modified Capabilities

<!-- none: production-booking-cta and tour-ticker behaviour are unchanged -->

## Impact

- `app/[locale]/productions/[slug]/page.tsx` (TourTicker position), `page.module.css` (`.cover img` max-height on phones).
- `components/GalleryLightbox.tsx` + `.module.css` (mobile preview limit + "all N" button, translated label in RU/EN/DE).
- `messages/{en,ru,de}.json`: one new key for the "All N photos" button.
