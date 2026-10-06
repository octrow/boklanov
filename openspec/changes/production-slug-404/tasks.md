# Tasks

## 1. Diagnose

- [ ] 1.1 Get the server error for `GET /productions/xyz` on prod: ask the user for the Vercel runtime log line (Dashboard → boklanov_v2 → Logs, filter `/productions/xyz`), or reproduce with `next build && next start` on a spare port against the local DB; verify by having the stack trace written into design.md under Context
- [ ] 1.2 Write `scripts/check-missing-pages.sh [base]` (404 for `/productions/does-not-exist`, `/de/…`, `/ru/…`, `/productions/VAIKENEMISEN-KIELIOPPI`, `/nope`; 200 for `/productions/vaikenemisen-kielioppi`); verify it fails against https://boklanov.com today (exit ≠ 0, the three slug URLs report 500)

## 2. Fix

- [ ] 2.1 Fix the cause found in 1.1 with the smallest change (design decision 2); verify `npx tsc --noEmit` and `rtk proxy npx eslint` on the touched files pass, and `scripts/check-missing-pages.sh http://localhost:3010` passes
- [ ] 2.2 If 1.1 used a local production build, re-run the check against it; verify all six URLs pass and the en/ru/de not-found pages show translated text and the site header (Playwright screenshot at 390)

## 3. Ship

- [ ] 3.1 Commit to main (`fix: unknown production slugs return the site's 404, not 500`), push, wait for the boklanov_v2 status to be success; verify `scripts/check-missing-pages.sh` passes against https://boklanov.com and the 404 page server HTML still has its own title (`curl -s https://boklanov.com/productions/xyz | grep -o '<title>[^<]*'`)
- [ ] 3.2 Verify a known production page still renders 200 and a production page not touched by the deploy still loads; add a DESIGN_REVIEW_CHANGELOG.md entry and commit it
