## Purpose

Says what a production page's document title reads, so browser tabs, bookmarks and search results name both the production and the site.

## ADDED Requirements

### Requirement: Production page title names the site

A production page's document title and Open Graph title SHALL read "<production title> — <site name>", with the site name in the page's locale.

#### Scenario: English page

- **WHEN** a visitor opens /productions/lina-marlina
- **THEN** the document title is "Lina-Marlina — Roman Boklanov"

#### Scenario: Russian page

- **WHEN** a visitor opens /ru/productions/lina-marlina
- **THEN** the document title ends with the Russian site name
