# Spec Delta

## Purpose

One-time rules for moving content editing from Keystatic on `main` to Payload without losing edits made on either side.

## ADDED Requirements

### Requirement: Single writer at every moment

Content SHALL have exactly one editable source at any time: Keystatic until the freeze, Payload after it.

#### Scenario: Freeze

- **WHEN** the cutover freeze starts
- **THEN** Keystatic editing is disabled before the Content delta is computed

### Requirement: Content delta is ported without loss

Every field value Saved in Keystatic after the fork point `4e7497e` and before the freeze SHALL be present in Payload after cutover, including new productions and renamed slugs.

#### Scenario: New production

- **WHEN** a production exists on frozen `main` but not in Payload
- **THEN** it is created in Payload with all its fields and media paths

#### Scenario: Reformat-only change

- **WHEN** a YAML change between `4e7497e` and frozen `main` differs only in serialisation or whitespace
- **THEN** it produces no update in Payload

### Requirement: Payload-side edits are never overwritten silently

A field changed both in Keystatic (since the fork point) and in Payload SHALL be reported as a conflict and left unchanged until resolved by hand.

#### Scenario: Both sides edited a field

- **WHEN** a field's Payload value differs from its value at `4e7497e` and Keystatic also changed it
- **THEN** the port reports the conflict with all three values and does not write that field

#### Scenario: Dry run

- **WHEN** the port runs without `--apply`
- **THEN** it prints the creates, updates and conflicts and writes nothing

### Requirement: Production fixes survive the switch

Behaviour fixed on `main` before cutover SHALL hold on the Payload build before it becomes production: media excluded from function traces, OG images rendering, transliterated collision-safe upload names, and poster alt in the page locale.

#### Scenario: First Payload production deploy

- **WHEN** the Payload build is promoted to production
- **THEN** `/api/og/<slug>` returns 200 `image/png` and no function exceeds the size limit
