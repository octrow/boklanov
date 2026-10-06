# Tasks

## 1. Target

- [ ] 1.1 Change the default booking href to `/{locale}/contact?show=<slug>` (keep `bookingCtaUrl` override and `bookingCta: false`); verify with a unit/snapshot or by reading the rendered href on /productions/nikita-looking-for-the-sea
- [ ] 1.2 `/contact`: read `show`, resolve it against known productions, show "About: <title>" and prefill the email subject; unknown slug renders the page unchanged. Verify /contact?show=nikita-looking-for-the-sea and /contact?show=<script> in RU/EN/DE
- [ ] 1.3 Add the new strings to messages/en.json, ru.json, de.json; verify `npm run typecheck` (or tsc) passes

## 2. Mobile visibility

- [ ] 2.1 Add the client island that observes slate, `.invite` and footer and sets `data-visible` + `inert` on `.stickyCta`; verify at 390×844 with Playwright: bar absent at load, present after scrolling past the slate, absent at the footer
- [ ] 2.2 CSS: hidden state (`visibility: hidden`, transform), reduced-motion without transition, `main` bottom padding on production pages <1024px; verify no overlap with the last paragraph in a full-page mobile screenshot

## 3. Closing invite on phones

- [ ] 3.1 Show `.invite` below 1024px with mobile gutters; verify a mobile screenshot ends with the invite before the footer on nikita and vaikenemisen-kielioppi

## 4. Ship

- [ ] 4.1 Lint, typecheck, `next build`; commit to main; after the Vercel status is success, re-run the 390px check on boklanov.com and add an entry to DESIGN_REVIEW_CHANGELOG.md
