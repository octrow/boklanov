# PAYLOAD_RICHTEXT_LOCALE_DEBUG

Status: **Closed 2026-05-18** — Round-4 wave landed; root cause was
H1 (the R3-5 hide-CSS rule kept the standard Lexical editor hidden
when `localStorage.localeMode` persisted as `'all'`, surfacing as
"main field empty BUT we have data"). Fix: drop the hide rule and
only render the two INACTIVE-locale textareas in ALL mode — the
active locale stays in the standard Lexical editor below the
pillstrip, always visible, always reading from form state.
See PAYLOAD_ADMIN_UX_PLAN.md §Round-4 entry for the shipped log.

---

## Original brief (preserved for archaeology)

Sibling of
[`PAYLOAD_ADMIN_UX_PLAN.md`](./PAYLOAD_ADMIN_UX_PLAN.md), which holds
the high-level plan + the Round-2/Round-3 shipped log. This file
was the **deep-dive ticket** for the bug Roman hit:
fields looked empty when there WAS data, and the multi-locale UX
still misbehaved in subtle ways.

The reason for splitting: `PAYLOAD_ADMIN_UX_PLAN.md` is now 700+ lines
of plan + progress log. Future-me reading that doc cold can't tell
"what is the current open bug?" from "what was shipped 3 waves ago?".
This file is short, focused, and survives until the bug is closed.

---

## The bug

Roman, dogfooding `feature/payloadcms` on Vercel preview
(`https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app/admin/collections/productions/5?locale=ru`):

> we still have MANY issue (main field is empty BUT we have data)

Severity: **blocking**. If the main editor shows empty when Postgres
has content, the editor cannot trust what they see and the migration
isn't ready for daily use.

Round-2 / Round-3 shipped the 4-pill `RU·EN·DE·ALL` control, moved
pills above richText, and made ALL-mode columns editable as plain-text
textareas. The remaining issues live in the **switch-mode** view of
richText: the single Lexical editor that's supposed to bind to the
URL's `?locale=`.

Roman's exact complaints from the latest review (no screenshot file
yet — request one when picking this up):

- "main field is empty BUT we have data" — Lexical editor under
  `Полный текст` / `Подзаголовок` / `Синопсис` / `Записка режиссёра`
  shows the empty placeholder ("Начните печатать или нажмите '/' для
  команд...") even though the API returns content for that locale.

Carry-over from Round-3 that may be related:

- Switching a single locale via the pill takes ~5 s (router.replace
  triggers a full server-side doc refetch). Acceptable today but
  worth re-checking if it's now even slower because of the custom
  components.

---

## What we've tried (chronological — read this BEFORE retrying)

Each row = one commit on `feature/payloadcms`. Don't re-attempt
solutions in the "what failed" column without reading why first.

| When       | Commit    | What we tried                                                                                                                                                                                                                                                                                      | Result                                                                                                                 |
| ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 2026-05-18 | (earlier) | Shadow `LocalizedDocContext` provider + per-field `LocalizedTextLike` for text/textarea. Active-locale routes via `useField`, inactive via PATCH.                                                                                                                                                  | ✅ Works for text/textarea. Save commits URL locale; debounced PATCH commits others.                                   |
| 2026-05-18 | (earlier) | `LocalizedRichTextTabs` in `Description` slot — pills + URL nav.                                                                                                                                                                                                                                   | ⚠️ Pills sat BELOW editor (Description slot renders after editor — verified in `field/Field.js:178`).                  |
| 2026-05-18 | `1294ada` | Round-2 — 4-pill `RU·EN·DE·ALL` segmented control, deleted header `LocaleModeToggle`. Productions/About/Contact/Media wired to wrappers.                                                                                                                                                           | ✅ Pill control rendered. Roman flagged: locale pill switch ~5s; ALL mode richText still shows one Lexical, not three. |
| 2026-05-18 | `8147e9e` | Round-3 — moved richText pills from `Description` to `beforeInput` slot. Made text/textarea pill switching instant (local `selectedTab`, no router.replace). Added 3 read-only preview columns in ALL mode for richText. Bumped border `--theme-elevation-150→250`.                                | ⚠️ Pills now above (good). Text/textarea instant (good). Border visible (good). BUT read-only previews aren't useful.  |
| 2026-05-18 | `226bf57` | R3-5 — replaced read-only div previews with editable `<textarea>` rows. `stringToLexicalState` serializer converts textarea content into minimal Lexical doc. CSS rule `body[data-locale-mode='all'] .localized-rt-pillstrip ~ * { display: none }` hides the standard Lexical editor in ALL mode. | ⚠️ Editable textareas land but Roman now reports "main field empty BUT we have data" on switch-mode view.              |

Diagrammed differently — what is rendered where, today:

```
SWITCH mode (mode = 'switch'):
  +-----------------------------------------+
  |  Label: Полный текст — Русский          |   <- Payload default
  |  [RU][EN][DE][ALL]   pillstrip          |   <- beforeInput (our component)
  |  +---------------------------------+    |
  |  | toolbar (T▾  ≡  ▸  B I U ...)   |    |
  |  | placeholder/content              |    |   <- Payload's standard Lexical
  |  +---------------------------------+    |
  +-----------------------------------------+

ALL mode (mode = 'all'):
  +-----------------------------------------+
  |  Label: Полный текст — Русский          |   <- Payload default
  |  [RU][EN][DE][ALL]                      |   <- beforeInput pills
  |  RU   |    EN   |    DE                 |   <- beforeInput grid (3 textareas)
  |  [..] |   [..]  |   [..]                |
  |                                         |
  |  (standard Lexical: display: none)      |   <- CSS-hidden
  +-----------------------------------------+
```

---

## What we know (facts, not theories)

Anything in this section has been verified by reading the Payload 3
source. Don't accept a hypothesis that contradicts these.

### A. Payload's form state is single-locale

`node_modules/@payloadcms/ui/dist/forms/fieldSchemasToFormState/index.js:39`
keys form-state entries by the flat field path
(`identity.body`), using the **current request's locale** from the
URL. There is no `fields['identity.body.en']`. To read a non-active
locale's value, you must either:

- send a fresh API request with `?locale=X`, or
- have already fetched it (which is what `LocalizedDocContext` does
  by hitting `?locale=all` once on mount).

### B. richText admin slots

`node_modules/payload/dist/fields/config/types.d.ts:979`:

```ts
RichTextField.admin.components = {
  afterInput?: CustomComponent[]
  beforeInput?: CustomComponent[]
  Error?: CustomComponent
  Label?: CustomComponent
} & FieldAdmin['components']  // adds Cell, Description, Diff, Field, Filter
```

`node_modules/@payloadcms/richtext-lexical/dist/field/Field.js:155–184`
renders, in order: Label → ErrorBoundary{BeforeInput → BulkUploadProvider{LexicalProvider} → AfterInput} → RenderCustomComponent(Description) → Error. So `beforeInput` is the only slot above the editor that doesn't replace the editor.

### C. `admin.components.Field` is total replacement

`node_modules/@payloadcms/ui/dist/forms/RenderFields/RenderField.js:72-75`:

```js
if (CustomField !== undefined) {
  t2 = CustomField || null
  break bb0
}
```

If we set `admin.components.Field`, the standard editor + label + everything
is skipped. We have to render Label/Description/Error ourselves.

### D. `RenderLexical` exists but is experimental

`node_modules/@payloadcms/richtext-lexical/dist/field/RenderLexical/index.d.ts`:

```ts
RenderLexical: React.FC<
  {
    Loading?: React.ReactElement
    setValue?: FieldType<DefaultTypedEditorState | undefined>['setValue']
    value?: FieldType<DefaultTypedEditorState | undefined>['value']
  } & RenderFieldServerFnArgs<LexicalRichTextField>
>
```

`@experimental — may break in minor releases`. It uses a server
function `_internal_renderField` so each mount is a network round-trip
to fetch the field component. 3 instances × 4 richText fields = 12
server calls on first render. Not free.

### E. Lexical doesn't auto-sync to external value changes

When form state changes externally (e.g. our `useField.setValue` from
the textarea), the standard Lexical editor that's already mounted does
NOT pick up the new value. It only reads `value_0` once at mount.
Hence Round-3 R3-5's documented trade-off: "switching pills (which
navs the URL) forces a fresh mount that reads the saved value."

### F. Default Lexical features (the keys)

Captured from `node_modules/@payloadcms/richtext-lexical/dist/lexical/config/server/default.js`:

```
[bold, italic, underline, strikethrough, subscript, superscript,
 inlineCode, paragraph, heading, align, indent, unorderedList,
 orderedList, checklist, link, relationship, blockquote, upload,
 horizontalRule, toolbarInline]
```

`INLINE_ONLY_DROP_FEATURES` in `collections/Productions.ts:18-29`
strips the block-shaped ten for tagline/synopsis/directorsNote.

---

## Hypotheses for the current "empty Lexical" bug

Ordered by likelihood. Pick one, prove or disprove it FIRST, then move
to the next. Don't try multiple fixes at once — we've already burned
two rounds on overlapping changes.

### H1. The hide-CSS leaks into switch mode

**Claim**: Our rule
`body[data-locale-mode='all'] .localized-rt-pillstrip ~ * { display: none }`
should ONLY apply when `data-locale-mode='all'`. If the body attribute
is somehow stuck at `'all'` after the user clicks a locale pill — or
if `setMode('switch')` from our pill handler happens AFTER the
URL nav re-fetch — the standard Lexical comes back invisible.

**How to test**:

1. Open admin in dark mode, dev tools open.
2. Toggle to ALL mode, then click an EN pill on a richText field.
3. Inspect `<body>` — is `data-locale-mode='switch'`?
4. Inspect the richText editor — is it `display: none` from this rule?

If yes → bug. Fix: ensure `setMode('switch')` runs synchronously
before `router.replace`, OR scope the hide rule more tightly (e.g.
require an additional class on the pillstrip that's only present in
all-mode), OR drive visibility via React state instead of CSS.

### H2. Form state for the active locale never populates

**Claim**: Adding `useField<unknown>({ path })` inside the beforeInput
component might be reading form state too early — before Payload
has populated it from the server response. If `useField` returns
`undefined` and Lexical's `value_0` is also `undefined`, the editor
shows empty.

**How to test**:

1. Add a `console.log('[richtext]', path, activeValue)` at the top of
   `LocalizedRichTextTabs`.
2. Load `/admin/collections/productions/5?locale=ru`.
3. Look at the console — is `activeValue` populated by the second
   render? If always `undefined`, the form state isn't reaching us.

If yes → check whether the `beforeInput` server-render path is
passing `serverProps` that include the initial value. Look at
`@payloadcms/ui/dist/forms/fieldSchemasToFormState/renderField.js:243`
(captured earlier — beforeInput's `serverProps` go through
`RenderServerComponent`).

### H3. The `useField` hook in beforeInput races with Lexical's `onChange`

**Claim**: When the textarea calls `setActiveValue(stringToLexicalState(text))`
in ALL mode, the standard Lexical editor (still mounted but hidden)
might have its `onChange` fire afterwards and overwrite our edit with
Lexical's stale internal state — leaving form state EMPTY (matching
Lexical's initial empty state).

**How to test**:

1. Open admin at `?locale=ru`, switch to ALL mode.
2. Type "TEST" into the RU textarea.
3. Click Save. Watch the network tab for the PATCH/PUT body — what
   does the `identity.body.ru` field look like?
4. If it's an empty Lexical doc (paragraph with no text children),
   Lexical raced us.

If yes → either:

- Don't write through `useField` for the active locale in ALL mode;
  write through shadow PATCH like the inactive locales. Drawback:
  Save button doesn't light up.
- OR truly unmount Lexical in ALL mode (instead of CSS-hiding it).
  Drawback: more invasive — needs `admin.components.Field` rewrite.

### H4. The locale=all fetch returns a different shape than per-locale fetches

**Claim**: Payload's `?locale=all` response might wrap localized
richText values in some envelope our shadow context isn't handling.
Then `getRawValue(path)[locale]` returns an unexpected shape and the
textarea reads `''`.

**How to test**:

1. With the dev server running, hit
   `curl -s 'http://localhost:3019/api/productions/5?locale=all&depth=0' | jq '.identity.body'`
   (must be authenticated — use a cookie from the browser).
2. Compare with `curl -s '/api/productions/5?locale=ru' | jq '.identity.body'`.
3. Does the `?locale=all` response have the shape
   `{ru: {...lexicalState}, en: {...}, de: {...}}` or something else?

If different → fix `LocalizedDocContext.getRawValue` (and `getValue`)
to match the actual shape.

### H5. The body field on production id=5 is genuinely empty

**Claim**: Maybe `productions/5` doesn't have body content for the
locale being viewed. The migration script may have left some records
without a body. The bug then is "empty placeholder when DB has null"
which is correct behavior, just confusing.

**How to test**:

```sql
SELECT id, slug, identity_body, identity_body_en, identity_body_de
FROM productions WHERE id = 5;
```

(Verify column names match the actual schema — locale columns may be
`{field}_locale` or use Payload's `_locales` join table.)

If body is null in DB → check Roman: which production was he editing,
and does the public site show the body content there? If yes → the
public site reads from a different source. If no → the data really
isn't there and this isn't an editor bug.

---

## Reference: where to look

### Payload 3 docs (web)

- Custom field components: https://payloadcms.com/docs/custom-components/fields
- Field admin config (component slots — beforeInput, afterInput, Field, Label, Description):
  https://payloadcms.com/docs/admin/components#fields
- Localization: https://payloadcms.com/docs/configuration/localization
- Lexical rich text adapter: https://payloadcms.com/docs/rich-text/lexical
- Lexical custom features: https://payloadcms.com/docs/rich-text/lexical#features
- REST API + `?locale=` parameter: https://payloadcms.com/docs/rest-api/overview#endpoints

Use `mcp__context7__query-docs` with `library: 'payloadcms'` for
runtime-current docs when web fetch isn't available.

### Payload 3 source (local, version-pinned)

| Concern                                               | Path                                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Field type definitions (richText, admin slots)        | `node_modules/payload/dist/fields/config/types.d.ts`                              |
| richText Field component (the editor wrap)            | `node_modules/@payloadcms/richtext-lexical/dist/field/Field.js`                   |
| Default editor features list                          | `node_modules/@payloadcms/richtext-lexical/dist/lexical/config/server/default.js` |
| Per-feature `key:` values                             | `node_modules/@payloadcms/richtext-lexical/dist/features/*/server/index.js`       |
| `RenderLexical` programmatic editor mount             | `node_modules/@payloadcms/richtext-lexical/dist/field/RenderLexical/index.js`     |
| Client component for the editor (RichTextField)       | `node_modules/@payloadcms/richtext-lexical/dist/exports/client/Field-*.js`        |
| Form state schema → state translation (single-locale) | `node_modules/@payloadcms/ui/dist/forms/fieldSchemasToFormState/index.js`         |
| Custom Field replacement logic                        | `node_modules/@payloadcms/ui/dist/forms/RenderFields/RenderField.js`              |
| BeforeInput / AfterInput render path                  | `node_modules/@payloadcms/ui/dist/forms/fieldSchemasToFormState/renderField.js`   |
| Lexical CSS class hooks                               | `node_modules/@payloadcms/richtext-lexical/dist/field/bundled.css`                |
| `useField` hook                                       | `node_modules/@payloadcms/ui/dist/forms/Form/context.js` (search for `useField`)  |

### Our code

| Component                                                                                        | Role                                                                                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`components/admin/LocaleModeProvider.tsx`](../../components/admin/LocaleModeProvider.tsx)       | localStorage-backed `mode: 'switch' \| 'all'` context. Writes `body.dataset.localeMode`.                                                         |
| [`components/admin/ActiveLocaleBodyAttr.tsx`](../../components/admin/ActiveLocaleBodyAttr.tsx)   | Mirrors `?locale=` to `body.dataset.activeLocale`. CSS hook for Команда + others.                                                                |
| [`components/admin/LocalizedDocContext.tsx`](../../components/admin/LocalizedDocContext.tsx)     | Shadow data layer. Fetches `?locale=all` once; `getValue` / `getRawValue` / `setValue`. Debounced PATCH per locale + `keepalive` unload flush.   |
| [`components/admin/LocalizedTextLike.tsx`](../../components/admin/LocalizedTextLike.tsx)         | Shared body for text + textarea wrappers. 4-pill control. Active-locale via `useField`, inactive via shadow.                                     |
| [`components/admin/LocalizedRichTextTabs.tsx`](../../components/admin/LocalizedRichTextTabs.tsx) | beforeInput component for richText. Pills + ALL-mode editable textareas. `extractLexicalText` + `stringToLexicalState` serdes.                   |
| [`app/(payload)/custom.scss`](<../../app/(payload)/custom.scss>)                                 | Border on `.rich-text-lexical`, hide-siblings-in-all-mode rule for the pillstrip, Команда conditional show/hide.                                 |
| [`collections/Productions.ts`](../../collections/Productions.ts)                                 | 4 richText fields use `beforeInput: ['/components/admin/LocalizedRichTextTabs#default']`. Inline-only fields filter `INLINE_ONLY_DROP_FEATURES`. |
| [`globals/About.ts`](../../globals/About.ts)                                                     | About body richText — same wiring as Productions.                                                                                                |
| [`payload.config.ts`](../../payload.config.ts)                                                   | `admin.components.providers` mounts the three providers in order.                                                                                |

---

## Suggested next investigation

1. **Reproduce locally first.** Boot dev (`PORT=3019 npm run dev`),
   sign in, open `/admin/collections/productions/5?locale=ru`. Confirm
   you see the same "empty editor with data in DB" symptom Roman
   reports. If you can't reproduce locally, the bug may be
   Vercel-preview-only (build/SSR difference, env, etc.) — pivot to
   inspecting the preview deployment.

2. **Walk the hypotheses in order.** Start with **H1** — it's the
   cheapest to test (one DevTools inspection) and the most likely
   culprit given the CSS rule was the last thing added in R3-5.

3. **Don't refactor until the bug is understood.** The temptation
   will be to "just use `admin.components.Field` and own the whole
   render". That's a 1–2 day rewrite, and if the bug is H1, a
   one-line SCSS fix solves it.

4. **When you ship the fix:**
   - Append the wave to `PAYLOAD_ADMIN_UX_PLAN.md` § Progress log
     (mirror the format of the existing Round-2 / Round-3 entries).
   - Either close this file by adding `Status: **Closed YYYY-MM-DD**`
     at the top with a link to the fix commit, or delete it if the
     plan doc fully captures the resolution.
   - Add a regression test if practical — even a screenshot diff via
     `.design/review/` of the BEFORE / AFTER state.

---

## Glossary

- **Switch mode** — `LocaleModeContext.mode === 'switch'`. Field shows ONE locale's input/editor at a time. RU/EN/DE pill click sets active locale.
- **All mode** — `LocaleModeContext.mode === 'all'`. Field shows three locales side-by-side. Text/textarea = 3 real inputs. RichText = 3 textareas + standard Lexical hidden.
- **Active locale** — the URL's `?locale=` param. Drives Payload's form state binding. Editable via `useField` → Save.
- **Selected tab** — `LocalizedTextLike` only. Local React state that controls which one of the three text inputs is visible in switch mode. Decoupled from URL nav (Round-3 R3-2 made this instant).
- **Shadow context** — `LocalizedDocContext`. Holds `{ru, en, de}` for every localized path. Inactive locales write here → debounced REST PATCH.
- **Pillstrip** — the `RU·EN·DE·ALL` segmented control. Lives in `LocalizedTextLike` (text/textarea) or `LocalizedRichTextTabs` (richText).
