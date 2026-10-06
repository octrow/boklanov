# Tasks

## 1. Layout and buttons

- [x] 1.1 Give `.stickerRow` the content gutter / title-column alignment in `page.module.css`; verify with Playwright at 390 and 1440 on bury-me-behind-the-baseboard that the sticker box is inside the viewport and its left edge matches the H1 column (±4px)
- [x] 1.2 Switch "Watch / listen" to `btnSecondary`; verify on a production with a video that no action-bar button is filled

## 2. Lists

- [x] 2.1 Group consecutive credits by role (one `<dt>`, several `<dd>`); verify on bury-me-behind-the-baseboard that each role label appears once per run and all names/links remain
- [x] 2.2 Move `isArticle()` to `lib/` (used by `/press` and the production page) and filter the production press list with it; verify bury-me-behind-the-baseboard no longer shows "sobaka.ru" / "Fontanka.ru" rows and `/press` is unchanged (same row count as before)
- [x] 2.3 Underline press links at rest and add `tap-target`; verify at 390 the press rows' hit area is ≥44px (elementFromPoint 10px above/below the text lands on the link)

## 3. Ship

- [ ] 3.1 tsc and eslint on touched files pass; commit to main, push, wait for boklanov_v2 success; verify 1.1–2.3 on boklanov.com (EN at 390 and 1440, RU at 390)
- [ ] 3.2 Add a DESIGN_REVIEW_CHANGELOG.md entry and commit it
