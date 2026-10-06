## Purpose

Keeps the `/press` page honest about what is translated and in which language each article is, so a curator knows what they will get before opening a link.

## ADDED Requirements

### Requirement: Translation note matches the content

The `/press` note SHALL say that headlines are translated where a translation exists and that articles are in their original language, in EN, RU and DE.

#### Scenario: English press page

- **WHEN** a visitor opens `/press`
- **THEN** the note reads "Headlines are in English where a translation exists. Articles are in their original language, mostly Russian."

### Requirement: Article language by name

When a press article's language differs from the page locale, its row SHALL name the language in the page's locale (e.g. "Finnish", «финский», "Finnisch"), not as a code.

#### Scenario: Finnish article on the English page

- **WHEN** `/press` lists an article with language `fi`
- **THEN** its row shows "Vuosaari · Finnish", not "Vuosaari · FI"
