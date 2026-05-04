# `content/` - production data

**2026-05-04:** `index.mdx` (frontmatter + body in one file) split into
`index.yaml` (data) + `body.{ru,en,de}.md` (prose). Obsidian Properties
panel retired in favour of plain-text YAML editing. Roman's onboarding
guide: `content/AUTHORING.ru.md`.

**Phase 8.3 (2026-05-02):** `metadata.yml` overlay retired and folded
into frontmatter. Notion sync retired. Obsidian + obsidian-git is the
editorial workflow.

---

## Structure

```
content/
├── README.md                       ← you are here
├── AUTHORING.ru.md                 ← Roman's editing guide (Russian)
├── _PRODUCTION_TEMPLATE.yaml       ← starter for new productions
├── productions-index.json          ← flat index for the content loader
├── about/
│   ├── ru.yaml + ru.md             ← bio data + prose, RU
│   └── en.yaml + en.md             ← bio data + prose, EN
└── productions/
    └── <slug>/
        ├── index.yaml              ← all data fields
        ├── body.ru.md              ← long-form prose, RU
        ├── body.en.md              ← long-form prose, EN
        └── body.de.md              ← long-form prose, DE (optional)
```

No `metadata.yml` files - overlays were folded into frontmatter
by `scripts/_legacy/fold-overlay.ts` on 2026-05-02. No `index.mdx`
files - body extracted into sibling `.md` files by
`scripts/migrate_mdx_to_yaml.py` on 2026-05-04.

---

## Editing

- **Data fields:** edit `index.yaml` as plain text in any editor.
  Plain `key: value` YAML - no Properties panel.
- **Prose:** edit `body.ru.md` / `body.en.md` / `body.de.md` in Obsidian
  as regular markdown.

Commit and push from Obsidian's Source Control panel - Vercel
redeploys automatically in 1–2 minutes.

---

## `index.yaml` fields

### Identity

| Field | Type | Notes |
|-------|------|-------|
| `slug` | string | Latin + hyphens. Must match folder name. |
| `notionIds.ru` / `.en` | string\|null | Legacy Notion IDs. Keep for audit trail. |

### Titles & texts (locale-keyed)

| Field | Type | Notes |
|-------|------|-------|
| `title.ru` / `.en` / `.de` | string | DE only for priority shows. |
| `synopsis.ru` / `.en` / `.de` | string | 1–3 sentences; appears in cards and page header. |
| `tagline.ru` / `.en` / `.de` | string\|null | Subtitle shown *above* the title on the production page. |
| `directorsNote.ru` / `.en` / `.de` | string\|null | Director's quote shown *below* the synopsis. |

### Theatre

| Field | Type | Notes |
|-------|------|-------|
| `theatre.name` | string\|L10nString | Producing theatre name. |
| `theatre.shortName` | string\|L10nString\|null | Compact label for tight UI spots. |
| `theatre.city` | string\|L10nString | City of the theatre. |
| `theatre.country` | string | ISO-2 code: `RU` / `KZ` / `DE` / `ES` … |
| `theatre.url` | string\|null | Official theatre or show page URL. |

### Dates & metadata

| Field | Type | Notes |
|-------|------|-------|
| `year` | number\|null | Premiere year. |
| `premiereDate.ru` / `.en` / `.de` | string\|null | Full date string per locale. |
| `ticketsUrl` | string\|null | Active ticket purchase page. |
| `ageRating` | string\|null | `0+` / `3+` / `6+` / `12+` / `16+` / `18+` |
| `durationMin` | number\|null | Integer minutes. |

### Classification

| Field | Type | Notes |
|-------|------|-------|
| `role` | string[] | Roman's role(s): `director` / `co-director` / `performer` / `playwright` / `designer` / `choreographer` / `mentor` / `reader` |
| `form` | string[] | `theater` / `puppet` / `object` / `solo` / `mono` / `music` / `immersive` / `lab` / `festival` / `online` / `ensemble` / `family` |
| `lineage` | string[] | `btk` / `rgisi` / `kudashov` / `dotheatre` / `school` / `lab` |
| `tags` | string[] | Free-form filter/search tags. |

### Credits

| Field | Type | Notes |
|-------|------|-------|
| `credits.ru` / `.en` / `.de` | CreditEntry[] | `{ role: string, name: string, url?: string }`. DE optional. |

### Media

| Field | Type | Notes |
|-------|------|-------|
| `poster.src` | string\|null | Path to cover image, e.g. `/productions/<slug>/poster.jpg`. |
| `poster.credit` | string\|null | Photographer name. |
| `gallery` | GalleryItem[] | `{ src, credit, caption: { ru, en, de? } }`. |
| `videos` | Video[] | `{ provider: "youtube"\|"vimeo", id: string }`. First item renders as trailer. |

### Recognition

| Field | Type | Notes |
|-------|------|-------|
| `awards` | Award[] | `{ name, year?, category?, city? }`. `name` can be L10nString. |
| `festivals` | Festival[] | `{ name, year?, category?, city? }`. Participation without prize. |
| `press` | Press[] | `{ title, url, outlet?, language? }`. `title` can be L10nString. |

### Links & files

| Field | Type | Notes |
|-------|------|-------|
| `externalLinks` | ExternalLink[] | `{ label: L10nString, url: string }`. |
| `techRider` | string\|null | URL or path to PDF. |
| `pressKit` | string\|null | URL or path to ZIP. |

### Booking CTA

| Field | Type | Notes |
|-------|------|-------|
| `bookingCta` | boolean | `false` hides the "Write to Roman about touring" button. Default `true`. |
| `bookingCtaLabel.ru` / `.en` / `.de` | string\|null | Override button label. `null` → default text. |
| `bookingCtaUrl` | string\|null | Override button URL. `null` → default `mailto:`. |

### Site placement

| Field | Type | Notes |
|-------|------|-------|
| `featured` | boolean | Show in home featured row (4–6 max site-wide). |
| `featuredOrder` | number\|null | Sort order in the featured strip (1, 2, 3 …). |
| `listOrder` | number\|null | Sort order in the full productions grid. `null` = not pinned. |
| `tour` | string[] | Tour cities. Used on the Plinth detail page. |
| `runs` | Run[] | Historical venue run data: `{ venue?, city?, yearFrom?, yearTo?, count? }`. All fields are L10nString-capable. Displays above the title on the production page. |

Long-form description ships in `body.<locale>.md` siblings — not
inside `index.yaml`.

---

## Adding a new production

1. Create folder `content/productions/<slug>/` (Latin, hyphens).
2. Copy `content/_PRODUCTION_TEMPLATE.yaml` as `<slug>/index.yaml`.
   Set the `slug:` field to match the folder name.
3. Create `body.ru.md` and `body.en.md` (and `body.de.md` if applicable)
   in the same folder.
4. Add photos to `public/productions/<slug>/`.
5. Commit and push from Obsidian.

---

## Archive

Legacy Notion sync script: `scripts/_legacy/sync-from-notion.ts`
(frozen 2026-05-02, do not re-run).
Legacy mdx migrators: `scripts/_legacy/{fold-overlay,migrate-body-to-frontmatter}.ts`
(frozen 2026-05-04, do not re-run).

`notion-data/` lives on disk locally but is gitignored.
