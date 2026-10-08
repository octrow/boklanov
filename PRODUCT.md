# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: EU curator.** Festival and theatre programmers in Europe deciding whether to invite a production or hire Roman to stage one. Usually on a phone, in a session of about 90 seconds. In that time they must leave knowing what kind of theatre he makes, two or three productions worth a closer look, and how to reach him outside Instagram.
- **Editor: Roman Boklanov himself.** Edits through the Payload admin (`/admin`) on a laptop, rarely, roughly when a new production appears. He writes RU first; EN/DE come later or with help. One editor, not a technical user.

## Product Purpose

Portfolio site of theatre director Roman Boklanov (boklanov.com): productions, bio, awards, press, contact, in RU/EN/DE. Success means an invitation or a commission. Priority order: invitation/booking > press kit (EPK) > archive.

## Positioning

The work of an independent director of puppet, object and children's theatre, without a troupe of his own. The site presents a body of work across theatres and countries, not one company's repertoire.

## Operating Context

- The public site is read on mobile first, in RU, EN or DE.
- Saving in the admin puts the edit on the site within seconds, without a deploy. There are no drafts and no autosave: every field, in every language, goes live only on Save. The page edits one language at a time, chosen in the document header (Русский / English / Deutsch); switching with unsaved changes asks first. On EN/DE pages each translatable field shows the RU original beneath it.
- Glossary: `CONTEXT.md` (Saved, Published).

## Capabilities and Constraints

- Next.js on Vercel, Payload 3 CMS on Neon Postgres, media on Cloudflare R2.
- Routes: `/`, `/productions`, `/productions/[slug]`, `/about`, `/awards`, `/press`, `/archive`, `/contact`, `/feed`.
- Locales: en (default, no prefix), ru (`/ru`), de (`/de`).
- Roman left Russia in 2022. Russian productions are described in the past tense, never as current repertoire.
- Press and awards are shown fully translated on EN pages (decided 2026-10-06). DE completeness is still undecided.
- Contact: Telegram and Instagram stay the primary channels, email secondary (May 2026 brief, reconfirmed 2026-10-06).

## Brand Commitments

- Name: Роман Бокланов / Roman Boklanov. No logo; the name in type is the mark.
- Voice: curatorial, quiet, declarative; not promotional.

## Evidence on Hand

- Productions, awards, press and bio live in the Payload database (single source since the 2026-10-05 cutover).
- Production photos and posters on R2. About photos in `public/about/`.
- Photographer credits are incomplete; do not invent them. Legal clearance for production photos is unverified.
- No testimonials or client logos exist; do not fabricate them.

## Product Principles

1. The work leads. Productions and their photos carry the site; chrome stays out of the way.
2. A curator on a phone gets to an invitation-worthy picture and a contact in 90 seconds.
3. Facts over claims: dates, theatres, cities, credits, awards. No hype.
4. Editing must be safe for a non-technical editor working rarely: no hidden states, obvious what is already live.
