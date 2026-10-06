# Spec Delta

## Purpose

Sets a minimum touch hit area for standalone links on the public site, so a visitor on a phone can tap every navigational target reliably.

## ADDED Requirements

### Requirement: Standalone links have a 44px hit area

On viewports narrower than 768px, every link that is not part of running prose SHALL have a hit area at least 44px tall and 24px wide, without reducing its visible font size.

#### Scenario: Press group links

- **WHEN** /press is rendered at 390×844
- **THEN** every production group link has a bounding hit area of at least 44px height

#### Scenario: Awards, archive and production slate

- **WHEN** /awards, /archive and a production page are rendered at 390×844
- **THEN** production links, archive rows, credit-name links and the slate theatre link each have a hit area of at least 44px height

#### Scenario: Prose links are exempt

- **WHEN** a link sits inside a paragraph of body text
- **THEN** it keeps its inline size

### Requirement: No nested interactive targets

A link SHALL NOT contain another link.

#### Scenario: Slate theatre link

- **WHEN** the production slate shows a theatre and city
- **THEN** the theatre is one link and the city is plain text or a separate sibling link
