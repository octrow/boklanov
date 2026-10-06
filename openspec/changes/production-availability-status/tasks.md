# Tasks

## 1. Data

- [ ] 1.1 Map `status` into `Production` in `lib/content.ts` (fallback `live`); verify `npx tsc --noEmit` passes and a local production with status set in the local admin returns it

## 2. Cards and sticker

- [ ] 2.1 Add the availability token to `ProductionCard` meta and remove the city; labels in `messages/{en,ru,de}.json`; verify at 390 and 1440 on local `/productions` and `/` with one production set to Archived (2021), one On tour, one Live: tokens "ARCHIVE · 2021", "ON TOUR", none; RU and DE translated; no city in any card meta
- [ ] 2.2 Show the TOURING sticker only for `status === 'on-tour'`; verify locally on a production with tour cities and status Archived (no sticker, band present) and one On tour (sticker)

## 3. Ship

- [ ] 3.1 eslint and tsc on touched files pass; commit to main, push, wait for boklanov_v2 success; verify on boklanov.com that cards have no city and no token (all Live) and nothing else changed
- [ ] 3.2 Add a DESIGN_REVIEW_CHANGELOG.md entry and a Roma content to-do ("set Status on every production: Live / On tour / In development / Archived"); commit
