# Spec Delta

## Purpose

Defines which production facts and labels the public site shows visitors and in what form, so a festival curator reads plain names and the touring facts without decoding codes.

## ADDED Requirements

### Requirement: Countries are shown by name

Wherever a country is shown as visible text, the site SHALL display its localized name for the page locale; ISO codes MAY remain in URLs and attributes.

#### Scenario: Filter options in German

- **WHEN** /de/productions renders the country filter
- **THEN** options read e.g. "Finnland", "Kasachstan", not "FI", "KZ"

#### Scenario: URL stays stable

- **WHEN** a visitor selects Finland
- **THEN** the URL carries `country=FI`

### Requirement: Cards show duration

A production card SHALL include the duration in its meta line when the production has one, in the locale's unit.

#### Scenario: Production with duration

- **WHEN** a production has `durationMin` 80
- **THEN** its card meta ends with "80 min" (RU «80 мин», DE "80 Min.")

#### Scenario: Production without duration

- **WHEN** `durationMin` is empty
- **THEN** the meta line has no duration part and no dangling separator

### Requirement: Page titles are specific and consistent

The 404 page SHALL have its own localized document title, and all document titles SHALL use the same separator.

#### Scenario: Unknown URL

- **WHEN** a visitor opens /xyz
- **THEN** the document title names the page as not found, not the home title

#### Scenario: Home title

- **WHEN** the home page renders in EN
- **THEN** its title is "Roman Boklanov — theatre director"
