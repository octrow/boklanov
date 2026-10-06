# Design

## Context

- Payload field `status` (select, default `live`; values `live`, `in-development`, `archived`, `on-tour`) exists in `collections/Productions.ts` but `lib/content.ts` does not map it into `Production`.
- `ProductionCard` builds `meta` = theatre · city · year · age · duration (`ProductionCard.tsx:44`). Home `FeaturedStrip` uses the same card, so one change covers both.
- The detail-page sticker condition is `production.tour.length > 0` (`page.tsx:429`).

## Goals / Non-Goals

**Goals:** availability visible on every card; sticker stops claiming touring for past tours.

**Non-Goals:** a status filter on `/productions` (add if curators ask); inferring status from country (rejected: a guess, not a fact); setting statuses in the DB (Roma does it in the admin).

## Decisions

1. **Map `status` in `lib/content.ts`** with `live` as the fallback for null/unknown values.
2. **Token as the last meta item, styled as the existing mono meta** (no fill, no pill, per DESIGN.md "mono labels without fill"); a small `<span>` inside the meta paragraph with uppercase + letter-spacing, so screen readers read it as part of the line. Rejected: a sticker on the card (stickers are capped per page and reserved for the detail page).
3. **Drop the city from card meta** (theatre is enough; the city stays on the detail page slate). Shortens the 4-line meta on 2-column phone cards.
4. **Sticker:** `status === 'on-tour'`.

## Risks / Trade-offs

- [All 55 are "Live" today, so nothing visible changes until Roma sets statuses] → content to-do in the changelog; verify locally by setting statuses in the local DB.
- ["Live" means "currently running" in the admin; a Russian show left on Live reads as current] → content, not code; the changelog to-do names it.
