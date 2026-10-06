# Tasks

## 1. Country names

- [ ] 1.1 Add `countryName(code, locale)` via `Intl.DisplayNames` in lib/countryCode.ts with an assert-based self-check for FI/KZ/RU in en/ru/de; verify by running it with tsx
- [ ] 1.2 Use it in the /productions country filter labels and on cards; keep ISO in URL params; verify /de/productions and /ru/productions screenshots at 390 and 1440

## 2. Duration on cards

- [ ] 2.1 Append localized duration to ProductionCard meta when `durationMin` is set; verify a card with and without duration on /productions (no trailing " · ")

## 3. Titles

- [ ] 3.1 `not-found.tsx`: add localized `generateMetadata` title (en/ru/de strings); verify `<title>` on /xyz, /ru/xyz, /de/xyz
- [ ] 3.2 `homeTitle` in messages: hyphen → em dash in all locales that use it; verify home `<title>`

## 4. Ship

- [ ] 4.1 Lint, build, commit to main, verify on boklanov.com, changelog entry
