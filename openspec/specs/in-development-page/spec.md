# in-development-page Specification

## Purpose

Makes a production that has not premiered yet read as upcoming work rather than an abandoned page: its page states that it is in development and, while it has no media or synopsis, says what will appear after the premiere.

## Requirements

### Requirement: Status line for shows in development

A production page whose admin Status is "In development" SHALL show a status line near the title reading "In development" in the page's locale, followed by the premiere date when one is set. Pages with any other Status SHALL NOT show it.

#### Scenario: Show without a premiere date

- **WHEN** a visitor opens mcqueen-blood-beneath-skin
- **THEN** the page shows "In development" near the title

#### Scenario: Live show

- **WHEN** a visitor opens bury-me-behind-the-baseboard
- **THEN** no "In development" line is shown

### Requirement: Note instead of empty media

When an in-development production has no poster, photos, video or synopsis, its page SHALL show one short note that photos, credits and press will appear after the premiere, in the page's locale.

#### Scenario: Empty in-development page

- **WHEN** a visitor opens mcqueen-blood-beneath-skin at 390×844
- **THEN** the note is visible below the title block and the page does not end in empty space before the closing call to action
