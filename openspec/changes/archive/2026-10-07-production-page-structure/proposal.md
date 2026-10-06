# Proposal

## Why

The production page is the weakest page in the fourth critique (consistency scored 2). The sticker row sits at x=0 with no gutter, so the rotated sticker is clipped on phones and it does not line up with the title column. Credits repeat the role for every person ("Actors / Maksim Morozov", "Actors / Lidia Klirikova"). The press list mixes article headlines with bare outlet homepage links ("sobaka.ru", "Fontanka.ru"), set in the same italic heading style, which reads as captions of the row above; /press already hides those homepage links. Press links have no visible link affordance until hover and are 27px tall. "Watch / listen" is filled vermillion like the booking call to action, so two primary buttons compete.

## What Changes

- The sticker row gets the page's content gutter and aligns with the title column on phones and desktop; no sticker is clipped.
- Credits are grouped by role: consecutive people with the same role show the role once, with the names listed under it.
- The production page's press list hides bare outlet homepage links, the same rule as `/press` (rows stay in the admin).
- Press links show an underline at rest and have a 44px hit area.
- "Watch / listen" uses the secondary (outlined) button style; the booking call to action stays the only filled button.

## Capabilities

### New Capabilities

- `production-page-structure`: layout and list rules on the production page (sticker alignment, credits grouping, press list, button hierarchy).

### Modified Capabilities

<!-- none: touch-targets already requires 44px for standalone links; this change applies it to press rows -->

## Impact

- `app/[locale]/productions/[slug]/page.tsx` and `page.module.css`.
- `isArticle()` moves from `app/[locale]/press/page.tsx` to a small shared `lib/` module so both pages use one rule.
