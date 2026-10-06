# Proposal

## Why

On prod an unknown production URL (`/productions/xyz`, `/de/productions/xyz`, `/ru/productions/xyz`, even `/productions/VAIKENEMISEN-KIELIOPPI`) returns HTTP 500 with Next's bare "500: Internal Server Error" page: no header, no links, no locale. Local dev returns the site's 404 for the same URL, and `/nope` returns the themed 404 on prod. A curator following a mistyped or stale link hits a dead end that looks like a broken site (fourth critique, P0, heuristic 9 scored 1).

## What Changes

- An unknown production slug returns HTTP 404 with the site's own not-found page (header, footer, the three return links) in the URL's locale, on prod as well as in dev.
- Find the actual server error first (Vercel runtime log or a local production build) and fix that cause; do not mask it with a catch-all.
- A small check script asserts 404, not 500, for unknown production slugs in all three locales and for a known slug 200; run it against boklanov.com after deploy.
- No redirects: every pre-cutover Keystatic slug (54) still exists in the current sitemap (55, plus `vaikenemisen-kielioppi`), so there are no old links to map.

## Capabilities

### New Capabilities

- `missing-pages`: what a visitor gets for a URL that does not exist, including unknown production slugs (status code, page, locale).

### Modified Capabilities

<!-- none -->

## Impact

- `app/[locale]/productions/[slug]/page.tsx` (static params + `notFound()` path), likely `app/[locale]/not-found.tsx` (how it gets locale and translations when rendered from a statically generated route).
- New `scripts/check-missing-pages.sh` (curl).
- The 404 `<title>` lost after hydration is a separate change (`press-and-404-labels`); this change must not regress the server-rendered 404 title.
