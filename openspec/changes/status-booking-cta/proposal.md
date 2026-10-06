# Proposal

## Why

Every production page ends with "Ask Roman about touring this show" (sticky bar and closing button), and `/contact` then prefills the email subject "Touring: <title>", whatever the production's state. That includes Russian repertoire from 2020–21, which PRODUCT.md says is never sold as current, and shows that have not premiered (fifth critique, P1; decided 2026-10-07: archived and Russian shows offer a new production).

## What Changes

- The booking call to action on a production page is chosen from the admin Status and the theatre's country:
  - On tour → "Ask Roman about touring this show" (today's label);
  - Archived, or Live at a Russian theatre → "Ask Roman about a new production";
  - In development → "Ask Roman about the premiere".
- The link still goes to `/contact?show=<slug>`. `/contact` prefills the email subject to match: "Touring: <title>", "New production / <title>", "Premiere: <title>".
- RU and DE get the same three labels and subjects (proposed copy below; confirm at apply).
- A per-production label set in the admin (`bookingCtaLabel`) still wins; `bookingCta: false` still hides the CTA.

Proposed copy:

|                  | EN                                | RU                                          | DE                                             |
| ---------------- | --------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| tour label       | Ask Roman about touring this show | Написать Роману о гастролях этого спектакля | Roman zu einer Tournee schreiben               |
| new label        | Ask Roman about a new production  | Написать Роману о новой постановке          | Roman wegen einer neuen Inszenierung schreiben |
| premiere label   | Ask Roman about the premiere      | Написать Роману о премьере                  | Roman wegen der Premiere schreiben             |
| tour subject     | Touring: {title}                  | Гастроли: {title}                           | Tournee: {title}                               |
| new subject      | New production / {title}          | Новая постановка / {title}                  | Neue Inszenierung / {title}                    |
| premiere subject | Premiere: {title}                 | Премьера: {title}                           | Premiere: {title}                              |

## Capabilities

### New Capabilities

- `booking-cta`: which booking call to action a production page shows and what the contact email subject says.

### Modified Capabilities

<!-- none: production-availability covers card markers and the TOURING sticker, not the CTA -->

## Impact

- `app/[locale]/productions/[slug]/page.tsx` (label), `app/[locale]/contact/page.tsx` and the client email/topic island (subject by kind), `messages/{en,ru,de}.json`, a small `lib/` helper with an assert check.
- Content: with every Status still "Live", non-Russian shows keep the touring label until Roma sets Statuses.
