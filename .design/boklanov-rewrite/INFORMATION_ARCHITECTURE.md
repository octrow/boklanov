# Information Architecture — boklanov.com / boklanov.ru

> Produced from DESIGN_BRIEF.md (locked 2026-04-30). Any divergence from the
> brief must be reflected here first. Last updated: 2026-04-30.

> **v2 architectural shift:** the current repo (`main`) uses Next.js Pages Router
> under `pages/`. v2 (`rewrite/v2`) migrates to the App Router. All file-system
> paths and route patterns below describe the **target state**, not what exists
> on disk today. The migration itself is a Phase 4 concern.

---

## Site Map

```
/ (RU default, no locale prefix)
├── /productions
│   └── /productions/[slug]
├── /about
├── /awards
├── /press
├── /archive
└── /contact

/en/ (full EN parity — same routes, all UI + content translated)
├── /en/productions
│   └── /en/productions/[slug]
├── /en/about
├── /en/awards
├── /en/press
├── /en/archive
└── /en/contact

/de/ (v1: UI chrome only — nav, buttons, chips, metadata labels)
├── /de/productions       # grid only; card text stays RU/EN
│   └── /de/productions/[slug]
├── /de/about             # portrait + DE bio for 5-6 priority shows only
└── /de/contact

System routes (no user-facing pages)
├── /api/og/[slug]        # dynamic OG image per production
├── /sitemap.xml          # emits hreflang for RU↔EN pairs only (see URL Strategy)
├── /robots.txt
├── /feed                 # RSS, RU+EN productions only (DE excluded — chrome-only locale)
└── /not-found            # 404 — locale-aware, links to /productions and /
```

**File-system mapping (App Router target):**

```
app/
├── [locale]/
│   ├── layout.tsx         # root layout: nav, footer, locale provider
│   ├── page.tsx           # Home
│   ├── productions/
│   │   ├── page.tsx       # filterable grid
│   │   └── [slug]/
│   │       └── page.tsx   # production detail
│   ├── about/page.tsx
│   ├── awards/page.tsx
│   ├── press/page.tsx
│   ├── archive/page.tsx
│   └── contact/page.tsx
├── [locale]/not-found.tsx  # locale-aware 404
├── api/og/[slug]/route.ts
├── sitemap.xml/route.ts
├── robots.txt/route.ts
└── feed/route.ts
```

**Locale routing note:** RU is the default locale and renders at `/` (no prefix)
even though the file system is `app/[locale]/`. Middleware rewrites `/` → `/ru`
internally; the canonical RU URL stays prefix-free in the address bar, sitemap,
and OG metadata. EN and DE are explicitly prefixed (`/en/...`, `/de/...`).

---

## Navigation Model

### Primary navigation

Six items maximum. Order = frequency of use by the primary user (curator/director).

| Position | Label (RU) | Label (EN) | URL |
|----------|-----------|-----------|-----|
| 1 | Спектакли | Productions | /productions |
| 2 | О режиссёре | About | /about |
| 3 | Награды | Awards | /awards |
| 4 | Пресса | Press | /press |
| 5 | Контакт | Contact | /contact |

**Footer-only routes** (not in primary nav):

| Label (RU) | Label (EN) | URL | Why footer-only |
|-----------|-----------|-----|-----------------|
| Архив | Archive | /archive | Deep research, not first-visit orientation |

### Secondary navigation

**Within `/productions`:** filter bar as a horizontal strip below the hero label.
Filters: `role` (default: director) · `form` (puppet / object / contemporary) · `ageRating` · `country` · `year`.
Active filters render as dismissable chips. Inactive toggle collapses to "Все / All".

**Within `/productions/[slug]`:** in-page anchor links for long detail pages (Gallery, Awards, Press) rendered as a
sticky sub-header that appears after the fold.

**Within `/awards`:** tab or segmented control grouping by production vs. by year.

### Utility navigation

Appears in the header, right-aligned, at all breakpoints:

- **Language switch:** `RU` · `EN` · `DE` — plain text links, current locale underlined with `--accent`.
- **Dark mode toggle:** icon only (sun/moon), 44×44px touch target.

### Mobile navigation

- Header: wordmark left, hamburger right. Language + dark mode collapse into the hamburger menu.
- Hamburger opens a full-viewport drawer (slides from right, 200ms). Shows primary nav items + lang + dark toggle.
- No bottom tab bar — the site is editorial, not app-like.
- `/productions` filter bar on mobile: horizontal scroll strip, no wrapping. "Filter" button expands a bottom sheet
  with all filter options when more than 2 active.

---

## Content Hierarchy

### Home `/`

Above fold (one viewport):
1. **Artistic statement** — 2 sentences in Lora, RU default. Sets the curatorial frame immediately.
2. **Wordmark** — `роман бокланов` in Lora, language-aware, all-lowercase, top-left.

Below fold (scroll):
3. **Featured productions** — 4–6 hand-curated cards (`featured: true` in frontmatter), drawn from the
   top-coverage band (Nikita looking for the sea, Комедия Дель-Арте, Лина-Марлина, Гипс, Крошечка-Хаврошечка…).
   Each card: 4:5 cover photo, RU title, age badge, country.
4. **Filterable production grid** — same component as `/productions`, but prefilled with `role=director`, no
   filter UI visible (just the grid). "See all" link goes to `/productions`.
5. **Footer** — contact line + language + archive link.

The home page deliberately does NOT have: a hero video, a stats block ("30+ productions, 20+ awards"), a timeline,
or a bento grid. The work speaks; the statement frames it.

### Productions grid `/productions`

1. **Page label** — "Спектакли" / "Productions", set in Lora display size.
2. **Filter bar** — `role` toggle (Director is default; Acting / Co-direction / Reader behind a collapsed toggle),
   then `form`, `ageRating`, `country`, `year`. Query-string driven; all filters are deep-linkable.
3. **Active filter chips** — dismissable, above the grid, below the filter bar.
4. **Grid** — 2 columns on mobile, 3 on tablet, 4 on desktop. Cards are equal-height 4:5 aspect ratio.
5. **Load more** (not pagination) — productions fit one long page; incremental reveal if > 24.
6. **Empty state** — if filters produce 0 results: "Нет спектаклей по этим фильтрам / No productions match."

### Production detail `/productions/[slug]`

Follows the D7 layout exactly:

1. **Cover** — full-bleed photo (or title-rendered poster if no cover image exists). No parallax.
2. **Title block** — RU title in Lora display; EN title smaller (Lora, weight 400); DE title if available.
3. **Metadata chips** — age rating · year · duration (min) · country flag(s). JetBrains Mono, `chip` scale.
4. **Synopsis** — 1–2 sentences. Body scale, Inter.
5. **Credits** — role, theatre, creative team. Mono captions.
6. **Primary CTAs** — "Смотреть / Watch" (→ YouTube embed or link) · "Tech rider (PDF)" · "Press kit (ZIP)".
   Shown only when the relevant asset exists in frontmatter.
7. **Gallery** — horizontal scroll on mobile, masonry or even grid on desktop. Credit caption below every image
   (not hover-only — a brief requirement). Full-screen lightbox on tap/click.
8. **Critic quotes** — pull-quote style, source + outlet.
9. **Awards** — compact list with year, festival name, category.
10. **External theatre links** — text links to the producing theatre's page for this show.
11. **Recommended shows** — 3 cards. Selection rule (in order): same `form`, then same age bucket,
    then most recent year. "Lineage" (shared theatre or shared creative team) is a tiebreaker only.
    Label: "Ещё спектакли / More productions".
12. **Sticky booking CTA** — "Написать Роману о гастролях / Email Roman about touring this show" with
    `--accent` oxblood background. Trigger: appears once the cover block leaves the viewport
    (IntersectionObserver on the cover element, `threshold: 0`). Hides again if the user scrolls
    back above the cover. Uses prefilled mailto with the show name in the subject.

### About `/about`

1. **Portrait** — full-width or 50% column on desktop. Real production/press photo, not a headshot.
2. **Bio lead** — 1-paragraph curatorial intro, Lora.
3. **Long-form bio** — prose, Inter body. Covers artistic lineage: Кудашов → БТК → РГИСИ.
4. **Education / key dates** — timeline component, JetBrains Mono dates. Not a CV dump; 6–8 key milestones.
5. **Theatres worked with** — logo/name grid or plain list with links.

No awards list here — awards live at `/awards`.

### Awards `/awards`

1. **Page label** — "Награды" / "Awards".
2. **Filter / group control** — toggle between "by production" (default) and "by year".
3. **Award timeline** — grouped, with production name as the grouping header. Year, festival, category, city.
4. **Total count** — "20+ наград / 20+ awards" as a meta-label at the top.
5. **Empty state** — only reachable if a future locale filter is added; show
   "Нет наград по этим фильтрам / No awards match." Otherwise the page is never empty.

### Press `/press`

1. **Page label** — "Пресса" / "Press".
2. **Card grid** — 2-col mobile, 3-col desktop. Each card: outlet, headline, language badge, date, link.
3. **Language filter** — RU / DE / other. Press clippings stay in original language; no translation.
4. **No full text** — link-out only, except for pull-quote excerpts in the card.
5. **Empty state** — when the language filter excludes all clippings:
   "Нет публикаций на этом языке / No press in this language."

### Archive `/archive`

1. **Intro note** — "Полный хронологический список / Full chronological list". Sets expectation: this is
   the long-tail CV, not the curated portfolio.
2. **Chronological list** — year blocks, plain list inside each: readings, sketches, workshops, festival
   appearances. No card grid; minimal typography.
3. **Minimal styling** — this page should feel like a document, not a feature. JetBrains Mono for years
   and metadata; Inter for titles.

### Search (Cmd-K palette)

The Cmd-K palette is a **navigation accelerator over existing content**, not a separate IA
section. It does not have its own URL. Trigger: `Cmd+K` / `Ctrl+K` on desktop; search-icon
button in the mobile header.

Indexed content types (priority order):
1. Productions (RU title + EN title + slug + city + year)
2. Awards (festival name + production name)
3. Press clippings (outlet + headline)
4. Theatres (name + city)

Empty state: "Ничего не найдено / No matches." Suggests the three most recent productions as
fallback. Transliteration table maps RU↔EN spelling variants ("Берлин" ↔ "Berlin",
"Хаврошечка" ↔ "Khavroshechka") so a curator typing in either alphabet hits the same result.

### Contact `/contact`

> Reordered 2026-05-01 per brief D8 revision: Telegram + Instagram are now the
> primary contact path on the standalone `/contact` page; email is the fallback.
> The sticky booking CTA on `/productions/[slug]` remains mailto-prefilled
> (brief D1 booking magnet) — that route is unchanged.

1. **Telegram** — primary, oxblood-treatment button matching the previous
   mailto button's visual weight. Icon + handle. Stacked at full width on mobile.
2. **Instagram** — primary, paired with Telegram. Same visual weight.
3. **Prefilled mailto CTA** — secondary. "Написать Роману / Email Roman" → opens
   mail client with `to`, `subject` (prefilled: "Запрос о гастролях / Touring
   inquiry"), and a short body template. Mono / hairline border, not oxblood.
4. **Plain-text email** — visually displayed and copy-pasteable next to the
   mailto button. No obfuscation (the primary user is a professional, not a
   spam bot).
5. **No contact form.** No backend. No CAPTCHA.

---

## User Flows

### Flow 1 — Curator / festival programmer (primary, mobile, ~90 seconds)

1. Opens site from Instagram DM link on mobile.
2. Lands on Home `/`. Sees artistic statement and 4–6 featured production cards.
3. Taps a card that matches their programming interest → `/productions/[slug]`.
4. Reads title, age rating, synopsis, credits. Scrolls gallery.
5. Watches embedded video or notes the show for a video request.
6. Sees critic quotes and festival awards as social proof.
7. Sticky CTA is visible → taps "Email Roman about touring this show".
8. Mail client opens, pre-filled with subject and show name. Sends.

   — OR —

7b. Doesn't find the right show → taps back → goes to `/productions` for the full filterable grid.
8b. Filters by `ageRating=6+` and `country=DE` → sees 3 matching shows.
9b. Taps one → detail page → contacts.

### Flow 2 — Press / festival jury (EPK mode, desktop)

1. Lands on Home or `/about` (from a press pack link).
2. Reads bio + lineage. Wants social proof.
3. Navigates to `/awards` → sees grouped awards timeline.
4. Navigates to `/press` → reads critic quotes.
5. Goes to a specific production page → looks for "Press kit (ZIP)".
6. Downloads press kit (if available) or emails for it.

### Flow 3 — Cmd-K search (power user, any device)

1. User is already on any page.
2. Presses `Cmd+K` (desktop) or taps the search icon (mobile).
3. Palette opens. Types partial title in RU or EN, or a city (e.g., "Берлин", "Wien").
4. Results: production cards, award rows, press clippings, theatre names.
   Transliterated index handles RU↔EN spelling variants.
5. Selects result → navigates to that page or production.

### Flow 4 — Language switch (RU to EN)

1. User is on `/productions/nizkiy-zhur/` (RU).
2. Taps "EN" in the language switcher.
3. Navigates to `/en/productions/nizkiy-zhur/` — same production, all UI chrome and bio text in EN.
4. Production title shows EN title as primary, RU as secondary.

---

## Naming Conventions

| Concept | RU label | EN label | Notes |
|---------|---------|---------|-------|
| A staged work | Спектакль | Production | Not "Show" (casual), not "Performance" (ambiguous) |
| The director's role | Режиссёр | Director | |
| Working in a show but not as director | Роль | Performer | `role=performer` |
| Co-directing with another director | Co-режиссёр | Co-director | `role=co-director` |
| Short festival pieces, readings | Эскиз / Читка | Sketch / Reading | Archived, not in main grid |
| A theatre company | Театр | Theatre | Not "Company" or "Studio" |
| Touring request | Запрос о гастролях | Touring inquiry | Used in prefilled mailto subject |
| Photo attribution | Фото: [Name] | Photo: [Name] | Always visible, not hover-only |
| Age appropriateness | 3+, 6+, 12+, 18+ | 3+, 6+, 12+, 18+ | Chip component, same in all locales |
| Language of site | Русский / English / Deutsch | Russian / English / German | Plain text in language switcher |

---

## Component Reuse Map

| Component | Used on | Notes |
|-----------|---------|-------|
| `<RootLayout>` | All pages | Wordmark, primary nav, language switch, dark toggle, footer |
| `<ProductionCard>` | Home (featured + grid), `/productions`, detail page (recommends) | Same card; `size` prop for featured vs. grid variants |
| `<ProductionGrid>` | Home (below fold), `/productions` | Same grid; home variant hides filter UI |
| `<FilterBar>` | `/productions` only | Horizontal chips + bottom sheet on mobile |
| `<MetadataChips>` | Production card, production detail header | Age / year / duration / country |
| `<Gallery>` | Production detail | Horizontal scroll (mobile) / grid (desktop) + lightbox |
| `<CriticQuote>` | Production detail, `/press` (excerpt) | Pull-quote style |
| `<AwardRow>` | `/awards`, production detail (compact) | Same data, different density |
| `<StickyBookingCTA>` | Production detail only | Appears on scroll, oxblood accent |
| `<CmdKPalette>` | Global (Cmd+K trigger) | Transliterated index, covers all content types |
| `<OGImage>` | Per production (server component) | Cover + title + age badge, used by `app/api/og/[slug]` |
| `<PageHead>` | All pages | Metadata API wrapper; JSON-LD `Person` + `CreativeWork` |

---

## Content Growth Plan

**Productions** grow slowly (1–4 per year). The filterable grid handles up to ~60 productions without
pagination. If the count exceeds 60, add virtual scrolling — do not add separate pages per year or form.

**Withdrawn productions** (no longer touring or rights-reverted): do not delete. Set
`status: withdrawn` in frontmatter; the production still renders at its slug for press/archival
linkability, but is hidden from grids and the Cmd-K index, the sticky booking CTA is suppressed,
and the page surfaces a small note: "Этот спектакль больше не показывается / This production
is no longer touring." Slugs remain stable forever.

**Awards** accumulate over time. The timeline grouped-by-production layout is self-extending; no IA change needed.

**Press** accumulates. The card grid handles 50+ items with a "load more" pattern. No separate archive needed
unless Roman wants to add a "featured press" tier separate from "all press."

**Archive** is deliberately low-UX: new rows are appended chronologically. No structural change anticipated.

**Locales** — EN is full parity from v1. DE promotion from chrome-only to full content (bios + synopses for
5–6 priority shows) is planned for v2. No IA change; the `de` locale key already exists; it's a content fill.

---

## URL Strategy

### Locale prefixing

| Locale | URL pattern | Notes |
|--------|-----------|-------|
| Russian (default) | `/productions/nizkiy-zhur/` | No prefix |
| English | `/en/productions/nizkiy-zhur/` | Full parity |
| German | `/de/productions/nizkiy-zhur/` | Chrome-only v1; same slug |

### Production slugs

- Canonical slug comes from the RU Notion page title, transliterated to ASCII + hyphenated.
- Where a clean EN title exists (e.g., "Bury Me Behind the Baseboard"), the slug uses the EN form.
- Slugs are set once at first sync and **never changed**. Notion page renames do not propagate to slugs.
- EN/RU sibling pages in Notion merge into one production record with one slug. See `notionIds: { ru, en }`.

Examples:
```
/productions/pokhoronite-menya-za-plintus/      # RU title, transliterated
/productions/bury-me-behind-the-baseboard/      # EN title preferred when clean
/productions/nikita-looking-for-the-sea/
```

### Filter query parameters

All parameters are optional; absence means "all".

| Param | Values | Example |
|-------|--------|---------|
| `role` | `director` (default) · `co-director` · `performer` · `reader` | `?role=director` |
| `form` | `puppet` · `object` · `contemporary` | `?form=puppet` |
| `age` | `3` · `6` · `12` · `18` | `?age=6` (URL param maps to the data field `ageRating`) |
| `country` | ISO 3166-1 alpha-2 | `?country=DE` |
| `year` | 4-digit year | `?year=2020` |

Multiple values: comma-separated. Example: `?form=puppet,object&country=DE,AT`

All filter states are deep-linkable and bookmarkable. The URL is the source of truth for filter state;
no hidden state in component memory.

### Sitemap & hreflang

`sitemap.xml` enumerates every page in RU and EN and emits `<xhtml:link rel="alternate" hreflang>`
entries pairing each RU URL with its EN sibling (and vice versa), plus `x-default` → RU.

DE pages are **excluded from hreflang alternates** in v1: chrome-only DE means the page body is
identical to the RU/EN sibling, and signalling DE as a content alternate would mislead Google
into ranking the wrong locale. DE URLs still appear in the sitemap for crawlability, just
without `hreflang` cross-references. When DE promotes to full content (v2 plan), the DE
locale joins the alternates set with no IA change required.

### Anchor links (production detail)

Auto-generated from section headings:
```
/productions/[slug]/#gallery
/productions/[slug]/#awards
/productions/[slug]/#press
```

Used by the sticky sub-header navigation inside long detail pages.

---

*IA locked: 2026-04-30. Feeds Phase 3 (content migration) and Phase 4 (frontend build).*
*Any route additions or removals must be reflected here before implementation.*