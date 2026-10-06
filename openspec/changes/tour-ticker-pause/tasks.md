# Tasks

## 1. Toggle

- [ ] 1.1 Add a client toggle button inside the ticker section that sets `data-paused` on the section; CSS sets `animation-play-state: paused` for `[data-paused]`, `:hover` and `:focus-within`; verify in Playwright at 390px that the track's transform stops changing after a tap
- [ ] 1.2 Localized labels (Pause / Play ticker) in en/ru/de; `aria-pressed`; ≥44px hit area that fits the band without changing its height on desktop; verify screenshots of home and nikita tour band at 390 and 1440
- [ ] 1.3 Verify reduced motion: emulate `prefers-reduced-motion: reduce`, the track is static and the toggle is hidden or inert

## 2. Ship

- [ ] 2.1 Lint, build, commit to main, verify on boklanov.com, changelog entry
