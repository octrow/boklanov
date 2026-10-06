# Design

## Context

- The slug route has `generateStaticParams` (locales × slugs from the DB) and the default `dynamicParams = true`, so unknown slugs are rendered on demand on Vercel and call `notFound()` (`page.tsx:196`).
- `app/[locale]/not-found.tsx` is a server component that calls `getTranslations('notFound')` without a locale, in both `generateMetadata` (added in 4c5a714) and the component. It relies on next-intl's request locale.
- `/nope` goes through `app/[locale]/[...rest]/page.tsx` (no static params) and returns the themed 404 on prod. Only the statically generated route fails, and only on prod; `next dev` renders everything dynamically, which is why local returns 404.
- Leading hypothesis (unconfirmed): when `notFound()` fires during on-demand static rendering, the not-found boundary renders without the request locale, `getTranslations` without a locale throws (it would need headers, which static rendering forbids), and the failure surfaces as the Pages-router 500.

## Goals / Non-Goals

**Goals:** 404 with the themed page for unknown slugs on prod in all locales; a repeatable check.

**Non-Goals:** the 404 `<title>` lost after hydration (separate change); redirects (no slugs changed in the cutover); other dynamic routes (none besides `[slug]` have static params with `notFound()`; the check covers `/nope` too).

## Decisions

1. **Diagnose before fixing.** Get the real stack trace: Vercel runtime log for `GET /productions/xyz` (the user can copy it from the dashboard), or reproduce with a local `next build && next start` against the local DB on :5433. Pick the fix from the trace, not from the hypothesis.
2. **If the hypothesis holds: stop not-found depending on the request locale.** `getLocale()` reads the same request locale, so it does not help. Move the not-found body to a client component that uses `useTranslations` (the layout's `NextIntlClientProvider` already supplies the locale and all messages), keeping a server `generateMetadata` only if the trace shows it is safe; otherwise set the title another way in `press-and-404-labels`. Prefer the smallest change the trace supports, and keep the server-rendered `<title>` from 4c5a714 if possible.
   - Rejected: `export const dynamicParams = false`. Unknown slugs would 404 natively, but a production added in the admin would 404 until the next deploy, which breaks the publish-without-deploy promise (PRODUCT.md, `content-publishing`).
   - Rejected: `export const dynamic = 'force-dynamic'` on the slug route. Hides the bug, gives up static pages for 55 productions.
   - Rejected: wrapping in try/catch. Masks the cause.
3. **Check script, not a test framework.** `scripts/check-missing-pages.sh [base-url]`: curl status for unknown slugs in en/ru/de, the upper-case slug, `/nope`, and one known slug (expect 404 ×5, 200 ×1); exit non-zero on mismatch. Default base is https://boklanov.com.

## Risks / Trade-offs

- [The trace points somewhere else, e.g. `getProduction` throwing on prod data] → follow the trace; the spec and the check stay the same, only the design note and the fix change.
- [A new production slug misbehaves after the fix] → the second requirement; verify by loading a slug that was not in the last build's static params (rename a test slug locally, or check a production created after the deploy).
