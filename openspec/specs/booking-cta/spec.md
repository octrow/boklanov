# booking-cta Specification

## Purpose

Makes the booking call to action on a production page promise only what Roman can deliver: touring for shows that travel, a new production for past Russian repertoire and archived work, and the premiere for shows in development.

## Requirements

### Requirement: Call to action follows the production's state

A production page's booking call to action (sticky bar and closing button) SHALL use:

- the touring label when the admin Status is "On tour", or "Live" at a theatre outside Russia;
- the new-production label when the Status is "Archived", or "Live" at a theatre in Russia;
- the premiere label when the Status is "In development".

A label set on the production in the admin SHALL override these, and a production with the call to action switched off SHALL show none.

#### Scenario: Russian repertoire

- **WHEN** a visitor opens a production with Status "Live" at a Russian theatre (e.g. the-ape-star)
- **THEN** the sticky bar and closing button read "Ask Roman about a new production" and link to `/contact?show=<slug>`

#### Scenario: Show in development

- **WHEN** a visitor opens a production with Status "In development" (e.g. mcqueen-blood-beneath-skin)
- **THEN** the call to action reads "Ask Roman about the premiere"

#### Scenario: Show abroad

- **WHEN** a visitor opens a production with Status "Live" at a theatre outside Russia (e.g. beware-of-the-dog, Almaty)
- **THEN** the call to action reads "Ask Roman about touring this show"

### Requirement: Contact subject matches the call to action

When `/contact` is opened with `?show=<slug>`, the prefilled email subject SHALL match the kind of call to action that production shows: "Touring: <title>", "New production / <title>" or "Premiere: <title>", in the page's locale.

#### Scenario: From a Russian production

- **WHEN** a visitor follows the call to action from the-ape-star to `/contact?show=the-ape-star`
- **THEN** the email link's subject is "New production / The Ape Star"

### Requirement: Primary channels carry the show

When `/contact` is opened with `?show=<slug>` naming a known production, the page SHALL offer a ready first message in the page's locale that names the production and follows its booking kind (touring, new production, premiere). The Telegram link SHALL pre-enter that message, and a copy control SHALL put it on the clipboard for Instagram. With no `?show=` or an unknown slug, the Telegram link SHALL be the plain profile link and no copy control SHALL be shown.

#### Scenario: Touring show

- **WHEN** a visitor opens `/contact?show=beware-of-the-dog`
- **THEN** the Telegram link carries a `text` parameter whose message names "Beware of the Dog" and touring, and a "Copy message" control is shown

#### Scenario: Russian page

- **WHEN** a visitor opens `/ru/contact?show=bury-me-behind-the-baseboard`
- **THEN** the message is in Russian and speaks of a new production

#### Scenario: Plain contact page

- **WHEN** a visitor opens `/contact` or `/contact?show=nope`
- **THEN** the Telegram link has no `text` parameter and no copy control is shown
