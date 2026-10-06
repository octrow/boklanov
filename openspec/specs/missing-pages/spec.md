# missing-pages Specification

## Purpose

Defines what a visitor gets when a URL does not exist on boklanov.com, so a stale or mistyped link still lands on a branded page with a way back to the work and to contact.

## Requirements

### Requirement: Unknown production slugs return the site's 404

A request for `/productions/<slug>` (and its `/ru`, `/de` forms) whose slug matches no production SHALL respond with HTTP status 404 and render the site's not-found page, with the site header, footer, skip link and the return links (home, productions, contact), in the locale of the URL. It SHALL NOT respond with a 5xx status or Next's default error page.

#### Scenario: Unknown slug in the default locale

- **WHEN** a visitor requests `https://boklanov.com/productions/does-not-exist`
- **THEN** the response status is 404
- **AND** the page shows the site header and the English not-found heading with links to home, productions and contact

#### Scenario: Unknown slug in another locale

- **WHEN** a visitor requests `/de/productions/does-not-exist` or `/ru/productions/does-not-exist`
- **THEN** the response status is 404
- **AND** the not-found page text and links are in German or Russian respectively

#### Scenario: Slug with the wrong letter case

- **WHEN** a visitor requests `/productions/VAIKENEMISEN-KIELIOPPI`
- **THEN** the response status is 404, not 500

#### Scenario: Known slug still renders

- **WHEN** a visitor requests `/productions/vaikenemisen-kielioppi`
- **THEN** the response status is 200 and the production page renders

### Requirement: Production pages added in the admin need no deploy

Fixing unknown slugs SHALL NOT stop a production created or renamed in the admin from being served at its new slug without a redeploy.

#### Scenario: Production added after the last build

- **WHEN** the editor publishes a new production in the admin after the last deploy
- **THEN** its `/productions/<new-slug>` page responds 200 without a redeploy

### Requirement: The 404 page keeps its own title

The not-found page SHALL show its own document title ("Roman Boklanov — page not found" and its RU/DE versions) once the page has loaded in the browser. The raw server HTML may carry the site title (accepted 2026-10-06; the response status is 404).

#### Scenario: Unknown path in English

- **WHEN** a visitor opens `/nope` and the page has finished loading
- **THEN** `document.title` is "Roman Boklanov — page not found"

#### Scenario: Unknown path in German

- **WHEN** a visitor opens `/de/nope` and the page has finished loading
- **THEN** `document.title` is the German not-found title, not the home title
