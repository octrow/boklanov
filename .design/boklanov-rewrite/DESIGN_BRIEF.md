# DESIGN BRIEF — boklanov.com / boklanov.ru rewrite

> Output of the `/grill-me` interview, locked 2026-04-30. This brief is the
> source of truth for every Phase 2+ decision. If a downstream phase wants to
> contradict something here, that is a brief change and needs explicit
> sign-off, not a unilateral pivot.

---

## 1. Project context

Roman Boklanov is a theatre director working between Almaty, Saint Petersburg,
and Western Europe. His repertoire is **puppet theatre, theatre of objects, and
contemporary theatre for kids / teens / family** — ages 3+ to 18+, 30+ staged
productions, 20+ awards, active touring across KZ, RU, DE, ES, AT, BY.

Today's site is a `react-notion-x` renderer over a public Notion page. It has
two structural problems and one tonal one:

- **Structural:** content is unstructured Notion blocks, so the site cannot
  filter by age, country, role, or theatre form; bilingual handling is just a
  link to a parallel Notion page; SEO/OG is weak; first paint depends on
  Notion's API uptime.
- **Tonal:** the site looks like a Notion theme. There is no theatre-specific
  atmosphere, no editorial voice, no curatorial signal. A festival curator
  opening it on mobile sees "another Notion site," not Roman's body of work.

The rewrite addresses both.

---

## 2. Primary user and jobs to be done

**#1 user:** a **theatre director or curator** (probably Russian-speaking) in a
European city — **Berlin, Bremen, Vienna, London, Alicante, Bern, Hamburg,
Munich** — opening the link from an Instagram DM or a colleague's email,
**on mobile**, in **about 90 seconds**.

What they need to walk away with:

1. Clarity on **what kind of theatre Roman makes** — puppet / object / kids+teens,
   not avant-garde adult drama.
2. **Two or three productions** they could request video for, framed by
   artistic identity (lineage with Кудашов / БТК / РГИСИ) rather than award
   counts.
3. **A contact method that is not Instagram** — copy-pasteable email plus a
   booking-prefilled mailto.

Secondary users, in priority order:

- **Press / festival jury** — needs an EPK feel: bio, hi-res photos, awards,
  press clippings, downloadable press kit where available.
- **Parents / general visitors** — long tail; covered by good baseline UX, not
  a separate experience.

The full chronological CV (every reading, every workshop, every short
festival sketch) is **demoted to an `/archive` route** — not the front of the
site.

---

## 3. Decisions locked from the grilling interview

| #   | Decision                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Site goal:** booking magnet first, EPK second, archive third.                                                                                       |
| D2  | **Primary user:** theatre director / curator, RU-speaking, EU cities, mobile, 90s.                                                                    |
| D3  | **Content source:** Notion stays editor-of-record. `scripts/sync-from-notion.ts` regenerates `content/productions/*.mdx` at build. MDX is generated, never hand-edited. |
| D4  | **Bilingual:** RU + EN parity for everything programmers care about. **DE = UI-chrome only for v1**; promote to full DE bios for the 5–6 most-toured productions in v2. Press clippings stay in original language with no translation. |
| D5  | **IA:** single Productions index, default-filtered to `role=director`. Acting/co-direction/readings tucked behind a toggle. Curator-default landing opens with a short artistic statement and 4–6 hand-curated featured shows above the filterable grid. |
| D6  | **Content metadata:** heuristic extraction (age rating, year, country flags) from MD on first sync into `metadata.yml`; hand-fix the 20% the heuristic misses. Roman never edits the metadata file. |
| D7  | **Production page layout:** cover · title (RU + smaller EN/DE) · age/year/duration/country chips · 1-line synopsis · credits · "Watch / listen" CTA + "Tech rider (PDF)" + "Press kit (ZIP)" when present · photos with credit on hover · critic quotes · awards · external theatre links · sticky "Email Roman about touring this show" CTA. |
| D8  | **Contact / booking:** prefilled mailto + plain-text copy-pasteable email + Telegram + Instagram secondary. No form, no backend. |
| D9  | **Search & recommends:** Cmd-K palette across productions, awards, press, theatres, cities, with transliterated index. Recommends 3 cards by `same age bucket + same theatre form + same lineage (Кудашов / БТК)`. |
| D10 | **Aesthetic family:** **(α) warm editorial** as base + **(δ) brutalist accents** for metadata (mono dates, roles, durations). Dark mode = soft `#0E0D0C`, never pure black. |
| D11 | **Colour system:** **(c) photo-led** — chrome stays neutral, colour comes from production photos. **One reserved accent:** deep oxblood for booking CTAs and hover underlines only. |
| D12 | **Photography:** local export already complete (419 images, see §6). Subtle brutalist credit caption under each image is mandatory. |
| D13 | **Typography:** display = **Lora** (transitional, calligraphic warmth, full Cyrillic — recommended by type.today for editorial Cyrillic work); body = **Inter** (already in `public/fonts/`, full Cyrillic); caption / metadata = **JetBrains Mono** (full Cyrillic, brutalist-leaning, sets up the metadata layer). All three are open-source / SIL OFL. PT Serif and Spectral kept as A/B alternates. |
| D14 | **Tone:** quiet curatorial. The site is a frame; the work speaks. **One signature gesture only** — a single subtle string-line / paper-cut transition, not a recurring motif. No kinetic type, no hero video, no scroll-locked parallax. |
| D15 | **Wordmark:** no logo. Site title is the name set in Lora, all-lowercase, language-aware (`роман бокланов` / `roman boklanov`). |

---

## 4. Information architecture (high-level — Phase 2 will detail)

```
/                       Home — artistic statement + 4–6 featured shows + filterable grid below fold
/productions            Filterable grid (query strings drive filters; deep-linkable)
/productions/[slug]     Canonical detail page, layout per D7
/about                  Long-form bio + lineage (Кудашов / БТК / РГИСИ) + portrait
/awards                 Award timeline grouped by production
/press                  Press clippings in card grid; original-language only
/archive                Readings, sketches, workshops, festival appearances (the long-tail CV)
/contact                Direct contact + booking flow
/en/* /de/*             EN full parity; DE chrome only for v1
```

---

## 5. Visual system (Phase 2 deliverable; preview here)

Tokens go into `.design/boklanov-rewrite/tokens.md` and `app/globals.css`.

### 5.1 Colour (light)

| Token        | Value     | Use                                                       |
| ------------ | --------- | --------------------------------------------------------- |
| `--paper`    | `#F4F2EC` | Page background. Off-white, warm.                         |
| `--ink`      | `#161514` | Primary text.                                             |
| `--ink-mute` | `#605C56` | Secondary text, dates, captions.                          |
| `--rule`     | `#1615141A` | Hairline rules between sections (10% ink).              |
| `--accent`   | `#6B0F0F` | **Reserved**: booking CTAs, hover underlines. Nowhere else. |

### 5.2 Colour (dark)

| Token        | Value     | Use                                          |
| ------------ | --------- | -------------------------------------------- |
| `--paper`    | `#0E0D0C` | Page background. Soft black, not OLED-pure.  |
| `--ink`      | `#E8E5DD` | Primary text.                                |
| `--ink-mute` | `#9E9A92` | Secondary text.                              |
| `--rule`     | `#E8E5DD1A` | Hairline rules.                            |
| `--accent`   | `#A82626` | Booking CTAs, hover underlines.              |

### 5.3 Typography

| Role                          | Font                | Weights used      | Cyrillic | License   |
| ----------------------------- | ------------------- | ----------------- | -------- | --------- |
| Display (hero, page titles)   | **Lora**            | 400, 500, 600     | ✓        | OFL       |
| Body (long-form prose)        | **Inter**           | 400, 500, 600     | ✓        | OFL       |
| Caption / metadata / numerics | **JetBrains Mono**  | 400, 500          | ✓        | OFL       |

A/B alternates if a future refresh wants more weight: PT Serif (display)
and Spectral (body). Both have first-class Cyrillic.

### 5.4 Type scale (mobile-first, fluid)

| Step    | Mobile (375px) | Desktop (1280px) | Use                                     |
| ------- | -------------- | ---------------- | --------------------------------------- |
| display | 44px           | 88px             | Hero name, page H1                      |
| h2      | 28px           | 40px             | Section titles                          |
| h3      | 20px           | 24px             | Card titles                             |
| body    | 17px           | 18px             | Reading prose                           |
| meta    | 13px           | 13px             | Mono captions, dates, durations         |
| chip    | 11px           | 11px             | Age rating chip, country code           |

### 5.5 Spacing & grid

- 4px base unit. Spacing tokens: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Mobile: single column, 20px gutters.
- Tablet (768px+): 8-col grid, 24px gutters.
- Desktop (1024px+): 12-col grid, 32px gutters.
- Max content measure: 65ch for long-form prose; full bleed for hero photography.

### 5.6 Motion

- Page transitions: 200ms fade, no slide.
- Hover: 150ms underline reveal on links and CTAs.
- The **one signature gesture** (TBD in Phase 4): a paper-cut or string-line
  transition between sections on the home page, ≤ 400ms total, runs once on
  page load, never on scroll. `prefers-reduced-motion` disables it entirely.
- No parallax. No scroll-driven entrances. No animated gradients.

---

## 6. Photo coverage (real, audited)

From `.design/boklanov-rewrite/photo-audit.md` (run on the local Notion export):

- **56 production records** total in the export.
- **32 records with at least one local image** (57%). 24 records have zero
  images — most of these are **EN-mirror duplicates** (e.g. _Похороните меня за плинтусом_ with 0 images is the same show as _Bury Me Behind the Baseboard_ with 12 images). The sync script must merge RU+EN siblings into a single production record.
- **419 total images, 250 MB**.
- **Only 4 records (7%) have an explicitly-named poster** (Крошечка-Хаврошечка,
  Джаггер-Джаггер, Медведь в своём репертуаре, Bury Me Behind the Baseboard).
  All other productions need a poster either commissioned, extracted from
  rehearsal photos, or rendered from the production title alone — the design
  system must not assume a poster exists.
- **Photo credits are NOT structured anywhere in the export** — heuristic
  search of all MD files returned only one candidate. **A manual pass is
  required**: `metadata.yml` must include a `credits[]` array per production,
  and the gallery component must display the credit visibly (not hidden behind
  hover) for every image. Roman owes us this list, and we should ask in plain
  language: "for each image you want on the site, who took it."

### Top-coverage productions (use these for hero / featured / examples)

| Images | Production                        | Notes                                |
| -----: | --------------------------------- | ------------------------------------ |
|     33 | Nikita looking for the sea        | EN; merge with _Никита ищет море_     |
|     28 | Комедия Дель-Арте                  | RU only                              |
|     27 | Лина-Марлина                      | KZ production                        |
|     25 | Гипс                              | RU                                   |
|     25 | Осторожно, злая собака!!!          | KZ                                   |
|     25 | The Ape Star                      | EN; merge with _Меня удочерила Горилла_|
|     24 | Крошечка-Хаврошечка               | poster present                       |
|     22 | Идём вдвоём                       | RU                                   |
|     21 | Aiaccio                           | EN; merge with _Айяччо_              |

The **artistic-statement landing should pull featured cards from this top
band** — not from low-coverage shows that would force placeholder treatment.

---

## 7. Content model — production frontmatter (target)

This is what `scripts/sync-from-notion.ts` should produce per production. It
combines auto-extracted fields, metadata-overlay fields, and credit fields
that need a manual pass.

```yaml
---
slug: bury-me-behind-the-baseboard
notionIds:
  ru: ee2d7bea11484e16bcb03effc276a719
  en: c6f2c93cbb534a19ba38b81226aa795b
title:
  ru: "Похороните меня за плинтусом"
  en: "Bury Me Behind the Baseboard"
  de: null  # filled only for v2 priority shows
synopsis:
  ru: "..."
  en: "..."
theatre:
  name: "Большой театр кукол"
  shortName: "БТК"
  city: "Saint Petersburg"
  country: "RU"
  url: "https://puppets.ru/spec/115"
year: 2020
ageRating: "18+"
durationMin: 90
role: director           # director | co-director | performer | reader | sketch
form:                    # for filtering and recommends
  - puppet
  - solo
lineage:                 # for recommends
  - btk
  - kudashov
poster:
  src: /productions/bury-me-behind-the-baseboard/poster.jpg
  credit: null
gallery:
  - src: /productions/bury-me-behind-the-baseboard/01.jpg
    credit: "Стас Левшин"           # MANUAL PASS
    caption: { ru: "...", en: "..." }
videos:
  - provider: youtube
    id: "dQw4w9WgXcQ"
awards:
  - name: "Он.Она.Они."
    category: "Лауреат 1 степени"
    year: 2021
    city: "Екатеринбург"
press:
  - title: "Если спектакль рожден в любви, то и зритель его полюбит"
    outlet: "СПб ведомости"
    url: "https://spbvedomosti.ru/..."
    language: "ru"
techRider: null          # path to PDF if available
pressKit: null           # path to ZIP if available
externalLinks:
  - label: "БТК"
    url: "https://puppets.ru/spec/115"
featured: true           # editor's choice for landing carousel
---
```

---

## 8. Anti-patterns (do NOT ship)

These are the AI-default looks the design must actively reject. Cribbed from
`~/refs/awesome-claude-design`'s anti-slop kit, filtered for relevance.

- AI-purple / pink gradients
- Glassmorphism, neumorphism, claymorphism
- "AI-Native UI" chips, animated gradient text, kinetic gradient meshes
- Hero video backgrounds
- Bento grids on the home page
- Generic Tailwind defaults (rounded-2xl shadow-xl)
- Stock photography of "diverse smiling team" types (we have real production photos; use them)
- Comic-Sans-as-irony or any "puppet show" pastiche typography
- Loading-spinner skeletons that animate forever
- Cookie banner that takes the bottom 20% of the screen

---

## 9. Open questions and risks

| #   | Question / risk                                                                                                                  | Owner    | When needed |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| Q1  | Does Roman have **photographer credits per image**? Without these, the gallery treatment looks unprofessional.                   | Roman    | Phase 3     |
| Q2  | Does Roman have **technical riders / press kits** as PDFs we can host? If yes, which productions?                                | Roman    | Phase 3     |
| Q3  | The "**one signature gesture**" — paper-cut transition vs string-line vs neither. Decide in Phase 4 with prototypes.              | Designer | Phase 4     |
| Q4  | German UI-chrome translations: who does them? (Translation effort is small; ~80 strings.)                                          | Daniil   | Phase 5     |
| Q5  | **Domain question:** keep `boklanov.ru` only, or also `boklanov.com`? `.ru` is geopolitically sensitive for some EU bookers.       | Roman    | Phase 7     |
| Q6  | **Hosting:** stay on Vercel? CN/RU access has been intermittent. Cloudflare Pages or Yandex Cloud as alternates.                  | Daniil   | Phase 7     |
| Q7  | **Analytics:** PostHog and Fathom are in deps but unused. Pick one (or none) and wire it up — booking-CTA conversion is the only real metric. | Daniil   | Phase 5     |
| Q8  | What's the **legal language** for press / production photos? Can we host them, or do we link out only?                           | Roman    | Phase 3     |

---

## 10. Phase plan reference

This brief feeds Phase 2 (`/information-architecture` + `/design-tokens`) and
Phase 3 (Notion → MDX sync). The full 8-phase plan is in
`/PLAN.md` at the repo root. Any divergence from this brief in a later phase
is a brief change and must be reflected here first.

---

_Brief locked: 2026-04-30. Author: Daniil Petrov + Claude Opus 4.7._
