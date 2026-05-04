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

| Field | Type | Notes |
|-------|------|-------|
| `slug` | string | Latin + hyphens. Matches folder name. |
| `notionIds.ru` / `.en` | string | Legacy Notion IDs. Keep for audit. |
| `title.ru` / `.en` / `.de` | string | DE only for priority shows. |
| `synopsis.ru` / `.en` / `.de` | string | Short description. |
| `theatre.name` | string | Producing theatre. |
| `theatre.url` | string | Theatre website. |
| `year` | number | Premiere year. |
| `premiereDate.ru` / `.en` | string | Full date string per locale. |
| `ageRating` | string | `0+` / `3+` / `6+` / `12+` / `16+` / `18+` |
| `durationMin` | number | Integer minutes. |
| `role` | string | `director` / `performer` / `co-director` / `reader` |
| `form` | string[] | `puppet` / `object` / `solo` / `ensemble` / `family` |
| `lineage` | string[] | `btk` / `rgisi` / `kudashov` / `dotheatre` |
| `featured` | boolean | Show in home featured row (4–6 max site-wide). |
| `tour` | string[] | Tour cities. Used on Plinth detail page. |
| `credits.ru` / `.en` | CreditEntry[] | `{ role, name, url? }` |
| `gallery` | GalleryItem[] | `{ src, credit, caption: { ru, en } }` |
| `awards` | Award[] | `{ name, year?, category?, city? }` |
| `press` | Press[] | `{ title, url, outlet?, language? }` |
| `videos` | Video[] | `{ provider: "youtube", id }` |
| `ticketsUrl` | string\|null | Active tickets page. |
| `techRider` | string\|null | Path to PDF. |
| `pressKit` | string\|null | Path to ZIP. |
| `tags` | string[] | Free tags. |

Long-form description ships in `body.<locale>.md` siblings - not
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
