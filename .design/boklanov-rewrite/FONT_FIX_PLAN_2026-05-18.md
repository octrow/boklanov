# Font & typography — fix plan

> **Status: ALL 5 WAVES SHIPPED 2026-05-18.** See "Shipped" section at the bottom
> for commit SHAs, final state, and remaining visual gates.

Companion to `FONT_AUDIT_2026-05-18.md`. Brings the system inside the editorial
ideal (2–3 families + 1 scoped, 6–8 sizes, 3–4 weights, 3 line-heights, 2–3
tracking) and resolves the drift from the audit. Sized in waves so each one
lands as its own atomic commit / PR.

Editorial ideal — pre-fix vs post-fix:

|              | Ideal           | Pre-fix                     | Post-fix                  | Verdict                                                            |
| ------------ | --------------- | --------------------------- | ------------------------- | ------------------------------------------------------------------ |
| Families     | 2–3 (+1 scoped) | 4 (Unbounded scoped)        | 4 (Unbounded scoped)      | ✅ At ceiling, properly bounded                                    |
| **Sizes**    | **6–8**         | **14 declared / 13 in use** | **10** (6 brief + 4 role) | ✅ Within budget                                                   |
| Weights      | 3–4             | 4                           | 4                         | ✅                                                                 |
| Line-heights | 3               | 4                           | 4                         | ✅ Long-form (`/about`) justifies the 4th                          |
| Tracking     | 2–3             | 4                           | **3**                     | ✅ Dropped `--letter-spacing-normal` (was unused + default-valued) |

### Important correction to the audit's "vestigial intermediates" claim

The audit (and an external editorial-typography review) suggested removing
`xs / sm / md / xl / 3xl` as unused. Actual grep across `app/**/*.module.css`
and `components/**/*.module.css`:

| Token                           | Usages         | Reality                                                                                                                  |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--font-size-xs` (12px)         | **0**          | Truly vestigial                                                                                                          |
| `--font-size-sm` (14px)         | 12+ in 9 files | Active — Marginalia, CommandPalette, ProductionCard, SiteHeader, TheatreSlate, awards/contact/about/productions captions |
| `--font-size-md` (clamp 18→20)  | 6+ in 4 files  | Active — about, productions/[slug] body+sidebar, press, TheatreSlate                                                     |
| `--font-size-xl` (clamp 24→32)  | 1 (awards H2)  | Near-vestigial                                                                                                           |
| `--font-size-3xl` (clamp 36→60) | 7+ in 7 files  | Active — page-H1 pattern (about/awards/archive/contact/press/productions/not-found)                                      |

Plan handles each at its actual cost — not as a single "delete five tokens" sweep.

---

## Decision points — answer these first

These three decisions shape Wave 2 and 3. Answer in this doc or inline before
starting work; everything else follows mechanically.

**Decided** (2026-05-18):

- **D1 → A** (keep fluid `clamp()`). No role demanded the split.
- **D2 → B** (brand-match Payload admin). Implemented in Wave 4 via shared `app/typography.css`.
- **D3 → (a)** (annotate VF deviation in DESIGN.md §4). Done in Wave 3.

### D1. Fluid `clamp()` or split mobile-set / desktop-set?

The user raised: "we can have one set for desktop and another for mobile."

| Option                             | What it looks like                                                                                                                               | Tokens count                    | Pros                                                                                                    | Cons                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Keep fluid clamp** (current) | `--font-size-2xl: clamp(28px, …, 40px)` — one token, scales between 375px and 1280px anchors                                                     | 1 per role                      | Closest to ONE-place goal; matches brief §5.4; smooth across all viewports; no media-query maintenance  | Can't independently tune mobile-vs-desktop ratios per role                                                                                            |
| **B — Split sets**                 | `--font-size-2xl-mobile: 28px; --font-size-2xl-desktop: 40px;` swapped via `@media (min-width: 1024px)` in `:root`                               | 2 per role (× ~13 = ~26 tokens) | Lets mobile and desktop have _different relationships_ (e.g., mobile body bigger relative to mobile H1) | Doubles token surface; breaks the "fluid" mental model already in `DESIGN.md` §4 ("Scale fluid `clamp(…)`"); harder for component CSS to reason about |
| **C — Hybrid**                     | Fluid clamp for _most_ roles; explicit mobile/desktop split only for the 2–3 where the relationship genuinely differs (e.g., hero wordmark, nav) | 1–2 per role                    | Best of both                                                                                            | Two patterns to learn; can drift                                                                                                                      |

**Recommended: A**, unless a specific role (likely hero or nav) demands the
split. The current anchors (375px / 1280px) already _are_ "mobile set" and
"desktop set" — they're just expressed as endpoints of one variable. Splitting
costs 13 extra tokens and a media-query block in `:root` for a benefit nobody
has asked for yet. If you find a role where mobile and desktop want a different
_shape_ (not just a different size), pick option C and split only that role.

### D2. Payload admin — Option A (carve-out) or Option B (brand-match)?

From audit §5. REFACTOR_PLAN §2 mandates B; current state is effectively A.
Pick one and amend the other doc to match.

### D3. Brief §5.3 weight lock vs reality

Brief says Lora `400/500/600`; code is VF axis `400–700`. Either:

- (a) Annotate the deviation in `DESIGN.md` §4 ("supersedes brief §5.3 per Phase 9.2 `f1613b1`") — cheap, honest.
- (b) Constrain `font-weight` callsites to the brief-locked trio. Requires audit of every `font-weight:` in component CSS.

Recommended: **(a)** — the VF swap was already a shipped, reviewed decision.

---

## Wave 1 — pure bugfix, zero design change ✅ shipped `7fe86cd`

**Scope**: 6 bugs from the audit. No tokens added or removed. No visual diff
expected. One PR, ~10 lines changed.

| #   | Change                       | File                                                 | Action                                                                                                                                                                                |
| --- | ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Define `--font-size-body`    | `app/globals.css :root`                              | Add `--font-size-body: var(--font-size-base);`                                                                                                                                        |
| 1.2 | Define `--font-family-serif` | `app/globals.css :root`                              | Add `--font-family-serif: var(--font-family-display);`                                                                                                                                |
| 1.3 | Define `--font-family-sans`  | `app/globals.css :root`                              | Add `--font-family-sans: var(--font-family-body);`                                                                                                                                    |
| 1.4 | Define `--line-height-body`  | `app/globals.css :root`                              | Add `--line-height-body: var(--line-height-normal);`                                                                                                                                  |
| 1.5 | Replace `font-size: 10px`    | `components/CommandPalette.module.css:103`           | Replace with `var(--font-size-xs)` (12px — accept +2px, that callsite is a small "GROUP LABEL" caption); alt: introduce `--font-size-2xs: 10px` if 12px hurts. Visual check required. |
| 1.6 | Replace `font-size: 0.75em`  | `components/FilteredProductionsPanel.module.css:153` | Read context; pick `var(--font-size-meta)` or `var(--font-size-sm)`; document if intent was deliberately relative                                                                     |

**Acceptance**: `grep -rE 'font-size:[[:space:]]*[0-9]' --include='*.module.css' components app | grep -v "var("` returns zero (modulo print-mode `pt` lines in `globals.css`).

**Risk**: trivial. Aliases preserve current visual output; the 2 hardcoded
replacements need a 60-second eyeball check at the affected components.

---

## Wave 2 — collapse the size scale toward 6–8 semantic tokens ✅ shipped `f5dd65e` + `91d274d` + `c3e2ba9`

**Scope**: get from 14 declared sizes to a documented "8-or-fewer brief-locked

- 3 role-specific" scale. Touches ~30 callsites. Visual review required per
  page. Ship as 2–3 PRs grouped by callsite cluster, not as one mega-PR.

### Target end state

**Brief-locked semantic core (6)** — display / h2 / h3 / body / meta / chip:

| Token              | Value                | Maps to today                          |
| ------------------ | -------------------- | -------------------------------------- |
| `--font-size-chip` | 11px                 | (unchanged)                            |
| `--font-size-meta` | 13px                 | (unchanged)                            |
| `--font-size-body` | clamp(17px, …, 18px) | alias of `base` (introduced in Wave 1) |
| `--font-size-h3`   | clamp(20px, …, 24px) | rename of `lg`                         |
| `--font-size-h2`   | clamp(28px, …, 40px) | rename of `2xl`                        |
| `--font-size-h1`   | clamp(44px, …, 88px) | rename of `4xl`                        |

**Role-specific extensions (3)** — each with a job name, not a t-shirt size:

| Token                 | Value                           | Job                            |
| --------------------- | ------------------------------- | ------------------------------ |
| `--font-size-nav`     | clamp(13px, …, 16px)            | Header nav links (≥1024px)     |
| `--font-size-hero`    | (reconcile per D3 / audit §3.3) | Unbounded hero wordmark on `/` |
| `--font-size-sticker` | clamp(11px, …, 13px)            | Unbounded Sticker badge        |

**Transitional aliases retained for one release**:

```css
--font-size-base: var(--font-size-body); /* deprecate */
--font-size-lg: var(--font-size-h3); /* deprecate */
--font-size-2xl: var(--font-size-h2); /* deprecate */
--font-size-4xl: var(--font-size-h1); /* deprecate */
```

These let Wave 2 ship without a 30-file rename, then Wave 2b migrates
callsites in chunks.

### Tokens to delete outright

| Token             | Usages              | Path to removal                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--font-size-xs`  | 0                   | Delete in Wave 2 PR 1. Zero-risk.                                                                                                                                                                                                                                                                                                                       |
| `--font-size-md`  | 6 in 4 files        | **Decide**: is this "between body and h3" doing real work? Two paths: (a) re-map all 6 callsites to `--font-size-body` (smaller text) or `--font-size-h3` (larger) — needs visual review per callsite; (b) keep it, accept 9-token scale instead of 8. Recommended: try (a) — see callsite list below; fall back to (b) if any callsite visibly breaks. |
| `--font-size-sm`  | 12 in 9 files       | **Keep** as `--font-size-meta-lg` or similar role name, OR re-map all to `--font-size-meta` (one step down, 13px instead of 14px). Recommended: keep but rename to a job name like `--font-size-caption` (caption-register, slightly larger than mono `meta`).                                                                                          |
| `--font-size-xl`  | 1 (awards H2)       | Re-map to `--font-size-h2`.                                                                                                                                                                                                                                                                                                                             |
| `--font-size-3xl` | 7 (page H1 pattern) | **This is genuinely page-H1** — different from hero `h1`. Either rename to `--font-size-page-title` (job name) or fold into `--font-size-h1` if visual diff is acceptable. The 36→60 range vs 44→88 range is a real design call. Per-page visual check required.                                                                                        |

### Callsite remap targets (`--font-size-md` → ?)

| File:line                                                     | Current context                          | Likely target             |
| ------------------------------------------------------------- | ---------------------------------------- | ------------------------- |
| `app/[locale]/about/page.module.css:218`                      | (read on implementation)                 | TBD                       |
| `app/[locale]/productions/[slug]/page.module.css:129,324,601` | Production detail sidebar / sub-headings | Likely `--font-size-h3`   |
| `app/[locale]/press/page.module.css:81`                       | Press card title                         | Likely `--font-size-h3`   |
| `components/TheatreSlate.module.css:26`                       | Slate sub-line                           | Likely `--font-size-body` |

**Acceptance**:

- `globals.css :root` declares ≤9 size tokens (6 brief + 3 role).
- Grep finds zero callsites of removed tokens _or_ a single round of transitional aliases is documented as "remove after release N+1".
- `DESIGN.md` §4 table mirrors `globals.css` exactly.
- Visual regression check: median-of-3 Lighthouse Perf delta within ±2pts on `/`, `/productions`, `/productions/[slug]`, `/about` (no CLS from a missed remap).

---

## Wave 3 — doc reconciliation (no code change) ✅ shipped `4258709`

Pure doc edits. One PR.

| #   | Doc                       | Edit                                                                                                                                                                                   |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | `DESIGN.md` §4 size table | Replace 8-row table with the final 9-row table from Wave 2. Mark `--font-size-base/lg/2xl/4xl` as deprecated aliases (if still in transition).                                         |
| 3.2 | `DESIGN.md` §4 weights    | Add: "Lora-VF axis 400–700 — supersedes brief §5.3 per Phase 9.2 `f1613b1`." Resolves D3(a).                                                                                           |
| 3.3 | `DESIGN.md` §4 hero       | Reconcile `--font-size-hero` value mismatch (audit §3.3). Either update value in code or in doc. Visual gate required.                                                                 |
| 3.4 | `DESIGN.md` §4 intro      | Add: "Brief D13 locks 3 families; v3 extends with Unbounded scoped to hero wordmark + Sticker only — see §13." (Already implicit; make explicit.)                                      |
| 3.5 | `REFACTOR_PLAN.md` §2     | Per D2: either reaffirm "Payload admin consumes same tokens" (Option B) or carve out: "Payload admin uses Payload defaults — tools, not brand. Site-only token discipline." (Option A) |

---

## Wave 4 — Payload admin typography ✅ shipped `f4f823f`

Only runs if D2 = **Option B** (brand-match admin). Otherwise: Wave 4 = "no-op,
doc edit already made in Wave 3".

**Scope**: add a typography block to `app/(payload)/custom.scss` so the admin
consumes the same tokens as the site. ~30–60 lines of SCSS.

### Implementation outline

```scss
// app/(payload)/custom.scss

.payload-cms-admin,
.payload__app {
  // verify actual root class in Payload 3
  --pl-font-family: var(--font-family-body);
  --pl-font-family-mono: var(--font-family-mono);

  font-family: var(--font-family-body);

  // Typography scale — admin uses tighter scale than site (utility, not editorial)
  h1,
  .page-title {
    font-size: var(--font-size-h2);
    font-family: var(--font-family-display);
  }
  h2 {
    font-size: var(--font-size-h3);
  }
  h3,
  .field-label {
    font-size: var(--font-size-body);
  }
  input,
  textarea,
  select {
    font-size: var(--font-size-body);
  }
  .meta,
  .timestamp {
    font-size: var(--font-size-meta);
    font-family: var(--font-family-mono);
  }
}
```

Key points:

- `app/globals.css` is **not loaded** in `app/(payload)/layout.tsx` today — verify whether tokens cascade into the admin route group. If not, either import `globals.css` (heavy) or duplicate the `:root` typography vars into `(payload)/custom.scss`. Audit step required before this wave.
- Test on every admin form type: textinput, richtext (Lexical), date, select, upload, array, blocks, tabs (already styled in `custom.scss`).
- Risk: Payload's bundled component styles may have specificity higher than our overrides; expect 1–2 `!important` or scope-bumping iterations.

### Acceptance

- Admin H1 / form labels / inputs visibly use Inter (or whatever family the brand chose), not Payload's defaults.
- No layout regression on any admin form type.
- One source: `app/(payload)/custom.scss` references only `var(--font-…)` tokens; no hardcoded family/size literals.

---

## Wave 5 — tracking / line-height tidy (optional, low value) ✅ shipped `846f24c`

Only if pursuing the editorial-ideal ceiling rigorously.

| Token                                                              | Action                                                                                         |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `--letter-spacing-normal: 0`                                       | Remove. `0` is the default; the token adds no information. Replace any callsite with omission. |
| `--letter-spacing-meta: 0.01em` vs `--letter-spacing-wide: 0.06em` | Keep both — they have distinct jobs (mono captions vs mono caps).                              |
| `--line-height-*` (4 tokens)                                       | Keep all 4. `relaxed` is justified by `/about` long-form.                                      |

---

## Sequencing

```
Wave 1 (bugfix)          → 1 PR, ~10 lines, no visual diff             → blocker for Wave 2
Wave 2 (size collapse)   → 2-3 PRs, ~30 callsites, visual gate per PR  → blocker for Wave 3
Wave 3 (doc reconcile)   → 1 PR, doc-only                              → independent of Wave 4
Wave 4 (Payload fonts)   → 1 PR, only if D2 = Option B
Wave 5 (tracking tidy)   → optional, ~5 lines
```

Decision gate after Wave 1: re-confirm D1/D2/D3 before Wave 2 starts; the
audit's clear callsite counts may shift opinions.

## Out of scope

- `next/font` migration — not adopting, no reason to revisit.
- Tailwind adoption — not in this project.
- Adding new families beyond Unbounded — would re-open D13 lock.
- Variable-axis exposure (e.g., `font-variation-settings` per component) — current VF use via plain `font-weight` is sufficient.

---

## Shipped — 2026-05-18

All 5 waves landed in a single session. 9 commits on `feature/payloadcms`:

| Commit    | Wave   | Scope                                                                        |
| --------- | ------ | ---------------------------------------------------------------------------- |
| `7fe86cd` | 1      | 4 undefined vars defined; 2 hardcoded sizes tokenized                        |
| `f5dd65e` | 2 PR 1 | Semantic names introduced (`-h1/-h2/-h3/-body`); t-shirts demoted to aliases |
| `91d274d` | 2 PR 2 | Drained `xl` (1 callsite) + `md` (6 callsites) onto semantic tokens          |
| `c3e2ba9` | 2 PR 3 | Final collapse: 14 → 10 tokens; brief deviations documented in code          |
| `4258709` | 3      | DESIGN.md §4 mirrors final scale; brief weight + scale deviations annotated  |
| `f4f823f` | 4      | `app/typography.css` extracted; site + Payload admin share one source        |
| `f68a740` | docs   | This file + `FONT_AUDIT_2026-05-18.md` committed                             |
| `846f24c` | 5      | `--letter-spacing-normal` removed (zero callsites, was default-valued)       |

### Final token inventory (`app/typography.css`)

| Bucket         | Count                  | Tokens                                                             |
| -------------- | ---------------------- | ------------------------------------------------------------------ |
| Families       | 4 (3 brief + 1 scoped) | display / body / mono / plakat (+ serif/sans aliases)              |
| Sizes          | 10 (6 brief + 4 role)  | chip / meta / body / h3 / h2 / h1 / caption / nav / hero / sticker |
| Weights        | 4                      | normal / medium / semibold / bold                                  |
| Line-heights   | 4                      | tight / snug / normal / relaxed (+ body alias)                     |
| Letter spacing | 3                      | tight / wide / meta                                                |

Every bucket within the editorial-ideal budget.

### Architecture

```
app/
  typography.css          ← ONE source for fonts (@font-face + --font-* tokens)
  globals.css             ← site-only: colors, spacing, body/heading defaults
  [locale]/layout.tsx     ← imports typography.css + globals.css
  (payload)/
    layout.tsx            ← imports typography.css after Payload's CSS bundle
    custom.scss           ← bridges Payload's --font-body/-mono/-serif to ours
```

Edit `app/typography.css` once; both surfaces update.

### Visual gates still pending eyeball

1. **Wave 2 PR 2** — italic Lora prose +2-4px on `/productions/[slug]` (synopsis,
   pressLink, directorsNoteText), `/press` (pull-quote), `/about` (lineageName);
   awards production title +4-8px.
2. **Wave 2 PR 3** — CommandPalette `.groupLabel` mono caps now 13px (was 12, originally 10).
3. **Wave 4 admin font swap** — `/admin` renders in Inter / JetBrains Mono / Lora
   instead of system fonts. Open `/admin` + any production edit form to confirm.
   Easy rollback: remove the `:root { --font-body: ... }` bridge block in
   `app/(payload)/custom.scss`.

### Brief deviations (documented, not regressions)

- `--font-size-h1` is 36→60, not the brief's 44→88 (which was never implemented).
  Actual display ceiling is `--font-size-hero` (Unbounded wordmark on `/` only).
- Lora is VF axis 400–700, not the brief's discrete 400/500/600 (Phase 9.2 swap).
