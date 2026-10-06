# Design

## Context

Today `.stickyCta` (page.tsx ~788) is `position: fixed` on mobile and static inside the sticky `.rail` on desktop. `.invite` (closing section, ~760) is `display: none` below 1024px with the comment "on mobile the fixed CTA is it". The target is `production.bookingCtaUrl || mailto` built at ~241 (roman.boklanov@web.de, subject/body prefilled). Contact data (`telegramUrl`) comes from `getContact()` in `lib/content.ts`; `/contact` falls back to `https://t.me/roman7593`.

## Goals / Non-Goals

**Goals:** bar hidden at first paint on mobile; shown between slate and invite/footer; default target is Telegram-first.

**Non-Goals:** restyling `/contact` (decided: do not restyle); changing the desktop rail layout; home page (owner: do not touch).

## Decisions

- **Visibility via one IntersectionObserver client island** (`BookingBarVisibility`) that watches the slate, the invite and the footer and toggles a `data-visible` attribute on the bar. CSS does the transition (`transform` + `opacity`, reduced motion → no transition). Alternative: CSS scroll-driven animations (`animation-timeline: view()`). Rejected: no Safari support for the curator-on-iPhone case.
- **Hidden state uses `visibility: hidden` + `inert`**, so it leaves the tab order and a11y tree without layout shift.
- **Default target = `/{locale}/contact?show=<slug>`**, not a new sheet. `/contact` already lists Telegram first and email with Copy. The page reads `show` and, when present, prefixes the existing email link with the touring subject and shows one line "About: <title>". No visual restyle. Alternative: a bottom sheet with TG/email. Rejected: a new component and focus trap for one tap saved.
- **Invite on mobile:** drop the `display: none` below 1024px; keep the desktop styling and use the mobile gutter.
- **Bottom reservation:** `main` gets `padding-bottom: calc(48px + var(--space-4) * 2)` only on production pages below 1024px.

## Risks / Trade-offs

- [The bar never appears on very short pages, because the slate and invite are visible together] → acceptable: the invite link is on screen then.
- [`?show=` slug is untrusted input] → look it up in productions; ignore unknown slugs; never render the raw value.
