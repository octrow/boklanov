# Design

## Context

- `.cover img` caps at `max-height: 65vh` (`page.module.css:28`); at 390×844 that is ~549px plus the credit line, so the slate starts below the fold.
- `GalleryLightbox` renders all items in a 1-column grid on phones (2 columns ≥ some breakpoint) and owns the lightbox state.
- The `TourTicker` sits after the action bar, far below the chips (`page.tsx:641`). The tour ticker spec (pause, reduced motion) is unaffected by moving it.

## Goals / Non-Goals

**Goals:** first screen = poster + title on phones; ~half the scroll on photo-heavy pages; tour next to facts.

**Non-Goals:** reordering poster after the title (rejected below); a horizontal photo strip; changing desktop layout; changing the sticky CTA logic.

## Decisions

1. **Cap the poster, don't reorder.** `@media (max-width: 767px) { .cover img { max-height: 45svh } }`. One CSS line, keeps the poster-first identity of the page. Rejected: title before poster (DOM/CSS order change, breaks the poster preload/LCP and the slate-triggered sticky CTA timing).
2. **Gallery preview via CSS + one button.** `GalleryLightbox` gets the items as now; on phones items after the 3rd get a class hidden below 768px, and a button (shown only below 768px, only if items > 3) opens the lightbox at index 3. Rejected: horizontal scroll-snap strip (new interaction, swipe conflicts with page scroll, harder for keyboard users). Rejected: server-side slicing (desktop needs all).
3. **Move the TourTicker JSX** to right after the chips list. No other change.

## Risks / Trade-offs

- [45svh makes a landscape poster tiny] → max-height only bites on tall images; landscape posters are width-bound and unaffected.
- [Hidden photos via CSS still download] → they are `loading=lazy` and below the fold; acceptable. Ceiling noted in a `ponytail:` comment.
