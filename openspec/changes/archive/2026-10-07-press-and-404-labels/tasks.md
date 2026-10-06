# Tasks

## 1. 404 title

- [x] 1.1 Keep the not-found title after hydration (already done by production-slug-404: client not-found renders `<title>`; only verify here); verify with Playwright that `document.title` after load on `/nope`, `/de/nope`, `/ru/nope` and `/productions/xyz` is the localized not-found title (the layout's `<title>` also stays in `<head>`; accepted 2026-10-07: `document.title` is ours, 404s aren't indexed)

## 2. Press and metadata

- [x] 2.1 Update `press.originalNote` in `messages/{en,ru,de}.json` with the confirmed wording; verify on local `/press`, `/ru/press`, `/de/press`
- [x] 2.2 Show the article language by name with `Intl.DisplayNames`; verify `/press` shows "Vuosaari · Finnish" and `/de/press` "Finnisch"
- [x] 2.3 Add `de` to the production page `alternates.languages`; verify `curl -s localhost:3010/productions/vaikenemisen-kielioppi | grep -o 'hreflang="[a-z-]*"'` lists en, ru, de

## 3. Ship

- [x] 3.1 tsc and eslint on touched files pass; commit to main, push, wait for boklanov_v2 success; verify 1.1, 2.1–2.3 on boklanov.com
- [x] 3.2 Add a DESIGN_REVIEW_CHANGELOG.md entry and commit it
