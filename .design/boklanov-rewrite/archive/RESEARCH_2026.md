# RESEARCH 2026 — prompt

_Frozen 2026-05-02. Read-only. Methodology record._

Prompt for the Capital-V Visual v2 pre-Phase-9 milestone. Run against Gemini Pro 3.1 (output: `RESEARCH_GEMINI.md`) and Claude Opus 4.7 (output: `RESEARCH_OPUS.md`) on 2026-05-02. Opus output selected as basis for `DESIGN_v2_PROPOSAL.md` (active). Do not edit; if a future research run needs a different prompt, write a new file (e.g. `RESEARCH_2027.md`).

Original front-matter follows verbatim:

---

# RESEARCH 2026

Research prompt for a "Capital-V Visual v2" pre-Phase-9 milestone. Updated: 2026-05-02.

Owns: the prompt below — a self-contained brief to feed an external research model (Claude Opus, GPT-5, Gemini 2.5 Pro) and harvest a 2026 design direction grounded in this site's actual constraints.

Status: prompt drafted, research not yet run. When research returns, we will:
1. file the raw output as `archive/RESEARCH_2026_RAW.md` (read-only),
2. distil the actionable subset into a new `DESIGN_v2_PROPOSAL.md`,
3. open MAP.md §5 unfreeze events for any `DESIGN.md` §11 anti-pattern we choose to lift,
4. only then begin a Phase 9.x implementation plan.

Scope chosen by Daniil 2026-05-02 (RFC mode, full visual refresh, theatre/festival + critic audience, English output, competitor scan included, ~2–3 weeks budget).

---

## How to use this prompt

1. Paste the section between the `===` markers into a frontier model with web access and large context (Claude Opus 4.7 with extended thinking, GPT-5 with browse, or Gemini 2.5 Pro with deep research).
2. Attach (or paste) `DESIGN.md`, `STATUS.md`, `archive/DESIGN_BRIEF_compress.md`, `archive/DESIGN_AMBITION_compress.md`, and `archive/INFORMATION_ARCHITECTURE_compress.md` so the model can ground claims in the project's locked decisions.
3. Demand the structured output specified in §10 of the prompt. Reject any answer that returns unstructured prose.
4. If the model proposes lifting an anti-pattern, it MUST follow the RFC format in §6 (Reason → Replacement guard → Risk to identity → Rollback). Generic "this is trendy in 2026" is not a reason — reject.

---

## ===PROMPT START===

### 1. Role

You are a Creative Director and Interactive Design Strategist with deep experience in:
- avant-garde editorial web design (publications like *The New Yorker*, *Apartamento*, *Frieze*, *Holiday Magazine*, *Wallpaper\**, *Lampoon*),
- artist/director portfolios at the intersection of theatre, performance art, and contemporary craft,
- 2025–2026 frontier digital aesthetics (Technical Mono / Code Brutalism, Tactile Digitalism, Naive Design, Pharma Serif, Specimen Editorial, Anti-AI Crafted Web),
- production-grade Next.js 15 App Router + MDX + CSS Modules engineering (no Tailwind, no CSS-in-JS runtime).

You are not a marketing copywriter. You do not produce SaaS landing pages. You do not pitch generic "minimalist clean modern" templates.

### 2. The subject

Roman Boklanov is a theatre director — puppet theatre, object theatre, kids/teens performance work. The site is a curatorial portfolio, not a venue, not a production company, not a CMS-driven blog.

Hard biographical facts (from `archive/DESIGN_AMBITION_compress.md`):
- No troupe — independent freelance director.
- Has not worked in Russia since 2022 mobilisation. All Russia work is past-tense (`ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`).
- Works in RU, EN, DE markets. Has staged in: SPB, Moscow, Almaty, Bremen, Vienna, Berlin, Tashkent.
- Tradition (lineage): BTK Saint-Petersburg, Kudashov school. Object theatre as material practice — wood, wire, silk, light.
- 24 productions in catalogue; 4 have posters; 419 production photos; most shows have no poster (typographic fallback is intentional).
- Site lives at `boklanov.vercel.app`; cutover to `boklanov.com` deferred.
- Birthday surprise — Roman has not seen the site yet.

The site's central job (from `DESIGN.md` §1, the "curator on mobile, 90 seconds" test):
> A theatre festival programmer scrolling on the U-Bahn must walk away with: (a) what kind of theatre this is, (b) two or three productions they'd want to book, (c) a non-Instagram way to contact Roman.

Secondary audience: critics and peers (stronger taste, slower read).

### 3. The stack (HARD — do not propose violations)

- Next.js 15 App Router, React 19, TypeScript 5.9 strict.
- `next-intl` v4 — RU canonical at `/` (no prefix), EN at `/en`, DE at `/de` (chrome only).
- MDX per production, frontmatter is single source of truth (see `CONTENT.md` §Frontmatter shape).
- CSS Modules + design tokens via `app/globals.css` custom properties. **No Tailwind. No styled-components. No Emotion. No runtime CSS-in-JS.**
- Self-hosted Lora + Inter + JetBrains Mono OFL under `public/fonts/`. **No Google Fonts CDN. No additional font families without a stack-cost justification.**
- `next/image` AVIF/WebP. `sharp` LQIPs inlined in frontmatter. **No third-party image CDNs other than the existing R2.**
- Static-first. **No client-side data fetching. No backend. No database.** Booking CTA is a `mailto:` with prefilled subject.
- Analytics: PostHog with exactly one event (`booking_cta_click`), no autocapture, no session recording, silent without API key. **Do not propose adding events, heatmaps, or recording.**
- Accessibility floor: AA always, AAA where possible, focus rings mandatory, 44×44 touch targets, `prefers-reduced-motion` zeros all `--duration-*` at the token layer.

### 4. What is locked (HARD — do not contest)

These come from `archive/DESIGN_BRIEF_compress.md` D1–D15 and the constraints block of `STATUS.md`:

- Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`. No present-tense Russia work. Year-only colophon. No city tour list in chrome.
- Production-card text stays RU/EN regardless of locale; DE chrome only; `hreflang` RU↔EN only.
- Awards and press are quoted in their original language only.
- Sticky booking CTA stays `mailto:`. No form, no CAPTCHA, no booking widget.
- I5 signature gesture cut formally. DA-3.A slate-strike + DA-3.C edition-frame fallback shipped — do not revisit, do not propose a "better" one-shot home gesture.
- Wordmark is always lowercase Lora `роман бокланов` / `roman boklanov`. Never caps, italic, or coloured. Never a logomark.
- One reserved colour: oxblood (`--accent`). Reserved for booking-CTA fills, hover underline reveal on primary links, focus ring. Nowhere else.
- No newsletter, no cookie banner (none needed — no tracking), no "Built with Next.js" footer, no stock photography.

If your concept requires breaking any of the above, reject the concept — do not propose the break.

### 5. What is RFC-able (SOFT — proposals welcome WITH justification)

Everything in `DESIGN.md` §3 (palette beyond the oxblood reservation), §4 (type scale and pairings, given the locked OFL trio), §5 (spacing scale, grid, radii, shadows), §6 (motion, within the `prefers-reduced-motion` floor), §7 (component grammar), and §11 (anti-patterns).

In particular, you may challenge any of these §11 anti-patterns if you can clear the §6 RFC bar below:
- glassmorphism, neumorphism, claymorphism (currently banned),
- bento grids on home (currently banned),
- drop-shadow glow on cards (currently banned),
- coloured chip pills (currently banned — status conveyed by font-weight),
- kinetic gradient meshes / animated gradient text (currently banned).

Some of those bans are correct for this brand. Some may be mid-2020s reflexes that don't deserve to govern a 2026 redesign. Your job is to tell the difference.

### 6. RFC bar for lifting any anti-pattern

For each §11 entry you propose lifting, return a row in this exact shape:

```
| §11 item | Reason to lift (specific 2026 craft/editorial signal, not "it's trendy") | Replacement guard (the new, narrower rule that prevents the original failure mode) | Risk to identity | Rollback trigger |
```

Example of an acceptable Reason: *"Drop-shadows are banned because Phase 1 was rejecting the Tailwind `shadow-xl` reflex. But specimen-label editorial design (Holiday Magazine 2025, Apartamento Issue 35) uses 1px low-contrast inset shadows on photographic plates to signal 'object catalogued, not floated'. This is the opposite failure mode from `shadow-xl` and supports the object-theatre frame."*

Example of an unacceptable Reason: *"Drop-shadows are popular again in 2026."* Reject and move on.

### 7. Rejected on input (do not waste output tokens on these)

- "Add a hero video."
- "Add a chatbot."
- "Add testimonials with star ratings."
- "Add an animated mesh gradient."
- "Use Tailwind."
- "Use a marketing template like Stripe / Linear / Vercel landing page."
- "Use AI-generated imagery."
- "Make it a single-page scrollytelling experience."
- "Add a dark/light theme toggle button" (auto via `prefers-color-scheme`, no manual toggle in chrome).
- "Use shadcn/ui."
- Any reference to crypto, web3, AI agents, "AI-Native UI" chips, or generative motion graphics.

### 8. Subject-domain references to mine, not borrow

Read these aesthetic neighbourhoods for grammar; never produce pastiche of them:
- Editorial print: *Apartamento*, *The New Yorker*, *Holiday Magazine*, *Frieze*, *Lampoon*, *Toiletpaper*, *MacGuffin*, *PIN-UP*.
- Theatre programme books: *La MaMa* season programmes, *Festival d'Avignon* identity (Atelier Têtard), *Schaubühne Berlin*, *Volksbühne*, *La Comédie de Genève*, *Théâtre de la Ville Paris*.
- Object/puppet theatre material culture: BTK Saint-Petersburg programmes, *Théâtre du Soleil* archival materials, *Compagnie Mossoux-Bonté*, *Buchty a loutky* visual rough.
- Specimen / archival / scientific editorial: *Cabinet Magazine*, herbarium plates, Aby Warburg's Mnemosyne Atlas, museum catalogue raisonnés.
- Web: linear.com (chrome stillness), claude.ai (warm), granola.ai (mono restraint), the-newyorker.com (typographic hierarchy), are.na (specimen layout), it's-nice-that.com (editorial discipline).

### 9. Deliverables — produce all ten sections

Format every section with the exact heading shown. Use markdown tables where specified. Cite sources with `(Source: <url or publication name + year>)` at the end of every claim. No claim without a source.

#### 9.1 — 2026 trend distillation

Identify 5–7 macro-trends in 2026 editorial / portfolio web design relevant to this brief. For each, produce a row:

```
| Trend name (yours, not borrowed) | Underlying signal (3+ independent sources) | Fit with object-theatre frame | Conflict with §3 / §4 / §11 | Verdict: ADOPT / ADAPT / REJECT |
```

Trends to seriously evaluate (you may add more): Technical Mono / Code Brutalism, Specimen Editorial, Naive Design, Pharma Serif, Anti-AI Crafted Web, Tactile Digitalism, Print-Echo Layout, Programmatic Marginalia, Zine Geometries, Heritage Apothecary, Risograph Web, Variable-Weight Editorial.

#### 9.2 — Competitor scan

5–10 theatre / director / performance-artist portfolios live in 2024–2026 + 3–5 high-end editorial sites. For each, one row:

```
| URL | Why it works (specific, observable) | What we steal (one decision, named) | What we reject (one decision, named) |
```

Prioritise: Schaubühne Berlin, Festival d'Avignon, Théâtre Vidy-Lausanne, Punchdrunk, Compagnie Mossoux-Bonté, Robert Lepage / Ex Machina, Romeo Castellucci / Societas, Tim Etchells, Phia Ménard. Editorial: Cabinet Magazine, Apartamento web, Holiday Magazine web, are.na, Frieze. If a site is dead or generic, drop it from the table.

#### 9.3 — Visual concept v2

Propose **two** named directions, A and B, that meet the brief. Each direction = 8–12 sentences of mood vocabulary + one "north-star sentence" of the form *"This site feels like ____ but interactive."*

Direction A should be the conservative refresh (preserves §11 mostly intact, lifts 0–2 anti-patterns).
Direction B should be the ambitious refresh (lifts 2–5 anti-patterns, justified per §6).

Do not propose three. Two forces a decision.

#### 9.4 — Anti-pattern RFC table

For Direction B only, produce the §6 RFC table for every anti-pattern you propose lifting. Reject your own row if it can't clear the bar. Show your rejected rows too — they prove the discipline.

#### 9.5 — Token deltas

For both directions, produce a unified diff against `DESIGN.md` §3–§6 and `app/globals.css`. CSS custom properties only. Format:

```css
/* Direction A — additions */
--specimen-rule: ...;
/* Direction A — changes */
--paper: <new> /* was #F4F2EC */;
/* Direction A — removals */
/* (none) */
```

Do not propose adding font families. Work within Lora + Inter + JetBrains Mono. Subset additions (italic, additional weights from the existing OFL files) are acceptable if you cite the file-size cost.

#### 9.6 — Component grammar deltas

Propose 5–8 new or refreshed components. For each:

```
### <ComponentName>
- Purpose (1 sentence)
- Used on (routes from DESIGN.md §8)
- MDX usage example (3–6 lines, real props from CONTENT.md frontmatter)
- CSS Module sketch (key selectors only, ≤20 lines)
- Accessibility notes (focus, ARIA, reduced-motion behaviour)
- §7 row replacement (which existing component — if any — this supersedes)
```

Components specifically wanted (you may add more): a refreshed **TheatreSlate**, a new **SpecimenPlate** (photographic plate with archival mono caption), a refreshed **Marginalia** (currently shipped, can it be louder?), a new **TourRider** (object-list as technical document), a refreshed **EmptyState** (currently the ERRATA register, can it be more typographically alive?).

#### 9.7 — Motion within reduced-motion floor

Within the `--duration-fast 150ms / --duration-normal 200ms / --duration-slow 400ms` ceiling, propose 2–4 micro-interactions that survive `prefers-reduced-motion: reduce` becoming a no-op. Each must cite the physics of object/puppet theatre (tethered, weight-bearing, manipulated) without literal puppet metaphors. Do not propose scroll-driven entrances, parallax, or kinetic type — those stay banned regardless of trend.

#### 9.8 — Imagery treatment

Given 419 photos with unstructured credits and most shows lacking a poster (the typographic fallback is intentional), propose:
- One photographic processing recipe (CSS filters and/or static SVG noise overlays — no canvas, no JS).
- One typographic-cover system for the 20+ shows that have no poster, with `coverStyle` already gated on `poster.src && poster.lqip`.
- One credit-rendering pattern that survives 80% missing data without looking apologetic.

#### 9.9 — Risk register

For Direction B specifically, score the top 5 risks in a 1–5 scale across {identity dilution, accessibility regression, performance regression, MDX-author friction for Roman, locale breakage}. Recommend a mitigation for each ≥3.

#### 9.10 — Implementation order

If we adopt Direction B, propose a 6–10 phase sequence (`9.1`, `9.2`, …) sized to atomic commits, each shippable to `boklanov.vercel.app` independently. The first phase must be reversible by `git revert` of a single commit. The last phase may be the first to require an MDX frontmatter migration.

### 10. Output rules

- English. ASCII or UTF-8, no emoji.
- Cite every empirical claim. Reject your own paragraph if it has no citation.
- Use the exact section numbering 9.1–9.10 above. No alternate structure. No executive summary.
- If a section has nothing to say, write `Nothing to add.` and move on. Do not pad.
- Length budget: 4000–8000 words across all ten sections. If a single section exceeds 1500 words, you are over-explaining.
- Do not flatter the brief. Do not preface. Do not apologise. Open with section 9.1.

### 11. One self-check before you ship

Before returning, scan your draft for the following failure modes and edit them out:
- "in 2026, designers are exploring…" → reject, rewrite as a specific signal with citation.
- "this trend is gaining traction…" → reject, name the signal.
- generic SaaS verbs ("seamless", "elegant", "intuitive", "delightful") → strike.
- "consider adding…" → reject, commit to a verdict.
- any sentence that would survive being pasted into a Stripe redesign brief → strike.

## ===PROMPT END===

---

## After-research checklist

When the research returns:

1. Save raw output to `archive/RESEARCH_2026_RAW.md` with `_Frozen YYYY-MM-DD_` banner. Add to MAP.md §2.
2. Read sections 9.3 and 9.4 first. If Direction B does not clear the §6 RFC bar honestly, fall back to Direction A or re-prompt.
3. For each anti-pattern row in 9.4 we accept, open a MAP.md §5 unfreeze event against `archive/DESIGN_BRIEF.md` §8 and mirror to `DESIGN.md` §11. One commit per unfreeze.
4. Stage 9.5 token deltas in a `feat(9.x): tokens v2 staging` commit on a branch, never directly on `main`.
5. Walk Roman through Direction A vs B in person before any token lands on `main`. The site is still a birthday surprise — do not push v2 to `boklanov.vercel.app` without confirmation.
6. Once a direction is chosen, this file moves to `archive/RESEARCH_2026.md` with the unmet sections deleted; the chosen direction becomes `DESIGN_v2_PROPOSAL.md` (active doc, register in MAP.md §1).
