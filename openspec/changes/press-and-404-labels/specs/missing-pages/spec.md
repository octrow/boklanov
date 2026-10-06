## ADDED Requirements

### Requirement: The 404 page keeps its own title

The not-found page SHALL show its own document title ("Roman Boklanov — page not found" and its RU/DE versions) once the page has loaded in the browser. The raw server HTML may carry the site title (accepted 2026-10-06; the response status is 404).

#### Scenario: Unknown path in English

- **WHEN** a visitor opens `/nope` and the page has finished loading
- **THEN** `document.title` is "Roman Boklanov — page not found"

#### Scenario: Unknown path in German

- **WHEN** a visitor opens `/de/nope` and the page has finished loading
- **THEN** `document.title` is the German not-found title, not the home title
