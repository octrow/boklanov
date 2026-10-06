# production-availability Specification

## Purpose

Tells a curator, from the card itself, whether a production can be invited now, using the status the editor sets in the admin, so archive work is never presented as current repertoire.

## Requirements

### Requirement: Availability token on cards

Every production card (home "Selected works" and `/productions`) SHALL end its meta line with an availability token derived from the production's admin status: "On tour" → "ON TOUR", "In development" → "IN DEVELOPMENT", "Archived" → "ARCHIVE" followed by " · <year>" when the year is known; "Live" SHALL show no token. Tokens SHALL be translated in RU and DE. The card meta line SHALL NOT include the city.

#### Scenario: Archived production

- **WHEN** a production with status Archived and year 2021 is shown on `/productions` in EN
- **THEN** its card meta ends with "ARCHIVE · 2021"
- **AND** on `/ru/productions` with «АРХИВ · 2021»

#### Scenario: Live production

- **WHEN** a production with status Live is shown
- **THEN** its card meta has no availability token

#### Scenario: City removed

- **WHEN** any card is shown
- **THEN** its meta line names the theatre but not the city

### Requirement: Touring sticker follows the status

The TOURING sticker on a production page SHALL be shown only when the production's status is On tour, regardless of whether it has tour cities. The tour city band SHALL still show when tour cities exist.

#### Scenario: Toured in the past, now archived

- **WHEN** a production with tour cities and status Archived is opened
- **THEN** no TOURING sticker is shown
- **AND** the tour city band is still shown

#### Scenario: On tour

- **WHEN** a production with status On tour is opened
- **THEN** the TOURING sticker is shown

### Requirement: Status changes need no deploy

A status change saved in the admin SHALL appear on cards and the production page without a redeploy, like any other content edit.

#### Scenario: Editor archives a production

- **WHEN** the editor sets a production's status to Archived and saves
- **THEN** within seconds its card on `/productions` shows the archive token
