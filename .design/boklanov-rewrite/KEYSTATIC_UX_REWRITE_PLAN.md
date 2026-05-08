# Keystatic admin UX — rewrite plan

Date: 2026-05-08
Source critiques: `.design/review/2026-05-08-keystatic-bury-me-behind-the-baseboard/REPORT.md` (grounded) +
`REPORT-STITCH.md` (Stitch concept). Library reference: `.design/boklanov-rewrite/keystatic.md`.

Scope: improve editor ergonomics on `/keystatic/collection/productions/item/<slug>` (and About singletons). Forking
Keystatic and reshaping YAML across all 54 entries are both on the table — the rewrite already touches enough that the
extra blast radius is amortised. Changes land across (a) schema reorganisation in `keystatic.config.ts`, (b) a YAML
migration script + `lib/content.ts` reader update, (c) `keystatic-shim.css` expansion, (d) a small client-side
enhancement in `app/keystatic/layout.tsx`, and (e) a `patch-package` patch against `@keystatic/core` for chrome that
the public API doesn't expose (sticky footer Save, real tabs).

---

## Library reality check — what Keystatic does and does not allow

Read first; it determines which Stitch suggestions are achievable.

| Stitch ask                                              | Keystatic public API?                                                | How we ship it                                                                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tabbed sub-navigation (Identity / Media / Team / Press) | No. `entryLayout` is binary `"form" \| "content"`. No tab primitive. | Real tabs via `patch-package` against `@keystatic/core`'s entry-form renderer; the schema declares an `_uiSection` marker per group and the patch reads it.        |
| Sticky `Save` footer                                    | No. Save lives in Keystatic's top toolbar.                           | `patch-package` adds a duplicate Save / Status bar pinned to the bottom of the viewport, wired to the same form-submit handler the toolbar Save uses.              |
| Larger image previews for poster / featured             | Yes via custom DOM in `ImagePathPreview.tsx` — already wired.        | Enlarge thumbnails, switch to a 16:9 frame for `featuredPhoto`, 2:3 for `poster`. CSS + component change, no patch needed.                                         |
| Horizontal multi-language rows                          | Yes — `layout: [4, 4, 4]` on every `l10n()` field already.           | Already shipped. Audit for drift, no new work.                                                                                                                     |
| Lighter workspace background, denser baseline           | Yes via CSS shim and `localStorage('keystatic-color-scheme')` seed.  | Expand shim with Obsidian Pro tokens; bind each tonal layer to Keystatic's surface selectors.                                                                      |
| Page title shown left of "Production" breadcrumb        | Yes — Keystatic already renders the slug in the breadcrumb.          | Confirmed not missing; Stitch's #6 misread the live UI. Drop.                                                                                                      |
| Locale tabs (RU/EN/DE) at form level                    | No.                                                                  | Schema-level: every `l10n()` field becomes a single field rendered through a custom locale-tab UI, backed by the same on-disk shape. YAML reshape covered by WS-1. |
| Dirty-state cue on Save                                 | No public API.                                                       | The same `patch-package` patch that adds the footer Save toggles `body[data-dirty]` from inside Keystatic's form state, instead of a brittle `MutationObserver`.   |

Conclusion: schema-level regrouping with a YAML migration, plus a narrow `patches/@keystatic+core+<version>.patch`
covering tabs, sticky footer, and dirty-state. Maintaining a patch is cheaper than maintaining a fork: the patch is
re-applied on every `npm install`, and upgrade pain is bounded to the surfaces we changed.

---

## Goals (ranked by editor-pain reduction)

1. Replace the ~12 000 px flat form with **real tabs** (Identity / Media / Production / Team / Recognition / Tour /
   Settings) — never more than ~1 500 px of vertical scroll inside any one tab.
2. Make the form readable by a non-Russian-reading collaborator (descriptions become bilingual RU / EN).
3. Add a **locale toggle** (RU / EN / DE) so the editor sees one column of inputs per session instead of three.
4. Pin **Save + dirty-state status** to a sticky footer; restore visible system status without scroll-hunting.
5. Remove the duplicate `Slug` label and stop the slug input from truncating to `bur…`.
6. Make the gallery and featured-strip visually verifiable, not data-entry-blind.
7. Apply a single tonal-layer pass (Obsidian Pro palette) so workspace > input > popover surfaces are
   distinguishable in dark mode.

Non-goals: redesigning the public site (covered by DESIGN.md), migrating the public site to Obsidian Pro, adding a
contact form, full-fork of Keystatic (we use `patch-package` instead).

---

## Workstreams

Seven workstreams. WS-1 / WS-6 / WS-7 are the load-bearing ones; the others are independent ergonomics passes. Each
is one PR unless noted.

### WS-1 — Schema regrouping in `keystatic.config.ts` (with YAML migration)

Reshape the `productions` collection from 30+ flat top-level fields into 7 nested groups. Each group becomes a
`fields.object({}, { label, description })` and on-disk YAML is reshaped to match. This is the truthful version of
the change — no CSS hacks pretending to be sections.

**New schema topology:**

```ts
schema: {
  slug: fields.slug({ name: { label: 'URL slug', ... } }),
  identity: fields.object({
    title, tagline, synopsis, directorsNote,
    bodyRu, bodyEn, bodyDe,
  }, { label: 'Identity', description: '…' }),
  media: fields.object({
    poster, productionsPhoto, featuredPhoto, gallery, videos,
  }, { label: 'Media' }),
  production: fields.object({
    theatre, year, premiereDate, ticketsUrl, durationMin, ageRating, status,
  }, { label: 'Production' }),
  taxonomy: fields.object({
    role, form, lineage, tags,
  }, { label: 'Taxonomy' }),
  team: fields.object({
    credits, // already nested ru/en/de
  }, { label: 'Team' }),
  recognition: fields.object({
    awards, festivals, press, externalLinks,
  }, { label: 'Recognition' }),
  history: fields.object({
    tour, runs,
  }, { label: 'Performance history' }),
  settings: fields.object({
    bookingCta, bookingCtaLabel, bookingCtaUrl,
    featured, featuredOrder, listOrder,
    techRider, pressKit,
    notionIds,
  }, { label: 'Settings' }),
}
```

**YAML migration** — one-shot script `scripts/migrate-productions-schema.ts`:

1. Reads every `content/productions/*/index.yaml`.
2. Lifts existing top-level keys under their new parent key per the topology above. `slug` stays at top level (it's
   the slug field).
3. Writes the result back through `js-yaml` with the same dump options (`noRefs: true`, `sortKeys: false`,
   `lineWidth: 120`) the original migration used so the diff is structural-only.
4. Includes a `--dry-run` flag that prints a diff of one entry without writing.
5. Run-once gate: refuses to run twice on an already-migrated entry (detected by presence of `identity:` at top
   level).

**Reader update** — `lib/content.ts`:

Replace every direct read like `fm.theatre`, `fm.poster`, `fm.tour`, `fm.credits` with `fm.production?.theatre`,
`fm.media?.poster`, `fm.history?.tour`, `fm.team?.credits`, etc. Single pass through the file; the `(fm as any)`
casts stay where they are. Add a thin `flatten(fm)` helper at the top so the rest of the file does not have to know
about the nested shape — read once, flatten once, downstream code unchanged.

**Acceptance:** every page on the public site renders identical bytes after migration (compare
`next build` output dirs before/after via `diff -r`). One Keystatic save round-trip on any entry produces zero diff.

### WS-2 — Bilingual field descriptions

Every field description in `keystatic.config.ts` is currently single-language (selected by `DESC_LANG` constant).
Replace the `desc(ru, en)` selector with a concatenation that always shows both:

```ts
const desc = (ru: string, en: string): string =>
  `**RU** — ${ru}\n\n**EN** — ${en}`
```

Keystatic renders descriptions through Markdoc; bold + linebreaks render as expected. Drop the `DESC_LANG` constant
entirely; it now has zero callers.

Cost: zero migration, zero reader change. Reverses the choice in the file's preamble — update the comment on lines
62-66.

### WS-3 — Slug label / slug width fix

Two issues, one PR:

1. **Duplicate `Slug` heading.** `fields.slug({ name: { label: 'Slug', ... } })` produces both an outer section
   heading "Slug" and an inner input label "Slug". Rename the inner label to `URL slug` so the section reads
   `Slug → URL slug, Regenerate, …`:
   ```ts
   slug: fields.slug({
     name: {
       label: 'URL slug',
       description: desc('…', '…')
     }
   }),
   ```
2. **Truncated input width.** The shim's `:has()` rule caps top-level text inputs at `33.333%`. The slug input is one
   of those. Carve out the slug input specifically (the field name is `slug` so the wrapping div carries
   `[aria-label*='slug' i]` or similar — verify in DevTools) and lift its cap to `min(640px, 60%)`.

Verification: take a fresh capture; the slug should render as `bury-me-behind-the-baseboard` in full.

### WS-4 — Visual verification of media

Three changes inside `ImagePathPreview.tsx` and the shim:

- **Poster preview** — bump from current ~64 px square to 192 × 288 px (2:3 portrait). The poster is the production's
  identity asset; it should be visually recognisable in the form, not a thumbnail.
- **Featured strip preview** — render in a 16:9 frame at 320 × 180 px, with a subtle hairline border so empty entries
  are obviously empty.
- **Gallery rows** — when the row is collapsed (default), inline a 48 × 48 px thumbnail next to the basename. The
  current implementation already does this but the thumbnail is invisible at default zoom; confirm it renders by
  reading `ImagePathPreview.tsx` and either growing the thumb to 56 × 56 px or adjusting its CSS containment.

These are component-level changes; the schema does not move.

### WS-5 — Obsidian Pro tonal layers

CSS shim expansion. The current `keystatic-shim.css` is 30 lines. Grow it to ~120 lines, focused entirely on tonal
layers — section-band hacks and the dirty-state `MutationObserver` are gone (WS-1 ships real sections, WS-6 ships a
real dirty-state hook from inside the patched form).

Define five surface variables on `body[data-theme='dark']` from the Obsidian Pro palette:

```css
--surface-bg: #0b1326; /* page canvas */
--surface-container: #171f33; /* tab panel / form section */
--surface-input: #060e20; /* input fields — darker than container */
--surface-popover: #222a3d; /* popovers, modals */
--outline-hairline: #464554;
```

Bind each layer to Keystatic's internal selectors (best-effort; eyeball after every Keystatic upgrade, same
fragility note already documented in the shim preamble). Where Keystatic exposes `--ks-color-*` CSS variables
directly, override those instead of element selectors — far more upgrade-resilient. Audit
`node_modules/@keystatic/core` styles before writing the shim so we know which override path is available.

### WS-6 — `patch-package` patch: real tabs + sticky footer Save + dirty-state

This is the one workstream that touches third-party code. We add `patch-package` to `package.json` (`postinstall:
patch-package`) and check in `patches/@keystatic+core+<version>.patch`.

The patch does three things:

1. **Real tabs.** In Keystatic's entry-form renderer, group consecutive child fields by their parent
   `fields.object` and render each group as a tab panel. The active tab is mirrored to the URL hash
   (`#tab=media`) so editor reloads land in the same panel. Tab order = field declaration order from
   `keystatic.config.ts`.
2. **Sticky footer Save.** Render a duplicate of the toolbar's Save button (and its current dirty/saving/saved
   status) at `position: fixed; bottom: 0` inside the form scroll container. Wire it to the same submit handler;
   no second form-state machine. The original toolbar Save stays so desktop muscle memory is unbroken.
3. **`body[data-dirty]` reflection.** Inside the form-state hook, `useEffect` that toggles
   `document.body.dataset.dirty = state.isDirty ? 'true' : 'false'`. This is what unlocks the visual cue without
   the brittle `MutationObserver` from the previous draft.

**Process for authoring the patch:**

1. `npm install --save-dev patch-package postinstall-postinstall`
2. Pin `@keystatic/core` and `@keystatic/next` exactly in `package.json` (no caret — patches are version-specific).
3. Edit `node_modules/@keystatic/core/dist/...` directly with the three changes above. Identify the entry-form
   component by reading `keystatic-next-ui-app.js` first — that's the entry shim, and it imports from `core`.
4. `npx patch-package @keystatic/core` — produces `patches/@keystatic+core+<version>.patch`.
5. Document the patch's surface area at the top of `patches/README.md`: which files, why, what to look for on
   upgrade.

**Upgrade discipline:** the patch is fragile by construction. Add a CI step that fails if `@keystatic/core` is
upgraded without re-applying / re-validating the patch. Treat the patch as load-bearing; rewrites of upstream are
worth more diligence than typical package upgrades.

### WS-7 — Locale toggle (RU / EN / DE)

Reduce the per-section vertical scroll further by collapsing every `l10n()` field's three-column row into a single
column with a tab toggle at the form level. The on-disk YAML shape for `l10n` fields stays
`{ ru, en, de }` — what changes is the **render** of those fields.

Two implementation routes:

**Route 1 — schema-side tag.** Add an `_uiLocaleTab: true` marker in the field options of every `l10n()` field
(via the helper, single-line change). The WS-6 patch reads this marker and renders one column of inputs, with a
tab strip pinned at the top of the form: `[RU] [EN] [DE]`. Switching the tab swaps which locale is visible.

**Route 2 — global locale toggle.** Skip the per-field marker entirely. The patch detects fields whose key shape
is `{ ru: text, en: text, de: text }` and applies the toggle automatically. Fewer schema changes; harder to opt
out of (e.g. Title might want to stay three-up while Body wants the toggle).

**Recommendation: Route 1.** Explicit opt-in per field, no auto-detection magic, easy to roll back individual
fields if Roman wants a specific one shown three-up.

Keystatic's existing `[4, 4, 4]` row layout becomes a fallback for any `l10n` field where `_uiLocaleTab` is not
set — preserves Stitch finding #3 for fields where it actually helps (short titles, taglines), removes it for
long-form fields where the three-column wall is the problem (Body, Director's note, Synopsis).

---

## Ordering and acceptance

Ship order: **WS-2 → WS-3 → WS-5 → WS-4 → WS-6 → WS-1 → WS-7.**

WS-2 first — zero blast radius, unblocks a non-Russian collaborator. WS-3 next — most-flagged finding, trivial.
WS-5 next — tonal layers stand on their own and make subsequent visual changes easier to evaluate. WS-4 before
WS-6 because media previews are component-local and verify the shim is healthy. WS-6 before WS-1 because tabs
need to exist before the schema regrouping has anywhere to land — WS-1 without WS-6 is just a denser flat form.
WS-1 before WS-7 because locale-toggle rendering is easier to reason about once `l10n` fields live inside their
right sections.

Acceptance per workstream:

- **WS-2.** Open `/keystatic/collection/productions/item/bury-me-behind-the-baseboard` and confirm every field
  description shows `**RU** — …` then `**EN** — …` on two lines.
- **WS-3.** Slug section shows one heading. Slug input renders the full slug without truncation at 1440 viewport.
- **WS-5.** Surface tones differ by eye between page bg, tab panel, input, and popover. Light-mode flash during
  hydration is acceptable but not regressed.
- **WS-4.** Poster preview is 192 × 288 px and recognisable at glance. Featured strip preview is 16:9 with hairline
  border. Gallery thumbs show a 56 px image when row is collapsed.
- **WS-6.** Tabs render as `[Identity] [Media] [Production] [Team] [Recognition] [History] [Settings]`. The
  sticky-footer Save mirrors the toolbar Save (state, click handler). `body[data-dirty='true']` is set whenever
  any field is edited since last save, false otherwise. Reloading the page with `#tab=media` lands on the Media
  tab.
- **WS-1.** YAML migration runs once, idempotent, dry-run reviewed first. After migration, `next build` produces
  byte-identical pages compared to pre-migration. One Keystatic round-trip save on any entry produces zero
  structural diff.
- **WS-7.** Long-form `l10n` fields (Body, Director's note, Synopsis) render in a single column with `[RU] [EN]
[DE]` tabs at the top of the form. Short `l10n` fields (Title, Tagline) keep their `[4, 4, 4]` row. Switching
  locale tabs preserves unsaved values across all three locales.

---

## Out of scope (explicit deferrals)

- **Public-site design changes.** Governed by DESIGN.md, not this plan.
- **Obsidian Pro on the public site.** The palette is admin-only; the public site stays paper-and-ink Plakat.
- **Aria-label audit on the toolbar icons.** Tracked in `KEYSTATIC_IMPROVEMENT_PLAN.md`. The WS-6 patch could fold
  these in cheaply — promote into WS-6 only if the patch is already touching the toolbar component.
- **Indigo/Purple accent migration.** Keystatic's existing accent works; reskinning the accent system means a much
  bigger patch surface. Defer until the structural changes are stable.

---

## Risks

1. **`patch-package` upgrade pain.** Every `@keystatic/core` minor refactor risks invalidating the patch. Mitigation
   (a): pin the version exactly. (b): a Playwright smoke spec that loads
   `/keystatic/collection/productions/item/bury-me-behind-the-baseboard` and asserts each tab renders, sticky footer
   exists, `body[data-dirty]` toggles. CI fails if any of those break. (c): the patch's own diff is the upgrade
   roadmap — keep it small, well-commented, and split per concern (one hunk per: tabs, footer, dirty-state, locale
   toggle).
2. **YAML migration is one-way.** Once `content/productions/*/index.yaml` is reshaped, rolling back WS-1 means
   reverse-migrating. Mitigation: tag a `pre-keystatic-rewrite` git ref before WS-1 lands, keep the migration
   script reversible (`scripts/migrate-productions-schema.ts --reverse`).
3. **Reader update lands wrong.** WS-1 changes `lib/content.ts` field paths everywhere. Mitigation: TypeScript
   strict mode catches the obvious paths; for the `(fm as any)` casts, add an explicit type for the migrated YAML
   shape so the casts narrow correctly.
4. **CSS coupling fragility (WS-5).** Tonal layers rely on Keystatic selectors. Mitigation: prefer `--ks-color-*`
   variable overrides over element selectors; same Playwright smoke spec covers the visible tonal hierarchy
   (assert computed `background-color` differs between canvas and panel).
5. **Locale toggle (WS-7) and Body MDX coexistence.** The MDX editor manages its own internal state; switching the
   locale tab while the editor is mid-paste may lose buffered content. Mitigation: hold all three MDX editors
   mounted but `display: none` the inactive ones — costs memory, preserves state.

---

## What we are not borrowing from Stitch

- The Indigo / Purple accent palette. Keystatic's existing accent works; reskinning it expands the patch surface
  for marginal benefit. Park as a follow-up after structural changes settle.
- The "Pro Tools / IDE" framing as a North Star. We are improving an editor's CMS for Roman, not building a
  power-user IDE. Density helps; aestheticisation of density does not.
- Stitch's recommendation #3 (horizontal language rows) — already shipped via `layout: [4, 4, 4]` for short fields.
  WS-7 collapses these to a locale tab only for the long-form fields where the three-column wall actually hurts.
- Stitch's recommendation #6 (page name left of "Production"). Already shown in the breadcrumb. Misread of the
  live UI.
