# social-preview Specification

## Purpose

Open Graph images shown when a production link is shared in messengers and social networks.

## Requirements

### Requirement: Every production has a working OG image per locale

The site SHALL serve a PNG Open Graph image for every published production at `/api/og/<slug>?locale=<locale>`, and production pages SHALL reference it in `og:image`. Assets the image renderer needs at runtime (fonts) SHALL be available inside the deployed function.

#### Scenario: Link shared in a messenger

- **WHEN** a crawler fetches `/api/og/<slug>?locale=en` for a published production
- **THEN** the response is 200 with `image/png`

#### Scenario: Cyrillic title

- **WHEN** the OG image is requested with `locale=ru`
- **THEN** the title renders with Cyrillic glyphs, not fallback boxes

#### Scenario: Production without a raster poster

- **WHEN** the production's poster is missing or not renderable by the image engine
- **THEN** the image still renders, using the no-poster fallback layout
