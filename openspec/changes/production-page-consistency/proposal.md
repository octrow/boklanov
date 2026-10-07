# Proposal

## Why

The sixth critique (2026-10-07, 21/32) found the production page inconsistent:

- On a 1440×900 desktop the portrait poster, capped at 65vh, pushes the title to about 790px, so the first screen of lina-marlina is a poster in a black frame with no name. The poster stays the main image (decided 2026-10-07); it just has to leave room for the title.
- Three button styles: the mono outlined booking button, the grey Inter boxes ("Buy tickets", "Watch / listen", rider links) and the filled buttons on /contact.
- The browser tab and search result read "Lina-Marlina" alone, while every other page reads "Roman Boklanov — …".
- The "Credits" and tour-rider disclosures are 37px tall, under the site's 44px touch target.

## What Changes

- Desktop (≥1024px): the production poster is height-capped so that at 1440×900 the H1 is fully visible without scrolling. Phones are unchanged.
- The secondary buttons on the production page (watch/listen, buy tickets, rider/press-kit links) take the booking button's grammar: mono, uppercase, outlined. Their border is neutral, not the accent: one primary (accent) and the rest secondary. /contact is not touched (decision: no restyle).
- Production pages get the site name in their `<title>`: "<production title> — Roman Boklanov" (localized site name). Open Graph title follows.
- The Credits and tour-rider `<summary>` controls get a 44px minimum height.
- Ops: check whether Vercel Skew Protection is on for boklanov_v2 (after the 2026-10-07 deploy, a production page twice loaded HTML pointing at a deleted CSS chunk and rendered unstyled); if it's off, the user enables it in the dashboard.

## Capabilities

### New Capabilities

- `page-titles`: what the document title of a production page says.

### Modified Capabilities

- `production-cover`: adds the desktop height cap.
- `production-page-structure`: adds one button grammar for page actions.
- `touch-targets`: adds the 44px minimum for disclosure controls.

## Impact

- `app/[locale]/productions/[slug]/page.tsx` (metadata title), `page.module.css` (cover cap, `.btn`/`.btnSecondary`, `.creditsSummary`), `components/TourRider.module.css` (summary header).
- Content to-dos for Roma from the sixth critique go into the changelog with this change (Statuses, home `listOrder`, DE titles and theatre names, Bury synopsis fragment, empty gallery alt on lina-marlina).
