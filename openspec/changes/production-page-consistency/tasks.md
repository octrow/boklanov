# Tasks

## 1. Page

- [x] 1.1 Cap the poster height at ≥1024px so the H1 fits in 1440×900; verify with Playwright the H1 bottom < 900 on lina-marlina, bury-me-behind-the-baseboard and a landscape poster (vaikenemisen-kielioppi) at 1440×900, and the 390×844 poster height is unchanged (measure before/after)
- [x] 1.2 Secondary production-page buttons take the mono uppercase outlined grammar with a neutral border; booking stays accent; verify computed font-family/text-transform on "Watch / listen" (bury) and "Buy tickets" (lina-marlina) match the closing booking button, and 390/1440 screenshots of both pages
- [x] 1.3 Production `<title>` and OG title read "<title> — <siteName>"; verify after load on /productions/lina-marlina, /ru/… and /de/…, and that other pages' titles are unchanged
- [x] 1.4 Credits and TourRider summaries ≥44px tall; verify bounding boxes at 390 and 1440 on lina-marlina

## 2. Ship

- [x] 2.1 tsc and eslint on touched files pass; commit to main, push, wait for boklanov_v2 success; repeat 1.1–1.4 on boklanov.com
- [x] 2.2 Check Vercel Skew Protection for boklanov_v2 (`vercel project` / API, read-only); if off, tell the user how to enable it (dashboard, their action)
- [x] 2.3 Add a DESIGN_REVIEW_CHANGELOG.md entry and the sixth-critique content to-dos for Roma (Statuses, home listOrder, DE titles and theatre names, Bury synopsis fragment, empty gallery alt on lina-marlina); commit
