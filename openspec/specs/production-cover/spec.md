# production-cover Specification

## Purpose

Defines how a production page presents its poster, the poster's photo credit and its alternative text, across viewports and image sources.

## Requirements

### Requirement: Credit sits under the poster

When a poster has a credit, the page SHALL render it below the image, in full, with a localized "Photo" label.

#### Scenario: Phone

- **WHEN** /productions/vaikenemisen-kielioppi renders at 390×844
- **THEN** the credit appears under the poster, unclipped, prefixed by the localized label

#### Scenario: Desktop

- **WHEN** the same page renders at 1440×900
- **THEN** the credit appears under the poster, aligned with the image, not beside it

### Requirement: Poster space is reserved before load

Every poster image SHALL carry non-zero intrinsic width and height attributes, using the stored dimensions when known and a portrait default otherwise.

#### Scenario: Admin upload without variants

- **WHEN** a production's poster has no baked variants
- **THEN** the rendered `<img>` has width and height attributes greater than zero

### Requirement: Poster alt text is title-first and clean

Poster alt text SHALL start with the production title, join trimmed parts with ", ", and contain no whitespace before punctuation.

#### Scenario: Title with trailing space

- **WHEN** the stored title ends with a space
- **THEN** the alt contains no " ," sequence
