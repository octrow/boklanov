# Tasks

## 1. Poster and tour band

- [x] 1.1 Cap `.cover img` at 45svh below 768px in `page.module.css`; verify with Playwright at 390×844 on `/productions/bury-me-behind-the-baseboard` that the H1 top is < 844 and the poster is uncropped, and at 1440×900 that the poster height is unchanged
- [x] 1.2 Move the `TourTicker` block to directly after the chips list in `page.tsx`; verify on bury-me-behind-the-baseboard (390 and 1440) that the band follows the chips and the pause button still works

## 2. Gallery preview

- [x] 2.1 In `GalleryLightbox`, hide items after the third below 768px and add an "All N photos" button (new key in `messages/{en,ru,de}.json`, ≥44px, keyboard focusable) that opens the lightbox at index 3; verify at 390 on a production with 11 photos: 3 photos + button, lightbox opens on photo 4 and reaches 1–11; on a production with ≤3 photos no button; at 1440 the full grid is shown
- [x] 2.2 Measure the page height of bury-me-behind-the-baseboard at 390 before and after; verify it drops substantially (record both numbers) — 390: 9294 → 6850px (bury-me-behind-the-baseboard); 1440 unchanged at 4908px

## 3. Ship

- [ ] 3.1 `npx tsc --noEmit` and eslint on touched files pass; commit to main, push, wait for the boklanov_v2 status; verify 1.1, 1.2 and 2.1 on boklanov.com at 390 and 1440 (EN and RU)
- [ ] 3.2 Add a DESIGN_REVIEW_CHANGELOG.md entry and commit it
