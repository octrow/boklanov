# DESIGN v2 PROPOSAL — Vitrine

Capital-V Visual v2 direction for boklanov.com. Updated: 2026-05-02.

Owns: Direction B selection rationale, three §11 unfreeze events, token deltas, component grammar deltas, motion
proposal, imagery treatment, risk register, 8-phase implementation order.

History (read-only): `archive/RESEARCH_2026.md` (prompt), `archive/RESEARCH_OPUS.md` (selected basis verbatim),
`archive/RESEARCH_GEMINI.md` (convergence evidence). On conflict, this file overrides the archived research. On conflict
with `DESIGN.md`, the unfreeze procedure of MAP.md §5 applies before this file ships.

## 0. Decision summary

Two directions were proposed by the research (Slate / Vitrine). Vitrine selected — preserves the 2026-05-02 mood axis (
curatorial, quiet, declarative; warm paper + hairlines) but pushes editorial volume up to a Cabinet-of-Curiosities
catalogue raisonné register. Roman's 419 photographs and 24 productions become numbered specimens, not floating cards.

Three §11 anti-patterns lifted with narrowed replacement guards (§2). Five refreshed/new components (§4). Three motion
patterns within the locked `prefers-reduced-motion` floor (§5). Frontmatter remains source-of-truth — no breaking schema
change; one optional `coverStyle` field with build-time default.

Audience: theatre festival programmers + critics/peers. Curator-90s mobile test (DESIGN.md §1) preserved.

### 0.1 Corrections to the Opus research basis

The four corrections folded into this proposal vs `archive/RESEARCH_OPUS.md`:

| # | Opus original                                                | This proposal                                                                                                                                          | Reason                                                                                                                                                                                                            |
|---|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | DottedProgress component + spinner-ban lift                  | Dropped. 3 lifts not 4.                                                                                                                                | Static-first site has no in-flight states the user observes long enough to need a progress register; mailto leaves the page; LQIP→AVIF is sub-100ms on cold cache. Solution in search of a problem.               |
| 2 | New `--rule-hairline: 0.5px solid …` token                   | Reuse existing `--rule` (1px @ 10% opacity) and `--rule-strong` (1px @ 18%)                                                                            | 0.5px renders as 0 or 1 unpredictably across DPR; existing tokens already cover the visual range.                                                                                                                 |
| 3 | Phase 9 frontmatter migration introducing `coverStyle` field | Folded into Phase 8 with build-time computed default `poster?.src && poster?.lqip ? 'photo' : 'typographic'`                                           | No 24-file edit needed; opt-in override remains available via explicit `coverStyle: 'typographic'` for shows that have a poster but want the typographic register. Roman never has to touch existing frontmatter. |
| 4 | Lora-VF swap unverified against DA-3.A                       | Verified 2026-05-02. `components/SlateStrike.module.css` does not reference `font-weight` or `Lora`; wordmark inherits from global type. Swap is safe. | Grep evidence: no `font-weight` or font-family references in `SlateStrike.module.css`.                                                                                                                            |

## 1. Mood axis update

Append to `DESIGN.md` §2 — does not replace existing rows.

| Yes (added)                                                     | No (added)                                                 |
|-----------------------------------------------------------------|------------------------------------------------------------|
| Catalogue raisonné register (numbered plates, archival caption) | Catalogue marketing register (collection, "shop the look") |
| Variable-weight Lora as breath, not animation                   | Kinetic interpolation between weights                      |
| Mono labels with hairline underline (no fill, no radius)        | Coloured pill chips, status hue                            |
| 1px low-contrast inset rule on photographic plates              | Outset shadow, blur radius >0, hover lift                  |

## 2. §11 anti-pattern lifts (three unfreeze events)

Each row below corresponds to one MAP.md §5 unfreeze commit against `archive/DESIGN_BRIEF.md` §8 with mirror to
`DESIGN.md` §11. One commit per lift. The `archive/DESIGN_BRIEF.md` row gets
`_Superseded 2026-05-02: see DESIGN_v2_PROPOSAL.md §2_`. Never overwrite.

### 2.1 Drop-shadow glow on cards → specimen rule (inset only)

| Field             | Value                                                                                                                                                                                                                                                                                                                                                                                |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Original ban      | "Drop-shadow glow on cards, neon focus" — Tailwind `shadow-xl` reflex from Phase 1                                                                                                                                                                                                                                                                                                   |
| Reason to lift    | Holiday Magazine's 2014 relaunch and Cabinet Magazine's 2022 redesign both use 1px low-contrast inset borders/shadows on photographic plates to signal "object catalogued, not floated" — opposite failure mode from `shadow-xl`. It's Nice That's 2026 specimen-plate piece reinforces this as an active editorial register. (Archived sources in `archive/RESEARCH_OPUS.md` §9.4.) |
| Replacement guard | New token `--specimen-rule: inset 0 0 0 1px rgb(22 21 20 / 0.08)` applied **only** when `coverStyle === 'photo'` AND viewport ≥ 768px. Forbidden in CSS Modules outside `SpecimenPlate.module.css`. NEVER blur radius >0. NEVER outset. NEVER coloured. NEVER on hover.                                                                                                              |
| Risk to identity  | Low-medium. Original ban was anti-Tailwind reflex; an inset 1px is not a glow. Risk is creep — junior contributor adds `blur-radius`. Mitigated by stylelint rule.                                                                                                                                                                                                                   |
| Rollback trigger  | If any reviewer cannot tell within 100ms whether a card is "framed" or "floating," roll back. If Lighthouse Accessibility drops on contrast, roll back.                                                                                                                                                                                                                              |

### 2.2 Coloured chip pills → specimen mono labels

| Field             | Value                                                                                                                                                                                                                                                                                                                                                              |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Original ban      | "Coloured chip pills (status -> font weight, not hue)" — anti-Jira reflex                                                                                                                                                                                                                                                                                          |
| Reason to lift    | The §11 ban targets pastel pill-shaped containers. Specimen-label editorial design uses tracked all-caps mono labels with a hairline underline — the form is opposite: angular, type-led, not pill-shaped. Roman's `form[]` and `tags[]` are real metadata that need typographic surface; rendering them as plain text loses scannability for a 90s mobile reader. |
| Replacement guard | Chips become "specimen labels": `text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-mono); font-size: var(--font-size-chip); padding: 0; border-bottom: 1px solid var(--rule); background: none; border-radius: 0`. NEVER background-fill. NEVER coloured beyond `--ink-mute`. Multiple labels separated by em-dash, not comma.            |
| Risk to identity  | Medium. Pill ban was symbolic. Replacing with mono labels resolves underlying problem. Risk is the new label looking like a form field — mitigated by removing all border-radius and `padding-inline`.                                                                                                                                                             |
| Rollback trigger  | If clickability is implied (labels are non-interactive metadata) or any contributor adds `background-color`, roll back.                                                                                                                                                                                                                                            |

### 2.3 Tailwind `rounded-2xl/shadow-xl` → 2px radius scoped to form chrome

| Field             | Value                                                                                                                                                                                                                                                                |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Original ban      | "Tailwind defaults `rounded-2xl shadow-xl`" — anti-marketing-template reflex                                                                                                                                                                                         |
| Reason to lift    | Strict reading made absolute zero-radius feel like brutalism we did not ask for. Print-echo editorial uses 2px radii on input fields and dialogs to read as paper-cut, not card-game. The site's only form is Cmd-K.                                                 |
| Replacement guard | New token `--border-radius-form: 2px` allowed **only** on `<input>`, `<textarea>`, `<select>`, `<dialog>`, and `kbd`. NEVER on a card, image, or button. Existing `--border-radius-sm: 2px` for chips/buttons stays unchanged (chips become labels per §2.2 anyway). |
| Risk to identity  | Low. 2px on form chrome is invisible at the cards/images scale where the original ban mattered.                                                                                                                                                                      |
| Rollback trigger  | If any card, image, or button border-radius is non-zero in computed styles, roll back.                                                                                                                                                                               |

### 2.4 Rejected lifts (discipline proof, do not unfreeze)

Two further trends were considered and explicitly rejected. Recorded here so future contributors don't re-relitigate.

| Item                                                       | Why rejected                                                                                                                                                                                   |
|------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Hand-drawn underlines (Canva 2026 "Imperfect by Design")   | Conflicts with locked oxblood hover-underline reveal — two underlines cannot compete; oxblood wins. Cannot be made consistent across RU/EN/DE diacritics. AA-contrast risk on long underlines. |
| Parallax / scroll-driven entrances (multiple 2026 reports) | `prefers-reduced-motion: reduce` zeros all `--duration-*`. Parallax cannot collapse to a no-op without becoming nothing → it is decoration, not communication. §11 ban is correct.             |

## 3. Token deltas

Against current `DESIGN.md` §3–§6 and `app/globals.css`. CSS custom properties only.

```css
/* Additions */
--specimen-rule: inset

0
0
0
1
px
rgb

(
22
21
20
/
0.08
)
; /* §2.1 — photographic plates only, ≥768px, scoped to SpecimenPlate.module.css */
--border-radius-form:

2
px

; /* §2.3 — form chrome only (input, textarea, select, dialog, kbd) */
--measure-caption:

36
ch

; /* SpecimenPlate caption block max-width */
--gutter-margin-pull:

-
1.25
rem

; /* Marginalia float-into-margin from ≥1024px */
--ink-marginalia:
rgb

(
22
21
20
/
0.55
)
; /* Marginalia secondary register; AA verified vs --paper */

/* Changes */
--paper: #F2F0EA

; /* was #F4F2EC — one notch warmer to seat Lora's calligraphic axis on the page; AA recomputed against --ink */
--font-serif-stack:

'Lora VF'
,
'Lora'
,
Georgia, serif

; /* was 'Lora', Georgia, serif — Phase 9.2 swap */

/* Removals (after Phase 9.2 lands; not before) */
/* The static @font-face declarations for Lora-Regular/-Bold/-Italic woff2 are removed */
/* once Lora-VariableFont_wght.woff2 + Lora-Italic-VariableFont_wght.woff2 are wired. */
```

Items deliberately **not** introduced (vs Opus original):

- `--rule-hairline: 0.5px …` — rejected, see §0.1 correction #2. Use existing `--rule` and `--rule-strong`.
- `--label-mono-tracking`, `--label-mono-size` — rejected as redundant with existing `--letter-spacing-wide` and
  `--font-size-chip`.
- `--lora-wght-axis-min/max` — rejected as not consumed at runtime (axis range is implicit in the VF file).

### 3.1 Font file accounting

Current self-hosted Lora set: `Lora-Regular.woff2` (~74KB) + `Lora-Italic.woff2` (~68KB) + `Lora-Bold.woff2` (~74KB) = ~
216KB across 3 round-trips, with separate Cyrillic subsets per weight.

Phase 9.2 swap: `Lora-VariableFont_wght.woff2` (~76KB) + `Lora-Italic-VariableFont_wght.woff2` (~76KB) covering the wght
axis 400–700. Net **−64KB** on font budget, **−4 HTTP requests** (Cyrillic subsets collapse into one VF file per axis).
Inter and JetBrains Mono unchanged.

The Cyrillic subset must remain — Roman ships RU production-card titles. Validation: Lighthouse `font-display: swap` +
size-adjust on Georgia fallback; CLS regression must stay < 0.05 (Phase-1 lock).

## 4. Component grammar deltas

Six refreshed/new components. Each is one self-contained CSS Module + one React 19 server-or-client component. None
requires a backend, runtime CSS-in-JS, or a frontmatter migration. MDX usage examples reference real fields from
`CONTENT.md` §Frontmatter shape.

### 4.1 TheatreSlate (refresh)

Purpose: Render a production's identifying record as a four-line typographic slate — title / theatre / role / year —
modeled on Schaubühne's per-show metadata block.

Used on: `/`, `/productions`, `/productions/[slug]`.

```mdx
<TheatreSlate
  title={frontmatter.title}
  theatre={frontmatter.theatre}
  role={frontmatter.role}
  year={frontmatter.year}
  premiereDate={frontmatter.premiereDate}
/>
```

```css
.slate {
  display: grid;
  gap: var(--space-1);
  padding-block: var(--space-5);
  border-top: 1px solid var(--rule);
}

.title {
  font-family: var(--font-serif-stack);
  font-weight: 600;
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-tight);
}

.theatre {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
}

.role {
  font-family: var(--font-mono);
  font-size: var(--font-size-chip);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ink-marginalia);
}

.year {
  font-family: var(--font-mono);
  font-size: var(--font-size-chip);
  font-variant-numeric: tabular-nums;
}
```

A11y: title is `<h2>` on index routes, `<h1>` on detail; role line is plain text, not `role="button"`; reduced-motion
irrelevant (no transitions).

§7 row replacement: refreshes existing TheatreSlate (right-rail mono spec sheet); becomes the dominant unit on `/` and
`/productions`.

### 4.2 SpecimenPlate (new)

Purpose: Photographic plate with archival caption — replaces the floating gallery image for `coverStyle === 'photo'` and
for `/productions/[slug]` gallery items.

Used on: `/productions/[slug]` (gallery), `/archive`, `/about` (photos[]).

```mdx
<SpecimenPlate
  src={image.src}
  lqip={image.lqip}
  alt={image.alt}
  credit={image.credit ?? null}
  plateNumber={index + 1}
  total={gallery.length}
/>
```

```css
.plate {
  display: grid;
  gap: var(--space-2);
}

.frame {
  box-shadow: var(--specimen-rule);
  background: var(--paper);
}

.caption {
  font-family: var(--font-mono);
  font-size: var(--font-size-chip);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--ink-marginalia);
  display: flex;
  gap: var(--space-2);
}

.index {
  font-variant-numeric: tabular-nums;
}

.credit {
  max-width: var(--measure-caption);
}

@media (max-width: 767px) {
  .frame {
    box-shadow: none;
  }
}
```

A11y: `<figure>` + `<figcaption>`; if credit is null, render `plate {n}/{total}` only — never apologetic "Credit
unknown"; reduced-motion irrelevant.

§7 row replacement: supersedes raw `next/image` in gallery layout. Composes with `PosterLightbox` (existing session-5
component) — Lightbox wraps the plate `<button>`.

### 4.3 Marginalia (refresh — louder)

Purpose: Render `runs[]`, `lineage[]`, and director's-note pull-quotes in the right margin from ≥1024px, as a footnoted
editorial voice rather than a mono caption.

Used on: `/about`, `/productions/[slug]`, `/press`.

```mdx
<Marginalia kind="run">
  {frontmatter.runs.map(r => <RunRow key={r.venue} {...r} />)}
</Marginalia>
<Marginalia kind="pull" lang="en">{frontmatter.directorsNote.en.slice(0, 240)}</Marginalia>
```

```css
.marginalia {
  font-family: var(--font-sans);
  font-size: var(--font-size-meta);
  color: var(--ink-marginalia);
  line-height: var(--line-height-snug);
}

.marginalia--pull {
  font-family: var(--font-serif-stack);
  font-style: italic;
  font-size: var(--font-size-base);
  color: var(--ink);
}

@media (min-width: 1024px) {
  .marginalia {
    float: right;
    width: 18ch;
    margin-right: var(--gutter-margin-pull);
  }
}
```

A11y: `<aside>` with `aria-hidden="true"` for the gutter render (the inline mobile fallback already announces); below
1024px, collapses inline below the prose paragraph it annotates.

Localization: `kind="pull"` renders `directorsNote.<active-locale>` if present, else falls back to `directorsNote.ru`
with explicit `lang="ru"` attribute (italics already imply quote). `kind="run"` is data-only — RunRow inherits chrome
locale formatting. This matches `directorsNote`'s status as editorial body content (localized per locale), distinct from
production-card chip metadata (which stays RU/EN regardless per D4).

§7 row replacement: refreshes DA-7.6.A Marginalia. The `pull` variant is new (replaces inline italic Lora subordinate
text).

### 4.4 TourRider (new)

Purpose: Render the production's technical and tour metadata as a real tech rider — mono key/value rows, no decoration.

Used on: `/productions/[slug]`.

```mdx
<TourRider
  durationMin={frontmatter.durationMin}
  ageRating={frontmatter.ageRating}
  form={frontmatter.form}
  lineage={frontmatter.lineage}
  techRider={frontmatter.techRider}
  pressKit={frontmatter.pressKit}
/>
```

```css
.rider {
  font-family: var(--font-mono);
  font-size: var(--font-size-chip);
  letter-spacing: var(--letter-spacing-wide);
}

.row {
  display: grid;
  grid-template-columns: 12ch 1fr;
  column-gap: var(--space-3);
  padding-block: var(--space-2);
  border-bottom: 1px solid var(--rule);
}

.key {
  text-transform: uppercase;
  color: var(--ink-marginalia);
}

.val {
  color: var(--ink);
}

.doc {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
```

Behaviour: short-circuits on null fields — never renders a row with placeholder text "TBD"; TypeScript narrow type
prevents `techRider: null` from rendering as a link. Documented in `CONTENT.md` so omitting the field omits the row.

A11y: `<dl>` with `<dt>` / `<dd>`; PDF link receives `aria-label="Technical rider, PDF"` and download size;
reduced-motion irrelevant.

§7 row replacement: supersedes the existing "ON TOUR band" implementation when `tour[]` is populated; on
`/productions/[slug]` the slate's `LANGUAGE` row (DA-7.6.F) is absorbed here.

### 4.5 TypographicCover (new)

Purpose: Canonical cover for the 20+ shows lacking `poster.src` — rendered as a typographic plate, **not** a fallback.
The frame is the cover.

Used on: `/productions`, `/productions/[slug]`, `/`.

```mdx
<TypographicCover
  title={frontmatter.title}
  theatre={frontmatter.theatre.shortName}
  year={frontmatter.year}
  form={frontmatter.form?.[0]}
/>
```

```css
.cover {
  aspect-ratio: 4 / 5;
  background: var(--paper);
  border: 1px solid var(--rule);
  display: grid;
  grid-template-rows: 1fr auto;
  padding: var(--space-4);
}

.title {
  font-family: var(--font-serif-stack);
  font-size: var(--font-size-4xl);
  line-height: var(--line-height-tight);
  align-self: end;
}

.meta {
  font-family: var(--font-mono);
  font-size: var(--font-size-chip);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ink-marginalia);
}
```

Variant rule (per Risk #5 in §6): cover layout is varied by hashing `slug` mod 3 — top-set / bottom-set / centre-set
title placement. No colour or imagery variation. When `synopsis.<locale>` is present, an optional 1-line Lora-italic
synopsis renders above the meta block — adds a second axis of differentiation when slug-hash collides on
theatre/city/year.

A11y: `<figure>` with `<figcaption>` repeating title for SR; reduced-motion irrelevant.

§7 row replacement: formalises the no-poster fallback (DESIGN.md §10). Existing typographic treatment is wrapped in this
component.

### 4.6 EmptyState / ERRATA (refresh)

Purpose: When a content field is null and rendering would otherwise fall back to placeholder text, render the absence as
a deliberate typographic register.

Used on: `/productions` (filter empty), `/archive`, `/awards`, `/press`, Cmd-K palette no-results.

Existing implementation (`e1920af`): hairline + ERRATA mono caps + italic Lora body + action slot. Refresh: replace mono
ERRATA chip with Lora italic that **completes a sentence** in the locale chrome — never reads as a UI state.

```mdx
<Errata kind="poster-absent" lang="en" title={frontmatter.title.en} year={frontmatter.year} />
```

Sentence templates (RU / EN / DE chrome):

- `kind="filter-empty"`: "Нет спектаклей по этим фильтрам." / "No productions match these filters." / "Keine
  Inszenierungen entsprechen diesen Filtern."
- `kind="poster-absent"`: rendered inside TypographicCover; never as a separate Errata.
- `kind="awards-empty"`: "Награды ещё не каталогизированы." / "Awards not yet catalogued." / "Auszeichnungen noch nicht
  katalogisiert."
- `kind="press-empty"`: "Пресса ещё не подшита." / "Press not yet filed." / "Presse noch nicht abgeheftet."

```css
.errata {
  font-family: var(--font-serif-stack);
  font-style: italic;
  color: var(--ink-marginalia);
  font-size: var(--font-size-base);
  line-height: var(--line-height-snug);
  padding-block: var(--space-5);
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.year {
  font-family: var(--font-mono);
  font-style: normal;
}
```

A11y: `role="status"` and `aria-live="polite"` for filter interactions; reads as a complete sentence in the active
locale; reduced-motion irrelevant.

§7 row replacement: refreshes DA-7.6.J EmptyState — keeps register, removes ERRATA chip in favour of complete-sentence
body.

## 5. Motion within the reduced-motion floor

Three patterns. None depend on scroll position. None depend on parallax. All collapse to no-ops under
`prefers-reduced-motion: reduce`.

### 5.1 Hover-underline reveal (locked, formalised)

Already shipped (`--duration-fast 150ms`, oxblood, primary links + CTAs). Physics rationale recorded for future
contributors: a tethered object held at one end and released to find its full extension. Not a swing — a controlled
reach with a fixed pivot. Reduced-motion: collapses to instant `scaleX(1)` — the underline simply appears.

### 5.2 SpecimenPlate caption settle (new)

When a SpecimenPlate receives keyboard focus, the caption block translates by 2px on the y-axis over `--duration-fast`,
creating a perceptible "settle" against the inset rule. Physics: a small object on a string, lifted briefly when the
cabinet is opened, returning to rest weighted by gravity. The plate itself does not move — only the caption "shifts in
its slot." Reduced-motion: zero translate; focus is signalled by the existing oxblood focus ring, which AA-passes on its
own.

### 5.3 Marginalia pull-text settle (≥1024px only, new)

On viewport intersection with the prose column, a Marginalia pull-quote receives a 1px x-axis translation from −1px to 0
over `--duration-normal`. Physics: a marginal note pinned slightly off-square, gently squared by an editor's thumb.
Below kinetic-typography threshold (no character-level deformation, no per-glyph delay). Reduced-motion: zero
translation — pull-quote renders at final position from first paint.

### 5.4 What is **not** in this proposal

- Page-transition `--ink`-then-`--paper` fade ("Stage Blackout", proposed by Gemini): rejected, conflicts with locked
  DA-3.A timing and existing 200ms page-fade.
- DottedProgress sequential reveal (proposed by Opus): rejected, see §0.1 correction #1.
- Any new home-paint gesture: rejected, DA-3.A slate-strike + DA-3.C edition-frame fallback are locked (STATUS.md
  Constraints).

## 6. Imagery treatment

### 6.1 Photographic processing recipe

Applied to every photograph in `/productions/[slug]` gallery, `/about` photos, and any photographic poster. CSS + static
SVG, no canvas, no JS:

```css
.plate__img {
  filter: contrast(1.04) saturate(0.92) brightness(0.99);
  background-image: url('/img/grain-tile-128.svg');
  background-size: 128px 128px;
  background-blend-mode: multiply;
}

@media (prefers-reduced-transparency: reduce) {
  .plate__img {
    background-image: none;
  }
}
```

The grain is a static SVG with `<feTurbulence baseFrequency="0.9" numOctaves="2"/>` exported once; `opacity: 0.04`
inside the SVG; tile 128×128, file < 2KB. Filters remain under reduced-transparency (they are not transparency).

The contrast/saturate/brightness triplet recovers contrast lost to the warmer paper colour and pulls saturation off the
punchy chromaticity AVIF compression tends to push toward. Yields a uniform across-portfolio register sitting between
Holiday Magazine's photographic warmth and Cabinet Magazine's archival neutrality.

### 6.2 Typographic-cover system for the 20+ posterless shows

Gated by `coverStyle === 'typographic'`, computed at build time as
`poster?.src && poster?.lqip ? 'photo' : 'typographic'` unless explicitly overridden in frontmatter. The
TypographicCover component (§4.5) is canonical — not a fallback.

Composition rules:

- Title in Lora 600 (variable axis) at `--font-size-4xl`, line-height tight, RU OR EN per locale chrome.
- Three-line meta block in JetBrains Mono uppercase, tracked at `--letter-spacing-wide`: theatre.shortName /
  city,country / year.
- Slug-hash mod 3 chooses bottom-set / top-set / centre-set title placement to avoid visually identical plates when two
  productions share theatre/city/year.
- Optional 1-line Lora-italic synopsis above the meta block when `synopsis.<locale>` is present (truncated to 60 chars).
  Provides a second differentiation axis on collision.
- Aspect ratio locked to 4:5 to match poster placeholders so the index grid doesn't reflow when poster vs typographic
  covers are mixed.

### 6.3 Credit-rendering

The `gallery[].credit` field is null for ~80% of records. CreditLine logic:

- If `credit` is null: render `plate {n}/{total}` only (from SpecimenPlate caption). Never "Credit unknown."
- If `credit` is a string: render as `Photo — {credit}` in JetBrains Mono.
- The component renders nothing in the credit slot when null; null is null and the layout adapts.

Discipline borrowed from museum catalogue raisonnés where partial provenance is rendered as an honest cataloguing fact,
not a UI absence.

## 7. Risk register

Top 5 risks in Direction B, scored 1–5 across {identity dilution, accessibility regression, performance regression,
MDX-author friction for Roman, locale breakage}. Mitigations required for any score ≥3.

| # | Risk                                                                            | ID | A11y | Perf | Author | Locale | Mitigation                                                                                                                                                                                                                               |
|---|---------------------------------------------------------------------------------|---:|-----:|-----:|-------:|-------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | `--specimen-rule` applied to non-photographic plates                            |  4 |    1 |    1 |      2 |      1 | Lock token usage to `SpecimenPlate.module.css`; add stylelint rule rejecting `var(--specimen-rule)` outside that file; Playwright visual regression on home fails if any non-photographic card has non-zero `box-shadow`.                |
| 2 | Mono "specimen labels" misread as form fields by SR users                       |  1 |    4 |    1 |      1 |      2 | Render labels as plain `<span>` with no role; verify with axe-core that they are not announced as interactive; visible `lang` attributes when label content is locale-specific (RU genre terms beside DE chrome).                        |
| 3 | Lora-VF fails to load on slow EU rural mobile, falls back to Georgia mid-paint  |  3 |    1 |    4 |      1 |      3 | Self-host with `font-display: swap`; preserve Phase-1 `size-adjust`/`ascent-override`/`descent-override` on Georgia fallback (CLS < 0.05); subset to Latin + Cyrillic only; ship 76KB woff2 cap.                                         |
| 4 | TourRider rendering null `techRider` PDF link as empty `<a>`                    |  1 |    3 |    1 |      4 |      2 | Component short-circuits on null fields — no row, never placeholder; TypeScript narrow type prevents `null` link rendering; contract documented in `CONTENT.md`.                                                                         |
| 5 | TypographicCover producing visually identical plates (shared theatre+city+year) |  4 |    1 |    1 |      2 |      3 | Slug-hash mod 3 chooses one of three layouts (top/centre/bottom-set title) — purely typographic. Documented in this file §6.2 so reviewers know identical-feeling covers across an index grid is a content data issue, not a design bug. |

DottedProgress-related risks from Opus (perf jitter on sequential reveal, race vs LQIP) are eliminated by §0.1
correction #1.

## 8. Implementation order — 3 unfreeze commits + 8 code phases

All work happens on `main`. No feature branch (per session decision 2026-05-02). Each row is a single shippable commit
on `main`, deploys to `boklanov.vercel.app` independently, and can be reverted with `git revert HEAD~N`. Roman does not
see `boklanov.vercel.app` (birthday surprise constraint) — Vercel preview is for Daniil's review only.

Push to `main` blocked by safety hook — Daniil pushes manually after each phase.

|    # | Subject                                                                                                                                                                                                                                                                                                                          | Reversible | Touches frontmatter?  |
|-----:|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|-----------------------|
| 9.0a | Unfreeze §11 row "Drop-shadow glow on cards" → specimen rule. Append `_Superseded 2026-05-02: see DESIGN_v2_PROPOSAL.md §2.1_` to `archive/DESIGN_BRIEF.md` §8 row; mirror narrowed rule to `DESIGN.md` §11.                                                                                                                     | yes        | no                    |
| 9.0b | Unfreeze §11 row "Coloured chip pills" → specimen mono labels. Same procedure, see §2.2.                                                                                                                                                                                                                                         | yes        | no                    |
| 9.0c | Unfreeze §11 row "Tailwind defaults `rounded-2xl shadow-xl`" → 2px radius scoped to form chrome. Same procedure, see §2.3.                                                                                                                                                                                                       | yes        | no                    |
|  9.1 | Token deltas in `app/globals.css` — additions + paper warm shift + AA recompute. No component changes. Acceptance: visual A/B on Daniil's monitor must read as paper, not cream — if perceived as cream, revert to `#F4F2EC` and re-propose. Site looks ~98% identical; only `--paper` and `--ink-marginalia` perceptibly shift. | yes        | no                    |
|  9.2 | Lora variable swap — replace 6 static `@font-face` declarations (Latin+Cyrillic × Regular/Bold/Italic) with 2 VF `@font-face` declarations. Net −64KB, −4 round-trips. Verify CLS < 0.05.                                                                                                                                        | yes        | no                    |
|  9.3 | TheatreSlate refresh — re-render four-line slate with VF wght axis and mono role line. Backward-compatible with all 24 productions.                                                                                                                                                                                              | yes        | no                    |
|  9.4 | Marginalia refresh (louder) — add `pull` variant, `--gutter-margin-pull` float at ≥1024px; route `directorsNote` and `runs[]` to the new variant. Existing call sites unchanged on small screens.                                                                                                                                | yes        | no                    |
|  9.5 | EmptyState / ERRATA refresh — replace mono ERRATA chip with Lora italic complete-sentence body in EN/RU/DE per chrome locale. Component-API unchanged.                                                                                                                                                                           | yes        | no                    |
|  9.6 | SpecimenPlate component — new module + adopt for `/productions/[slug]` gallery and `/about` photos. Composes with `PosterLightbox`.                                                                                                                                                                                              | yes        | no                    |
|  9.7 | TourRider component — new module + adopt for `/productions/[slug]`. Reads existing frontmatter; null fields produce no row. Absorbs DA-7.6.F LANGUAGE row + ON TOUR band.                                                                                                                                                        | yes        | no                    |
|  9.8 | TypographicCover + CreditLine + grain SVG + build-time `coverStyle` default. Last phase. Computed default means **no frontmatter editing required** — existing files render unchanged unless explicitly overridden.                                                                                                              | yes        | no (computed default) |

Phases 9.0a/9.0b/9.0c must merge before any code phase that consumes the corresponding lift: 9.0a blocks 9.6 (
SpecimenPlate), 9.0b blocks 9.3 (TheatreSlate role line) and any chip→label refactor, 9.0c blocks the form-chrome radius
change in Cmd-K. Code phases 9.1–9.8 are otherwise independently revertible in any order against `main`.

## 9. Compatibility checks performed 2026-05-02

| Subsystem                                                          | Check                                                                                                                                                                                                                                    | Result                                                                                         |
|--------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| DA-3.A slate-strike (`components/SlateStrike.tsx` + `.module.css`) | grep for `font-weight`, `Lora`, `font-family`                                                                                                                                                                                            | no references — Lora-VF swap (Phase 9.2) is safe                                               |
| DA-3.A timing                                                      | grep for `--duration-slate`                                                                                                                                                                                                              | defined in `globals.css:413`, not overridden by proposed token deltas                          |
| `PosterLightbox` (session 5, uncommitted)                          | composition with SpecimenPlate                                                                                                                                                                                                           | Lightbox wraps the plate `<button>`; trigger element receives the inset rule, overlay does not |
| `firstPaintDone` sessionStorage gate                               | grep                                                                                                                                                                                                                                     | unchanged by any phase                                                                         |
| §11 anti-patterns surviving                                        | parallax, scroll-driven, kinetic type, hero video, glassmorphism, neumorphism, claymorphism, AI-purple, Comic-Sans, drop-shadow glow on cards (still banned for non-photographic), bento on home, "Built with Next.js", coloured headers | all retained                                                                                   |
| Locked decisions                                                   | I5 cut, DA-3.A slate-strike, RU/EN-only production-card text, mailto-only CTA, single PostHog event, hreflang RU↔EN, awards/press original-language only                                                                                 | all retained                                                                                   |
| MAP.md §5 unfreeze procedure                                       | Phase 9.0 produces three explicit unfreeze commits, each appending `_Superseded 2026-05-02_` to the relevant `archive/DESIGN_BRIEF.md` row, mirroring to `DESIGN.md` §11                                                                 | conforms                                                                                       |

## 10. Decisions taken 2026-05-02

Resolved before commit. The four open questions in earlier drafts of this section are now closed; rationale captured
here for future contributors.

| # | Decision                                                                                                                                                                         | Rationale                                                                                                                                                                                                                          |
|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | Paper `#F2F0EA` ships as proposed; visual A/B on Daniil's monitor folded into Phase 9.1 acceptance criteria.                                                                     | Reverting a single CSS custom property is a one-commit operation. Pre-committing the colour without ship-it visual proof is acceptable when rollback cost is trivial.                                                              |
| 2 | TypographicCover differentiation = slug-hash mod 3 (top/centre/bottom-set) + optional Lora-italic synopsis line (60-char truncation) when `synopsis.<active-locale>` is present. | Two-axis differentiation. Synopsis adds editorial voice without imagery — fits the "frame is the cover" doctrine in §6.2.                                                                                                          |
| 3 | Marginalia `kind="pull"` renders `directorsNote.<active-locale>` when present, falls back to `directorsNote.ru` with explicit `lang="ru"`.                                       | `directorsNote` is editorial body content (localized per locale), not production-card chip metadata (which stays RU/EN per D4). Italics already imply quote; the `lang` attribute lets SR pronounce correctly when fallback fires. |
| 4 | Phase 9.0 ships as three separate commits (9.0a / 9.0b / 9.0c), one per `archive/DESIGN_BRIEF.md` §8 unfreeze.                                                                   | Atomic per MAP.md §5 — each unfreeze is a discrete decision; if one is wrong, revert one. Folding into a single commit would couple three independent locked-decision changes.                                                     |
