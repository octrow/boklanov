# Proposal

## Why

Critique 2026-10-06, P2 (a11y). `TourTicker` scrolls continuously and pauses only on hover or under `prefers-reduced-motion`. On touch and keyboard there is no way to stop it. Moving content that runs longer than 5 seconds needs a pause mechanism (WCAG 2.2.2). The ticker appears on the home page and in the tour band of production pages.

## What Changes

- `TourTicker` gets a small, visible pause/play toggle (a native button, ≥44px hit area, localized label) that stops and resumes the animation. It is keyboard reachable and announced as a toggle (`aria-pressed`).
- Focus inside the ticker region also pauses it (`:focus-within`), as hover does today.
- Visual design, speed, uppercase treatment and the gradient wordmark stay: they are pinned in DESIGN.md §3/§5.
- **Not in scope:** the order of cities on the home ticker (`messages/*.json` `stagingCities`, leads with ST. PETERSBURG · MOSCOW). The owner asked not to touch the home page on 2026-10-06; this stays a separate decision.

## Capabilities

### New Capabilities

- `tour-ticker`: behaviour and accessibility of the scrolling city ticker.

### Modified Capabilities

<!-- none -->

## Impact

`components/TourTicker.tsx` (becomes a client component or gets a tiny client child for the toggle), `components/TourTicker.module.css`, `messages/{en,ru,de}.json` (Pause / Play labels). Callers (`app/[locale]/page.tsx`, production page tour band) unchanged apart from passing labels if needed.
