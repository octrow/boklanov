# Tasks

## 1. Measure

- [x] 1.1 Add a Playwright check script (scratch, not CI) that lists links <44px tall at 390×844 on /press, /awards, /archive, /productions/nikita-looking-for-the-sea, /productions/vaikenemisen-kielioppi, excluding links inside `<p>`; record the baseline counts

## 2. Fix

- [x] 2.1 /press `.groupLink` and /awards `.productionLink`: min-height 44px via padding/inline-flex, visual rhythm unchanged; verify with the script and a before/after screenshot
- [x] 2.2 /archive rows: make the row link fill the row height ≥44px; verify "co-director" still fits or wraps cleanly in the role column at 390px
- [x] 2.3 TheatreSlate: remove the nested link, give the theatre link a ≥44px hit area; verify DOM has no `a a` and the script passes
- [x] 2.4 Credits on production pages: credit-name links get a ≥44px hit area that does not break the leader-dot alignment; verify screenshot of nikita credits

## 3. Ship

- [ ] 3.1 Re-run the script (all zero outside prose), lint, build, commit to main, verify on boklanov.com, changelog entry
