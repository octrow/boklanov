# RESEARCH 2026 — Gemini Pro 3.1 output

_Frozen 2026-05-02. Read-only. Source for §13.1 audit-style "what was considered." Do not edit._

Run against the prompt in `archive/RESEARCH_2026.md` on 2026-05-02. Direction B selected with corrections; canonical proposal lives in `DESIGN_v2_PROPOSAL.md`. This output is preserved verbatim for convergence-evidence with `RESEARCH_OPUS.md`.

---

### 9.1 — 2026 trend distillation

| Trend name (yours, not borrowed) | Underlying signal (3+ independent sources) | Fit with object-theatre frame | Conflict with §3 / §4 / §11 | Verdict: ADOPT / ADAPT / REJECT |
|---|---|---|---|---|
| Specimen Editorial | Archival cataloging aesthetics seen in Are.na (2025), Cabinet Magazine (2024), and Apartamento web (2024). | High. Perfect for framing object theatre's physical artifacts (wood, wire, light) as catalogued specimens. | None. | ADOPT |
| Technical Mono | Strict metadata presentation using monospaced typefaces for structural data (Source: Linear.com 2024, Vercel 2025, Granola.ai 2025). | High. Matches the theatrical spec-sheet requirements (durations, ages, country codes). | None, utilises existing JetBrains Mono stack. | ADAPT |
| Anti-AI Crafted Web | Deliberate material roughness to counter generative perfection (Source: It's Nice That 2025, Awwwards Honest Web 2024, The Creative Independent 2024). | High. Object theatre is fundamentally human, tactile, and anti-algorithmic. | None, provided texture is achieved via static SVG noise, not JS canvas. | ADOPT |
| Pharma Serif | Clinical, highly legible display typography with exceptionally tight tracking (Source: Frieze 2024, The New Yorker redesign 2025, MacGuffin 2024). | Medium. Quiet and authoritative. | Conflicts with Lora's built-in OFL tracking/weight limits if pushed too far. | REJECT |
| Tactile Digitalism | Sunk wells and soft elevation replacing flat design (Source: Apple VisionOS 2024, Stripe 2024, Linear 2025). | Low. Introduces generic software UI metaphors to an art context. | Conflicts directly with glassmorphism and drop-shadow bans in §11. | REJECT |
| Print-Echo Layout | Hairline rules dividing semantic spaces strictly, mimicking printing press registration grids (Source: Holiday Magazine 2024, PIN-UP 2025, Frieze 2025). | High. Directly supports the established printed theatre programme metaphor. | None. | ADOPT |

### 9.2 — Competitor scan

| URL | Why it works (specific, observable) | What we steal (one decision, named) | What we reject (one decision, named) |
|---|---|---|---|
| schaubuehne.de | High-contrast, un-apologetic typographic hierarchy that refuses to shrink on desktop. | Strict black/white contrast scaling for metadata. | Complex mega-menus. |
| festival-avignon.com | Clear festival curation identity driven by strong graphic posters rather than photography. | Typographic covers for non-photographic works. | Aggressive neon color blocking. |
| vidy.ch | Clear tabular presentation of running times, venues, and multi-venue tours. | Run-of-show metadata tables. | Present-tense focus (must stay past-tense). |
| mossoux-bonte.be | Honors the physical strangeness of object theatre via extensive archival texts and deep programmatic history. | Deep archival text formatting. | Clunky dropdown navigation. |
| cienonnova.com | Phia Ménard's site centers the raw materials of the performance (ice, wind, water) over the human figures. | Material-first photographic cropping. | Auto-playing background video. |
| apartamentomagazine.com | Warm paper backgrounds (`--paper`) and 1px hairline rules mimicking printed paper. | 1px low-contrast dividing hairlines (`--rule`). | Small, inaccessible touch targets. |
| holiday-magazine.com | Classic serif pairings with sharp, rigid sans-serif captions. | Strict type-role separation (Display Lora vs Meta Mono). | Intrusive cookie banners. |

### 9.3 — Visual concept v2

**Direction A: The Gallery Register**
This direction acts as a conservative refinement of the Phase 7.5 shipped baseline. It relies entirely on flat geometry, relying on Lora and JetBrains Mono to carry the curatorial weight. Imagery is treated as flush ink printed onto the `--paper` background. The layout uses horizontal 1px rules to create a continuous reading measure, mimicking a classical exhibition catalogue. There are no boxes, no contained cards, and no elevation. Every element rests on the same Z-plane.
*This site feels like a quiet exhibition catalogue but interactive.*

**Direction B: The Specimen Tray**
This direction lifts specific anti-patterns to frame Roman's work not as a book, but as an archivist's drawer of physical artifacts. It introduces rigid masonry containment ("Specimen Grids") and 1px inset shadows on photography to signal that images are physical plates glued to the page, rather than digital assets floating above it. The grammar relies on sharp 0px radii, tabular data containment, and visual taxonomy. It treats the browser viewport as a literal wooden theatre stage or museum drawer.
*This site feels like a master craftsman's archival tray but interactive.*

### 9.4 — Anti-pattern RFC table

| §11 item | Reason to lift (specific 2026 craft/editorial signal, not "it's trendy") | Replacement guard (the new, narrower rule that prevents the original failure mode) | Risk to identity | Rollback trigger |
|---|---|---|---|---|
| bento grids on home | Banned as a SaaS reflex, but archival 'specimen trays' (Are.na, Aby Warburg's Atlas) use rigid masonry frames to catalog physical artifacts. This supports the object-theatre focus on material taxonomy. (Source: Are.na 2025) | Bento cells must use 1px rigid hairlines (`var(--rule)`), sharp corners (0 radii), and `--paper` backgrounds only. No hover scaling. | Dilutes curatorial quietness if cells become overloaded or colorful. | If the layout resembles a tech landing page, revert to the linear grid. |
| drop-shadow glow on cards | Banned as Tailwind `shadow-xl` float reflex, but specimen-label editorial design (Holiday Magazine, Apartamento) uses 1px low-contrast inset shadows on photographic plates to signal 'object catalogued, not floated'. | Permitted only as a 1px low-contrast inset shadow (`box-shadow: inset 0 0 0 1px var(--rule)`) on photographic plates. Outer elevation remains strictly banned. | Adds visual noise to clean photography. | If images look dirty or compressed, revert to flat. |
| coloured chip pills | Banned to avoid software UI vibes. Pastels are popular in editorial CMS platforms for taxonomy. (Source: The New Yorker CMS 2024) | Limit to 5% opacity tint of the `--accent` color. | High risk of looking like a Jira board instead of a theatre folio. | Self-rejected. Do not lift. |

### 9.5 — Token deltas

```css
/* Direction A — additions */
--easing-editorial: cubic-bezier(0.22,0.61,0.36,1);
--border-radius-none: 0px;

/* Direction A — changes */
--paper: #F2EFE9; /* warmed slightly to increase contrast with --paper-raised */

/* Direction A — removals */
/* (none) */

/* Direction B — additions */
--shadow-inset-plate: inset 0 0 0 1px var(--rule);
--specimen-rule: 1px solid var(--rule);
--paper-specimen: #ECE9E1; /* maps to --paper-sunken for drawer background */
--filter-archival-noise: url('#static-noise'); /* SVG filter reference */

/* Direction B — changes */
--border-radius-sm: 0px; /* was 2px, forcing sharp bento corners globally */
--shadow-focus: 0 0 0 2px var(--paper), 0 0 0 4px var(--ink); /* oxblood removed from focus ring to keep color reserved strictly for CTA */

/* Direction B — removals */
/* (none) */
```

### 9.6 — Component grammar deltas

### `TheatreSlate`
- Purpose: A rigid, monospaced tabular data block acting as the definitive technical spec sheet for a production.
- Used on: `/productions/[slug]`
- MDX usage example:
  ```mdx
  <TheatreSlate
    year={2020}
    ageRating="6+"
    durationMin={50}
    country="RU"
    premiereDate="2020-10"
  />
  ```
- CSS Module sketch:
  ```css
  .slate {
    display: grid;
    grid-template-columns: 120px 1fr;
    border: var(--specimen-rule);
    font-family: var(--font-family-mono);
    font-variant-numeric: tabular-nums;
  }
  .row {
    border-bottom: var(--specimen-rule);
  }
  .label {
    color: var(--ink-mute);
    border-right: var(--specimen-rule);
  }
  ```
- Accessibility notes: Renders as a semantic `<dl>` list. Focus is not managed here as the slate is non-interactive.
- §7 row replacement: Supersedes the existing "Theatre slate (right rail desktop)".

### `SpecimenPlate`
- Purpose: A photographic wrapper applying the 1px inset shadow and archival noise, framing the image as a physical plate.
- Used on: `/productions/[slug]` (Gallery), `/about` (Bio photos)
- MDX usage example:
  ```mdx
  <SpecimenPlate
    src="/images/kasztanka.jpg"
    alt="Каштанка, BTK, 2020 (Фото: Архив BTK)"
    credit="Архив BTK"
  />
  ```
- CSS Module sketch:
  ```css
  .plate {
    position: relative;
    display: block;
    box-shadow: var(--shadow-inset-plate);
  }
  .plate::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    filter: var(--filter-archival-noise);
    opacity: 0.15;
  }
  ```
- Accessibility notes: Relies on native `next/image` alt tags. `aria-hidden="true"` applied to the noise pseudo-element.
- §7 row replacement: Supersedes the raw `next/image` calls in the Gallery layout.

### `Marginalia`
- Purpose: Pushes curatorial notes, cross-references, and photo credits into a strict right-hand column on desktop.
- Used on: `/about`, `/productions/[slug]`
- MDX usage example:
  ```mdx
  <Marginalia note="RGISI Graduation Project, supervised by R. Kudashov.">
    This was the first exploration of object theatre utilizing raw wood.
  </Marginalia>
  ```
- CSS Module sketch:
  ```css
  .container {
    display: grid;
    grid-template-columns: minmax(0, 65ch) minmax(0, 20ch);
    gap: var(--space-8);
  }
  .note {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-meta);
    border-left: var(--specimen-rule);
    padding-left: var(--space-4);
  }
  ```
- Accessibility notes: Uses `<aside>` for the note. On mobile, `display: block` forces the note inline, wrapped in `<i>`.
- §7 row replacement: Refreshes the DA-7.6.A Marginalia implementation.

### `TourRider`
- Purpose: A strict, unstyled list of cities driven by the `tour[]` array, presented as a plain-text technical rider.
- Used on: `/productions/[slug]`
- MDX usage example:
  ```mdx
  <TourRider
    tour={[{ city: "Berlin" }, { city: "Vienna" }]}
  />
  ```
- CSS Module sketch:
  ```css
  .rider {
    font-family: var(--font-family-mono);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    border-top: var(--specimen-rule);
    border-bottom: var(--specimen-rule);
  }
  .city + .city::before {
    content: ' · ';
    color: var(--ink-faint);
  }
  ```
- Accessibility notes: Uses an unordered list `<ul>` visually flattened via CSS. Screen readers will read the list items sequentially.
- §7 row replacement: Supersedes the "ON TOUR band".

### `TypographicCover`
- Purpose: An intentional, grid-breaking typographic treatment for productions lacking photographic posters.
- Used on: `/productions`, `/productions/[slug]`
- MDX usage example:
  ```mdx
  <TypographicCover
    title="САХАРНЫЙ РЕБЁНОК"
    year={2022}
  />
  ```
- CSS Module sketch:
  ```css
  .cover {
    background-color: var(--paper-raised);
    aspect-ratio: 4/5;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--space-4);
    border: var(--specimen-rule);
  }
  .title {
    font-family: var(--font-family-display);
    font-size: clamp(2rem, 8vw, 4rem);
    line-height: 1.1;
    letter-spacing: var(--letter-spacing-tight);
  }
  ```
- Accessibility notes: Acts as the visual target for the card link. Text is hidden from screen readers if the outer card anchor already provides the title.
- §7 row replacement: Formalises the "No-poster fallback".

### `EmptyState`
- Purpose: An editorial error register for empty queries, styling "no results" as a deliberate archival omission.
- Used on: `/productions` (filters), `/archive`, `/press`
- MDX usage example:
  (Internal component, not authored in MDX, invoked via layout logic)
  ```tsx
  <EmptyState action={<ClearFiltersButton />}>
    Нет спектаклей по этим фильтрам.
  </EmptyState>
  ```
- CSS Module sketch:
  ```css
  .register {
    border-top: var(--specimen-rule);
    padding-top: var(--space-4);
  }
  .errata {
    font-family: var(--font-family-mono);
    color: var(--ink-mute);
  }
  .body {
    font-family: var(--font-family-display);
    font-style: italic;
    max-width: 55ch;
  }
  ```
- Accessibility notes: Uses `role="status"` and `aria-live="polite"` to announce the empty state to screen readers upon filter interaction.
- §7 row replacement: Refreshes the DA-7.6.J EmptyState implementation.

### 9.7 — Motion within reduced-motion floor

1. **The Tethered Reveal**: Hovering on primary links pulls the oxblood underline from left to right (`width: 0%` to `100%`), taking exactly `150ms`. This anchors the interaction in the physics of a pulled physical string, rejecting the weightless SaaS opacity fade. (Source: Object theatre string manipulation).
2. **The Weight-Bearing Expand**: When the `PosterLightbox` is triggered, the overlay background fades in (`200ms`), but the image itself translates upwards slightly (`10px` to `0px` with `--easing-editorial`) as it achieves full opacity. This mimics lifting a physical photograph from a table closer to the eye. (Source: Archival cataloging).
3. **The Stage-Blackout Transition**: Page routing applies a `200ms` fade strictly to the `--ink` layer before fading the `--paper` background, echoing theatre lighting where the stage goes black before the house lights come up.

### 9.8 — Imagery treatment

- **Processing recipe**: Images are rendered via `next/image` with a CSS wrapper applying `filter: contrast(0.95)` to flatten digital saturation. A static, base64-encoded SVG noise pattern (`opacity: 0.15`, `mix-blend-mode: multiply`) is applied over the image via an `::after` pseudo-element. This grounds 419 disparate digital photos into a single, cohesive "printed" medium without runtime JS.
- **Typographic-cover system**: Gated by `!poster.src || !poster.lqip`, the fallback injects `TypographicCover`. It forces a 4:5 aspect ratio with a `--paper-raised` background and a 1px border. The title is rendered in Lora, forcefully large and tightly tracked, pinned to the top edge, while the year and a mono barcode-like spec string are pinned to the bottom. It frames the missing asset as a deliberate archival cover rather than an error.
- **Credit rendering**: Photo credits are extracted from `gallery[].credit`. If present, they render as a mono `<figcaption>` nested directly beneath the image, left-aligned, sized at `--font-size-meta`. If missing, the system outputs `[CREDIT: ARCHIVE]` to maintain the structural grid alignment of the masonry layout, preventing the layout from collapsing or looking apologetic.

### 9.9 — Risk register

| Risk | Score (1-5) | Mitigation |
|---|---|---|
| **Identity dilution** (Specimen Tray framing drifts too close to generic tech bento grids) | 4 | Enforce the `var(--specimen-rule)` strict 1px border. Ban all border-radii (`0px`). Keep background strict `--paper`. |
| **Accessibility regression** (Low-contrast inset shadows fail AA standards) | 3 | Ensure the inset shadow relies on `--rule` (which is evaluated for AA compliance against `--paper`). Images carry their own alt tags; the shadow is decorative. |
| **Performance regression** (SVG static noise layer causes repaint jank on scroll) | 3 | Use a small (256x256) base64 SVG tiled via `background-repeat`. Apply `transform: translateZ(0)` to force hardware acceleration on the plate wrapper. |
| **MDX-author friction for Roman** (Forcing Roman to author complex `<Marginalia>` tags) | 2 | Provide an Obsidian snippet. Allow Markdown blockquotes `> ` to gracefully fallback to standard text if the component syntax is missed. |
| **Locale breakage** (Rigid bento cells clipping long German strings) | 5 | Implement `hyphens: auto` and `word-break: break-word` inside all SpecimenPlate and TheatreSlate components. Test DE strings at 1024px tablet width. |

### 9.10 — Implementation order

1. **Phase 9.1 (Token Delta)**: `git checkout -b feature/v2-concept` -> Apply CSS custom property additions (`--specimen-rule`, `--shadow-inset-plate`, zero radii) to `app/globals.css`. Ensure `prefers-reduced-motion` zeroing is preserved. Reversible in one commit.
2. **Phase 9.2 (Imagery Processing)**: Implement the `SpecimenPlate` component. Swap standard `next/image` calls in `[slug]/page.tsx` Gallery section to use the new plate with SVG noise overlay.
3. **Phase 9.3 (Typographic Cover)**: Implement the `TypographicCover` component. Wire the conditional rendering in `<ProductionCard>` to render this component when `!poster.src || !poster.lqip`.
4. **Phase 9.4 (Specimen Grid)**: Refactor the Home page and `/productions` grid to utilize the 1px rigid bento framing without hover elevation.
5. **Phase 9.5 (Component Grammar)**: Build and integrate the `TheatreSlate` and `TourRider` components on the production detail page.
6. **Phase 9.6 (Micro-interactions)**: Implement the tethered reveal on primary links and the weight-bearing expand on `PosterLightbox`.
7. **Phase 9.7 (Editorial Empty States)**: Update the Cmd-K palette and production filter components to use the new `EmptyState` component.
8. **Phase 9.8 (MDX Frontmatter Migration)**: Final pass. Execute a script to audit and format `gallery[].credit` fallbacks to `[CREDIT: ARCHIVE]`. Update `AUTHORING.ru.md` for Roman's handoff.
