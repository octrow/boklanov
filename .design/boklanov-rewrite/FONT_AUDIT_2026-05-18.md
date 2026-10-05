# Font & typography audit — 2026-05-18

Snapshot of every font family, size, weight, and token in the codebase, plus a
delta against the three font-relevant docs that already exist. Goal: confirm
the "ONE source for site fonts + ONE source for Payload admin fonts" target
and surface drift before consolidating further.

Prior docs reviewed (newest first):

| Doc                                                                  | mtime           | Font scope                                                                                                                 |
| -------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `.design/boklanov-rewrite/REFACTOR_PLAN.md` §2                       | 2026-05-17      | Names `app/globals.css` as canonical token file (site + admin)                                                             |
| `DESIGN.md` §4                                                       | 2026-05-04      | Families, voice rules, fluid scale (8 sizes), tracking                                                                     |
| `.design/boklanov-rewrite/archive/tokens.md` §2                      | 2026-05-04 (ar) | Original token spec — superseded; archive is read-only                                                                     |
| `.design/boklanov-rewrite/archive/DESIGN_BRIEF.md` D13 + §5.3 + §5.4 | 2026-05-04 (ar) | **Original lock point.** D13 locks families; §5.3 locks weights; §5.4 locks a 6-step scale (display/h2/h3/body/meta/chip). |
| `.design/boklanov-rewrite/archive/DESIGN_AMBITION.md`                | 2026-05-04 (ar) | Design-essay; consumes existing tokens (chip, mono, etc.). No font redefinitions — not doctrine.                           |

Reviewed and excluded as non-doctrine:

- `archive/research_ai-design_review.md` (2026-05-08) — survey of external AI design tools (Kittl, Canva, Jotform). Font
  mentions are features of those tools, not this project.
- `archive/research_ai-design_review_opus.md` (2026-05-08) — review prompt; "font sizes" appear only in the generic a11y
  checklist.

---

## 1. Inventory — site (public-facing)

Single source of truth: **`app/globals.css`** (`@font-face` L17–256, `:root` tokens L258–457).
No `next/font`, no Tailwind, no Google Fonts CDN. All woff2, self-hosted from
`public/fonts/`, `font-display: swap`, unicode-range subsetted.

### 1.1 Families loaded

| Family             | Type     | Weights       | Subsets                          | `@font-face` at           |
| ------------------ | -------- | ------------- | -------------------------------- | ------------------------- |
| **Lora**           | VF       | 400–700 axis  | 1 file × normal + 1 × italic     | `app/globals.css:38–52`   |
| **Unbounded**      | VF       | 200–900 axis  | 3 (Cyrillic / Latin-ext / Latin) | `app/globals.css:58–89`   |
| **Inter**          | discrete | 400, 500, 600 | 3 subsets × 3 weights = 9 files  | `app/globals.css:92–189`  |
| **JetBrains Mono** | discrete | 400, 500      | 3 subsets × 2 weights = 6 files  | `app/globals.css:192–256` |

### 1.2 Family tokens (`:root` L339–347)

| Token                   | Value                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| `--font-family-display` | `'Lora', Georgia, 'Times New Roman', serif`                                |
| `--font-family-body`    | `'Inter', ui-sans-serif, system-ui, -apple-system, …, Arial, sans-serif`   |
| `--font-family-mono`    | `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, …, monospace` |
| `--font-family-plakat`  | `'Unbounded', 'Lora', Georgia, serif` (hero wordmark + Sticker only)       |

### 1.3 Size tokens (`:root` L351–376) — 14 tokens

| Token                 | Value                                            | Use                         |
| --------------------- | ------------------------------------------------ | --------------------------- |
| `--font-size-chip`    | `11px` (fixed)                                   | Chips, country code         |
| `--font-size-meta`    | `13px` (fixed)                                   | Mono captions, dates        |
| `--font-size-xs`      | `12px`                                           | (intermediate)              |
| `--font-size-sm`      | `14px`                                           | (intermediate)              |
| `--font-size-base`    | `clamp(17px, 16.5px + 0.13vw, 18px)`             | Body                        |
| `--font-size-md`      | `clamp(18px, 17px + 0.27vw, 20px)`               | (intermediate)              |
| `--font-size-lg`      | `clamp(20px, 18.7px + 0.44vw, 24px)`             | h3 / card titles            |
| `--font-size-xl`      | `clamp(24px, 20.5px + 0.93vw, 32px)`             | (intermediate)              |
| `--font-size-2xl`     | `clamp(28px, 23.6px + 1.32vw, 40px)`             | h2 / section titles         |
| `--font-size-3xl`     | `clamp(36px, 28.5px + 2.18vw, 60px)`             | (intermediate)              |
| `--font-size-4xl`     | `clamp(44px, 26.5px + 4.84vw, 88px)`             | Display / page H1           |
| `--font-size-hero`    | `clamp(36px, 23px + 4vw, 80px)` _(see §3 drift)_ | v3 Unbounded hero wordmark  |
| `--font-size-sticker` | `clamp(11px, 10.5px + 0.13vw, 13px)`             | v3 Unbounded sticker badges |
| `--font-size-nav`     | `clamp(13px, 11.5px + 0.16vw, 16px)`             | Header nav links (≥1024px)  |

### 1.4 Weight tokens (`:root` L378–381)

`--font-weight-normal: 400`, `--font-weight-medium: 500`, `--font-weight-semibold: 600`, `--font-weight-bold: 700`.

### 1.5 Line-height + tracking (`:root` L383–391)

`--line-height-tight 1.15`, `--line-height-snug 1.3`, `--line-height-normal 1.55`, `--line-height-relaxed 1.7`.

`--letter-spacing-tight -0.015em`, `--letter-spacing-normal 0`, `--letter-spacing-wide 0.06em`,
`--letter-spacing-meta 0.01em`.

### 1.6 Print overrides

`app/globals.css:687–756` reuses the same tokens; only the print body sets
`11pt` / `9pt` literals inside `@media print` — intentional.

---

## 2. Inventory — Payload CMS admin

**No custom font configuration exists.** Admin inherits Payload's defaults.

- `app/(payload)/layout.tsx:16` imports only `'@payloadcms/next/css'`.
- `app/(payload)/custom.scss` (13 lines) contains only `.tabs-field__*` vertical-density tweaks. Zero typography.
- `payload.config.ts` has no font config.
- No `components/admin/**` inline `style={}` typography overrides found.

This is the gap REFACTOR_PLAN §2 anticipates: "Payload admin … consumes the
same `var(--token-name)` set so the admin can never visually drift from the
public site." Today it does drift — admin uses whatever stack Payload ships
with, not our `--font-family-*` tokens.

---

## 3. Drift / violations vs prior docs

### 3.1 Undefined CSS vars referenced in components (REFACTOR_PLAN §2 violation — "no magic values, consume tokens")

| Var referenced        | Where                                                                             | Likely intended target  |
| --------------------- | --------------------------------------------------------------------------------- | ----------------------- |
| `--font-size-body`    | `GalleryLightbox.module.css:73`; `productions/[slug]/page.module.css:641,654,678` | `--font-size-base`      |
| `--font-family-serif` | `CommandPalette.module.css:84`; `productions/[slug]/page.module.css:640`          | `--font-family-display` |
| `--font-family-sans`  | `productions/[slug]/page.module.css:653,677`                                      | `--font-family-body`    |
| `--line-height-body`  | `productions/[slug]/page.module.css:655,679`                                      | `--line-height-normal`  |

These resolve to the browser's `unset` cascade today — visually they fall through to inherited values, which is why
they've gone unnoticed.

### 3.2 Hardcoded font sizes

| File                                                 | Value    | Fix                                                                                     |
| ---------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `components/CommandPalette.module.css:103`           | `10px`   | New token `--font-size-groupLabel` _or_ use `--font-size-xs` (12px) and accept the +2px |
| `components/FilteredProductionsPanel.module.css:153` | `0.75em` | Replace with explicit token, or document intent as a deliberate relative size           |

### 3.3 Doc/code drift

| Discrepancy                                                                                                                                                                           | Resolution                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DESIGN.md` §4 size table lists 8 tokens; `globals.css` actually defines **14**. Missing from the doc: `xs`, `sm`, `md`, `xl`, `3xl`, `nav`.                                          | Update DESIGN.md §4 table to mirror globals.css. `tokens.md` (archived) called these "intermediate steps not mandatory" — they're now in use, so they need to be documented as first-class.                                       |
| `--font-size-hero` declared as `clamp(36px, 23px + 4vw, 80px)` in `globals.css:362`, but `DESIGN.md:109` and `DESIGN.md:331` say `48px → 96px` (post fix-pass `2388511`).             | Reconcile: either the code wasn't updated to the documented narrow, or the doc value is stale. **Visual check needed** before changing — fix-pass `2388511` already narrowed once.                                                |
| `tokens.md` (archive) lists Lora weights as `400, 500, 600`. Reality: Lora is now a single VF with axis `400–700` (commit `f1613b1` "Lora variable font swap — 11 subsetted → 2 VF"). | Archive is read-only by policy; flag in the new doc that `tokens.md` is **superseded** by `DESIGN.md` + `globals.css` for fonts.                                                                                                  |
| `tokens.md` §2.1 says "self-hosted from `public/fonts/`; no Google Fonts CDN" — still true. ✓                                                                                         | No action.                                                                                                                                                                                                                        |
| **`DESIGN_BRIEF.md` §5.3 (the lock) lists Lora weights `400, 500, 600`.** Same upstream drift — VF axis swap was never reflected in the brief.                                        | Brief is archived (read-only). Note the deviation explicitly in `DESIGN.md` §4 ("Lora-VF 400–700 axis — supersedes brief §5.3 per Phase 9.2 commit `f1613b1`"), so future readers don't think the brief is canonical for weights. |
| **`DESIGN_BRIEF.md` §5.4 (the lock) specifies a 6-step scale**: display, h2, h3, body, meta, chip. Code has 14 tokens.                                                                | The brief is the ceiling. Either (a) acknowledge the 8 additions (xs/sm/md/xl/3xl/hero/sticker/nav) as documented extensions in `DESIGN.md` §4, or (b) remove the unused intermediate steps. See §6 Q3.                           |
| **`DESIGN_BRIEF.md` D13 names 3 families** (Lora, Inter, JetBrains Mono). Code adds **Unbounded** as a 4th.                                                                           | Already documented as a "v3 addition" in `DESIGN.md` §4 + `DESIGN_v3_PROPOSAL.md`. ✓ No further action — extension is properly bounded ("hero wordmark + Sticker only").                                                          |
| REFACTOR_PLAN §2 mandates Payload admin consumes the same tokens. Current admin uses Payload defaults.                                                                                | Decision needed — see §5.                                                                                                                                                                                                         |

### 3.4 No-issue findings (drift checked, none found)

- No `next/font` imports anywhere (matches DESIGN.md §4 "no Google Fonts CDN" stance).
- No `tailwind.config.*` typography utilities (no Tailwind in this project).
- No duplicate `@font-face` declarations.
- All 20 component modules under `components/*.module.css` consume `var(--…)` tokens for typography (except the two
  hardcoded values in §3.2).
- `@fontsource/inter` removed from `package.json` 2026-05-17 (MAP.md L70) — no orphan dep.

---

## 4. State of "ONE place" goal

| Scope         | Source of truth             | State                                                                                        |
| ------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| Site fonts    | `app/globals.css`           | ✅ Centralized. 6 small bugs (4 undefined vars + 2 hardcoded sizes). Doc drift in DESIGN.md. |
| Payload admin | _(none — Payload defaults)_ | ❌ Not centralized. REFACTOR_PLAN §2 says it should be, but no implementation.               |

---

## 5. Recommendation

### Site — 4 small fixes, no architectural change

1. Define the 4 missing aliases in `globals.css :root`:
   ```css
   --font-size-body: var(--font-size-base);
   --font-family-serif: var(--font-family-display);
   --font-family-sans: var(--font-family-body);
   --line-height-body: var(--line-height-normal);
   ```
   (Or rename the 6 callsites — pick whichever costs less churn.)
2. Replace the 2 hardcoded sizes with tokens.
3. Update `DESIGN.md` §4 size table to list all 14 tokens — match `globals.css`.
4. Reconcile `--font-size-hero` value: pick code or doc, update the other.

### Payload admin — pick ONE of two options, then document

**Option A: declare "Payload uses Payload defaults" as intentional.**

- Amend REFACTOR_PLAN §2 to carve out Payload typography.
- Rationale: admin is a tool, not the brand; performance + zero maintenance win.
- Action: 1-line doc edit. No code change.

**Option B: brand-match the admin to the site (matches existing REFACTOR_PLAN §2 intent).**

- Add a typography block to `app/(payload)/custom.scss` scoped under Payload's
  admin root, consuming the same `--font-family-*` and `--font-size-*` tokens.
- `app/globals.css` already loads the fonts; admin gets them for free.
- Risk: Payload's default form/menu styles may need spacing nudges if Inter's
  metrics differ from Payload's bundled stack.
- Action: ~30–60 lines of SCSS in `app/(payload)/custom.scss`.

Either way, **one doc line + one code location per scope** is the end state.
That's what "ONE place" looks like.

---

## 6. Open questions for Daniil

1. **Option A or B** for Payload admin? (Default per REFACTOR_PLAN §2 is B.)
2. `--font-size-hero` — is `clamp(36px, …, 80px)` (code) or `clamp(48px, …, 96px)` (doc) the source of truth?
3. The 5 intermediate scale tokens (`xs/sm/md/xl/3xl`) — promote to first-class in `DESIGN.md` §4, or remove the unused
   ones from `globals.css`?
