## ADDED Requirements

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
