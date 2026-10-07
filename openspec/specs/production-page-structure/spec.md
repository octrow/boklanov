# production-page-structure Specification

## Purpose

Keeps the production page visually orderly and its lists honest for a curator scanning it on a phone: stickers aligned with the title column, credits readable by role, press rows that are real articles with a visible, tappable link, and a single filled call to action (booking).

## Requirements

### Requirement: Stickers align with the content column

The award and touring stickers on a production page SHALL sit inside the page's content gutter, aligned with the title column, and SHALL NOT be clipped by the viewport at 390px or 1440px.

#### Scenario: Phone

- **WHEN** a production with an award sticker is opened at 390×844
- **THEN** the sticker's bounding box lies fully inside the viewport and starts at the same left edge as the title column

### Requirement: Credits grouped by role

Consecutive credits with the same role SHALL be shown under one role label, with each person's name (and link, when set) listed beneath it, in the stored order.

#### Scenario: Several actors

- **WHEN** a production lists "Actors: Maksim Morozov" and "Actors: Lidia Klirikova" consecutively
- **THEN** the credits show "Actors" once followed by both names

### Requirement: Press list shows articles only

The production page's press list SHALL omit entries whose link is a bare outlet homepage (no path and no query), using the same rule as `/press`. Remaining press links SHALL be visibly underlined at rest and have a hit area at least 44px tall.

#### Scenario: Homepage link in the data

- **WHEN** a production's press data contains `http://sobaka.ru/` titled "sobaka.ru"
- **THEN** that row is not shown on the production page

#### Scenario: Article link

- **WHEN** a press row links to an article
- **THEN** its headline is underlined without hover and tapping within 44px of its centre line opens it

### Requirement: One filled call to action

The production page SHALL have at most one filled (primary) button: the booking call to action. "Watch / listen" and the other action-bar links SHALL use the outlined secondary style.

#### Scenario: Production with a video

- **WHEN** a production with a video link is opened
- **THEN** "Watch / listen" is outlined, not filled

### Requirement: One button grammar on the production page

Action buttons on a production page (booking, watch/listen, buy tickets, rider and press-kit downloads) SHALL share one typographic style: mono, uppercase, outlined. The booking action SHALL be the only one in the accent colour; the others SHALL use the neutral rule colour.

#### Scenario: Secondary actions

- **WHEN** a visitor opens /productions/bury-me-behind-the-baseboard
- **THEN** "Watch / listen" uses the same font family and text transform as the closing booking button, with a neutral border
