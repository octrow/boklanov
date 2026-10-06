# Proposal

## Why

A curator's real question is "can I invite this show now?". Cards answer with theatre, city, year, age and duration, but not availability, so Russian-era productions in "Selected works" and the grid look like current repertoire (fourth critique, P1). The only signal, the TOURING sticker on the detail page, shows whenever a production has tour cities, so a Russian show that toured in 2019 is also marked TOURING. The admin already has a "Status" field (Live / In development / Archived / On tour), but the site ignores it and every production is still "Live" (the default). Decided 2026-10-06 (option 1): show availability from that field.

## What Changes

- The site reads the production's admin "Status".
- Cards (home "Selected works" and `/productions`) end their meta line with a mono token: "ON TOUR" / «НА ГАСТРОЛЯХ» / "AUF TOURNEE", "IN DEVELOPMENT" / «В РАБОТЕ» / "IN ARBEIT", "ARCHIVE · 2021" / «АРХИВ · 2021» / "ARCHIV · 2021" (year when known). "Live" shows no token.
- The city leaves the card meta line (the theatre name stays), to keep the line short.
- The TOURING sticker on the production page shows only when Status is "On tour", not when tour cities exist. The tour city band is unchanged (it is history).
- Roma sets the status for each production in the admin (content to-do; until then nothing new shows, because all are "Live").
- Home page composition, order and grid are unchanged.

## Capabilities

### New Capabilities

- `production-availability`: how a production's availability (status) is shown on cards and on the production page.

### Modified Capabilities

<!-- none: curator-facts covers country/duration; this adds a separate requirement set -->

## Impact

- `lib/content.ts` (map `status` into `Production`), `components/ProductionCard.tsx` (+ CSS for the token), `app/[locale]/productions/[slug]/page.tsx` (sticker condition), `messages/{en,ru,de}.json` (3 labels).
- No schema change, no migration: the field exists with default `live`.
