# Tasks

## 1. Count and default

- [x] 1.1 Render "<shown> of <total>" next to the H1 in all states (move it out of the panel's bottom), with `aria-live="polite"`; verify at 390 and 1440 with and without `?form=puppet`
- [x] 1.2 Name the default role in the UI ("Directed by Roman" / RU / DE strings in messages); verify all three locales render the label without overflow at 390px

## 2. Mobile disclosure

- [x] 2.1 Below 768px wrap the groups in a disclosure button (native `<button aria-expanded>` + region; `<details>` acceptable) whose label is "Filter · <active summary>"; verify first row of posters is in the first viewport at 390×844 (Playwright screenshot)
- [x] 2.2 Keep the button ≥44px, Esc closes the open panel and returns focus to the button; verify by keyboard in Playwright

## 3. Desktop

- [x] 3.1 Fix the orphan "COUNTRY" wrap at 1440px (one row); verify desktop screenshot

## 4. Ship

- [x] 4.1 Lint, typecheck, build; commit to main; verify on boklanov.com after the Vercel deploy; changelog entry
