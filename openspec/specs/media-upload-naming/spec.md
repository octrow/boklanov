# media-upload-naming Specification

## Purpose

How filenames of media uploaded through the admin are turned into storage keys and public URLs.

## Requirements

### Requirement: Upload filenames are readable Latin slugs

An uploaded file's stored name SHALL be derived from its original name by transliterating Cyrillic to Latin, then reducing it to `[a-z0-9._-]` with no repeated or edge dashes. A name with nothing left after that SHALL fall back to `upload`.

#### Scenario: Cyrillic filename

- **WHEN** the editor uploads `Грамматика молчания.webp`
- **THEN** the stored name starts with `grammatika-molchaniya` and keeps the `.webp` extension

#### Scenario: Unrepresentable filename

- **WHEN** the editor uploads a file whose name has no transliterable characters
- **THEN** the stored name starts with `upload`

### Requirement: Uploads never overwrite each other

Each upload SHALL get a unique storage key, because stored objects are cached as immutable and an overwrite would be served stale for up to a year.

#### Scenario: Same name uploaded twice

- **WHEN** two files with the same original name are uploaded to the same directory
- **THEN** they get different storage keys and both remain retrievable
