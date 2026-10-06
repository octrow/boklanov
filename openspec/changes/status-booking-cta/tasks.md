# Tasks

## 1. Rule

- [x] 1.1 Add `bookingKind(status, country)` in `lib/` with `scripts/check-booking-kind.mts` covering all four statuses and Live RU vs non-RU; verify `npx tsx scripts/check-booking-kind.mts` prints ok

## 2. Page and contact

- [x] 2.1 Confirm the copy table in proposal.md with the user, then replace `bookingCta` / `mailtoSubjectShow` with the three label and three subject keys in `messages/{en,ru,de}.json`; verify no other code reads the old keys (`grep`)
- [x] 2.2 Production page uses the label for its kind (admin label override and `bookingCta: false` still work); verify on localhost that the-ape-star shows "Ask Roman about a new production", mcqueen-blood-beneath-skin "Ask Roman about the premiere", beware-of-the-dog "Ask Roman about touring this show" (bury-me-behind-the-baseboard is a Russian theatre show, so "new production"), in both the sticky bar and the closing button, and the RU/DE pages show the RU/DE labels
- [x] 2.3 `/contact?show=<slug>` subject follows the kind; verify the email link `href` on `/contact?show=the-ape-star`, `?show=mcqueen-blood-beneath-skin`, `?show=beware-of-the-dog` and `/ru/contact?show=the-ape-star`

## 3. Ship

- [ ] 3.1 tsc and eslint on touched files pass; commit to main, push, wait for boklanov_v2 success; repeat the 2.2 and 2.3 checks on boklanov.com
- [ ] 3.2 Add a DESIGN_REVIEW_CHANGELOG.md entry (fifth critique plan + this change) and commit it
