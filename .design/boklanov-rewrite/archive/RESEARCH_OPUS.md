# RESEARCH 2026 — Claude Opus 4.7 output

_Frozen 2026-05-02. Read-only. Selected basis for `DESIGN_v2_PROPOSAL.md`. Do not edit._

Run against the prompt in `archive/RESEARCH_2026.md` on 2026-05-02. Direction B ("Vitrine") selected as canonical, with
four corrections recorded in `DESIGN_v2_PROPOSAL.md` §0:

1. DottedProgress dropped (no in-flight states justify spinner-ban lift on a static-first site).
2. `--rule-hairline 0.5px` replaced with reuse of existing `--rule` / `--rule-strong` (cross-DPR rendering risk).
3. Frontmatter migration phase folded into Phase 8 via build-time computed `coverStyle` default.
4. Lora-VF swap verified compatible with DA-3.A — `SlateStrike.module.css` does not reference font-weight.

This output is preserved verbatim. The proposal supersedes it on conflict.

---

# DESIGN RFC v2 — boklanov.com / Sections 9.1–9.10

## 9.1 — 2026 trend distillation

| Trend name (mine)                  | Underlying signal (3+ independent sources)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Fit with object-theatre frame                                                                                                                                        | Conflict with §3/§4/§11                                                                                                                                                                          | Verdict                                                                                 |
|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| Specimen Editorial                 | It's Nice That's 2026 stock-take describes "scientific specimens — like entomology display cases exhibiting pinned-down bugs and butterflies" with "flattened, numbered" cut-outs (Source: itsnicethat.com 2026 graphic trends, January 2026); Squarespace Circle's 2026 "Archival Index" calls out "digital collecting turned editorial … grids, labels, annotations" (Source: pros.squarespace.com 2026 Design Trends, Sam Walsh + Puno, 2026); the it's nice that piece names "Sunroom's snail mail and Miguel Vides posters" plus "Jean Pierre Consuegra's" typological collections; the same tendency is documented as "Archival Index" for portfolio sites.                 | Direct fit. Roman's gallery is 419 photographic plates of manipulated objects; the frame "object catalogued, not floated" mirrors the puppet-theatre vitrine.        | None. Specimen layouts already match §3's herbarium-leaning palette and §4's typographic discipline. The frame requires a careful inset shadow lift if used on cards (see 9.4).                  | ADOPT.                                                                                  |
| Technical Mono / Code Brutalism    | It's Nice That identifies a "hidden language of hyper functionality" with "tight typographic overlays, grids and timestamps as visual devices that imply technical depth and a more specialised knowledge" (Source: itsnicethat.com, January 2026); Brutalist Websites archive shows sustained 2024–26 inventory of mono-driven portfolios (Source: brutalistwebsites.com, ongoing); VistaPrint's 2026 font report names the "apothecary" pairing of "condensed sans serifs paired with elegant serifs, all-caps labeling, monospaced details (every character the same width), and tight grids that echo dosage charts and lab forms" (Source: vistaprint.com Font Trends 2026). | Strong fit. Tour rider, run dates, technical specs are real artefacts of touring theatre — mono is honest, not decorative.                                           | None when mono is restricted to JetBrains Mono in metadata only. Conflicts with §11 if mono leaks into headlines (becomes Tailwind-style code-cosplay).                                          | ADOPT, scoped.                                                                          |
| Pharma Serif / Heritage Apothecary | VistaPrint 2026 explicitly names "apothecary vibe, recalling amber bottles, stamped lot numbers, tidy specimen labels and no-nonsense typography that blends nostalgia with clinical clarity" (Source: vistaprint.com 2026); Fontfabric 2026 documents "revisiting history without falling into pure nostalgia" with brands referencing "early financial and crypto visual tropes … contemporary typography" e.g. Wolff Olins NYBG, Ragged Edge Solflare (Source: fontfabric.com 10 Design Trends 2026); Creative Boom's 2026 pick list recommends Mrs Eaves and similar heritage transitional serifs (Source: creativeboom.com 50 fonts 2026).                                   | Mid-fit. Roman's RU/EN/DE markets respond to gravity. Lora is a transitional serif that already carries this register; the lift is in usage, not in the font roster. | Conflicts with §11 only if it becomes ornamental — bracketed flourishes, italic display, drop-caps, bottle-label drop-shadows.                                                                   | ADAPT — usage only, no new fonts.                                                       |
| Anti-AI Crafted Web                | Canva's 2026 report frames the year as "Imperfect by Design," with searches for "lo-fi aesthetic" up 527% and "Zine"/"Substack" aesthetics up 85% YoY (Source: canva.com Design Trends 2026); Fontfabric describes "wobbly outlines, loose illustration, 'wrong' spacing, and textures that look like they came from a risograph or a leaky marker" (Source: fontfabric.com 2026); illustration.app/Creative Bloq's "Tactile Rebellion" is named explicitly with Graham Sykes (Landor) quote: "Human-driven craft is the antidote to AI's hyper-slick language" (Source: illustration.app, Creative Bloq 2026 trends).                                                            | Strong fit. Object/puppet theatre IS handcraft. Photographs of glue, tape, fabric and wood are anti-AI artefact by definition.                                       | Conflicts with §11 if "imperfection" means hand-drawn underlines, scribble overlays, or wobbly type — those are LOCKED rejections. The lift is in photographic processing, not graphic ornament. | ADAPT — image treatment only.                                                           |
| Variable-Weight Editorial          | Fontfabric 2026 documents Studio Dumbar's OutSystems variable-type identity, COLLINS for Bose, "type visualises sound—variable weight, rhythm, vibration" (Source: fontfabric.com 10 Design Trends 2026); Kittl's 2026 piece argues variable fonts are now "best practice" with one variable file (~100–200KB) replacing four static files (Source: kittl.com 2026); Lora ships an OFL variable wght file at ~76KB woff2, vs ~74KB regular static + ~68KB italic static separately (Source: github.com/google/fonts and webaware.com.au snippet, 2024).                                                                                                                           | Fit at the chrome/title scale. The frame "weight as breath" suits a director who works with breath as a directing vocabulary.                                        | Conflicts with §11 only if interpolated in motion (kinetic typography is banned). Static weight selection is fine.                                                                               | ADOPT — single Lora-VF file replaces existing static pair, italic axis added (see 9.5). |
| Programmatic Marginalia            | Cabinet Magazine's redesign documents a deliberate marginalia/footnote register: Everything Studio's case study notes the orange accent, Palatino, sort-by-issue/archive scaffolding (Source: everythingstudio.com Cabinet Magazine 2022); It's Nice That observes "footnotes everywhere" as a 2026 portfolio device (Source: itsnicethat.com 2026); Squarespace 2026 names the form "tiny labels, understated typography, catalog information" (Source: pros.squarespace.com 2026).                                                                                                                                                                                              | Direct fit. Roman's productions carry runs, tour history, lineage, role variants — all classical marginalia content.                                                 | The CURRENT Marginalia component already ships; lifting it means making it louder, not adding it. No §11 lift required.                                                                          | ADAPT — turn up volume of existing component.                                           |
| Print-Echo Layout                  | Holiday Magazine's 2014 relaunch by Atelier Franck Durand re-established the editorial register of "the picture is the layout … you make it tight and sweet" (Source: holiday-magazine.com history; designobserver.com on Frank Zachary); Apartamento's house style — bare interiors-magazine grid, no chrome decoration — has trained an entire 2020s editorial cohort (Source: apartamentomagazine.com); Cabinet Magazine's grey-paper, Palatino, tight gutter system has been the reference for catalogue-raisonné web since the 2022 redesign (Source: everythingstudio.com Cabinet redesign case).                                                                           | Fit. Roman's portfolio is closer to a catalogue raisonné than a marketing site.                                                                                      | None — it's already the §3 north star.                                                                                                                                                           | ADOPT (already substantively present; 2026 lift is sharpening, not adding).             |

---

## 9.2 — Competitor scan

I dropped Punchdrunk (the company's authoritative site is now opaquely thin and the search domain "
punchdrunk-digital.com" is an unrelated marketing agency) and replaced it with Théâtre des Doms 2025 / ABM Studio
identity, which is the most clearly relevant 2025–26 puppet-adjacent identity work.

| URL                                                                                                                | Why it works                                                                                                                                                                                                                                                                                                            | What we steal                                                                                                                                                   | What we reject                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| festival-avignon.com                                                                                               | Catalogue scaffolding survives an 80-show programme on mobile in <90s; per-edition skin replaceable without breaking deep links; institutional weight signalled by year-only colophon and absence of marketing chrome (Source: festival-avignon.com, accessed May 2026; Wikipedia on the 80th edition 4–25 July 2026).  | The discipline of putting the year as the only chrome timestamp — already in §11 lock for boklanov; festival-avignon validates it on a 79-year-old institution. | The full-bleed festival-poster hero — does not transfer to a 24-production catalogue where no single image is canonical. |
| schaubuehne.de                                                                                                     | Slate-based directory: title + author + director + premiere date as a four-line typographic record, repeated dozens of times. Felix Bork's 2024/25 campaign deletes letters from the masthead to compose seasonal vocabulary — typography as system not decoration (Source: schaubuehne.de Spielzeitkampagnen 2024/25). | The four-line slate (title / by / director / Uraufführung + date) — refresh of TheatreSlate (see 9.6).                                                          | The cookie-bar YouTube-consent overlay; rejected by §11 (no cookie banners).                                             |
| theatre-des-doms.eu (ABM Studio identity, Festival Off Avignon 2025, Sature typeface by Atelier Ater / Blaze Type) | Fonts In Use documents identity as "expressive illustrations … vibrant typographic compositions, and an overall refusal to conform to the traditional codes of French theatrical communication" anchored by Sature, "a family built to saturate" (Source: fontsinuse.com, Théâtre des Doms 2025, July 2025).            | The conviction that typography alone can carry the identity of a small independent stage — argues for letting Lora carry more of Roman's chrome.                | The saturation strategy itself; Sature is loud. Roman's market is critical/festival-programmer, not Off-Avignon walk-up. |
| vidy.ch                                                                                                            | Bilingual EN/FR chrome, season-as-database routing, full multilingual surtitle metadata at the show level (Source: vidy.ch, 25/26 season, accessed May 2026).                                                                                                                                                           | Per-show language metadata pattern — useful for our credit-rendering when productions are multilingual.                                                         | The cookie modal; the generic "Accept/Preferences/Reject" UI conflicts with §11.                                         |
| exmachina.ca (Robert Lepage / Ex Machina)                                                                          | Director-led company site reads as a single archive: production, year, venue, tour. The site successfully refuses video hero despite an opera/multimedia output (Source: exmachina.ca, accessed May 2026).                                                                                                              | The decision to refuse hero video on a multimedia director's site — direct precedent for our §11 lock.                                                          | Their flat black/grey monolith — we want more paper, less monolith.                                                      |
| societas.es (Romeo Castellucci)                                                                                    | Biographical, slow, no booking flow; the site assumes the reader already knows why they're here. The Wikipedia-grade prose density is the editorial lever (Source: societas.es biography, accessed May 2026).                                                                                                           | Permission to write prose-dense bios in Lora at a generous measure on /about.                                                                                   | The total absence of imagery wayfinding — Roman has 419 photos and cannot afford that ascetic.                           |
| forcedentertainment.com (Tim Etchells)                                                                             | "Projects Archive" route is a 40-year flat list of production cards with year + 1-line synopsis + image. No "featured" hierarchy. Reads as inventory (Source: forcedentertainment.com/projects, accessed May 2026).                                                                                                     | The flat-inventory /productions route, no featured-collection rail.                                                                                             | The "Read More →" repetition — we replace with title-as-link per §4.                                                     |
| cienonnova.com (Phia Ménard)                                                                                       | Calendar route is a single-column tour list: city — venue — date(s). No map widget, no "book now," no embed (Source: cienonnova.com/calendrier, accessed May 2026).                                                                                                                                                     | The calendar pattern as the canonical TourRider component (see 9.6).                                                                                            | The plain-HTML aesthetic with no typographic system — we want Lora discipline, not blank Times.                          |
| buchtyaloutky.cz                                                                                                   | Czech alt-puppet company. Single-language CZ chrome, thumbnail grid for productions, photos load fast on mobile (Source: buchtyaloutky.cz, accessed May 2026).                                                                                                                                                          | Validates RU/EN-only production card text for an audience that mostly does not read RU — DE chrome wraps it without burdening titles.                           | The thumbnail grid with no captions — credits floating loose. We caption everything.                                     |
| mossoux-bonte.be                                                                                                   | Discrete, slow, designer-collaboration site. Show list is title + year + role-pair (chor / dir). Walks the line between solo-director portfolio and company site (Source: mossoux-bonte.be, accessed May 2026).                                                                                                         | The "performances by year" descending-chronology list — already our default; this corroborates.                                                                 | The legal-notice copyright pageantry — out of register for a 2026 critical-festival audience.                            |
| cabinetmagazine.org                                                                                                | Editorial archive built by Everything Studio: grey paper, Palatino, orange accent, sort-by-issue/sort-by-archive duality (Source: everythingstudio.com Cabinet case study, 2022; cabinetmagazine.org, accessed May 2026).                                                                                               | The dual sort axis (chronological vs. thematic) — informs /archive route and /productions filter.                                                               | The orange accent at scale — we already reserve oxblood; will not mix two reserved colours.                              |
| apartamentomagazine.com                                                                                            | The reference for "everyday-interiors" editorial register: photo-led, low chrome, generous margin, sans-serif body (their hosted property is restrained relative to print) (Source: apartamentomagazine.com, accessed May 2026).                                                                                        | The "low chrome on a high-imagery archive" decision — vindicates our 419-photo strategy.                                                                        | The cookie GDPR overlay and shop-first homepage — out of scope.                                                          |
| holiday-magazine.com                                                                                               | Bi-annual relaunch (2014, Atelier Franck Durand) demonstrates that an editorial property can survive online with print-grade composition and minimal interaction (Source: en.wikipedia.org/Holiday_(magazine); holiday-magazine.com).                                                                                   | The willingness to publish a serif body at long measure for an editorial reader.                                                                                | The fashion-magazine cover-led grammar — wrong genre for object theatre.                                                 |
| are.na                                                                                                             | Specimen-grid as primary collection format; tile sizes determined by content, not template; minimal chrome (Source: are.na, accessed May 2026).                                                                                                                                                                         | The principle that the tile is sized to the photo, not the photo to the tile — informs SpecimenPlate (see 9.6).                                                 | The user-generated chaos signature — Roman's site is curated, not networked.                                             |

---

## 9.3 — Visual concept v2

### Direction A — "Slate"

Conservative refresh. Paper colour shifts one notch warmer to match Lora's calligraphic origin; the existing
TheatreSlate becomes the dominant unit on home and on /productions; Marginalia is type-tightened but not louder; oxblood
stays locked to booking-CTA fills + primary-link hover underline reveal + focus ring. The mood is a black-and-white
printed festival programme next to a half-drunk coffee; a critic reading on a phone in the courtyard between two
performances; a programme stapled at the spine, never glossy. The page should feel like a four-line cataloguing record
was always the answer and we just stopped fighting it. Photographs are slightly desaturated but never tinted. Grain
noise is present at exactly 4% opacity, a static SVG, never animated. The home is a time-descending slate list, not a
bento, not a hero. Mobile feels like a programme insert: title, theatre, year, role, single still. Lifts: zero from §11;
one possible adjacent clarification (specimen-style 1px inset border on photographic plates, which is not currently in
§11 but borders the drop-shadow ban — see 9.4).

North-star sentence: this site feels like a Schaubühne season programme reprinted on Apartamento's paper but
interactive.

### Direction B — "Vitrine"

Ambitious refresh. The site reads as a Cabinet of Curiosities catalogue raisonné: each production is a numbered specimen
plate with archival caption, low-contrast inset shadow indicating it has been "filed," and a typographic cover system
for the 20 shows lacking a poster that is itself a piece of the identity rather than a fallback. Marginalia becomes an
editorial voice — running heads, footnoted credits in Inter at a smaller scale, occasional pull-text in Lora italic that
breaks the right margin into the gutter. The TourRider is a component, visible on each production, that reads like a
real technical sheet (durationMin, ageRating, languageOfPerformance, form[], lineage[]) rendered in JetBrains Mono on a
tighter rhythm than body text. Variable-weight Lora carries the title from 400 to 700 across breakpoints without
changing files (one Lora-VF woff2). Oxblood remains absolutely locked to the three reserved uses. The mood is an
entomology cabinet next to Aby Warburg's Mnemosyne Atlas next to a touring-company's actual paperwork pinned to a
backstage corkboard. Photographs receive a unified processing recipe (see 9.8); typographic covers are not "
missing-poster fallbacks" but the canonical cover for any show without a poster, signalled by coverStyle. Lifts: 2–5 §11
items, all justified in 9.4.

North-star sentence: this site feels like Cabinet Magazine and Holiday's relaunch issue laid out together by a touring
puppet stagehand but interactive.

---

## 9.4 — Anti-pattern RFC table (Direction B only)

| §11 item                                | Reason to lift                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Replacement guard                                                                                                                                                                                                                                                                                                                                                           | Risk to identity                                                                                                                                                                                                                | Rollback trigger                                                                                                                                                             |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| drop-shadow glow on cards               | Holiday Magazine's 2014 relaunch and Cabinet Magazine's 2022 redesign both use 1px low-contrast inset borders/shadows on photographic plates to signal "object catalogued, not floated" — the opposite failure mode from Tailwind shadow-xl (Source: everythingstudio.com Cabinet case; designobserver.com on Holiday's Frank Zachary tradition). It's Nice That's 2026 specimen-plate piece reinforces this as an active editorial register, not a 2018 throwback.                                                                                          | New token `--specimen-rule: inset 0 0 0 1px rgb(28 28 28 / 0.08);` applied ONLY when `coverStyle === 'photo'` AND viewport ≥ 768px. NEVER blur radius > 0. NEVER outset. NEVER coloured. NEVER on hover. The rule is a frame, not a glow. Forbidden in CSS Modules outside `SpecimenPlate.module.css`.                                                                      | Low-medium. The original §11 ban was anti-Tailwind reflex; an inset 1px is not a glow. The risk is creep: junior contributor adds blur-radius. Mitigated by lint rule + CSS variable scoped to one module.                      | If any reviewer cannot tell within 100ms whether a card is "framed" or "floating," roll back. If Lighthouse Accessibility drops on contrast against the new rule, roll back. |
| coloured chip pills                     | The §11 ban targeted the SaaS "Tag" pill in pastel pill-shaped containers. Specimen-label editorial design uses tracked all-caps mono labels with a hairline underline or border — the form is opposite: angular, type-led, not pill-shaped (Source: vistaprint.com 2026 apothecary trend; itsnicethat.com 2026 hyper-functionality overlays; Cabinet's column-typography precedent). Roman's `form[]` and `tags[]` data are real metadata that need typographic surface, and rendering them as plain text loses scannability for a 90-second mobile reader. | New token block: chips become "specimen labels" — `text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-mono); font-size: 0.72rem; padding: 2px 0; border-bottom: 1px solid currentColor; background: none; border-radius: 0;`. NEVER background-fill. NEVER coloured beyond `--ink-secondary`. Multiple labels separated by an em-dash, not a comma. | Medium. The pill ban was symbolic. Replacing with mono labels resolves the underlying problem. Risk is that the new label looks like a form field — mitigated by removing all border-radius and the `padding-inline > 0` value. | If clickability is implied by the label (it is non-interactive metadata), roll back. If a contributor adds `background-color`, roll back.                                    |
| Tailwind defaults rounded-2xl/shadow-xl | Strict reading: rounded-2xl is the failure. But the absolute ban on any radius pushes us toward sharp-corner brutalism we did not ask for. Print-echo editorial uses 2px radii on input fields and dialogs to read as paper-cut, not card-game (Source: itsnicethat.com 2026 hyper-functionality piece on contract-layout discipline; precedents in Cabinet's input fields and the Schaubühne ticketing flow).                                                                                                                                               | A single new token `--radius-paper: 2px` is allowed ONLY on `<input>`, `<textarea>`, `<select>`, and `<dialog>` — never on a card, never on an image, never on a button (buttons stay 0).                                                                                                                                                                                   | Low. 2px on form chrome is invisible at the cards/images scale where the original ban mattered.                                                                                                                                 | If any card, image, or button border-radius is non-zero in computed styles, roll back.                                                                                       |
| infinite spinners                       | Banned because they are SaaS noise. But for a static-first site, on slow EU rural mobile the only "in-flight" state is the next/image LQIP→AVIF swap. Specimen catalogues have a documented register: a single dotted leader (`........`) progressing left-to-right is a print-grade in-flight signal (Source: pharma-serif/apothecary trend on dosage-chart aesthetics, vistaprint.com 2026).                                                                                                                                                               | New `<DottedProgress>` component, rendered ONLY at the page-load level for routes >100KB and ONLY when LQIP is present. Maximum on-screen lifetime: 600ms. After that, vanish — no looping. NEVER on hover, NEVER on form submit (mailto submits leave the page). Use `prefers-reduced-motion: reduce` to render the dotted leader fully visible without animation.         | Low. The original ban was on the looping circle. A non-looping dotted leader is an opposite primitive.                                                                                                                          | If any dotted leader runs >800ms or repeats, roll back.                                                                                                                      |

### Rejected lifts (discipline proof)

| §11 item considered   | Why I considered lifting it                                                                                                                                                                                                 | Why I cannot clear the bar                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| hand-drawn underlines | Canva 2026's "Imperfect by Design" report lists hand-drawn marks as a primary tactile-rebellion signal (Source: canva.com Design Trends 2026), and It's Nice That's 2026 trend "Sketchbook" register validates the gesture. | The §11 ban is about a specific failure mode: hand-drawn underlines in editorial portfolio chrome read as "I made this in Notion." Once shipped they're impossible to make consistent across RU/EN/DE diacritics; they break the AA contrast guarantee on long underlines; and they directly conflict with the locked oxblood hover-underline reveal on primary links, which IS the underline grammar of the site. Two underlines compete; one must win, and oxblood is locked. Reject. |
| parallax              | Multiple 2026 trend writeups (Source: figma.com, gatitaa.com 2026) list "scrollytelling" and "motion narratives" as defining patterns.                                                                                      | The brief locks `prefers-reduced-motion: reduce` to zero all durations. Parallax cannot be expressed as a no-op without becoming nothing, which means it is decoration not communication. The §11 ban is correct. Reject.                                                                                                                                                                                                                                                               |

---

## 9.5 — Token deltas

### Direction A — additions

```
--specimen-rule: inset 0 0 0 1px rgb(28 28 28 / 0.06); /* photographic plates only, ≥768px */
--label-mono-tracking: 0.06em;
--label-mono-size: 0.72rem;
```

### Direction A — changes

```
--paper: #F2F0EA; /* was #F4F2EC — one notch warmer to seat Lora's calligraphic axis on the page */
--ink-secondary: #4A4744; /* was #555 — recomputed for AA on the warmer paper */
```

### Direction A — removals

```
/* (none) */
```

### Direction B — additions

```
--specimen-rule: inset 0 0 0 1px rgb(28 28 28 / 0.08);
--label-mono-tracking: 0.06em;
--label-mono-size: 0.72rem;
--radius-paper: 2px; /* form chrome only — see §9.4 guard */
--measure-prose: 62ch; /* /about, /press long-read */
--measure-caption: 36ch; /* SpecimenPlate caption block */
--rule-hairline: 0.5px solid rgb(28 28 28 / 0.18);
--ink-marginalia: rgb(28 28 28 / 0.55); /* footnoted credits, runs, lineage */
--gutter-margin-pull: -1.25rem; /* Marginalia pulls into right margin from ≥1024px */
--lora-wght-axis-min: 400;
--lora-wght-axis-max: 700;
```

### Direction B — changes

```
--paper: #F0EDE6; /* was #F4F2EC — closer to Apartamento newsprint, two notches warmer */
--ink: #1C1C1C; /* unchanged numerically; explicitly re-locked to verify AA against the new paper */
--font-serif-stack: 'Lora VF', 'Lora', Georgia, serif; /* was 'Lora', Georgia, serif */
--font-mono-size-meta: 0.72rem; /* was 0.78rem — tighter for mono labels */
```

### Direction B — removals

```
/* the now-unused static @font-face declarations for Lora-Regular.woff2 and Lora-Italic.woff2 */
/* the now-unused @font-face for Lora-Bold.woff2 (subsumed by VF wght axis to 700) */
```

### Font-file accounting (Direction B)

The current site self-hosts Lora as static Lora-Regular.woff2 (~74KB) + Lora-Italic.woff2 (~68KB) + Lora-Bold.woff2 (~
74KB) = ~216KB across three round-trips (Source: wfonts.com Lora package sizes; webaware.com.au on Lora variable
subsetting). Direction B replaces this with two variable-axis files — Lora-VariableFont_wght.woff2 (~76KB Latin-Cyrillic
subset, the wght axis covering 400–700 internally) plus Lora-Italic-VariableFont_wght.woff2 (~76KB) (Source:
webaware.com.au snippet; google/fonts repo). Net delta: −64KB on the font budget AND one fewer HTTP request. The
Cyrillic subset must be preserved (Roman ships RU production-card titles). Inter and JetBrains Mono remain unchanged
from Phase 1.

The italic axis is being added (was previously absent because the brief never required italic body), justified by
Marginalia's louder voice in Direction B requiring an italic register for pull-text (the alternative — synthetic-italic
browser-rendering of the upright — produces the kind of sloppy slope critics will notice).

---

## 9.6 — Component grammar deltas

### TheatreSlate (refreshed)

- Purpose: Render a production's identifying record as a four-line typographic slate — title / venue / role / year —
  modeled on Schaubühne's per-show metadata block.
- Used on: `/`, `/productions`, `/productions/[slug]`.
- MDX usage example:

```mdx
<TheatreSlate
  title={frontmatter.title}
  theatre={frontmatter.theatre}
  role={frontmatter.role}
  year={frontmatter.year}
  premiereDate={frontmatter.premiereDate}
/>
```

- CSS Module sketch:

```css
.slate {
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 0.25rem;
  padding-block: 1.25rem;
  border-top: var(--rule-hairline);
}

.slate__title {
  font-family: var(--font-serif-stack);
  font-weight: 600;
  font-size: clamp(1.4rem, 1.1rem + 1.2vw, 2.1rem);
  line-height: 1.15;
}

.slate__theatre {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--ink);
}

.slate__role {
  font-family: var(--font-mono);
  font-size: var(--label-mono-size);
  letter-spacing: var(--label-mono-tracking);
  text-transform: uppercase;
  color: var(--ink-marginalia);
}

.slate__year {
  font-feature-settings: 'tnum' 1;
  font-family: var(--font-mono);
  font-size: var(--label-mono-size);
}
```

- Accessibility: title is rendered as `<h2>` on `/productions` and `<h1>` on `/productions/[slug]`; role chip is plain
  text, not `role="button"`; reduced-motion: no transitions to remove.
- §7 row replacement: supersedes existing `ProductionCard` for index routes.

### SpecimenPlate (new)

- Purpose: Photographic plate with archival caption — replaces the floating `<Card>` for shows with a poster image AND
  on `/productions/[slug]` for gallery items.
- Used on: `/productions/[slug]` (gallery), `/archive`.
- MDX usage example:

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

- CSS Module sketch:

```css
.plate {
  display: grid;
  gap: 0.5rem;
}

.plate__frame {
  box-shadow: var(--specimen-rule);
  background: var(--paper);
}

.plate__caption {
  font-family: var(--font-mono);
  font-size: var(--label-mono-size);
  letter-spacing: var(--label-mono-tracking);
  color: var(--ink-marginalia);
  display: flex;
  gap: 0.5rem;
}

.plate__index {
  font-feature-settings: 'tnum' 1;
}

.plate__credit {
  max-width: var(--measure-caption);
}
```

- Accessibility: `<figure>` + `<figcaption>`; if credit is null, render the caption with `plate {n}/{total}` only, never
  the apologetic "Credit unknown"; reduced-motion is irrelevant (no motion).
- §7 row replacement: supersedes the gallery-grid item; does not replace TheatreSlate.

### Marginalia (refreshed — louder)

- Purpose: Render runs[], lineage[], and director's-note pull-quotes in the right margin from ≥1024px, as a footnoted
  editorial voice.
- Used on: `/productions/[slug]`, `/about`, `/press`.
- MDX usage example:

```mdx
<Marginalia kind="run">
  {frontmatter.runs.map(r => <RunRow city={r.city} venue={r.venue} dates={r.dates} />)}
</Marginalia>
<Marginalia kind="pull" lang="en">{frontmatter.directorsNote.en.slice(0, 240)}</Marginalia>
```

- CSS Module sketch:

```css
.marginalia {
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--ink-marginalia);
  line-height: 1.5;
}

.marginalia--pull {
  font-family: var(--font-serif-stack);
  font-style: italic;
  font-size: 1rem;
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

- Accessibility: rendered as `<aside>`; on <1024px collapses below the prose, never floats; reduced-motion: irrelevant.
- §7 row replacement: refreshes the existing `<Marginalia>`, does not supersede.

### TourRider (new)

- Purpose: Render the production's technical and tour metadata as an object-list reading like a real tech rider (
  durationMin, ageRating, form[], lineage[], runs[], languageOfPerformance, techRider link).
- Used on: `/productions/[slug]`.
- MDX usage example:

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

- CSS Module sketch:

```css
.rider {
  font-family: var(--font-mono);
  font-size: var(--label-mono-size);
  letter-spacing: var(--label-mono-tracking);
}

.rider__row {
  display: grid;
  grid-template-columns: 12ch 1fr;
  column-gap: 1rem;
  padding-block: 0.4rem;
  border-bottom: var(--rule-hairline);
}

.rider__key {
  text-transform: uppercase;
  color: var(--ink-marginalia);
}

.rider__val {
  color: var(--ink);
}

.rider__doc {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
```

- Accessibility: `<dl>` with `<dt>` and `<dd>`; PDF rider link receives `aria-label="Technical rider, PDF"` and download
  size; reduced-motion: irrelevant.
- §7 row replacement: supersedes any existing `<MetaList>` on `/productions/[slug]`.

### EmptyState / ERRATA (refreshed)

- Purpose: When a production lacks a poster, missing credits, or null gallery, render the absence as a deliberate
  typographic register rather than a UI-empty state.
- Used on: anywhere a content field is null and rendering would otherwise fall back to a placeholder.
- MDX usage example:

```mdx
<Errata kind="poster-absent" lang="en" title={frontmatter.title.en} year={frontmatter.year} />
```

- CSS Module sketch:

```css
.errata {
  font-family: var(--font-serif-stack);
  font-style: italic;
  color: var(--ink-marginalia);
  font-size: 1rem;
  line-height: 1.4;
  padding: 1.5rem 0;
  border-top: var(--rule-hairline);
  border-bottom: var(--rule-hairline);
}

.errata__year {
  font-family: var(--font-mono);
  font-style: normal;
}
```

- Accessibility: text content reads as a complete sentence in EN/RU/DE — "Plate not yet catalogued. {year}." — never as
  a UI state; reduced-motion: irrelevant.
- §7 row replacement: refreshes existing EmptyState; remains the ERRATA register but in Lora italic.

### TypographicCover (new)

- Purpose: Canonical cover for the 20+ shows lacking `poster.src` — rendered as a typographic plate, not a fallback.
- Used on: `/productions`, `/productions/[slug]`.
- MDX usage example:

```mdx
<TypographicCover
  title={frontmatter.title}
  theatre={frontmatter.theatre.shortName}
  year={frontmatter.year}
  form={frontmatter.form[0]}
/>
```

- CSS Module sketch:

```css
.cover {
  aspect-ratio: 3 / 4;
  background: var(--paper);
  border: var(--rule-hairline);
  display: grid;
  grid-template-rows: 1fr auto;
  padding: 1.25rem;
}

.cover__title {
  font-family: var(--font-serif-stack);
  font-size: clamp(1.4rem, 4vw, 2.4rem);
  line-height: 1.05;
  align-self: end;
}

.cover__meta {
  font-family: var(--font-mono);
  font-size: var(--label-mono-size);
  letter-spacing: var(--label-mono-tracking);
  text-transform: uppercase;
  color: var(--ink-marginalia);
}
```

- Accessibility: rendered as `<figure>` with `<figcaption>` repeating title for SR; reduced-motion: irrelevant.
- §7 row replacement: replaces poster `<img>` when `coverStyle === 'typographic'`.

### CreditLine (new)

- Purpose: Render unstructured credits without looking apologetic when 80% of fields are null.
- Used on: `/productions/[slug]` (gallery captions), `/press`.
- MDX usage example:

```mdx
<CreditLine photographer={image.credit?.photographer} year={image.credit?.year} />
```

- CSS Module sketch:

```css
.credit {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ink-marginalia);
  letter-spacing: 0.04em;
}

.credit__sep {
  display: inline-block;
  padding: 0 0.4em;
}
```

- Accessibility: `<small>` element; SR reads "photo by {name}, {year}" with em-dash separators.
- §7 row replacement: supersedes `<Credit>` if it exists.

---

## 9.7 — Motion within reduced-motion floor

### 1. Hover-underline reveal (primary links, locked oxblood)

A 1px oxblood underline grows from `transform: scaleX(0)` left-anchored to `scaleX(1)` over `--duration-fast` (150ms) on
`:hover` and `:focus-visible`. Physics: a tethered object held at one end and released to find its full extension. This
is not a swing; it is a controlled reach with a fixed pivot. `prefers-reduced-motion: reduce` collapses to instant
`scaleX(1)` — the underline simply appears, fully extended. Already locked in §11; this RFC only formalises the physics
rationale.

### 2. SpecimenPlate caption shift on focus

When a SpecimenPlate receives keyboard focus, the caption block translates by 2px on the y-axis over `--duration-fast`,
creating a perceptible "settle" against the inset rule. Physics: a small object on a string, lifted briefly when the
cabinet is opened, returning to rest weighted by gravity. The displacement is small enough that the photographic plate
itself does not move — only the caption "shifts in its slot." `prefers-reduced-motion: reduce` produces zero translate;
focus is instead signalled by the focus-ring oxblood reserved colour, which AA-passes on its own.

### 3. DottedProgress reveal

A row of six monospace dots fades each dot in turn from opacity 0 to 1 over a total of `--duration-slow` (400ms), one
per ~67ms. Physics: a dropped object catalogued on intake — six receipts being checked off in sequence. Never loops;
reaches state and stops. `prefers-reduced-motion: reduce` renders all six dots fully opaque from t=0 — the dotted leader
is still legible as a "loaded" indicator without the sequential reveal.

### 4. Marginalia pull-text settle (≥1024px only)

On viewport intersection with the prose column, a Marginalia pull-quote receives a 1px x-axis translation from −1px to 0
over `--duration-normal` (200ms). Physics: a marginal note pinned slightly off-square, gently squared by an editor's
thumb. The motion is below the kinetic-typography threshold (no character-level deformation, no per-glyph delay).
`prefers-reduced-motion: reduce` produces zero translation — the pull-quote renders at its final position from first
paint.

None of these depend on scroll position (no scroll-driven entrances) and none depend on parallax. All four pass the §11
reduced-motion floor by collapsing to no-ops, not to "shorter motion."

---

## 9.8 — Imagery treatment

### Photographic processing recipe (CSS + static SVG, no canvas, no JS)

A unified treatment applied to every photograph in `/productions/[slug]` gallery and any photographic poster:

```css
.plate__img {
  filter: contrast(1.04) saturate(0.92) brightness(0.99);
  background-image: url('/img/grain-tile-128.svg');
  background-size: 128px 128px;
  background-blend-mode: multiply;
}
```

The grain is a static SVG with `<feTurbulence baseFrequency="0.9" numOctaves="2"/>` exported once and self-hosted.
Opacity inside the SVG itself is set to `0.04` (4%), no animation; tile is 128×128 to keep the file under 2KB and tile
invisibly. The contrast/saturate/brightness triplet recovers contrast lost to the warmer paper colour and pulls
saturation off the punchy chromaticity that AVIF compression tends to push toward — yielding a uniform across-portfolio
register that sits between Holiday Magazine's Frank Zachary photographic warmth and Cabinet Magazine's archival
neutrality (Source: designobserver.com on Holiday's photographic register; everythingstudio.com Cabinet redesign). On
`prefers-reduced-transparency: reduce`, the grain `background-image` is removed via media query — filters remain, since
they are not transparency.

### Typographic-cover system for the 20+ posterless shows

Gated by `coverStyle === 'typographic'` when `poster.src` is null OR `poster.lqip` is null. The `TypographicCover`
component (see 9.6) is the canonical cover for these productions — not a fallback. Composition rules:

- Title in Lora 600 set to `clamp(1.4rem, 4vw, 2.4rem)` with `line-height: 1.05`, set on RU OR EN per locale chrome
  rule.
- Three-line meta block in JetBrains Mono uppercase, tracked at 0.06em: theatre.shortName / city,country / year.
- The title sits at the bottom-of-frame, meta at the very bottom-edge, the upper two-thirds of the plate is `--paper`
  only.
- Aspect ratio locked to 3:4 to match poster placeholders so the index grid doesn't reflow when poster vs typographic
  covers are mixed.
- No ornament. No rule. No icon. The frame itself is the `var(--rule-hairline)` border. This is the canonical reference
  to are.na's tile-sized-to-content principle (Source: are.na, accessed May 2026), inverted: tile is fixed, type is the
  content.

### Credit-rendering pattern (survives 80% missing data without apologising)

The `CreditLine` component (see 9.6) renders only the fields that exist, separated by em-dashes, in JetBrains Mono.
There is no "credit unknown," no "TBD," no italic apology. If only `year` exists: `2019`. If only `photographer` exists:
`Photo — A. Surname`. If both exist: `Photo — A. Surname — 2019`. If neither exists: the component renders nothing — the
plate is captioned only by `plate {n}/{total}` from `SpecimenPlate.__caption`, which is never empty, and which by itself
is a complete cataloguing record. The discipline is borrowed from museum catalogue raisonnés where partial provenance is
rendered as an honest cataloguing fact, not as a UI absence. The component never inserts placeholder strings; null is
null and the layout adapts.

---

## 9.9 — Risk register (Direction B)

| Risk                                                                                                                                               | Identity dilution | A11y regression | Perf regression | MDX-author friction | Locale breakage | Mitigation (≥3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|-----------------|-----------------|---------------------|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Specimen rule (1px inset) on non-photographic plates by mistake                                                                                    | 4                 | 1               | 1               | 2                   | 1               | Lock `--specimen-rule` token usage to `SpecimenPlate.module.css` only, enforce via stylelint rule `at-rule-no-unknown` extended to `selector-disallowed-list` matching `var(--specimen-rule)` outside that file; add a Playwright visual regression on the homepage that fails if any non-photographic card has a non-zero `box-shadow`.                                                                                                                                                                                                                     |
| Mono-label "specimen chips" misread as form fields by SR users                                                                                     | 1                 | 4               | 1               | 1                   | 2               | Render labels as plain `<span>` with no role; verify with axe-core that they are not announced as interactive; add visible `lang` attributes when label content is locale-specific (e.g. RU genre terms beside DE chrome).                                                                                                                                                                                                                                                                                                                                   |
| Lora variable font fails to load on slow EU rural mobile and falls back to Georgia mid-paint                                                       | 3                 | 1               | 4               | 1                   | 3               | Self-host Lora-VF with `font-display: swap` AND set `size-adjust`/`ascent-override`/`descent-override` on the Georgia fallback so that the layout doesn't shift more than 0.05 CLS when the swap happens (already a Phase-1 lock). Pre-connect to nothing (fonts are first-party). Subset to Latin + Cyrillic only; ship a 76KB woff2 cap.                                                                                                                                                                                                                   |
| TourRider rendering a missing `techRider` PDF link as an empty `<a>`                                                                               | 1                 | 3               | 1               | 4                   | 2               | Component must short-circuit on null fields and render no row at all — never a row with placeholder text "TBD"; add a TypeScript narrow type that prevents `techRider: null` from rendering as a link. Document the contract in CONTENT.md so Roman knows that omitting the field omits the row.                                                                                                                                                                                                                                                             |
| TypographicCover producing visually identical plates across multiple posterless productions (because they share `theatre.shortName`+`city`+`year`) | 4                 | 1               | 1               | 2                   | 3               | Variant the cover by hashing `slug` to one of three internal layouts (top-set title, bottom-set title, centre-set title) — purely typographic, no colour or imagery variation. Document in DESIGN.md so reviewers know identical-feeling covers across an index grid is a content data issue (two productions with the same theatre/city/year), not a design bug. Provide a single-line prose synopsis fallback rendered in Lora italic at the top edge when slug-hash collides — yields visual differentiation while staying within the typographic system. |

Risks scored ≥3 receive mitigations as listed above. Every mitigation is implementable as a single PR with no backend,
no database, no runtime CSS-in-JS — consistent with the locked stack.

---

## 9.10 — Implementation order (Direction B)

Each phase is sized to a single shippable commit on `main`, deploys to boklanov.vercel.app independently, and can be
deployed without the next phase. Phase 1 is reversible by `git revert` of one commit. Phase 9 is the only phase that
requires an MDX frontmatter migration.

**Phase 1 — Token deltas only.** Add the new tokens (--specimen-rule, --label-mono-tracking, --label-mono-size,
--radius-paper, --measure-prose, --rule-hairline, --ink-marginalia, --gutter-margin-pull, --lora-wght-axis-min/max),
warm the paper colour, recompute --ink-secondary for AA. No component changes. The site looks ~98% identical; only paper
colour and ink-secondary perceptibly shift. Single commit. Reversible by `git revert HEAD`. This phase ships the design
system before any component depends on it.

**Phase 2 — Lora variable swap.** Replace static Lora-Regular.woff2 + Lora-Bold.woff2 + Lora-Italic.woff2 with
Lora-VariableFont_wght.woff2 + Lora-Italic-VariableFont_wght.woff2. Update `@font-face` declarations and `font-weight`
usages. Verify CLS does not regress (size-adjust on Georgia fallback already locked). Net −64KB on font budget, one
fewer round-trip. Single commit; reversible.

**Phase 3 — Refresh TheatreSlate.** Re-render the four-line slate with the new Lora-VF wght axis and the
`--label-mono-tracking` for the role line. No new data fields required. The change is largely typographic.
Backward-compatible with all 24 existing productions.

**Phase 4 — Refresh Marginalia (louder).** Add `--marginalia--pull` variant in Lora italic, add `--gutter-margin-pull`
float behaviour at ≥1024px, route directorsNote pull-quotes and runs to the new variant. Existing Marginalia call sites
continue to render unchanged on small screens.

**Phase 5 — Refresh EmptyState as ERRATA.** Replace the existing EmptyState text with the Lora-italic ERRATA register,
render in EN/RU/DE per chrome locale. No component-API change.

**Phase 6 — Add SpecimenPlate component.** New CSS Module, new MDX wrapper. Adopt for `/productions/[slug]` gallery.
Existing gallery items render with the inset 1px rule and mono caption. Falls back to existing `<img>` if
`coverStyle === 'photo'` is false. No frontmatter migration.

**Phase 7 — Add TourRider component.** New CSS Module, new MDX wrapper. Adopt for `/productions/[slug]`. Reads existing
frontmatter fields (durationMin, ageRating, form, lineage, techRider, pressKit). Renders only fields that exist; null
fields produce no row. No migration.

**Phase 8 — Add TypographicCover + CreditLine + DottedProgress components.** Three new CSS Modules. TypographicCover
gated by `coverStyle === 'typographic'`. CreditLine gated by presence of `image.credit`. DottedProgress installed at
root layout, conditionally rendered. No frontmatter migration if `coverStyle` already exists; otherwise see Phase 9.

**Phase 9 — Frontmatter migration: introduce `coverStyle` field.** This is the only phase requiring a frontmatter update
across the 24 productions. Each production gains `coverStyle: 'photo' | 'typographic'`. Default is computed at build
time as `coverStyle = poster?.src && poster?.lqip ? 'photo' : 'typographic'`, so existing files do not need editing — a
build-time script writes the field if absent. After this phase, the typographic-cover system is canonical for posterless
shows. Reversible by reverting the schema change and the script.

The order above front-loads risk-free token and font work, defers the only data-schema migration to last, and ensures
every commit between Phase 1 and Phase 8 is independently revertible without leaving the deployed site in a broken or
visually inconsistent state.
