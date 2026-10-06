# Design

## Context

- The label comes from `t('bookingCta')` unless `production.bookingCtaLabel` is set (`page.tsx` ~259); the same `ctaLabel` feeds `BookingBar` and the closing invite.
- `/contact` is static; it builds a `slug → title` map for the `?show=` client island, which formats `mailtoSubjectShow`.
- Status values: `live | in-development | archived | on-tour` (`lib/content.ts`). `theatre.country` is an ISO code; `ticketsUrl` already hides for `RU`.

## Goals / Non-Goals

**Goals:** one rule decides the CTA kind; page and contact subject agree; three locales.

**Non-Goals:** the in-development page layout (separate change); shortening the mono closing button beyond the new copy; changing Statuses (content).

## Decisions

1. **One helper `bookingKind(status, country) → 'tour' | 'new' | 'premiere'`** in `lib/` beside `availability.ts`, with an assert script. Live + RU → `new` because Status data is all "Live" today and PRODUCT.md already forbids selling RU work as current; this keeps the rule correct before Roma sets Statuses.
2. **Messages:** `bookingCtaTour` / `bookingCtaNew` / `bookingCtaPremiere` replace `bookingCta`; `mailtoSubjectTour` / `New` / `Premiere` replace `mailtoSubjectShow`. Old keys are removed.
3. **Contact:** the map becomes `slug → { title, kind }`; the island picks the subject template by kind. Still static.

## Risks / Trade-offs

- [Live non-RU shows that cannot actually tour still say "touring"] → fixed by Roma setting Status; noted in the content to-dos.
- [Copy] → table in proposal.md is confirmed with the user at apply before shipping.
