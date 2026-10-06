## Purpose

Keeps a production page short and fact-first on a phone, so a curator sees what the show is and where it has played within the first screens instead of scrolling past a full-height poster and a long photo column.

## ADDED Requirements

### Requirement: Title in the first screen on phones

On viewports narrower than 768px the production page SHALL show the production title (H1) within the first viewport (844px tall at 390px wide) for every production, including those with a portrait poster. The poster SHALL keep its natural aspect ratio and SHALL NOT be cropped.

#### Scenario: Portrait poster at 390×844

- **WHEN** a visitor opens `/productions/bury-me-behind-the-baseboard` at 390×844
- **THEN** the H1's top edge is above 844px without scrolling
- **AND** the whole poster is visible, uncropped

#### Scenario: Desktop unchanged

- **WHEN** the same page is opened at 1440×900
- **THEN** the poster is displayed at the same size as before this change

### Requirement: Short gallery on phones

On viewports narrower than 768px a production with more than 3 gallery photos SHALL show the first 3 photos and a button labelled with the total ("All 11 photos" / «Все 11 фото» / "Alle 11 Fotos") that opens the lightbox at the fourth photo. All photos SHALL remain reachable in the lightbox. On wider viewports the full gallery SHALL be shown.

#### Scenario: Production with 11 photos on a phone

- **WHEN** a visitor opens a production with 11 gallery photos at 390px
- **THEN** 3 photos and the "All 11 photos" button are shown
- **AND** tapping the button opens the lightbox on photo 4 and the visitor can reach photos 1–11

#### Scenario: Production with 3 or fewer photos

- **WHEN** a production has 3 or fewer gallery photos
- **THEN** all of them are shown and no button appears

### Requirement: Tour cities next to the facts

When a production has tour cities, the tour band SHALL appear directly after the year/age/duration chips and before the video and photos, on all viewports.

#### Scenario: Production with tour cities

- **WHEN** a visitor opens a production with tour cities
- **THEN** the city band is the next block after the chips
