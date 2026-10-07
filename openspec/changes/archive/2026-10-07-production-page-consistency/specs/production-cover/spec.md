## ADDED Requirements

### Requirement: Title visible beside the poster on desktop

On viewports 1024px wide and wider, the production poster SHALL be height-capped so that the production title (H1) is fully inside the first viewport at 1440×900. On narrower viewports the poster keeps its current size.

#### Scenario: Portrait poster on desktop

- **WHEN** a visitor opens /productions/lina-marlina at 1440×900
- **THEN** the H1's bottom edge is above 900px without scrolling

#### Scenario: Phone unchanged

- **WHEN** a visitor opens /productions/lina-marlina at 390×844
- **THEN** the poster renders at the same height as before this change
