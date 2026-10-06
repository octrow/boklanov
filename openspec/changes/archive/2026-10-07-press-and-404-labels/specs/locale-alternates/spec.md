## Purpose

Makes every production page point search engines and link previews at its versions in all three site locales.

## ADDED Requirements

### Requirement: Production pages list all locale alternates

A production page's metadata SHALL list alternate URLs for en, ru and de.

#### Scenario: English production page

- **WHEN** `/productions/vaikenemisen-kielioppi` is fetched
- **THEN** its HTML has `hreflang` alternates for en, ru and de
