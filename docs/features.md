# Features in detail

Moved from README.md. Short versions stay in the README.

- Payload admin at `/admin`, built for one non-technical editor: Russian originals shown under the EN/DE fields,
  a "needs work" list on the dashboard (missing translation, year or poster), a status per production.
  Saving fires `revalidateTag`, so the page updates a few seconds later with no rebuild.
- Poster first. Every card and production page leads with the poster; photos come after.
- Booking button that depends on status: "ask about touring", "about a new production" or "about the premiere".
  It leads to the contact page, where the Telegram link carries a first message already written for that show.
- Images: uploads go through `/api/r2-asset`, which writes the source to R2 and bakes four AVIF sizes on the spot.
  Stored width and height keep the gallery from shifting; LQIP placeholders live next to each production.
- Per-production Open Graph images rendered with `@vercel/og`.
- SEO: `hreflang` alternates, sitemap with a real `lastmod` per production, an RSS feed in RU and EN.
- Ops in CI: a nightly encrypted database backup, a quarterly dead-link check of the live site.
- Self-hosted fonts (Lora, Inter, JetBrains Mono, Unbounded), two themes (dark by default, light "paper").
