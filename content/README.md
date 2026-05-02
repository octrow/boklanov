# `content/` — production data

**Phase 8.3 (2026-05-02):** `metadata.yml` overlay retired and folded into
frontmatter. Notion sync retired. Obsidian + obsidian-git is now the
editorial workflow. Roman's onboarding guide: `content/AUTHORING.ru.md`.

---

## Structure

```
content/
├── README.md                ← you are here
├── AUTHORING.ru.md          ← Roman's editing guide (Russian)
├── productions-index.json   ← flat index for the content loader
└── productions/
    └── <slug>/
        └── index.mdx        ← frontmatter + RU/EN body
```

No `metadata.yml` files — overlays were folded into `index.mdx`
frontmatter by `scripts/fold-overlay.ts` on 2026-05-02.

---

## Editing

Edit `index.mdx` files directly in Obsidian. The Properties panel
(top of each file) shows all structured fields. Body text is below
the Properties block.

Commit and push from Obsidian's Source Control panel — Vercel
redeploys automatically in 1–2 minutes.

---

## `index.mdx` frontmatter fields

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

---

## Adding a new production

1. Copy an existing `content/productions/<slug>/` as a template.
2. Rename the folder to the new slug (Latin, hyphens).
3. Edit `index.mdx` — fill in Properties, write RU/EN body.
4. Add photos to `public/productions/<slug>/`.
5. Commit and push from Obsidian.

---

## Archive

Legacy Notion sync script: `scripts/_legacy/sync-from-notion.ts`
(frozen 2026-05-02, do not re-run).

`notion-data/` lives on disk locally but is gitignored.
