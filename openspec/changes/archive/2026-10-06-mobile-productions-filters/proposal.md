# Proposal

## Why

Critique 2026-10-06, P1. On a phone `/productions` opens on 15 always-open filter controls (Role 5, Form 5, Age 4, Country) taking about 336px, so the first screen shows no work at all. The default `role=director` (brief D5) silently hides 24 of 55 productions. The result count appears only once a non-default filter is on, and it sits below the controls, so tapping a chip gives no visible feedback. A curator with 90 seconds should land on posters.

## What Changes

- Below 768px the filter controls collapse behind one disclosure button that states the current state, e.g. "Filter · Directed by Roman · 31 of 55". Tapping it opens the existing groups in place. Desktop and tablet keep the open toolbar.
- The count is always visible (including in the default state) and sits next to the H1, announced politely on change.
- The default is named in the UI ("Directed by Roman") instead of being a hidden state; "All roles" stays one tap away.
- Filter state stays in the URL as today. Clear-all and Esc behaviour are unchanged.

## Capabilities

### New Capabilities

- `productions-filtering`: how the productions index exposes its filters, default and result count, per viewport.

### Modified Capabilities

<!-- none -->

## Impact

- `components/FilteredProductionsPanel.tsx` + `.module.css`, `app/[locale]/productions/page.tsx` (count placement next to the H1), `messages/{en,ru,de}.json` (new labels).
- No data or URL changes. Grid columns stay 2 on phones and 3 on desktop (decided).
