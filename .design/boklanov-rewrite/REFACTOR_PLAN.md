# REFACTOR_PLAN

Codebase hygiene pass on `feature/payloadcms` — find and fix what the Payload migration left behind
without changing user-facing behavior. Updated: 2026-05-17.

Owns: scope, rules, sweep order, output contract for the resulting report.
Update: when a sweep ships → record commit hash in `## Ledger`, then route status to `STATUS.md`.

## 1. Goal

One thing only: surface and remove the **drift** between the codebase and the post-Payload reality
documented in `STATUS.md` Phase 11 + `PAYLOAD_POLISH_PLAN.md`. Net result is a smaller, clearer,
identical-behavior codebase ready for `feature/payloadcms` → `main` merge.

Not a goal: new features, design changes, perf tuning beyond what `STATUS.md` § Lighthouse
verification already records, or any edit to `.design/boklanov-rewrite/archive/**`.

## 2. Hard rules (read before every commit)

- **Don't break.** Every commit ends with `npm run build` clean, `tsc --noEmit` clean,
  `npm run lint-tokens` clean, `npm run test` clean. If any of these were already failing,
  capture the baseline first; do not silence them.
- **Minimal-necessary diff.** Touch only what the finding requires. No drive-by reformatting,
  no "while-I'm-here" rewrites. The diff should read as one idea per commit.
- **Reuse over rewrite.** Before adding a helper, grep the existing namespace
  (`lib/`, `components/`, `hooks/`). Promote an inline duplicate to a shared call site only when
  ≥ 2 real call sites exist today — no speculative abstractions.
- **No hardcoded user-visible text. Ever.** Any string a human reads — page copy, button label,
  toast, `aria-label`, `title`, `alt`, error message, empty-state line, placeholder, OG/meta
  fallback — must resolve through a translation layer. Public site: `messages/{ru,en,de}.json` +
  `next-intl`. Payload admin: the RU/EN/DE label objects on every `label` / `description` /
  `admin.description` / `RowLabel` per `PAYLOAD_POLISH_PLAN.md` Tier 3. A hardcoded English string
  in JSX, a TS string union of "Open" / "Close", a raw label in a Payload field — all blocked. If
  the locale catalog is missing a key, add the key first; never inline the fallback. The single
  exception is technical strings that are never rendered (log lines, error.message for dev,
  internal slugs); those still go through a named const if reused.
- **No hardcode / no magic values.** Numbers, paths, MIME lists, size limits, locale codes,
  ISO country codes, env keys → named constants. Reuse the existing namespaces (`lib/cdn.ts`,
  `lib/baseUrl.ts`, `lib/countryCode.ts`, `lib/folio.ts`, `lib/section-accent.ts`) before adding a
  new file. If a constant is used in both site and admin, it lives in `lib/` and is imported by
  both — never duplicated.
- **One source of truth for design tokens — site AND admin.** All colors, font families, font
  sizes, line heights, spacing scale, radii, shadows, motion durations, breakpoints, z-index
  layers are CSS custom properties defined in **`app/globals.css`** (the canonical token file per
  `DESIGN.md` §3–§6 + `archive/tokens.md`). Three follow-on rules:
  1. **Site code** consumes tokens via `var(--token-name)` in `*.module.css` / SCSS — never
     re-declares a hex, px, ms, rem, or font name. Magic values flagged by `npm run lint-tokens`
     are blockers, not warnings.
  2. **Payload admin** (`app/(payload)/custom.scss`, any future admin SCSS, any inline `style={}`
     in `components/admin/**`) consumes the same `var(--token-name)` set so the admin can never
     visually drift from the public site. If Payload's default admin styles can't be themed via
     CSS vars, raise it as a follow-up — do not duplicate a token with a new value.
  3. **No new token without doc.** A new `--token-name` requires a matching entry in `DESIGN.md`
     §3–§6 with the rationale. Sweep commits that introduce a token without the doc edit fail
     review.
- **Translation catalogs are also a single source.** `messages/ru.json` is canonical; `en.json`
  and `de.json` mirror its key tree. Sweeps must not introduce a key in one locale without the
  other two (DE may carry a documented graceful-empty per 9v3.7, but the **key** must exist).
- **One source for shared text between site and admin.** Country names, role taxonomy, locale
  labels, status enums that appear both in `/admin` selects and on the public site come from one
  module in `lib/` (today: `lib/countryCode.ts`). Adding a parallel list anywhere else is a
  finding, not a feature.
- **Brief comments only.** A comment exists to explain _why_, never _what_. Multi-paragraph
  docstrings get reduced to one line or deleted.
- **Archive is read-only.** No edits to `.design/boklanov-rewrite/archive/**` (`MAP.md` §5).
- **No force-push, no rebase of `feature/payloadcms`, no merges to `main` without Daniil.**
  Push to `main` is blocked by safety hook — surface a ready-to-run command, don't run it.

## 3. Inputs to consult (in order)

Before touching code, the agent reads — in this order:

1. `STATUS.md` — current phase state, uncommitted work, last shipped commits.
2. `MAP.md` §1, §3, §4, §5 — active docs, what was deleted in Phase 11, cascade rules.
3. `PAYLOAD_MIGRATION_PLAN.md` + `PAYLOAD_POLISH_PLAN.md` — what shipped, what was retired,
   schema source of truth.
4. `DESIGN.md` §7 (component grammar), §11 (anti-patterns).
5. `CONTENT.md` — current authoring flow against `/admin`.
6. Branch state: `git status`, `git log feature/payloadcms ^main --oneline`,
   `git diff main...feature/payloadcms --stat`.

Skip the `archive/` compress files unless a sweep finds an undocumented constraint and needs to
verify a locked decision.

## 4. Scope map (what to audit, what to leave)

### In scope

| Area                                    | Why it's in scope                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `app/[locale]/**`, `app/(payload)/**`   | Live routes — refactor target.                                                                  |
| `app/api/**` + `pages/api/**`           | Two API surfaces side-by-side; `pages/api/social-image.tsx` is a known 501 stub per F8.         |
| `components/**`, `components/admin/**`  | Live UI. Cross-check against `DESIGN.md` §7 + uncommitted `ImagePathPreview.tsx` diff.          |
| `lib/**`                                | Helpers. `lib/markdoc.tsx` is suspected dead post-Payload (header refs `keystatic.config.ts`).  |
| `hooks/**`, `i18n/**`, `middleware.ts`  | Small surface — verify each export still has a caller.                                          |
| `collections/**`, `globals/**`          | Payload schemas. Reuse opportunities (RowLabel, label objects, country select).                 |
| `scripts/**` (not `_legacy/`)           | Some `migrate-*.ts` scripts have already run against prod data — candidates for archival.       |
| `package.json` deps                     | Drop deps with zero importers (suspected: `@markdoc/markdoc`).                                  |
| `payload.config.ts`, `payload-types.ts` | Verify generated types are current; never hand-edit `payload-types.ts`.                         |
| `content/**`, `notion-data/**`          | `MAP.md` §3 marks `content/{productions,about,contact}/` deleted but `content/` dir still holds |
|                                         | `AUTHORING.ru.md` (owned by Roman) + `README.md`. `notion-data/` is pre-F8 residue.             |

### Out of scope

- `.design/boklanov-rewrite/archive/**` — frozen.
- `app/globals.css` token values — design decisions, not refactor surface.
- `design_v3` branch work — separate workstream.
- Lighthouse / perf tuning — handled by `LIGHTHOUSE_RUNBOOK.md`.

## 5. Sweep order (strict priority)

Each sweep produces one commit (or a tight series). Stop a sweep early and ship if the diff grows
past ~300 lines; pick up the rest in the next pass. Do not interleave priorities within a commit.

### Sweep 1 — Bugs (must fix)

What counts: runtime errors, type holes that mask real defects, broken links between
`payload-types.ts` and `lib/content.ts` readers, schema fields rendered but never set, hooks that
fire on the wrong collection, locale fallbacks that crash on `null`, route handlers that throw on
empty input, dead exports re-imported by live code.

How: read the uncommitted diff first (`components/admin/ImagePathPreview.tsx`, `globals/About.ts`,
`payload-types.ts`) — figure out whether those are in-progress fixes or accidental edits before
auditing. Then run `tsc --noEmit` and treat every error as a bug entry.

### Sweep 2 — Duplication removal

What counts: two or more call sites that copy the same 5+ lines and share a clear name. Promote to
`lib/` or to a shared component **only when ≥ 2 real call sites exist today**. RowLabel functions,
label objects, image-path normalization, locale fallback ladders, country-code mapping
(`lib/countryCode.ts` already exists — verify it's the single source).

How: grep for repeated string literals (RU/EN/DE labels), repeated regex patterns
(image extension allowlist appears in `ImagePathPreview.tsx` and likely the upload route), repeated
`?? null` / fallback chains in `lib/content.ts`.

### Sweep 3 — Targeted complexity reduction

What counts: functions that mix three concerns in one body, components that own both data fetching
and presentation, conditionals nested 4+ deep, files past ~400 lines that read as two files glued
together. Fix by **extraction with a name**, not by sprinkling early-returns; reuse existing
namespaces (`lib/folio.ts`, `lib/section-accent.ts`, etc.) before creating a new file.

Out-of-scope here: rewriting working code that's merely "tall but linear" — length is not
complexity.

### Sweep 4 — Unused code cleanup

Pre-identified candidates (verify each with grep before deleting):

- `lib/markdoc.tsx` — header references `keystatic.config.ts`; no importers found in `app/`,
  `components/`, `collections/`, `globals/`, `hooks/`, `lib/`. Removing it permits dropping
  `@markdoc/markdoc` from `package.json`. Verify against `globals/About.ts:42-43`
  description strings — those are user-facing label text only, no runtime dependency.
- `pages/api/social-image.tsx` — explicit 501 placeholder; the real OG renderer is
  `app/api/og/[slug]/route.tsx` (Phase 5 shipped). The `pages/` directory exists _only_ for this
  one stub on App Router — deleting it removes a whole router surface.
- `notion-data/` — pre-F8 Notion export; `MAP.md` §3 already lists Notion as removed.
- `scripts/migrate-to-keystatic.ts`, `scripts/migrate-about-to-keystatic.ts`,
  `scripts/migrate_mdx_to_yaml.py`, `scripts/migrate-productions-schema.ts`,
  `scripts/migrate-richtext-data.ts`, `scripts/backfill-nulls.ts` — one-shot migrations whose
  output is already in Postgres. Move under `scripts/_legacy/` (matches the existing convention
  excluded by `tsconfig.json`) rather than deleting, so the git-archaeology trail stays usable.
- Deps to re-check after Sweep 4: `@markdoc/markdoc`, `next-mdx-remote`, `lqip-modern`,
  `fathom-client`, `critters`, `cli-progress`, `csv-parse`, `p-map`. For each, grep importers; if
  zero in live code, remove from `package.json`. Scripts under `_legacy/` are excluded from
  `tsconfig.json` so they don't count as live importers.
- Exports that nothing imports — run a quick `ts-unused-exports`-style pass via grep
  (no new tool dep; spot-check the lib/ files individually).

Rule: if a deletion candidate has even one importer, leave it and explain why in the report. Do not
chase the importer in the same commit.

### Sweep 5 — Minor style / safety

What counts: `as` casts that hide a real `unknown`, `any` leaking into a public type,
`process.env.X!` non-null assertions in code paths that can run without the env, raw `new Date()`
that should use the project's existing helper, `console.log` left from debugging, mutable module
state where const works, `==` where `===` was meant. Plus: confirm `next-intl` is used for every
user-facing string the sweep touches.

Style only — no broader formatting passes. `npm run test:prettier` already runs on the suite.

### Sweep 6 — Readability pass

What counts: rename one variable / one function / one prop where the current name is actively
misleading after the Payload migration (e.g. anything still named `keystatic*` outside the
documented R2-proxy carve-out, `entry`/`item` where `production` / `about` is unambiguous in
context). Tighten one comment per file where the comment now lies about behavior. Add a one-line
header to any file whose purpose isn't obvious from its name.

Hard cap: one rename per file per commit. No mass renames.

## 6. Output contract (the audit report)

Each sweep produces a section under `## Findings` in this doc, in this exact shape:

### 6.1 Per-sweep section header

```
### Sweep N — <name>

1. Goal fit: met / partial / not met — one sentence on whether sweep N's stated intent landed.
2. Must-fix bugs (Sweep 1 only; other sweeps use "Findings"):
   - `path/to/file.ts:LINE` — what's wrong, impact (who breaks, when), suggested fix.
3. BAD → GOOD naming:
   - `currentName` → `proposedName` — `path/to/file.ts:LINE` — one-sentence why.
4. Follow-ups (out-of-scope for this sweep, but worth tracking):
   - <bullet> — clearly marked OOS:<reason>.
```

Rules for the report:

- Every finding cites `file:line`. No findings without a location.
- "Impact" answers _what breaks, for whom, when_ — not _what the code does_.
- BAD → GOOD entries are proposals; renames only land in Sweep 6 commits.
- Follow-ups never silently graduate to in-scope. Promotion requires a new sweep entry.

### 6.2 Roll-up

After all six sweeps, append a single `## Roll-up` block:

- Total diff size (lines added / removed).
- Deps removed.
- Files deleted / moved to `_legacy/`.
- Build / `tsc` / lint / test status before vs after (verbatim CLI output line).
- Open follow-ups grouped by sweep number.

## 7. Verification gates (run after every sweep commit)

```sh
npm run build           # next build clean (only allowed warning: outputFileTracingRoot)
npx tsc --noEmit        # zero errors
npm run lint-tokens     # zero violations
npm run test            # lint + prettier green
```

Manual gate after Sweep 4 (deletions): boot `npm run dev`, visit `/`, `/ru/productions`, one
production detail, `/about`, `/admin`. No console errors, no 404 on assets. Captures regressions
that type-check can't see (e.g. an `<Image>` whose `src` resolved through a deleted helper).

## 8. Commit conventions

Match the existing log style (see `STATUS.md` § Recent commits):

```
refactor(scope): one-line intent

Body explains *why* the change was safe and which sweep it belongs to.
Reference the sweep section, e.g. `Sweep 4 — Unused code cleanup`.
```

Scope tokens already in use: `payload`, `theme`, `i18n`, `9v3.x`, `perf`. New refactor scopes
should reuse one of these where possible; otherwise use the directory name (`lib`, `components`,
`scripts`).

## 9. Risks & rollback

- Generated artifacts (`payload-types.ts`, `app/(payload)/admin/importMap.js`) — never hand-edit.
  Always regenerate via `npm run payload:generate:types` / `:importmap` and commit the diff
  separately from logic changes.
- Dep removal can break a transient peer used by Payload — `npm run build` is the gate; if it
  fails after `npm uninstall X`, restore X and record the finding instead of fighting it.
- If a sweep finds that an "uncommitted" file on `feature/payloadcms` is actually mid-flight
  fix work, stop and ask Daniil before refactoring around it.
- Rollback = `git revert <sweep-commit>`. Sweeps are deliberately small so revert is safe.

## 10. Pre-identified findings (seed list, to validate during Sweep 1–4)

These are signals already gathered while writing this plan — they are **not** confirmed findings.
Each must be re-verified during its sweep before any change.

- **Sweep 1:** uncommitted edits on `components/admin/ImagePathPreview.tsx`, `globals/About.ts`,
  `payload-types.ts`. Status unclear — confirm with Daniil whether they're in-progress fixes or
  accidental rebase residue before the audit touches them.
- **Sweep 2:** image-extension allowlist (`jpg|jpeg|png|webp|gif|svg|avif`) appears in both
  `components/admin/ImagePathPreview.tsx` and the upload route; promote to one constant in
  `lib/`.
- **Sweep 3:** none pre-identified; expect findings around `lib/content.ts` locale fallback ladders
  given the DE-graceful-empty contract documented in 9v3.7.
- **Sweep 4:** `lib/markdoc.tsx` (0 importers), `pages/api/social-image.tsx` (501 stub),
  `notion-data/` (pre-F8), migration scripts (`migrate-*.ts`, `backfill-*.ts`) once verified
  applied to prod. Candidate deps: `@markdoc/markdoc`, `next-mdx-remote`, `lqip-modern`,
  `fathom-client`, `critters`, `cli-progress`, `csv-parse`, `p-map`.
- **Sweep 5:** spot-check `process.env.*!` assertions in `lib/cdn.ts`, `lib/baseUrl.ts`,
  `payload.config.ts`.
- **Sweep 6:** any symbol still named `keystatic*` outside `app/api/keystatic-asset/` (which
  `MAP.md` §3 explicitly kept as the R2 proxy).

## 10b. Pre-audit inventory — in-code markers (2026-05-17 scan)

Strict marker survey across `app/`, `components/`, `lib/`, `hooks/`, `i18n/`, `collections/`,
`globals/`, `middleware.ts`, `next.config.js`, `payload.config.ts`, `pages/`, `scripts/`
(excluding `scripts/_legacy/`, `node_modules`, `.design/`):

### Action markers (`TODO`, `FIXME`, `HACK`, `XXX`, `TBD`, `WIP`)

**Zero hits.** The codebase carries no explicit deferred-work markers — unusually clean for a
project this size. Treat this as a baseline: any TODO landed during the refactor sweeps is a new
debt and should be removed before commit unless it cites a tracking entry in `STATUS.md`.

### "Legacy" mentions (16 hits, all intentional compatibility shims)

These are **not** findings — they are documented bridges. Verify wording stays accurate during
Sweep 6; do not rip out the underlying code without scope review.

- `lib/content.ts:58, 282, 315, 449, 518` — Payload-document → legacy `Production` interface
  adapter. The "legacy" label refers to the pre-Payload shape that every page route still
  consumes. Removing this adapter is a separate refactor (not in this plan's scope).
- `app/[locale]/layout.tsx:25-36` — `localStorage` `theme=dark|light` → `gorky|paper` migration.
  Per `STATUS.md` "Gorky default theme" section, this can be retired once Daniil decides legacy
  visitors have all rotated through. Sweep 4 candidate **only** with explicit sign-off.
- `collections/Productions.ts:1444-1476` — Notion IDs preserved in schema for migration
  cross-reference. Cannot be removed; Roman has authored against these slugs.
- `collections/Media.ts:32` — comment referencing `PAYLOAD_IMAGE_VARIANTS_PLAN.md`. Comment only.
- `app/globals.css:464` — `[data-theme="light"]` migration note. Paired with the layout shim
  above.
- `components/admin/{Credit,Video,Gallery}RowLabel.tsx` — "matches the legacy Keystatic
  itemLabel" — phrasing in comments. Sweep 6 may shorten "matches the legacy Keystatic itemLabel"
  → "matches the prior itemLabel format" once Keystatic isn't actively remembered.

### Known stub (already in Sweep 4 deletion list)

- `pages/api/social-image.tsx:9` — `"OG image renderer not yet ported (see TASKS.md S3)"`.
  Real renderer at `app/api/og/[slug]/route.tsx` shipped Phase 5. Confirms Sweep 4 deletion of the
  whole `pages/` tree is safe.

### Lint/TS escape hatches

Surveyed — all justified, none constitute a finding:

- `app/(payload)/admin/[[...segments]]/{page,not-found}.tsx`, `app/(payload)/layout.tsx`,
  `app/(payload)/api/[...slug]/route.ts` — Payload-generated route handlers. File-level
  `/* eslint-disable */` is generator output; never hand-edit.
- `components/{ProductionCard,SpecimenPlate,GalleryLightbox}.tsx`,
  `app/[locale]/productions/[slug]/page.tsx`, `app/api/og/[slug]/route.tsx`,
  `components/admin/ImagePathPreview.tsx` — line-level `@next/next/no-img-element` disables on
  intentional `<img>` use (OG renderer; lightboxes that bypass `next/image` cache; admin preview
  thumbnails). All correct.
- `next.config.js:9` — `no-process-env` on a single env flag read. Correct.
- `scripts/seed-payload.ts:65, 71` — `@typescript-eslint/no-explicit-any` on a one-shot seed
  script. Sweep 4 may move this to `_legacy/` if the seed has fully landed in prod.

### "Placeholder" mentions

Two are user-facing UI ("CommandPalette input placeholder"; CSS token comment on `--ink-faint`).
Neither is a follow-up.

### Sweep impact

- Sweep 1 (bugs): **no marker-driven entries**. Bugs must be discovered by `tsc`, build, and
  manual route walk.
- Sweep 4 (unused): confirms `pages/api/social-image.tsx` deletion. `seed-payload.ts` archival
  candidate.
- Sweep 6 (readability): wording polish on five comments mentioning Keystatic. Hard cap (one
  rename per file per commit) still applies.

## 11. Findings

### Sweep 1 — Bugs (must fix)

Run on 2026-05-17 against `feature/payloadcms` at HEAD `59e881a`.

Baseline gates before audit:

- `git status` — workspace clean for in-scope files (the three previously-uncommitted files
  shipped as `59e881a feat(admin): wire ImagePathPreview into About global` during the §10
  triage window — no audit blocker).
- `npx tsc --noEmit` — **exit 0, zero diagnostics.**

1. **Goal fit: met.** Two real bugs surfaced from the manual scan, both locale-correctness
   regressions in the public-facing render path. No `tsc` errors, no broken hook bindings, no
   crashing route handlers, no rendered-but-unset schema fields. The audit walked all six
   categories from plan §5 Sweep 1; categories 1 (types↔reader coherence), 2 (rendered-but-
   unset), 3 (hooks-on-wrong-collection), and 5 (route handlers) returned no findings.

2. **Must-fix bugs:**
   - `app/api/og/[slug]/route.tsx:83` — `getProduction(slug, 'ru')` hardcodes the Russian locale,
     ignoring the validated `locale` variable established at `:71-74`. **Impact:** OG social-card
     images shared from `/en/productions/<slug>` or `/de/productions/<slug>` render
     `production.theatre.name` / `theatre.shortName` / `theatre.city` / `ageRating` in Russian
     regardless of the share locale, because those fields come out of `project(p, locale)` as
     locale-projected singular strings (`lib/content.ts:679`). The `?locale=` query param has
     been a no-op for these fields since the route was added. `meta`/`nav`/`productions`/`footer`
     translations on the same card (`:76-81`) already use the correct locale, so the bug
     manifests as mixed-language OG cards. **Fix:** pass `locale` instead of `'ru'`. One-line
     change.

   - `lib/content.ts:684-687` — `credits` projection misses the `locale === 'de'` branch.
     **Impact:** German production pages discard the `creditsDe` array even when `/admin` has
     populated it (schema `collections/Productions.ts:869`, loader `lib/content.ts:368`, type
     `lib/content.ts:105` all exist for `credits.de`). Three-line fallback chain checks `'en'`
     then `'ru'` then a generic RU→EN tail — DE never matches a clause, so the value resolves to
     `p.credits.ru ?? p.credits.en ?? []`. Mirrors the same pattern already correct for
     `directorsNote` (`:693-699`) and `tagline` (`:700-703`). **Fix:** prepend the DE clause
     `(locale === 'de' && p.credits.de?.length ? p.credits.de : null) ??` so the DE path
     short-circuits before falling through to the RU/EN tail. One-line addition.

3. **BAD → GOOD naming:** none — naming changes belong to Sweep 6 (plan §5).

4. **Follow-ups (out-of-scope for Sweep 1):**
   - OOS:Sweep-2 — `lib/content.ts:679-712` `project()` has three near-identical L10n fallback
     chains (`directorsNote`, `tagline`, `credits`) that differ only in the field name and
     `?.length` vs `??`. Promote to one helper named after what it does
     (e.g. `pickLocaleArray<T>(field, locale)`) once Sweep 2 confirms ≥ 2 production call sites
     today.
   - OOS:Sweep-4 — `lib/markdoc.tsx` has zero importers (re-verified during this sweep).
     Deletion already in the Sweep 4 candidate list.
   - OOS:Sweep-6 — `app/api/og/[slug]/route.tsx:88` reads `production.titles.ru` directly;
     after Bug 1's fix the OG render becomes locale-correct except for the deliberately
     bilingual title block. Worth a comment one-liner explaining _why_ `titles.ru` is read
     unconditionally there (intentional bilingual masthead), separate from the locale fix.
   - OOS:Sweep-5 — `npm run test` pre-existing baseline failure: ESLint 9.39.1 dropped support
     for `.eslintrc.json` (repo's current config) and requires `eslint.config.{js,mjs,cjs}`.
     Verified by stash-and-rerun against HEAD `2913cb8` — failure pre-dates Sweep 1. Migration is
     a self-contained config job (eslint v9 flat-config). Track as Sweep 5 follow-up.

### Sweep 2 — Duplication removal

Run on 2026-05-17 after Sweep 1, on `feature/payloadcms` HEAD `8b84fc6`.

Baseline gates before audit: `tsc --noEmit` 0 · `lint-tokens` OK · `build` clean.

Mid-sweep clarification from Daniil: locale fallback order is **EN → DE → RU** (matches
`routing.locales`, not the older RU-canonical convention). Saved as project memory
`project_locale_fallback_order.md` and applied during this sweep.

1. **Goal fit: met.** Two structural duplicates promoted to shared helpers / hoists. The five
   smaller categories surfaced (image-extension allowlists, RowLabel `fallback` one-liner, label
   objects, country-code split, DE-graceful-empty pair) all failed the ≥ 2-call-sites-of-≥-5-lines
   bar for different reasons documented as follow-ups.

2. **Findings + actions:**
   - **Promoted:** `pickL10n<V, T>(field, locale, fallback)` helper added to `lib/content.ts:683`.
     Replaces 7 inlined `field[locale] ?? field.ru ?? field.en ?? fallback`-shaped chains:
     5 in `lib/content.ts:project()` (`title`, `synopsis`, `body`, `premiereDate`,
     `bookingCtaLabel`) and 2 in `app/[locale]/productions/[slug]/page.tsx` (gallery alt × 2).
     Helper encodes the EN → DE → RU order from the project rule.
   - **Promoted:** `resolveL10n` (`lib/content.ts:668`) fallback order flipped from EN→RU→DE to
     EN→DE→RU. Consumers: `item.title`, awards/festivals `name`/`category`/`city`,
     `externalLinks.label`, tour `city` — all now agree on the order with `pickL10n`.
   - **Promoted:** `credits` outer-fallback tail in `project()` flipped from RU→EN to EN→DE→RU
     (current-locale `.length`-matching clauses kept so an empty-but-present array can't
     short-circuit).
   - **Hoisted:** `galleryItems` in `app/[locale]/productions/[slug]/page.tsx`. The detail page
     ran `production.gallery.map(...)` twice — once in the mobile column (`.inlineMedia`, hidden
     ≥ 1024px) and once in the desktop rail (`.railMedia`, hidden < 1024px). Both blocks were
     byte-identical 22-line mappings. Hoisted to one `const` before the JSX; both
     `<GalleryLightbox>` consume the same array reference.

3. **BAD → GOOD naming:** none — Sweep 6 territory.

4. **Follow-ups (out-of-scope for Sweep 2):**
   - OOS:Sweep-3 — `app/[locale]/productions/[slug]/page.tsx` still renders two
     `<GalleryLightbox>` JSX instances (under different `.inlineMedia` / `.railMedia` parents).
     Both go to the DOM simultaneously; only one is visible per viewport. Collapsing to a single
     mount requires CSS-only repositioning (the rail's `display:none` toggle is the current
     mechanism, replicated in JSX). Complexity-reduction, not structural duplication.
   - OOS:no-ship — Image-extension allowlists: `ALLOWED_EXT` (`app/api/r2-asset/route.ts:50`),
     `MIME` map (`:66`), `BAKEABLE_EXTS` (`lib/image-variants.ts:62`), `IMAGE_EXT`
     (`scripts/photo-audit.mjs:28`), `accept` attr on `ImagePathPreview.tsx:187`,
     `Media.mimeTypes` (`collections/Media.ts:28`). Six lists, all intentionally different scopes
     (bakeable subset, upload accept, MIME map, audit scan, browser file-picker, Payload Media
     whitelist). Documented intent stands; no promotion.
   - OOS:no-ship — RowLabel `fallback = ${(rowNumber ?? 0) + 1}.padStart(2, '0')` duplicated
     across 12 files in `components/admin/*RowLabel.tsx`. Real shared concept but only one line
     per file; promotion adds 12 imports for marginal code-volume gain. Skipped per the plan's
     "5+ lines" threshold (§5 Sweep 2).
   - OOS:Sweep-5 — Payload field labels in `globals/About.ts`, `globals/Contact.ts`, and most of
     `collections/Productions.ts` use a `{ ru, en }` two-key shape, but `PAYLOAD_POLISH_PLAN.md`
     Tier 3 established RU/EN/DE as the convention. No DE keys = admin chrome falls through to
     RU/EN on the DE admin locale. Content-fill job (~150 strings), not structural.
   - OOS:Sweep-4 — `COUNTRY_TO_CODE` map in `lib/countryCode.ts` (6 entries: RU/KZ/DE/ES/AT/BY
     free-text → ISO-2) is likely dead after Tier 5.3 backfill — `theatre.country` is now ISO
     codes in DB, and the function's `/^[A-Z]{2}$/` passthrough already handles those. Verify no
     remaining free-text values, then delete the map.
   - OOS:Sweep-6 — `components/FilteredProductionsPanel.tsx:6` imports `countryCode` from
     `@/components/ProductionCard` (which re-exports from `@/lib/countryCode` at `:15`). Direct
     import from `@/lib/countryCode` would drop the indirection.
   - OOS:no-ship — `directorsNote` and `tagline` chains in `project()` share the DE-graceful-
     empty pattern but with subtly different non-DE tails (tagline lacks an EN fallback).
     Documented inline (`lib/content.ts:709-711`) with a comment pointing at
     DESIGN_v3_PROPOSAL.md §9v3.7. Don't collapse into `pickL10n` — its EN→DE→RU chain would
     break the DE-explicit-null guarantee.

### Sweep 3 — Targeted complexity reduction

Run on 2026-05-17 after Sweep 2, on `feature/payloadcms` HEAD `3db67fb`.

Baseline gates before audit: `tsc --noEmit` 0 · `lint-tokens` OK · `build` clean.

1. **Goal fit: not met (intentional no-ship).** Scan covered the four largest source files
   (`collections/Productions.ts` 1489 lines · `lib/content.ts` 881 · `app/[locale]/productions/[slug]/page.tsx` 805 · `lib/image-variants.ts` 512) and the top-5 longest functions
   (`payloadDocToProduction` 149 lines · `project` 112 · `FilteredProductionsPanel` body 299 ·
   `GalleryLightbox` body 190 · `SiteHeader` body 176). None met the Sweep 3 criteria after the
   plan's own "length is not complexity" filter. The two carryover candidates from earlier
   sweeps were re-examined and triaged below.

2. **Findings + actions:** none shipped. Detailed triage:
   - **`payloadDocToProduction` (149 lines, `lib/content.ts:316`)** — tall but linear field
     mapping (≈30 paths, no nested concerns). Splitting by `media`/`recognition`/`history`
     blocks would produce single-call-site helpers with no clarification gain. Skip.
   - **`project` (112 lines, `lib/content.ts:699`)** — already simplified in Sweep 2 via
     `pickL10n`. Remaining inline chains (`credits` length-check, `directorsNote`/`tagline`
     DE-graceful) are intentionally distinct shapes. Skip.
   - **`FilteredProductionsPanel` body (299 lines, `:63`)** — three distinguishable concerns
     (URL state, filter predicate, render). Extractable as `useFilterURLState()`,
     `matchesFilters()`, and `useClickOutside()` — each would be a single-call-site extraction
     (the plan §2 speculative-abstraction line). Extracting them would clarify the component
     body but at the cost of three new files / one wide module for ≈40-50 lines of one-use
     logic. Skip until a second call site appears or a UI redesign forces a rewrite.
   - **Dual `<GalleryLightbox>` on detail page (`app/[locale]/productions/[slug]/page.tsx`
     ≈ lines 491-496 and 779-784)** — confirmed: both mount in DOM at all times, CSS hides one
     per viewport via `.inlineMedia` / `.railMedia` toggles. After Sweep 2's `galleryItems`
     hoist, each call site is 5 lines of identical JSX. Collapsing to a single mount requires
     either (a) CSS-only repositioning of `.rail` to flow inline at mobile (significant CSS
     restructure with risk to sticky-CTA behavior), or (b) JS-conditional render with
     `useMediaQuery` (introduces SSR/hydration mismatch where currently there is none). The
     `loading="lazy"` semantics mean hidden images don't fetch, so the real cost is DOM size
     - duplicate lightbox state — both small. Skip in this sweep; revisit during the next UX
       pass on the detail page layout.

3. **BAD → GOOD naming:** none — Sweep 6 territory.

4. **Follow-ups (out-of-scope for Sweep 3):**
   - OOS:future-UX — Single-mount media block (`<DetailMedia>` housing trailer + gallery) on
     the production detail page. Requires layout restructure of `.rail` ↔ `.inlineMedia` to
     unify mount points. Defer to a design-led layout pass; do not pursue as a refactor.
   - OOS:future-reuse — Extract `useFilterURLState`, `useClickOutside`, and `matchesFilters`
     from `FilteredProductionsPanel.tsx` once a second filter consumer (e.g. archive page,
     awards filter, or a /press search) appears. The shape is well-understood today;
     re-evaluate when call sites ≥ 2.

## 12. Ledger

Filled in as sweeps land.

| Sweep | Status  | Commit                | Notes                                                                                                                                                                                                                                                                                                 |
| ----- | ------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | shipped | `3458619` + `8b84fc6` | 2 bugs fixed: OG locale hardcode + DE credits fallback. Gates: tsc 0, lint-tokens OK, prettier OK, build clean. Pre-existing `npm run test` ESLint 9 baseline failure recorded as Sweep 5 follow-up.                                                                                                  |
| 2     | shipped | `7febc7b` + `44c5644` | `pickL10n` helper + EN→DE→RU fallback order applied (7 inlined ladders dedupe + resolveL10n + credits tail). Gallery items hoisted on detail page. Behavior change: DE/RU pages with empty active-locale value but non-empty EN now show EN. Gates: tsc 0, lint-tokens OK, prettier OK, build clean.  |
| 3     | no-ship | —                     | Triaged 5 hotspots + 2 carryover candidates. Two real concerns identified (dual `<GalleryLightbox>` mount; `FilteredProductionsPanel` mixed concerns) — both deferred. Dual-gallery needs layout restructure; panel split is speculative single-call-site. Findings written; no code changes shipped. |
| 4     | pending |                       |                                                                                                                                                                                                                                                                                                       |
| 5     | pending |                       |                                                                                                                                                                                                                                                                                                       |
| 6     | pending |                       |                                                                                                                                                                                                                                                                                                       |

## 13. After all sweeps land

- Update `STATUS.md`: add a "Refactor pass post-Payload (2026-05-17 → …)" section under the
  Lighthouse block with the final roll-up.
- Update `MAP.md` §1 / §3 if any active doc was moved or any file was deleted.
- Open PR `feature/payloadcms` → `main` only after the merge of carryover `GalleryLightbox` work
  is decided (see `STATUS.md` § Carryover).
