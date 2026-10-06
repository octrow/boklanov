# Proposal

## Why

The 2026-10-06 site critique (`.impeccable/critique/2026-10-06T14-27-10Z__app-locale.md`, P1) found that on a phone the fixed "Email Roman about touring this show" bar on every production page is visible from first paint. It covers the H1 and then the trailer's play button, and asks for a booking before the curator has seen the show. It is also mailto-only, which contradicts the recorded decision that Telegram and Instagram are the primary contact (PRODUCT.md). This is the first step of the curator's mobile path: show → decide → contact.

## What Changes

- On phones (<1024px) the fixed booking bar appears only after the production slate (title, theatre, premiere) has scrolled out of view, and hides again when the page's closing invite or the footer is on screen.
- `main` reserves bottom space while the bar is shown, so the bar never covers the last lines of content.
- The default booking target becomes the contact choice (Telegram first, email second) for this show instead of a bare `mailto:`. The editor overrides (`bookingCta: false`, `bookingCtaUrl`, `bookingCtaLabel`) keep working.
- The closing invite section is shown on phones too (today it is desktop-only), so the page ends with the invitation.
- On desktop, the rail CTA and the closing invite stay. Screen readers get one named landmark for the booking action, not two identical links.

## Capabilities

### New Capabilities

- `production-booking-cta`: when and where the booking call to action appears on a production page, and where it leads.

### Modified Capabilities

<!-- none -->

## Impact

- `app/[locale]/productions/[slug]/page.tsx` (CTA target, invite section), `page.module.css` (`.stickyCta`, `.invite`).
- A small client component for scroll-based visibility (IntersectionObserver; no new dependency).
- `app/[locale]/contact/page.tsx` may accept `?show=<slug>` to name the show (copy is per locale in `messages/*.json`).
- Analytics attribute `data-ph-event='booking_cta_click'` is kept.
