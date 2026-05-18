# PAYLOAD_ADMIN_UX_PLAN

Status: **Draft 2026-05-18** — Steps 1 + 2 shipped (text/textarea on all
31 localized fields, richText via URL-nav tab pills); Steps 3+ deferred.
Owner: Daniil. Follow-up to `PAYLOAD_POLISH_PLAN.md` after Roman
dogfooded the shipped admin for ~4 days.

**Round-2 feedback (2026-05-18, after Steps 1 + 2 reached Roman):** four
new requirements landed. See **§Round-2 requirements** below — they
modify the next-session scope and override the original A.0 / A.4 +
Team-tab assumptions.

## Progress log

### 2026-05-18 — Steps 1 + 2 landed

**Step 1 — global mode toggle.**

- `components/admin/LocaleModeProvider.tsx` — `useSyncExternalStore` over
  `localStorage['boklanov.admin.localeMode']`. Persisted per-browser,
  cross-tab sync via the native `storage` event.
- `components/admin/LocaleModeToggle.tsx` — pill button mounted via
  `admin.components.actions`; flips global mode between `switch` and
  `all`. Label is RU-leaning (`Языки: вкладки` / `Языки: все сразу`).

**Step 2 — shadow data layer + per-field UX.**

- `components/admin/LocalizedDocContext.tsx` — shadow provider mounted
  via `admin.components.providers`. On mount fetches the doc with
  `?locale=all&depth=0`, holds `{ru, en, de}` per localized path.
  Inactive-locale edits → debounced (1500 ms) PATCH against
  `/api/<entity>/<id>?locale=<X>`. `keepalive: true` PATCH on
  `beforeunload` so half-debounced edits survive a close.
- Endpoint resolution: `usePathname()` parses
  `/admin/collections/<slug>/<id>` or `/admin/globals/<slug>`. Not
  `useDocumentInfo()` — `admin.components.providers` mounts ABOVE the
  per-doc `DocumentInfoProvider`, so the hook returns empty there.
- Array-aware PATCH: `findArrayAncestor` + `projectToLocale` lift any
  edit inside an array (e.g. `media.gallery.0.caption`) to send the
  FULL array projected to the target locale. Single-row edits no
  longer destroy sibling rows.
- `components/admin/LocalizedTextLike.tsx` — shared body for the two
  text-shaped wrappers. Renders `switch` (tab strip) or `all`
  (3-column grid). Active locale (URL's `?locale=`) plumbs through
  `useField`; inactive locales plumb through the shadow context.
- `components/admin/LocalizedText.tsx` /
  `components/admin/LocalizedTextarea.tsx` — thin wrappers.
- `components/admin/LocalizedRichTextTabs.tsx` — mounted via
  `admin.components.Description` on every richText field. Renders 3
  pill buttons; non-active click calls
  `router.replace('?locale=X', { scroll: false })`. **In-place editing
  of inactive locales for richText is not in v1** (see Risk R1 +
  Remaining work below).
- Wiring done by
  [`scripts/wire-localized-fields.py`](./scripts/wire-localized-fields.py)
  — comment-aware brace matcher walks each config and injects
  `admin.components.{Field,Description}` refs. Idempotent; safe to
  re-run when new localized fields are added. 31/31 localized fields
  covered on the first clean run:
  - Productions: 23 (text + richText, top-level + array-nested:
    gallery, awards, festivals, press, tour, runs, externalLinks)
  - About: 7 (body richText + timeline/marginalia text rows)
  - Contact: 1 (`intro` textarea)

**Bugs surfaced and fixed during Step 2.**

- Non-default locale tabs showed blank inputs (real values existed in
  DB). Root cause: `useDocumentInfo()` in `admin.components.providers`
  returns defaults → endpoint null → fetch never fired. Fix: parse the
  endpoint from `usePathname()`.
- React `borderBottomColor` shorthand-mixing warning on every tab
  click. Fix: rewrote `tabBaseStyle` / `tabActiveStyle` using only
  longhand border props.

**Verified clean.** `npx tsc --noEmit`, `npx eslint`,
`npx prettier --write`, `npm run payload:generate:importmap`,
`npm run dev` boot, `GET /admin/login` → 200,
`GET /admin/collections/productions/54` → 200.

### 2026-05-18 — Round-2 wave R2-1…R2-5 landed

All four Round-2 requirements shipped in a single follow-up session.

**R2-1 — 4-pill tab strip (`RU · EN · DE · ALL`).**

- `components/admin/LocalizedTextLike.tsx` — local `activeTab`
  `useState` removed. Active tab now binds directly to URL `?locale=`
  via `useLocale().code`. New `onPillClick`: locale pills set mode to
  `switch` + `router.replace('?locale=X', { scroll: false })`; `ALL`
  sets mode to `all`. Same `pillStrip` renders in both modes.
- `components/admin/LocalizedRichTextTabs.tsx` — same 4-pill control
  in the richText description slot; richText still single-Lexical
  per field in `all` mode (see Carry-overs §5 below for the
  triple-Lexical work).
- `components/admin/LocaleModeToggle.tsx` — **deleted**.
- `payload.config.ts` — `admin.components.actions` dropped; comment
  block updated.
- Decision on global-vs-per-field state (open question in R1):
  shipped as **page-global**. State still lives in
  `LocaleModeContext` + URL, so flipping any field's `ALL` flips
  every field and clicking `EN` on one field activates EN
  page-wide. Single-locale-per-field is not blocked from being
  added later, but day-one data says editors think in
  "I'm working in EN now," not per-field-mixed.

**R2-2 — Wiring audit closed one gap.**

- Coverage was actually 32 localized fields (the previous 31/31
  claim missed a comment-string false positive). Real gap:
  `collections/Media.ts:alt`. Added the
  `admin.components.Field: '/components/admin/LocalizedText#default'`
  ref. New total: 32/32.
- `production.premiereDate` already had the ref. Roman's "Год
  премьеры feels missing" reads as visual-prominence — R2-1's
  unmistakable 4-pill strip directly above the input fixes it
  without any wiring change.

**R2-3 — Inline-richText feature trim.**

- New module-local `INLINE_ONLY_DROP_FEATURES` constant in
  `collections/Productions.ts` listing the ten block-shaped feature
  keys to strip: `heading`, `align`, `indent`, `unorderedList`,
  `orderedList`, `checklist`, `relationship`, `blockquote`, `upload`,
  `horizontalRule`.
- Applied to `tagline`, `synopsis`, `directorsNote`. `identity.body`
  untouched (keeps `+` + fixed toolbar).
- Feature keys captured by reading
  `node_modules/@payloadcms/richtext-lexical/dist/lexical/config/server/default.js`
  rather than the dev-console approach noted in §B.1 — same result,
  no dev round-trip needed.

**R2-4 — Visible borders + toolbar density CSS.**

- `app/(payload)/custom.scss` gained a Lexical-polish block:
  - `.rich-text-lexical` gets a 1 px border, 4 px radius, and
    `--theme-input-bg` background; focus-within bumps the border
    to `--theme-elevation-400`. Light + dark covered via theme
    elevation vars.
  - `.rich-text-lexical:not(.rich-text-lexical--show-gutter)` adds
    inner padding so the bordered shell sits flush around the
    text (belt-and-braces — the inline-only fields already lack the
    gutter modifier after R2-3, this rule just keeps the visual
    correct even if some future default brings the gutter back).
  - `.fixed-toolbar` density tightened to 4/6 px padding and 28 px
    buttons on `identity.body`.
- Class hooks (`rich-text-lexical`,
  `rich-text-lexical--show-gutter`, `fixed-toolbar`) confirmed
  against `@payloadcms/richtext-lexical/dist/field/bundled.css` —
  if a future Payload upgrade renames them, that file is the
  reference (Risk R4).

**R2-5 — Команда tab via Option B (conditional show/hide).**

- New `components/admin/ActiveLocaleBodyAttr.tsx` provider
  reads `?locale=` from `useSearchParams()` and mirrors it to
  `document.body.dataset.activeLocale` via `useEffect`. Mounted in
  `admin.components.providers` after `LocalizedDocContext`.
- `creditsRu / creditsEn / creditsDe` arrays got
  `admin.className: 'team-credits-locale team-credits-locale--{ru|en|de}'`.
- `custom.scss` rules:
  `body[data-locale-mode='switch'][data-active-locale='X'] .team-credits-locale--Y { display: none }`
  for the two non-matching arrays per locale. `all` mode shows all
  three (the default — no rules hide anything).
- Tab description rewritten in RU + EN to explain the visibility
  model.
- Option A (unify into one localized array) parked as a future
  migration if Roman confirms credit sets are always parallel
  across locales. Not blocking — Option B is zero-migration and
  fully reversible.

**Verified clean.**
`npx tsc --noEmit`, `npx eslint`, `npx prettier --write`,
`npm run payload:generate:importmap`,
`npm run dev` ready in 1.8 s, `GET /admin/login` → 200,
`GET /admin/collections/productions` → 200,
`GET /admin/collections/productions/54?locale=en` → 200.
No runtime errors in the log (pre-existing "no email adapter" warning
only).

## Remaining work (next session)

R2-1…R2-5 landed (see Progress log §2026-05-18 Round-2). What's left
from the original Remaining-work list:

1. **RichText `Языки: все сразу` (show-all) mode.** When the `ALL`
   pill is active, richText fields should render **three editable
   locale columns** simultaneously. Risk R1 still applies (15
   Lexical instances on a loaded Production). Plan of attack
   unchanged:
   - Build a minimal Lexical wrapper that reads/writes the shadow
     `LocalizedDocContext` for inactive locales, mirroring the feature
     set declared in each field's `editor: lexicalEditor({...})`.
     Alternative: short-circuit to **2 read-only HTML previews +
     1 active editor** in `all` mode, then enable real triple-edit
     only on explicit per-field opt-in.
   - Verify Lexical state shape (`SerializedEditorState`) round-trips
     correctly through the PATCH path that currently only handles
     plain strings — `LocalizedTextLike` writes strings; richText
     writes JSON objects.
2. **Part A.4 — hide global `.localizer`.** Deferred until after
   richText show-all lands, since right now the global selector is
   still the only way to edit inactive-locale richText.
3. **Команда — Option A migration (optional).** If Roman confirms
   credit sets are always parallel across locales, convert
   `team.creditsRu/En/De` to a single `team.credits` array with
   `localized: true` on `role` + `name`. Otherwise Option B (R2-5)
   is the steady state.

## Architecture note (2026-05-18, post-Step-2 investigation)

Step 2 investigation found that **Payload's form state is single-locale**
— `@payloadcms/ui/dist/forms/fieldSchemasToFormState/index.js:39` keys
all fields by their flat path (`identity.title`) using the current
`req.locale` from the URL. There is no `fields['identity.title.en']`.
This invalidates the original `useField({ path: \`${path}.${locale}\` })`
approach.

User direction: pursue full per-field locale editing anyway ("Option
2"). Architecture chosen:

- **Shadow data layer** via `LocalizedDocContext`: fetches the doc
  with `?locale=all` on mount; holds `{ ru, en, de }` per localized
  path; flushes inactive-locale edits to REST `PATCH …?locale=X` on a
  500 ms debounce (and synchronously on tab switch + page unload).
- **Active locale stays on Payload's rails**: the locale that owns
  `?locale=` in the URL keeps the normal form-state + draft + Save
  flow. We don't replace the SaveButton or hook `onSubmit`.
- **Two render modes** (from §A.0, unchanged): `switch` shows a tab
  strip with one input bound to active locale; `all` shows three
  inputs (active locale via Payload form state, inactive locales via
  the shadow context).

Trade-offs accepted: 500 ms data-loss window on hard browser close;
inactive-locale validation happens server-side only (we don't run
Payload's client validators against the shadow state); live preview
still follows the URL's `?locale=`. All revisitable.

**Scope reminder**: this plan operates **exclusively inside Payload 3
CMS**. Keystatic is gone (`PAYLOAD_POLISH_PLAN.md §6.2A/B`); any
Keystatic reference below is inspiration only — we do not port code,
restore configs, or reintroduce Keystatic UX patterns 1:1. The
side-by-side 3-locale layout idea, in particular, is borrowed as a
visual reference for **show-all mode** (§A.0 / §A.1), not as a code
port.

## Round-2 requirements (2026-05-18)

After Steps 1 + 2 reached Roman, four issues landed. Treat these as the
**authoritative scope for the next session**; they override matching
parts of §A.0, §A.4, and the original Execution-order table.

### R1. Move the locale toggle into the field tab strip

**Today.** A single `LocaleModeToggle` pill sits in the admin header
(`admin.components.actions`) and flips a global context between
`switch` and `all`. Field tab strips show `RU · EN · DE`.

**Wanted.** No header pill. Every field's tab strip becomes a
**4-state segmented control**: `RU · EN · DE · ALL`. `ALL` is the
4th pill; clicking it expands the field into the 3-column grid mode.

**Behaviour.**

- `RU` / `EN` / `DE` → field renders only that locale's input
  (`switch` mode, that locale active).
- `ALL` → field renders all three locales side-by-side
  (`all` mode).
- The control is **per-field-visible but page-global in state**:
  state still lives in `LocaleModeContext` + active-locale URL, so
  flipping one field's tab strip to `ALL` flips every field on the
  page to `ALL`, and clicking `EN` on one field also makes `EN` the
  active locale for every other field (and the URL's `?locale=`).
  Rationale: editors think in "I'm working in EN now" not "I'm
  working in EN on this one field but RU on the next" — and the
  shadow context already PATCHes inactive locales transparently, so
  there's no productivity loss from page-global state.
- **Open question** (defer to implementation): should `ALL` be
  per-field instead? Trade-off documented inline with the
  implementer's first-draft prototype; default ships as page-global
  unless the prototype shows it's clearly worse.

**Removal.** Delete `components/admin/LocaleModeToggle.tsx` and its
entry in `admin.components.actions`. The component code that lives in
the tab strip moves into `LocalizedTextLike` (or a sibling shared
file) since text/textarea/richText all need the same 4-state strip.

**Visual contract.** Pills sit on a single row directly above the
input. Active pill uses the same active style today's `RU`/`EN`/`DE`
pills use; `ALL` is visually a peer (no separator, no different
weight). `ALL` shows the same dirty-dot affordance as the locale
pills (dot if **any** locale on this field is dirty).

### R2. Every localized field must show the tab strip

Step 2 claimed 31/31 coverage via `scripts/wire-localized-fields.py`.
Roman flagged at least one field where the switcher feels missing.
He cited "Год премьеры", which is actually two adjacent fields:

- `production.premiereDate` — `type: 'text'`, `localized: true`
  (label "Дата премьеры"). **Should** have the tab strip.
- `production.premiereYear` — `type: 'number'`, **not** localized
  (label "Год премьеры"). Should **not** have a tab strip — the year
  is shared across locales.

Two possibilities for the bug:

1. `premiereDate` did get the `admin.components.Field` ref but the
   visual is so adjacent to the unlocalized `premiereYear` row that
   Roman read "the switcher is missing on this group". Fix is layout
   polish, not wiring.
2. The wiring script's brace-matcher missed `premiereDate` (or
   another field) on first run. Fix is to re-run the audit and patch
   the gap.

**Action for next session.**

- Diff `grep -nE 'localized:\s*true' collections/Productions.ts
globals/About.ts globals/Contact.ts collections/Media.ts` against
  the set of fields that today resolve to a `LocalizedText` /
  `LocalizedTextarea` / `LocalizedRichTextTabs` ref. Any localized
  field without a ref is a wiring bug — fix the script or hand-patch.
- For `premiereDate` specifically: confirm `admin.components.Field`
  is set; if yes, the issue is visual prominence — verify the new
  4-pill tab strip is unmistakably present above the input.

### R3. Field chrome for inline-only richText

Three richText fields use `InlineToolbarFeature` only — they're
not block editors. They must look like normal bordered text fields.

- `identity.tagline` ("Подзаголовок")
- `identity.synopsis` ("Синопсис")
- `identity.directorsNote` ("Записка режиссёра")

**Required visual after this wave.**

- Visible 1 px border around the editor (light + dark theme).
- **No** `+` block-insert glyph on the left gutter.
- **No** `+` row / floating actions at the bottom.
- The fixed inline toolbar (bold / italic / link / strike) is fine;
  keep it.

`identity.body` ("Полный текст") is **exempt** — it's the long-form
editorial body and keeps `+` + block insert + horizontal rules etc.

**Implementation** = Part B.1 + B.2 already drafted in this doc.
Two refinements:

- Before committing the `f.key` filter list, do the one-time
  `console.log(defaultFeatures.map(f => f.key))` capture noted in
  §B.1 so we drop the right defaults rather than guessing.
- B.2 selectors are best-guess against Payload 3.x; verify in
  DevTools on first dev boot (Risk R4) and pin under one
  Payload-class block in `app/(payload)/custom.scss`.

### R4. Reconcile the `Команда` (Team) tab

`collections/Productions.ts:826–936` models team credits as **three
parallel arrays**:

```text
team: {
  creditsRu: [{ role, name, url }, …],
  creditsEn: [{ role, name, url }, …],
  creditsDe: [{ role, name, url }, …],
}
```

None of these are `localized: true`. The pattern predates the
per-field locale UX and now violates the principle stated in
§Goals.1: "Editing any localized field across RU / EN / DE must be
possible from inside the field itself." Team rows can't be — they
live in different arrays. Switching the active locale doesn't hide
the wrong-language array, and the new `ALL` mode has nothing to
expand because there's no locale axis on the array.

Three possible exits (pick one in next-session prep):

**Option A — Unify into one localized array.** Convert to a single
`team.credits` array with `role` + `name` `localized: true`. Pros:
matches the rest of the admin; the `RU · EN · DE · ALL` strip works
out of the box on `role` and `name`; row count is constant across
locales (a "Director" row is the same person in every language).
Cons: requires a one-time data migration that interleaves the three
arrays into a single ordered list. Order-matching across locales is
manual (which RU row is the EN translation of which?). Editors lose
the ability to have a different **set** of credits per locale (if
that's ever wanted, which Roman has not asked for).

**Option B — Keep three arrays but conditionally hide two.** Show
only `creditsRu` when active locale is RU, only `creditsEn` when EN,
etc. Use the same `LocaleModeContext` to drive `admin.condition` on
each array. `ALL` mode shows all three side-by-side in a 3-column
grid (which is roughly what the tab already does — but now governed
by the field-level pills instead of being always-visible).
Pros: zero data migration. Cons: still three independent arrays
under the hood; adding a credit in RU doesn't auto-add a row in EN.

**Option C — Leave it as-is and document the exception.** Keep the
3-array model; add a banner at the top of the Команда tab
explaining "Команда — три параллельных списка, не локализованное
поле; переключатель языков сверху работает на остальных вкладках".
Pros: zero work. Cons: leaks implementation, contradicts §Goals.1.

**Recommendation: Option A** if Roman confirms row sets are always
parallel across locales (i.e., the credits list doesn't differ in
membership across languages, only in spelling). Confirm with Roman
before writing the migration. If Roman wants the freedom to add a
credit in one locale that doesn't exist in others, fall back to
Option B.

### Execution order — Round-2

Replaces the original §Execution-order table for the next session.

| Step | What                                                                                                                                          | Est. time |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| R2-1 | Refactor `LocalizedTextLike` tab strip into a 4-pill segmented control (`RU · EN · DE · ALL`). Delete `LocaleModeToggle`.                     | 1 h       |
| R2-2 | Re-run wiring audit; diff localized-field inventory against `admin.components.Field` refs; fix any gap (incl. `premiereDate`).                | 30 m      |
| R2-3 | B.1 inline-richText feature trim — capture `defaultFeatures.map(f => f.key)` once, commit filter list for tagline + synopsis + directorsNote. | 45 m      |
| R2-4 | B.2 visible borders + B.3 toolbar density in `app/(payload)/custom.scss`; verify selectors against DevTools first.                            | 45 m      |
| R2-5 | Decision: Option A / B / C on `Команда`. If A: write migration `scripts/migrate-team-to-localized.ts`. If B: condition flips.                 | 1.5 – 3 h |
| R2-6 | Smoke test all four waves on a live Production; record before/after screenshots in `.design/review/`.                                         | 45 m      |

**Total estimate: 5 – 7 h.** Carry-over items (richText show-all,
hide `.localizer`) follow in a subsequent session.

## Why this plan exists

`PAYLOAD_POLISH_PLAN.md §2.2` explicitly accepted Path 1 — Payload's
global locale switcher in the header — over Path 2 (custom per-field
locale UI). After live editor use Roman + Daniil reversed that call:

> "we want to be able to edit text on any images in at least 3 languages
> EN/DE/RU. Right now for that we must change `Локаль: Deutsch` on the
> top-right corner of the page — this is extremely uncomfortable. We
> need to be able to switch language on every field OR/AND see/edit all
> languages for the same field at the same time."

Second issue, same dogfood pass:

> "we need clean and clear design of fields. Now many fields like
> Подзаголовок do not have borders, but have some `+` on the left and on
> the bottom of fields."

That second point is the Lexical richText editor leaking BlockInsert
glyphs and missing a container shell. Both are admin-side polish; no
storage shape changes, no Postgres migration.

## Goals

1. Editing any `localized: true` field across **RU / EN / DE** must be
   possible from inside the field itself — no header-level locale flip,
   no full-page reload, no scroll loss.
2. RichText fields (`identity.body`, `identity.tagline`,
   `identity.synopsis`, `identity.directorsNote`, About body) must look
   like first-class form inputs: visible border, no stray `+` glyphs on
   fields that only support inline formatting.

## Non-goals

- Bulk translate UX ("AI translate from RU" per field). Captured in
  follow-ups; not in this plan.
- Live-preview pane locale binding. Currently keyed off the global
  selector; if we hide that selector the preview pane needs its own
  locale dropdown. Tracked as **Risk R3** below.
- `payload-types.ts` regeneration. Storage shape unchanged; types stay.
- Wider admin theming, sidebar restructuring, wordmark swap — all
  remain out of scope per `PAYLOAD_MIGRATION_PLAN.md §10`.

---

## Part A — Per-field locale switching

### A.0 Design — both modes, user-toggleable

User requirement (2026-05-18): "we want to switch between languages OR
show them all". So A1 is **not** a single UX — it's two modes that
share the same wrapper component, with the editor choosing which one
to use:

| Mode                | UX                                                                                                                     | Best for                                                                                | When to use                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Switch** (tabs)   | A 3-tab strip (`RU · EN · DE`) above each localized field; active tab edits that locale, others are hidden.            | RichText fields (heavy editors), the Productions form as a whole (least scroll-weight). | Default. One editor instance per richText field → cheap.                               |
| **Show-all** (grid) | Three inputs side-by-side in a `[1fr 1fr 1fr]` (or `[2fr 1fr 1fr]` with RU dominant) grid; all three editable at once. | Short text fields (titles, captions, city names) and quick proofreading sweeps.         | Optional — editor opt-in per session via a top-of-form toggle, OR per field if needed. |

Both modes are powered by the same `LocalizedField` wrapper — only the
render branch differs. The wrapper exposes a `mode: 'switch' | 'all'`
prop with a default fed by editor preference (stored in
`localStorage`, key `boklanov.admin.localeMode`, so the choice
persists between sessions but is per-browser).

**Global toggle**: a small two-state button in the admin header (or
above the tab strip on each doc) flips every `LocalizedField` on the
page between `switch` and `all`. Cheap because the wrapper already
manages its own subtree; flipping a top-level React context updates
all instances.

**Per-field override** (optional, ship later if Roman asks): an icon
button on the tab strip lets a single field opt into the other mode
without changing the global setting. Not in v1.

**Decision: ship both modes from day one.** Switch is the default
(perf-safe). Show-all is one click away. RichText fields force
`switch` mode unless the editor explicitly forces `all` — see Risk
R1.

### A.1 Component: `components/admin/LocalizedField.tsx`

Generic wrapper. One file, ~160 LoC. Responsibilities:

- Read locale list from `useConfig()` (`config.localization.locales`) so
  adding a 4th locale later is automatic; fall back to the hardcoded
  `['ru','en','de']` if `useConfig` is not stable on the field-level
  client.
- Read `mode` from a React context (`LocaleModeContext`, value `'switch'
| 'all'`) provided high in the admin tree by a small client-only
  provider mounted from `app/(payload)/layout.tsx`. The provider seeds
  itself from `localStorage` and exposes a setter the toolbar toggle
  uses.
- **In `switch` mode**: render a tab strip styled with Payload's own
  `.tabs-field__tab*` SCSS classes (no custom design system). Hold
  `activeLocale` in local component state — per-field, not synced
  across fields. Roman scrolls down, the tagline can be on EN while
  the synopsis is still on RU. That's the whole point.
- **In `all` mode**: render a horizontal grid with the three inputs
  side-by-side, each labelled with its locale code in a small chip
  above the input. Mobile/narrow-admin (< 900 px) collapses to a
  vertical stack with bold locale headings — never tries to keep three
  columns at narrow widths.
- Show a small empty/dirty dot in both modes (tab badge in `switch`,
  inline chip dot in `all`) for any locale whose value is `''`/`null`
  or differs from saved.
- Compose the underlying default field component (passed as a render
  prop or child) bound through `useField({ path: `${path}.${locale}` })`.
- **RichText-specific override**: `LocalizedRichText` forces `switch`
  mode regardless of context (per Risk R1) — three Lexical instances
  mounted at once is a perf cliff on the heavy Productions edit page.
  An explicit prop `allowShowAll={true}` lets editors opt back in for
  a short field if they really want to (default false).
- For richText in `switch` mode: **only mount the Lexical instance for
  the active locale**. Other locales keep their value in form state
  but render as nothing (or a static `<div>` preview). Switching tabs
  commits the previous editor's state to form state before unmounting.

### A.2 Three thin wrappers

One file each, ~15–30 LoC, all delegate to `LocalizedField`:

- `components/admin/LocalizedText.tsx` — wraps `TextField`
- `components/admin/LocalizedTextarea.tsx` — wraps `TextareaField`
- `components/admin/LocalizedRichText.tsx` — wraps `RichTextField`

### A.3 Wiring

Set `admin.components.Field` on every `localized: true` field. Full
inventory (audit before coding — counts taken from current
`collections/Productions.ts`, `globals/About.ts`, `globals/Contact.ts`,
`collections/Media.ts`):

**Productions** (≈18 localized fields):

- `identity.title` (text)
- `identity.body`, `identity.tagline`, `identity.synopsis`,
  `identity.directorsNote` (richText × 4)
- `production.premiereDate` (text)
- `production.theatre.name`, `production.theatre.shortName`,
  `production.theatre.city` (text × 3)
- `media.gallery[].caption` (text, inside array)
- `recognition.awards[].name`, `.category`, `.city` (text × 3, inside array)
- `recognition.festivals[].name`, `.category`, `.city` (text × 3, inside array)
- `recognition.press[].title` (text, inside array)
- `recognition.externalLinks[].label` (text, inside array)
- `history.tour[].city` (text, inside array)
- `history.runs[].venue`, `.city`, `.count` (text × 3, inside array)
- `settings.bookingCtaLabel` (text)

**Media**: `alt` (if `localized: true` — verify).

**Globals**: every localized field in `globals/About.ts` and
`globals/Contact.ts` — to be enumerated during step 2.

> Array-row localized fields (`gallery[].caption`, `awards[].name`,
> etc.) are the high-risk part of the rollout — `useField` path
> semantics inside `arrayField.fields[].field` need verification on
> the prototype before mass rollout. See **Risk R2**.

### A.4 Hide the header LocaleSelector

CSS-only, reversible:

```scss
// app/(payload)/custom.scss
.localizer {
  display: none;
}
```

Recommended over `admin.components.actions = []` because:

- it's reversible by Roman (he can re-enable in DevTools to debug);
- it doesn't fight Payload's React component graph;
- if Path A1 has a regression we can ship a one-line revert.

Re-evaluate after a week of Roman's use — if A1 holds up, also drop
the `<LocaleSelector>` from `admin.components` properly.

---

## Part B — Field chrome polish

### B.1 Remove orphan `+` glyphs from inline-only richText

`identity.tagline`, `identity.synopsis`, `identity.directorsNote` only
enable `InlineToolbarFeature` in the current config. The `+` glyph on
the empty-line gutter and most of the bottom toolbar come from
`defaultFeatures` — `HeadingFeature`, `BlockquoteFeature`,
`HorizontalRuleFeature`, `UnorderedListFeature`, `OrderedListFeature`,
`ChecklistFeature`, `UploadFeature`, `BlocksFeature`,
`RelationshipFeature`. None of those are appropriate for a tagline.

Edit in `collections/Productions.ts` for each inline-only richText
field:

```ts
editor: lexicalEditor({
  features: ({ defaultFeatures }) =>
    defaultFeatures
      .filter(
        (f) =>
          ![
            'heading',
            'blockquote',
            'horizontalRule',
            'unorderedList',
            'orderedList',
            'checklist',
            'upload',
            'blocks',
            'relationship'
          ].includes(f.key)
      )
      .concat([InlineToolbarFeature()])
})
```

> The `f.key` values above are inferred. **Action: console.log
> `defaultFeatures.map(f => f.key)` in dev once, capture the actual
> keys, and commit the filter list.**

For `identity.body` (full editorial body) keep the existing features —
`+` is legitimate there.

### B.2 Visible borders on richText (Lexical)

`app/(payload)/custom.scss` add:

```scss
.rich-text-lexical {
  border: 1px solid var(--theme-elevation-150);
  border-radius: 4px;
  padding: 8px 12px;
  transition: border-color 120ms ease;
}

.rich-text-lexical:focus-within {
  border-color: var(--theme-elevation-400);
}

.field-type:has(> .rich-text-lexical) > label {
  margin-bottom: 6px;
}
```

Uses `--theme-elevation-*` so light + dark mode both work. Verify
selector matches the actual rendered class (Payload 3 emits
`.rich-text-lexical` for the Lexical field — confirm in DevTools on
first dev boot; selectors may have prefixes like `.field-type__`).

### B.3 Tighten fixed toolbar density

For `identity.body` only (the one field that keeps
`FixedToolbarFeature`):

```scss
.rich-text-lexical .toolbar-fixed {
  padding: 4px 6px;
  gap: 4px;
}

.rich-text-lexical .toolbar-fixed button {
  width: 28px;
  height: 28px;
}
```

Cuts ~20 px of toolbar height per richText, ~80 px on a Productions
edit form.

---

## Execution order

| Step | What                                                                                                                                                        | Est. time |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1    | Build `LocaleModeContext` + provider + localStorage seed; mount in `app/(payload)/layout.tsx`. Add header toggle button (`Switch` / `Show all`).            | 45 m      |
| 2    | Prototype `LocalizedField` + `LocalizedText` (both modes) on `identity.title` only. Verify `useField` locale path semantics.                                | 1.5 h     |
| 3    | Enumerate every `localized: true` field in the four config files; write the inventory back into this doc as §A.3.                                           | 30 m      |
| 4    | Build `LocalizedTextarea` (both modes) and `LocalizedRichText` (switch mode default, `allowShowAll` opt-in). Validate on `identity.body` (heaviest field).  | 2 h       |
| 5    | Wire `admin.components.Field` across the full inventory.                                                                                                    | 2 h       |
| 6    | B.1 inline-richText feature trim — log `f.key` values, commit filter.                                                                                       | 30 m      |
| 7    | B.2 + B.3 SCSS polish in `custom.scss`.                                                                                                                     | 30 m      |
| 8    | A.4 hide `.localizer` in `custom.scss`.                                                                                                                     | 5 m       |
| 9    | Smoke test: edit one Production, About, Contact end-to-end in all three locales **in both modes**; verify save round-trip; verify localStorage persistence. | 1 h       |

**Total estimate: ~9 h** of focused work, single PR.

Atomic commits per step so any single step can be reverted independently.

---

## Risks

### R1. Lexical perf with three locale instances per richText field

A naive show-all implementation would mount 3 Lexical editors per
richText field × 5 richText fields = 15 editors on the Productions
edit page. Two-layer mitigation per §A.0 / §A.1:

1. `LocalizedRichText` **forces `switch` mode** regardless of the
   global mode setting unless an explicit `allowShowAll` prop is
   present. So flipping the global toggle to "show all" affects only
   text/textarea fields by default — richText stays tabbed.
2. Even in `switch` mode, only the active-locale Lexical instance is
   mounted; the other two locales hold their value in form state
   without an editor instance.

Verify before rollout that switching tabs commits the previous
editor's state into form state before unmounting.

### R2. `useField` path semantics for nested array localized fields

`gallery[].caption` is the trickiest case — it's a `localized: true`
field inside a `type: 'array'`. Payload 3's per-row `path` already
includes the array index (`media.gallery.0.caption`); the locale
suffix needs to slot on top
(`media.gallery.0.caption.en`). **Action**: validate this on the
prototype in step 1 _with one array-nested field_ before declaring A1
viable. If the path API doesn't support locale suffix mid-path, fall
back to using Payload's `data.media.gallery[i].caption.en` form-state
mutation API or rework the wrapper to use `useFormFields` directly.

### R3. Live-preview locale binding regression

Productions + About currently use `admin.livePreview.url({ locale })`,
which reads the _global_ locale selector (`.localizer`). If we hide
that selector (§A.4) the preview pane will always render the default
locale (`ru`). Mitigations:

- **Acceptable**: live preview shows RU only; per-field tabs let Roman
  edit EN/DE but the preview pane defaults to RU. Reasonable —
  preview was never trilingual in keystatic either.
- **Better**: add a small locale dropdown to the live-preview pane
  itself (Payload exposes `admin.livePreview.url` so we can read a
  separate state for it). Tracked as a follow-up, not in this plan.

Decision: ship the acceptable behavior; capture the follow-up in the
shipping commit.

### R4. CSS selector drift across Payload versions

`.rich-text-lexical`, `.localizer`, `.tabs-field__tab*` are
unprefixed Payload admin classes. They could rename in a future
`@payloadcms/next` minor. Pin selectors in one block in `custom.scss`
with a comment pointing here so future-Daniil notices when a Payload
upgrade breaks the polish.

---

## What "done" looks like

Roman, on a Production edit page:

1. Sees no `Локаль: Deutsch` selector in the header.
2. Sees a `Switch | Show all` toggle near the top of the form.
3. **Switch mode (default)**: every localized field shows a `RU · EN · DE`
   tab strip above it. Tab strip on `identity.tagline` defaults to RU;
   clicking `DE` switches **only that field** to German — scroll
   position unchanged, other fields unchanged.
4. **Show-all mode**: every localized text/textarea field renders as
   three side-by-side inputs (RU, EN, DE), all editable at once.
   RichText fields stay tabbed (perf — Risk R1) unless an explicit
   per-field override is set.
5. The mode choice persists between sessions (localStorage).
6. `identity.tagline` has a visible border and **no** stray `+` icons
   on the left margin or bottom — just the inline formatting toolbar
   (bold / italic / link / strike).
7. `identity.body` keeps its `+` block-insert button and fixed
   toolbar, but the toolbar is denser and the editor has the same
   bordered shell.
8. Save round-trips correctly: RU stays RU, EN stays EN, DE stays DE
   in Postgres + R2-cached preview.

---

## Follow-ups (not in this plan)

- Per-pane live-preview locale dropdown (Risk R3 mitigation).
- "AI translate from RU" button per localized field, wired to the
  existing `scripts/translate-content.ts` flow.
- Empty-state hinting: localized fields that are non-empty in RU but
  blank in EN/DE could show a faint "translate me" affordance on those
  tabs. Adjacent to the dirty/empty dot from §A.1.
- Drop `<LocaleSelector>` from `admin.components` properly once A1 is
  stable for a week (currently just CSS-hidden — §A.4).
