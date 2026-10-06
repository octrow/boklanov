# productions-filtering Specification

## Purpose

Defines how the productions index presents its filters, its default selection and its result count, so a curator on a phone sees work first and always knows what subset is shown.

## Requirements

### Requirement: Collapsed filters on phones

Below 768px the filter groups SHALL be collapsed behind a single disclosure control, and at least one row of production cards SHALL be visible in the first viewport at 390×844.

#### Scenario: Landing on /productions on a phone

- **WHEN** a visitor opens /productions at 390×844 with no query string
- **THEN** the filter groups are collapsed and the first row of posters is visible without scrolling

#### Scenario: Opening the filters

- **WHEN** the visitor activates the disclosure control
- **THEN** the Role, Form, Age and Country groups appear with their labels, and the control reports `aria-expanded="true"`

### Requirement: The active subset is always stated

The page SHALL always show "<shown> of <total>" next to the page title, including in the default state, and the disclosure control SHALL name the active filters, including the default role.

#### Scenario: Default state

- **WHEN** no filter parameters are in the URL
- **THEN** the page states the default role by name (e.g. "Directed by Roman") and the count of shown productions out of all productions

#### Scenario: Changing a filter

- **WHEN** the visitor selects a form chip
- **THEN** the count next to the title updates and is announced by a polite live region

### Requirement: Desktop toolbar unchanged

At 768px and wider the filter groups SHALL remain visible without a disclosure, on no more than one row at 1440px.

#### Scenario: Desktop toolbar

- **WHEN** a visitor opens /productions at 1440×900
- **THEN** all filter groups are visible on one row and the count sits next to the title
