# production-booking-cta Specification

## Purpose

Defines when the booking call to action appears on a production page and where it leads, so a curator on a phone sees the show first and then has a one-tap path to the primary contact channels.

## Requirements

### Requirement: Mobile booking bar appears after the slate

On viewports narrower than 1024px, the fixed booking bar SHALL be hidden while the production slate (title block with theatre and premiere) is in view, and SHALL be shown once the slate has scrolled above the viewport.

#### Scenario: Landing on a production page on a phone

- **WHEN** a visitor opens a production page at 390×844
- **THEN** no fixed booking bar overlaps the title, poster or trailer in the first viewport

#### Scenario: Scrolling past the slate

- **WHEN** the visitor scrolls until the slate is above the viewport
- **THEN** the fixed booking bar is visible at the bottom of the screen

### Requirement: Mobile booking bar yields to the closing invite and footer

The fixed booking bar SHALL hide while the closing invite section or the site footer intersects the viewport, and the page SHALL reserve bottom space so the bar never covers content.

#### Scenario: Reaching the end of the page

- **WHEN** the closing invite or footer scrolls into view
- **THEN** the fixed bar is hidden and the invite's own link is the only booking action on screen

### Requirement: Booking action leads to the primary channels

Unless the editor set `bookingCtaUrl`, the booking action SHALL lead to a contact choice for this show that lists Telegram first and email second, and names the show. When `bookingCta` is false, no booking action SHALL render.

#### Scenario: Default target

- **WHEN** a production has no `bookingCtaUrl`
- **THEN** activating the booking action shows Telegram first, then email (with the touring subject prefilled), naming the production

#### Scenario: Editor override

- **WHEN** a production has `bookingCtaUrl` set
- **THEN** the booking action links to that URL with the editor's label if set

### Requirement: The page ends with an invitation on every viewport

The closing invite section SHALL render on phones as well as desktop when the booking action is enabled.

#### Scenario: Phone end of page

- **WHEN** a visitor scrolls to the end of a production page at 390px
- **THEN** an invite heading and booking link appear before the footer

### Requirement: Booking bar visibility is announced once

Assistive technology SHALL NOT encounter two identically named booking links in the same region; a hidden bar SHALL be removed from the accessibility tree and tab order.

#### Scenario: Keyboard user on a phone layout

- **WHEN** the bar is hidden
- **THEN** tabbing does not focus it
