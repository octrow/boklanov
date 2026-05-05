# Keystatic improvement plan

Synthesis of the Opus + Gemini UI/UX reviews (`archive/keystatic_uiux_review_opus.md`,
`archive/keystatic_uiux_review_gemini.md`) measured against the **current**
`keystatic.config.ts`. Many items in those reviews were written against an
earlier schema and are already done — what remains is filtered below.

Site is **live with Lighthouse 4×100**, ~30+ production entries in YAML, and
ships a custom `app/keystatic/ImagePathPreview.tsx` for text-path image fields.
Every change below is sized against that reality.

---

## Already shipped (do not redo)

- `entryLayout: 'content'`, `previewUrl`, brand name
- `fields.url` for theatre/tickets/booking/award/external/tech-rider/press-kit
- `fields.image` on About-page singletons (portrait + photos)
- Structured credits as `{ role, name, url }` per language
- Structured awards / festivals / press / external links / runs / videos
- `fields.mdx` for production bodies (RU/EN/DE) and About bodies
- L10n object helper (`l10n()`) collapsing RU/EN/DE into one labelled object
- Theatre as nested object (name, shortName, city, country, url, foundedYear)

The reviews' suggestions for these items are obsolete.

---

## Tier 1 — Pure config wins, no YAML migration

One PR. Reads/writes don't change. YAML files stay byte-identical.

### 1.1 Side-by-side l10n layout

Add `layout: [4, 4, 4]` to the `l10n()` helper. Three locales render in 3
columns instead of stacked vertically. ~15 fields benefit immediately
(title, synopsis, tagline, directorsNote, theatre.name, theatre.shortName,
theatre.city, premiereDate, all `name` fields inside awards/festivals/press,
gallery captions, tour cities, runs.venue/city, externalLinks.label,
bookingCtaLabel).

### 1.2 Replace free-text enums with selects

| Field | Current | Become |
|-------|---------|--------|
| `theatre.country` | `fields.text` (3-char) | `fields.select` over real ISO-2 list (RU, KZ, DE, ES, FR, GB, IT, AT, CH, PL, …) |
| `ageRating` | `fields.text` | `fields.select` (`0+`, `6+`, `12+`, `16+`, `18+`) |
| `status` | free text | `fields.select` (`live`, `in-development`, `archived`, `on-tour`) with `defaultValue: 'live'` |
| `videos[].provider` | `fields.text` | `fields.select` (`youtube`, `vimeo`) |
| `press[].language` | `fields.text` | `fields.select` (`ru`, `en`, `de`) |
| `role` array | text array | `fields.multiselect` (director, performer, playwright, set-designer, producer, …) |
| `form` array | text array | `fields.multiselect` (mono, ensemble, immersive, reading, family) |

**Pre-flight check before merging:** sweep all `index.yaml` files to confirm
existing values match the option list. Any outlier must be added to the
options or fixed in YAML — a select that can't represent existing data will
hard-fail at edit time.

```bash
# Quick audit — replace <field> with each enum candidate
rg -N "^ageRating:" content/productions --no-filename | sort -u
```

### 1.3 Conditional fields

Hide fields that don't apply until a parent toggle is on:

- `bookingCtaLabel` + `bookingCtaUrl` → only when `bookingCta` checkbox is true.
- `featuredOrder` → only when `featured` checkbox is true.

Wrap each pair in `fields.conditional(checkbox, { true: object(...), false: fields.empty() })`.

### 1.4 Better collection list columns

`columns: ['slug', 'year']` shows two near-identical-looking columns. Switch
to something scannable. Keystatic accepts dotted paths into objects:

```ts
columns: ['title.ru', 'theatre.shortName.ru', 'year']
```

If the dotted-path approach proves unsupported by the version pinned in
`package.json`, fall back to derived top-level fields.

### 1.5 Sidebar grouping

```ts
ui: {
  brand: { name: 'boklanov.com' },
  navigation: {
    Productions: ['productions'],
    'About page': ['aboutRu', 'aboutEn', 'aboutDe'],
  }
}
```

### 1.6 Field descriptions

Add 1-line `description:` to under-documented fields the editor will hit:
- Poster image dimensions / aspect ratio expectation
- What `productionsPhoto` overrides vs `featuredPhoto`
- `listOrder` vs `featuredOrder` semantics
- `tour` cities = guest performances, not premiere
- `runs[]` = venue history

**Risk:** very low. Selects refuse free text — see pre-flight audit. Conditional
fields preserve YAML keys when `false`, so re-enabling later doesn't lose data.

---

## Tier 2 — Schema changes that touch YAML

Do only if Tier 1 leaves real friction. Each requires a migration script
(see playbook below) and a visual smoke test of `/[locale]/productions/[slug]`.

### 2.1 `directorsNote` → `fields.markdoc.inline`

Per locale. Lets paragraphs/emphasis/quote. Affects how `lib/content.ts` reads
the field and how the production page renders it.

**Migration:** wrap each existing string value in a single-paragraph markdoc
node. Bodies are short — usually 1–2 sentences — so this is a one-pass script.

### 2.2 Image fields for poster / productionsPhoto / featuredPhoto / gallery

Replace `fields.text` with `fields.image({ directory, publicPath, … })`.

**Trade-off to think through:**
- `fields.image` stores **just the filename** relative to `publicPath`. YAML
  values change from `/productions/<slug>/poster.jpg` → `poster.jpg`.
- The custom `app/keystatic/ImagePathPreview.tsx` becomes redundant.
- Every reader in `lib/content.ts`, `components/ProductionCard.tsx`,
  `components/TypographicCover.tsx`, `app/[locale]/productions/[slug]/page.tsx`,
  `app/api/og/[slug]/route.tsx` needs to reconstruct the public path.

**Cleanest pattern:** keep `publicPath` set so the rendered URL stays
byte-identical to the current `/productions/<slug>/<file>` form, and update
readers to `${publicPath}${value}` if needed. Verify on one entry first.

**Migration:** rewrite YAML for all 30+ entries — strip the leading
`/productions/<slug>/` prefix from every `*.src` value.

### 2.3 `fields.pathReference` for `techRider` / `pressKit`

Only worth doing if those PDFs actually live in the repo (`public/...`). If
they're external URLs, leave as `fields.url`.

```bash
rg -N "techRider:|pressKit:" content/productions --no-filename | sort -u
```

---

## Tier 3 — Big structural refactors (deferred)

The Opus reviewer pushes for normalising **theatres**, **people**, **cities**,
**festivals** into separate collections with relationship fields. Recommendation:
**don't do this yet.**

- Largest editor UX change + largest data migration combined.
- Director-portfolio site with a known finite cast; duplication cost is small.
- Site already shipped; "one source of truth" mostly serves future expansion.
- Revisit only if Roman starts editing himself, the cast grows past ~5 reused
  theatres/people, or you want public per-theatre / per-collaborator pages.

Recorded here so we don't re-litigate every quarter.

---

## Suggestions explicitly skipped

- **Move Notion IDs out of view / use `fields.ignored()`.** They're already at
  the bottom of the schema, kept on purpose for round-tripping. `fields.ignored()`
  would erase them on save.
- **Auto-generate slug from English title.** Slugs are curated, stable, and
  drive live URLs. Auto-gen risks breaking links.
- **Lock slug after first save.** Keystatic can't enforce this. Not worth a
  custom workaround for a one-editor site.
- **Blanket `validation: { isRequired: true }` everywhere.** Will fight legacy
  entries that have empty fields. Add only on truly-required new fields.
- **`premiereDate` as `fields.date` + render-time formatting.** Current
  free-text per locale handles fuzzy dates ("весна 2021") that ISO can't. Skip
  unless we drop fuzzy support.
- **Tags / lineage as separate collection.** Same logic as Tier 3 — duplication
  cost is small for our scale.

---

## Recommended order

1. Ship **Tier 1** as one PR. Eyeball editor in dev.
2. If image-path UX is still painful, do **Tier 2.2** in its own PR with a
   migration script.
3. **Tier 2.1 / 2.3** are independent — bundle when convenient.
4. **Tier 3** deferred until the cast/theatre count grows.

---

## Migration playbook — `content/about` and `content/productions`

Whenever a Tier 2 change ships, or a future schema tweak forces YAML rewrites,
follow this pattern.

### Layout reminder

```
content/productions/<slug>/
  index.yaml          ← all structured fields (l10n, credits, awards, …)
  bodyRu.mdx          ← from fields.mdx (no frontmatter, plain mdx)
  bodyEn.mdx
  bodyDe.mdx

content/about/
  ru.mdx              ← YAML frontmatter + body in one file
  en.mdx              ← (singleton uses contentField: 'body')
  de.mdx
```

About-page data lives **inside frontmatter of the same `.mdx`**, not a separate
yaml. Productions split data and body across files.

### Migration script skeleton

Always write the script to be idempotent — running twice must be a no-op.

```ts
// scripts/migrate-keystatic.ts
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'         // already in deps via Keystatic
import matter from 'gray-matter'   // already in deps for mdx frontmatter

const PROD_DIR = 'content/productions'
const ABOUT_DIR = 'content/about'

function migrateProduction(slug: string) {
  const file = path.join(PROD_DIR, slug, 'index.yaml')
  const raw = fs.readFileSync(file, 'utf8')
  const data = yaml.load(raw) as any

  // <-- transform `data` here (e.g. strip /productions/<slug>/ from poster.src)

  fs.writeFileSync(file, yaml.dump(data, { lineWidth: 100, noRefs: true }))
}

function migrateAbout(locale: 'ru' | 'en' | 'de') {
  const file = path.join(ABOUT_DIR, `${locale}.mdx`)
  const parsed = matter(fs.readFileSync(file, 'utf8'))

  // <-- transform `parsed.data` (frontmatter) and/or `parsed.content` (body)

  fs.writeFileSync(file, matter.stringify(parsed.content, parsed.data))
}

for (const slug of fs.readdirSync(PROD_DIR)) migrateProduction(slug)
for (const loc of ['ru', 'en', 'de'] as const) migrateAbout(loc)
```

### Pre-flight checklist

Before running any migration **or** promoting a free-text field to a
`fields.select` / `fields.multiselect` / similar enum-shaped field:

- [ ] `git status` clean (or work on a branch).
- [ ] Tag the pre-migration state: `git tag pre-keystatic-<change>-$(date +%Y%m%d)`.
- [ ] **Audit for `null` presence**, not just unique non-null values.
      Keystatic select rejects literal `null` in YAML — the field will
      crash the client even if every other entry is fine. Use:

      ```python
      python3 -c "
      import yaml, glob
      null_entries = []
      for f in glob.glob('content/productions/*/index.yaml'):
          d = yaml.safe_load(open(f)) or {}
          # ↓ adjust dotted path for the field you're auditing
          v = d.get('press') or []
          if any(p.get('language') is None for p in v):
              null_entries.append(f.split('/')[-2])
      print(f'{len(null_entries)} entries with null:', null_entries)
      "
      ```

      Backfill or strip the null keys **before** promoting the schema.
- [ ] Snapshot diff a single entry by hand to confirm the transform is correct.
- [ ] Dry-run the script with writes commented out, log the diff.

### Post-migration checklist

- [ ] `npm run dev` and open `/keystatic` — every collection list loads, no
      "field is required" errors on existing entries.
- [ ] Open the trickiest entry (currently `bury-me-behind-the-baseboard` — most
      fields populated) and click Save without editing. Should be a no-op
      diff in git.
- [ ] `npm run build` — type errors surface here for any reader that needs
      updating.
- [ ] Visual smoke test: `/ru/productions/bury-me-behind-the-baseboard`,
      `/en/productions/bury-me-behind-the-baseboard`, `/ru/about`, `/en/about`.
- [ ] Run `next build` lighthouse on production page — should remain 4×100.
- [ ] Commit migration script alongside the schema change so the link is
      preserved in history.

### Rollback

YAML migrations are git-tracked. `git revert` of the migration commit restores
exact pre-migration bytes. Tag set in pre-flight is the safety net if revert
gets messy.

### When to re-run vs migrate

- **Add an enum option** (e.g. new `form` value): config-only, no migration.
- **Rename a field key**: migration required (rename in every YAML file).
- **Change a field's storage shape** (text → image, text → markdoc, scalar →
  object): migration required.
- **Tighten validation** (length, required): pre-flight audit YAML for
  violations; either fix data or relax validation.

---

## Decision log

| Date | Decision | Why |
|------|----------|-----|
| 2026-05-06 | Defer theatre/people/city/festival normalisation (Tier 3) | Site shipped; finite cast; cost > value at current scale |
| 2026-05-06 | Keep `notionIds` field, do not `fields.ignored()` | Needed for legacy round-trip; `ignored` erases on save |
| 2026-05-06 | Keep `premiereDate` as free-text l10n, not `fields.date` | Fuzzy dates ("весна 2021") not representable as ISO |
| 2026-05-06 | `country` and `ageRating` stay `fields.text`, defer to Tier 2 | `fields.select` requires `defaultValue` and has no optional/null mode. 8 entries have `country: null`, ~25 have `ageRating: null` — converting now would silently default-fill them on first save. Migrate the nulls first, then switch to select. |
| 2026-05-06 | `bookingCta` / `featured` not yet wrapped in `fields.conditional` | Conditional reshapes YAML (introduces `discriminant`/`value` keys) — Tier 2 with migration script |
| 2026-05-06 | `press[].language` reverted to `fields.text` (regression) | 10 entries have literal `language: null` in YAML; select rejects null → client crash on edit page. Same null-mismatch class as country/ageRating. Backfill before re-promoting. |
| 2026-05-06 | `entryLayout: 'content'` kept on productions despite no `contentField` | Keystatic docs say it's a no-op without `contentField`, but empirically the wider editor canvas DOES render — and removing it left forms squished into the left half of the viewport. Restored as a load-bearing config until upgrades break it. |
| 2026-05-06 (user) | `role` re-promoted to `fields.multiselect` (commit 6390e34) | Editor decided the closed checklist UX is worth the trade-off for the role field specifically — the role list is small and stable. `form` and `lineage` stay free-text. |

---

## Shipped — 2026-05-06 (Tier 1 first PR)

Ref commit: see git log for `keystatic.config.ts`.

- ✅ `l10n()` helper now uses `layout: [4, 4, 4]` — RU/EN/DE render in 3 columns. Affects ~15 fields.
- ✅ `role` / `form` / `lineage` arrays → `fields.multiselect` with options sized to existing data + obvious extensions. (Multiselect serialises to `string[]` — YAML stays compatible, all consumers in `lib/content.ts`, `FilteredProductionsPanel`, `[slug]/page.tsx` keep working.)
- ✅ `videos[].provider` → `fields.select` (`youtube`/`vimeo`).
- ✅ `press[].language` → `fields.select` (`ru`/`en`/`de`). No existing data, safe.
- ✅ Collection `columns` switched from `['slug', 'year']` to `['year', 'durationMin', 'status']` — drops the redundant slug column.
- ✅ `ui.navigation` groups `aboutRu/En/De` under "About page".
- ✅ Field descriptions added to `featured`, `featuredOrder`, `listOrder`, `durationMin`, `tour`, `videos[].id`.

Pre-flight YAML cleanup also shipped:
- Normalised `country: ""` → `country: null` in `dialogi-po-povodu-dzhaza/index.yaml` and `lestnica-v-nebesa/index.yaml`. Two-line touch, safe.

Smoke test post-merge:
- `npx tsc --noEmit` clean.
- Open `/keystatic` in dev, browse a production with role/form/lineage set (e.g. `bury-me-behind-the-baseboard`), confirm checkboxes pre-tick correctly.
- Open a production with `country: null` (e.g. `lika-and-beam`), confirm no error.
- Save without editing — git diff should be empty.

Not shipped (intentionally deferred to Tier 2):
- Conditional fields for `bookingCta` and `featured`.
- `country` / `ageRating` / `status` selects.
- Image fields, markdoc-inline director's note, pathReference for PDFs.

## Shipped — 2026-05-06 (Tier 1 second PR — field reordering)

Schema field order = editor UI order (JS preserves object-literal insertion
order). Reorganised the productions schema by editing frequency / narrative
importance:

1. `slug` (auto, always first)
2. **Identity & short prose** — title, tagline, synopsis, directorsNote
3. **Body — full editorial per locale** — bodyRu / bodyEn / bodyDe (was at the bottom)
4. **Media** — poster, productionsPhoto, featuredPhoto, gallery, videos
5. **Theatre & dates** — theatre, year, premiereDate, ticketsUrl, durationMin, ageRating, status
6. **Roles & taxonomy** — role, form, lineage, tags
7. **Credits**
8. **Recognition** — awards, festivals, press, externalLinks
9. **Performance history** — tour, runs
10. **Booking CTA** — bookingCta + label + url
11. **Site placement** — featured, featuredOrder, listOrder
12. **Tech / press assets** — techRider, pressKit
13. **Legacy** — notionIds

Same treatment on the About singletons: `body` (Bio) moves from last to first.

Side-effect cleanup found while doing this:
- Productions had `entryLayout: 'content'` set, but no `format.contentField` — Keystatic silently falls back to `form` layout in that case, so the line was dead config. Removed with an explanatory comment. Enabling `entryLayout: 'content'` properly would require picking a single primary body field (one of three locales) and renaming its file from `bodyRu.mdx` to `index.mdx` across all entries — a YAML/file-layout migration we don't want to take on for a marginal UI gain.
- About singletons already had `format.contentField: 'body'`, so adding `entryLayout: 'content'` there is a free win — Bio gets the prominent editor pane and the structured fields move to a sidebar. Enabled.

Files changed: only `keystatic.config.ts`. No YAML touched.

## Shipped — 2026-05-06 (Tier 1 third PR — multiselect revert + status select)

**Reverted role / form / lineage to free-text arrays.** Tier 1 PR 1 had
converted them to `fields.multiselect`. Editor feedback during dogfooding:
they need to coin new tags ("duo show", "site-specific", a new lineage
school) without a code deploy. `fields.multiselect` is a closed enum with
no "creatable" mode — there is no schema option that lets the editor type
in a value that isn't in the option list. Reverting is the only Keystatic-
native answer; the comment in `keystatic.config.ts` lists the established
values so they can be re-typed consistently, but the field accepts anything.

**Status promoted to `fields.select`.** Editor confirmed status doesn't need
to be open-ended (the four lifecycle states cover everything). Options:
`live` / `in-development` / `archived` / `on-tour`, default `live`. Only
2 of 30+ entries actually have a `status:` key in YAML (both
`in-development`); the rest will pick up `defaultValue: 'live'` on first
form load and write it back on first save — no migration script needed.
Nothing in `lib/content.ts` or any component reads `status` at runtime,
so the schema-only change is safe.

Reasoning for the asymmetry: status is a system-level enum (the frontend
might one day filter by it); role / form / lineage are editorial taxonomies
that grow organically.

## Shipped — 2026-05-06 (Tier 1 hotfix — unblock editor)

Two regressions surfaced when opening
`/keystatic/collection/productions/item/bury-me-behind-the-baseboard`:

1. **Client crashed on the production.** 10 entries have
   `press[].language: null` literally in YAML (the field was set up but never
   filled). My Tier 1 PR had promoted that field to `fields.select` —
   Keystatic select rejects null and the entire client SPA failed to render.
   Reverted `press[].language` to `fields.text` with a comment noting the
   nulls need backfilling before any future re-promotion.

2. **Editor canvas squished into the left half of the viewport, right side
   empty.** My second Tier 1 PR (field reorder) had removed
   `entryLayout: 'content'` from the productions collection on the basis
   that Keystatic docs say it requires `format.contentField`. Empirically
   the wider canvas does still render without one. Restored, with a comment
   explaining the docs discrepancy and the migration path
   (`format.contentField: 'bodyRu'` + rename `bodyRu.mdx` → `index.mdx`
   across every entry) if a future Keystatic upgrade strict-enforces.

Also captured in this hotfix: user's own commit (6390e34) putting `role`
back to `fields.multiselect` — small stable role list earned the
closed-checklist treatment; `form` / `lineage` stay free-text.

## Lessons learned

These apply to every future schema change that touches an enum-style field.

### Audit for null *presence*, not just unique non-null values

The Tier 1 PR audit looked like this:

```python
seen = sorted({d.get('press', {}).get('language') for f in ...} - {None})
# returned [], so press.language looked safe to convert to select
```

It excluded `None` from the result set, masking the fact that 10 entries
had literal `language: null` in YAML. When promoted to `fields.select`,
those entries crashed the editor on load. Correct audit:

```python
seen_or_null = {d.get('press', {}).get('language') for f in ...}
# returned {None}; flag for backfill before any select conversion
```

Codified in the Migration Playbook below as a pre-flight requirement.

### Keystatic docs vs. runtime behaviour can drift

`entryLayout: 'content'` was documented as requiring `format.contentField`,
but Keystatic still renders a wider editor canvas without one. Never
trust docs alone for layout-affecting config — verify visually in
`/keystatic` against the same entry before merging.

### `fields.multiselect` is closed-enum only

There is no "creatable" / "tags-mode" multiselect in Keystatic. If editors
need to coin new values, the field must be `fields.array(fields.text(...))`.
Not negotiable; do not propose multiselect for an open taxonomy again.

### Don't conflate *missing* and *null* in audits

Python's `dict.get(key)` returns `None` for both an absent key AND an
explicit `key: null`. They are NOT equivalent for Keystatic:

- **Missing key** + schema `fields.select({ defaultValue })` → field
  defaults silently on form load. No crash. Editor save will write the
  default value into YAML (so a "save without editing" produces a real
  diff).
- **Literal `key: null`** + same schema → Keystatic rejects null at parse
  time → client SPA refuses to render the entry.
- **Literal `key: ""`** + same schema → same reject as null.

When auditing, distinguish the three. The audit script does this; ad-hoc
Python one-liners with `.get()` quietly do not.

The hotfix that reverted `press[].language` from select to text was still
the right call — every press item across every entry is *missing* the
`language` key, so converting to select would have silently default-filled
all 41 items on first save. Just not for the reason originally given.

## Pre-flight tooling

`scripts/audit-keystatic-schema.ts` reports per-field nullability,
cardinality, and select-readiness. Run before any schema change that
narrows a field type:

```bash
npm run audit-keystatic            # report only
npm run audit-keystatic -- --strict # exit 1 if any null/empty mismatches
```

Output legend:

- `⚠ NULL/EMPTY` — field has literal null or empty-string values; will
  crash `fields.select`. Backfill before promoting.
- `✓ select-ready` — low-cardinality, no null/empty mismatches. Safe to
  consider promotion.
- `— open taxonomy` — too many distinct values; keep as text array.
- `— field unused` — no entries have a value; either drop the field or
  start filling it.

Add new fields to the `PRODUCTION_FIELDS` list at the top of the script
when they become candidates for promotion.
