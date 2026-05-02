Full version (original): .design/boklanov-rewrite/archive/INFORMATION_ARCHITECTURE.md

# Information Architecture — boklanov.com / boklanov.ru

v2 App Router migration (`rewrite/v2`). All routes use `app/[locale]/` internally. Middleware rewrites `/` to internally
use `/ru` while keeping root URL prefix-free. EN uses `/en/`, DE uses `/de/`.

## File-System Mapping & Sitemap

```
app/
├── [locale]/
│   ├── layout.tsx             # Nav, footer, locale provider
│   ├── page.tsx               # Home
│   ├── productions/
│   │   ├── page.tsx           # Filterable grid
│   │   └── [slug]/
│   │       └── page.tsx       # Detail page
│   ├── about/page.tsx
│   ├── awards/page.tsx
│   ├── press/page.tsx
│   ├── archive/page.tsx
│   └── contact/page.tsx
├── [locale]/not-found.tsx      # Locale-aware 404
├── api/og/[slug]/route.ts      # Dynamic OG image
├── sitemap.xml/route.ts        # Hreflang for RU/EN alternates
├── robots.txt/route.ts
└── feed/route.ts               # RSS for RU/EN productions
```

## Navigation Model

### Primary Navigation

1. `/productions` (Спектакли / Productions)
2. `/about` (О режиссёре / About)
3. `/awards` (Награды / Awards)
4. `/press` (Пресса / Press)
5. `/contact` (Контакт / Contact)

*Footer-only route:* `/archive` (Архив / Archive).

### Secondary & Utility Nav

- **`/productions` filters:** Horizontal strip: `role`, `form`, `ageRating`, `country`, `year`. Active chips
  dismissable. Mobile: horizontal scroll strip; button expands filter sheet for >2 active filters.
- **`/productions/[slug]` sub-nav:** Sticky sub-header with anchor links (`#gallery`, `#awards`, `#press`).
- **`/awards` filter:** Group by production or year.
- **Utility Header (All breakpoints):** Language switcher (`RU`, `EN`, `DE`) + Theme toggle (44x44px). Mobile hides
  options inside hamburger drawer (200ms slide-in).

## Content Hierarchy per Route

### `/` (Home)

- **Artistic Statement:** 2 sentences, Lora font, RU default.
- **Wordmark:** `роман бокланов` (Lora, all-lowercase, locale-aware).
- **Featured:** 4-6 cards (`featured: true`), 4:5 image, RU title, age badge, country.
- **Production grid:** Filtered to `role=director`, hides filter UI. Link to `/productions`.
- **Exclusions:** No hero video, timeline, stats, or bento grid.

### `/productions`

- **Page Label:** Lora display scale.
- **Filter bar:** Query-string driven, deep-linkable.
- **Grid:** 2 cols (mobile), 3 cols (tablet), 4 cols (desktop). 4:5 aspect ratio cards.
- **Pagination:** Infinite load on scroll if >24 items.

### `/productions/[slug]`

- **Visuals:** Full-bleed cover photo/poster. No parallax.
- **Title Block:** Lora display (RU/EN/DE).
- **Metadata chips:** Age rating, year, duration, country flag. Mono font.
- **Synopsis:** 1-2 sentences. Inter.
- **Credits:** Role, theatre, creative team.
- **CTAs:** Watch video (embed/link), Tech rider (PDF), Press kit (ZIP). Visible only when present in MDX frontmatter.
- **Gallery:** Masonry/grid with plain text captions. Click launches lightbox.
- **Critic Quotes:** Pull-quote style with attribution.
- **Awards:** Compact production-specific list.
- **Recommended:** 3 cards matched by `form` -> age -> year.
- **Sticky Booking CTA:** Oxblood background button, `mailto` with subject. Triggers when cover leaves viewport (
  `IntersectionObserver`, `threshold: 0`).
- **Phase 7.5 additions:** `ON TOUR` Plinth band if `tour[]` array exists in frontmatter.
- **Phase 7.6 additions:**
  - Director's note: italic blockquote with hairline left rule, mono attribution `— РОМАН БОКЛАНОВ`. Controlled by
    `directorsNote.{ru,en}`.
  - Run-of-show row: mono caps `RUN · BTK · СПБ · 2020–2024 · ~80 PERFORMANCES`. Controlled by `runs[]`.

### `/about`

- **Visuals:** Real production/press photo (50% desktop width).
- **Bio prose:** 1 paragraph intro (Lora), followed by long-form bio (Inter).
- **Staging Row (Phase 7.5):** Mono row `СПБ · МОСКВА · АЛМАТЫ · БРЕМЕН · ВЕНА · БЕРЛИН · ТАШКЕНТ`. Label:
  `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`. Links to `/productions?city=<slug>`.
- **Phase 7.6 additions:** Above 1280px desktop, bio prose gains right gutter marginalia (credits, lineage, dates).
  Below 1280px marginalia renders inline. Check `INSZENIERTE IN` wrapping on 1024-1100px; shorten to `BÜHNEN IN` if
  required.
- **Timeline:** 6-8 key dates, mono font. Theatre links grid. No awards list.

### `/awards`

- Total count meta-label (e.g., "20+ наград / 20+ awards").
- Filter: Toggle between by-production (default) and by-year.
- Timeline: Production name header, mono details.

### `/press`

- Card grid: 2 cols (mobile), 3 cols (desktop).
- Elements: Outlet, headline, lang badge, date, link.
- Language filter: RU / DE / other. No translations for clips.

### `/archive`

- Uncurated chronological plain list of readings, sketches, workshops, festivals.
- Typography: Mono for dates, Inter for titles. No images.

### `/contact`

- Visual weight: Telegram + Instagram buttons are primary (oxblood accent).
- Secondary: Plaintext email address + `mailto` CTA button ("Touring inquiry" subject, hairline border). No form, no
  CAPTCHA.

### Cmd-K Palette

- Global shortcut (`Cmd+K` / `Ctrl+K`) + mobile button.
- Index: Productions -> Awards -> Press -> Theatres.
- Features: Transliteration matching (RU/EN variants, e.g., "Берлин" ↔ "Berlin").

## Content Growth & Error State Rules

- **Withdrawn items:** Set `status: withdrawn` in frontmatter. Do not delete. Hide from grids and Cmd-K. Retain URL
  slug. Display message: "Этот спектакль больше не показывается / This production is no longer touring". Suppress the
  booking CTA.
- **Growth:** If production cards > 60, activate virtual scrolling instead of pagination.
- **DE Locale v1:** Chrome-only (nav, headers, metadata). Detail pages fallback to EN/RU.

## URL Strategy & Parameters

### Patterns

- RU canonical: `/productions/bury-me-behind-the-baseboard/`
- EN alternate: `/en/productions/bury-me-behind-the-baseboard/`
- DE alternate: `/de/productions/bury-me-behind-the-baseboard/`

Slugs are generated once from RU Notion page or EN title, then locked.

### Query Parameters

- `role`: `director`, `co-director`, `performer`, `reader`
- `form`: `puppet`, `object`, `contemporary`
- `age`: `3`, `6`, `12`, `18`
- `country`: ISO-3166 alpha-2 (e.g., `DE`)
- `year`: 4-digit integer

Multiple options: comma-separated (`?form=puppet,object&country=DE`). URLs are the sole source of truth for filter
states.

### Sitemap & hreflang

- Emit `<xhtml:link rel="alternate" hreflang="...">` for RU ↔ EN URLs.
- Include `x-default` pointing to RU.
- Exclude DE URLs from `hreflang` in v1 to prevent indexing non-translated copies. Include in sitemap for crawling.

## Component Reuse Map

| Component            | Pages Used                     | Purpose                                  |
|:---------------------|:-------------------------------|:-----------------------------------------|
| `<RootLayout>`       | All                            | Nav, footer, theme, locale               |
| `<ProductionCard>`   | `/`, `/productions`, `/[slug]` | 4:5 image, metadata, title               |
| `<ProductionGrid>`   | `/`, `/productions`            | Handles grid layout per breakpoint       |
| `<FilterBar>`        | `/productions`                 | Renders query parameters visually        |
| `<MetadataChips>`    | `/[slug]`, card                | Renders age rating, flags, duration      |
| `<Gallery>`          | `/[slug]`                      | Desktop masonry / mobile scroll          |
| `<CriticQuote>`      | `/[slug]`, `/press`            | Pull-quote block with link out           |
| `<AwardRow>`         | `/awards`, `/[slug]`           | Standardized data row                    |
| `<StickyBookingCTA>` | `/[slug]`                      | Triggers on viewport leave, mailto link  |
| `<CmdKPalette>`      | All                            | Global floating search box               |
| `<OGImage>`          | `/[slug]`                      | Server component rendering metadata card |
| `<PageHead>`         | All                            | Metadata API wrapper for SEO and JSON-LD |

## Data Mappings & Terms

- **Production:** RU `Спектакль` · EN `Production`
- **Director:** RU `Режиссёр` · EN `Director`
- **Performer:** RU `Роль` · EN `Performer` (`role=performer`)
- **Co-director:** RU `Co-режиссёр` · EN `Co-director` (`role=co-director`)
- **Sketch/Reading:** RU `Эскиз / Читка` · EN `Sketch / Reading`
- **Theatre:** RU `Театр` · EN `Theatre`
- **Touring inquiry:** RU `Запрос о гастролях` · EN `Touring inquiry`
- **Photo Attribution:** RU `Фото: [Name]` · EN `Photo: [Name]` (Visible)
- **Age Ratings:** `3+`, `6+`, `12+`, `18+` (Identical in all locales)

## User Flows Traces

- **Curator:** `Home` -> Card click -> `/productions/[slug]` -> Scroll cover -> View details & gallery -> Click sticky
  mailto CTA -> Open native mail client.
- **Reviewer:** `Home` -> `/about` -> View staging row/marginalia -> `/awards` -> `/press` -> Review critics -> Go
  `/productions/[slug]` -> Download press kit.
- **Search:** Any page -> `Cmd+K` -> Type "Berlin" -> Render matched production, awards, and press -> Click target ->
  Direct jump.
