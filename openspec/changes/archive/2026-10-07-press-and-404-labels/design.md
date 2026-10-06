# Design

## Context

- No code sets `document.title`. The server HTML for `/nope` has the not-found title; after hydration the tab shows the layout's home title. Likely Next 15.4 streaming metadata: the client applies the `[locale]` layout metadata and drops the not-found segment's `generateMetadata`.
- `production-slug-404` may rewrite `not-found.tsx` (client body); this change must build on whatever it leaves.

## Goals / Non-Goals

**Goals:** stable 404 title; accurate press note; language names; de alternate.

**Non-Goals:** translating headlines (content, Roma's to-do); a `/de` translation-completeness decision.

## Decisions

1. **404 title: render a React 19 `<title>` inside the not-found body** (hoisted to `<head>`, wins on the client), translated with the same `notFound.title` key. Keep `generateMetadata` if it still works on the server; if both exist, check there is exactly one `<title>` in the final DOM. Rejected: a `useEffect` setting `document.title` (flash of the wrong title, extra code).
2. **Language name via `Intl.DisplayNames([locale], { type: 'language' })`**, same pattern as `countryName()` (fallback to the code). Lowercase in RU follows `Intl` output.
3. **Note copy** as in the proposal; the user confirms the wording before apply.

## Risks / Trade-offs

- [Two `<title>` elements in head] → accepted 2026-10-07: the not-found `<title>` comes first, so `document.title` and the tab are correct; the layout title stays too. 404s are not indexed.
