# DESIGN BRIEF — boklanov.com rewrite

> Output of the `/grill-me` interview, locked 2026-04-30. This brief is the
> source of truth for every Phase 2+ decision. If a downstream phase wants to
> contradict something here, that is a brief change and needs explicit
> sign-off, not a unilateral pivot.
>
> **Status 2026-05-02: rewrite complete.** Phases 1–8 shipped. Site live at
> https://boklanov.vercel.app/. D4 DNS cutover (boklanov.com) pending — deadline
> 6 May 2026. This brief is now the historical source-of-truth record for
> the implemented site.

---

## 1. Project context

Roman Boklanov is a theatre director working between Almaty and Western Europe.
His repertoire is **puppet theatre, theatre of objects, and contemporary theatre
for kids / teens / family** — ages 3+ to 18+, 30+ staged productions, 20+ awards,
active touring across KZ, DE, ES, AT, BY.

The site was previously a `react-notion-x` renderer over a public Notion page.
The rewrite replaced it with a statically generated Next.js 15 site on a
content-owned MDX stack (Obsidian as editor, Vercel as host).

---

## 2. Primary user and jobs to be done

> **Annotation 2026-05-02 (does not modify locked decisions D1–D15).**
> Two production-context facts surfaced after the brief was locked,
> recorded here so downstream copy work doesn't drift:
>
> 1. **Roman has no permanent troupe.** He directs at producing
>    theatres (Бремен · Алматы · Вена · Берлин · Ташкент · …) and
>    tours one solo show alone (*Похороните меня за плинтусом*).
>    Per-production credits belong to the producing theatre, not to
>    a "Roman company." Consequence applied in
>    `DESIGN_AMBITION.md` §3.B.
> 2. **Roman has not been in Russia since the 2022 mobilisation.**
>    Productions he directed in Russia before 2022 stay on the site
>    as part of the body of work; copy must not claim present-tense
>    work in Russia. Consequence applied in `DESIGN_AMBITION.md`
>    §3.G.1 (past-tense `ГДЕ СТАВИЛ` / `STAGED IN` /
>    `INSZENIERTE IN`) and §3.H (year-only colophon, no city pairing).
>
> **Launch context (2026-05-02).** The site goes live to
> `boklanov.com` as a 33rd-birthday surprise for Roman (born
> 7 May 1993; D4 deadline before 6 May). **Phase 7.5 Round 1–3
> design elevation already shipped** against `boklanov.vercel.app`
> (folio + cue numbers + edition stamp; production credits +
> theatre slate + two-geographies + premiere mark; slate-strike
> gesture paired with static edition-frame fallback). Phase 7.6
> editorial-polish backlog scheduled post-D4. Phase 8 authoring
> handoff (Obsidian + R2 codepaths shipped, 8.3–8.5 pending) lets
> Roman take the site over after the surprise reveal. None of these
> post-lock annotations modify D1–D15 — they record which lock-text
> triggered which downstream decision.

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
| D3  | **Content source:** ~~Notion stays editor-of-record.~~ _Superseded 2026-05-02:_ source of truth is **Obsidian + obsidian-git (vault = repo)**. MDX frontmatter is hand-edited via Obsidian Properties panel. `scripts/sync-from-notion.ts` retired to `scripts/_legacy/`. |
| D4  | **Bilingual:** RU + EN parity for everything programmers care about. **DE = UI-chrome only for v1**; promote to full DE bios for the 5–6 most-toured productions in v2. Press clippings stay in original language with no translation. |
| D5  | **IA:** single Productions index, default-filtered to `role=director`. Acting/co-direction/readings tucked behind a toggle. Curator-default landing opens with a short artistic statement and 4–6 hand-curated featured shows above the filterable grid. |
| D6  | **Content metadata:** ~~heuristic extraction into `metadata.yml`; hand-fix the 20% the heuristic misses.~~ _Superseded 2026-05-02:_ Phase 8.3 folded all `metadata.yml` overlays one-shot into MDX frontmatter (single source of truth per field). Overlay files deleted. Roman edits frontmatter directly via Obsidian Properties. |
| D7  | **Production page layout:** cover · title (RU + smaller EN/DE) · age/year/duration/country chips · 1-line synopsis · credits · "Watch / listen" CTA + "Tech rider (PDF)" + "Press kit (ZIP)" when present · photos with credit · critic quotes · awards · external theatre links · sticky "Email Roman about touring this show" CTA. |
| D8  | **Contact / booking:** on `/contact`, **Telegram + Instagram are primary** (Roman responds there fastest); prefilled mailto + plain-text copy-pasteable email are secondary. No form, no backend. The **sticky booking CTA on `/productions/[slug]` stays mailto** — benefits from prefilled subject + body. |
| D9  | **Search & recommends:** Cmd-K palette across productions, awards, press, theatres, cities, with transliterated index. Recommends 3 cards by `same age bucket + same theatre form + same lineage (Кудашов / БТК)`. |
| D10 | **Aesthetic family:** **(α) warm editorial** as base + **(δ) brutalist accents** for metadata (mono dates, roles, durations). Dark mode = soft `#0E0D0C`, never pure black. |
| D11 | **Colour system:** **(c) photo-led** — chrome stays neutral, colour comes from production photos. **One reserved accent:** deep oxblood for booking CTAs and hover underlines only. |
| D12 | **Photography:** local export complete (419 images). Subtle brutalist credit caption under each image is mandatory. |
| D13 | **Typography:** display = **Lora** (transitional, calligraphic warmth, full Cyrillic); body = **Inter** (already in `public/fonts/`, full Cyrillic); caption / metadata = **JetBrains Mono** (full Cyrillic, brutalist-leaning). All three are open-source / SIL OFL. |
| D14 | **Tone:** quiet curatorial. The site is a frame; the work speaks. One signature gesture only — the slate-strike (DA-3.A, shipped 2026-05-02). No kinetic type, no hero video, no scroll-locked parallax. |
| D15 | **Wordmark:** no logo. Site title is the name set in Lora, all-lowercase, language-aware (`роман бокланов` / `roman boklanov`). |

---

## 4. Information architecture

```
/                       Home — artistic statement + 4–6 featured shows + filterable grid below fold
/productions            Filterable grid (query strings drive filters; deep-linkable)
/productions/[slug]     Canonical detail page, layout per D7
/about                  Long-form bio + lineage (Кудашов / БТК / РГИСИ) + portrait + staging geography
/awards                 Award timeline grouped by production
/press                  Press clippings in card grid; original-language only
/archive                Readings, sketches, workshops, festival appearances (the long-tail CV)
/contact                Direct contact + booking flow
/en/* /de/*             EN full parity; DE chrome only for v1
```

---

## 5. Visual system (implemented)

Tokens in `app/globals.css`. Source reference in `.design/boklanov-rewrite/tokens.md`.

### 5.1 Colour (light)

| Token        | Value       | Use                                                       |
| ------------ | ----------- | --------------------------------------------------------- |
| `--paper`    | `#F4F2EC`   | Page background. Off-white, warm.                         |
| `--ink`      | `#161514`   | Primary text.                                             |
| `--ink-mute` | `#605C56`   | Secondary text, dates, captions.                          |
| `--rule`     | `#1615141A` | Hairline rules between sections (10% ink).                |
| `--accent`   | `#6B0F0F`   | **Reserved**: booking CTAs, hover underlines. Nowhere else. |

### 5.2 Colour (dark)

| Token        | Value       | Use                                          |
| ------------ | ----------- | -------------------------------------------- |
| `--paper`    | `#0E0D0C`   | Page background. Soft black, not OLED-pure.  |
| `--ink`      | `#E8E5DD`   | Primary text.                                |
| `--ink-mute` | `#9E9A92`   | Secondary text.                              |
| `--rule`     | `#E8E5DD1A` | Hairline rules.                              |
| `--accent`   | `#A82626`   | Booking CTAs, hover underlines.              |

### 5.3 Typography

| Role                          | Font                | Weights used | Cyrillic | License |
| ----------------------------- | ------------------- | ------------ | -------- | ------- |
| Display (hero, page titles)   | **Lora**            | 400, 500, 600 | ✓       | OFL     |
| Body (long-form prose)        | **Inter**           | 400, 500, 600 | ✓       | OFL     |
| Caption / metadata / numerics | **JetBrains Mono**  | 400, 500      | ✓       | OFL     |

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
- **Signature gesture:** slate-strike (DA-3.A) — 320ms one-shot on home first paint; `prefers-reduced-motion` disables entirely; static edition-frame fallback (DA-3.C) as end-state.
- No parallax. No scroll-driven entrances. No animated gradients.

---

## 6. Photo coverage

From `.design/boklanov-rewrite/photo-audit.md` (run on the local Notion export):

- **24 productions** (after merging RU+EN sibling pairs and filtering non-productions).
- **419 total images, 250 MB** — all in `public/productions/<slug>/`.
- **Photo credits are not structured** — `gallery[].credit` is null across most productions. Roman needs to fill these via Obsidian (open task).

### Top-coverage productions (used for hero / featured)

| Images | Production                        | Notes                                |
| -----: | --------------------------------- | ------------------------------------ |
|     33 | Nikita looking for the sea        | merged with _Никита ищет море_       |
|     28 | Комедия Дель-Арте                 | RU only                              |
|     27 | Лина-Марлина                      | KZ production                        |
|     25 | Гипс                              | RU                                   |
|     25 | Осторожно, злая собака!!!         | KZ                                   |
|     25 | The Ape Star                      | merged with _Меня удочерила Горилла_ |
|     24 | Крошечка-Хаврошечка               | poster present                       |
|     22 | Идём вдвоём                       | RU                                   |
|     21 | Aiaccio                           | merged with _Айяччо_                 |

---

## 7. Content model — production frontmatter

Single source of truth is `content/productions/<slug>/index.mdx`. All fields
are edited via Obsidian Properties panel; no overlay file.

```yaml
---
slug: bury-me-behind-the-baseboard
notionIds:           # kept for historical traceability; Notion sync retired
  ru: ee2d7bea...
  en: c6f2c93c...
title:
  ru: "Похороните меня за плинтусом"
  en: "Bury Me Behind the Baseboard"
  de: null           # filled only for v2 priority shows
synopsis:
  ru: "..."
  en: "..."
  de: null
theatre:
  name: "Большой театр кукол"
  shortName: "БТК"
  city: "Saint Petersburg"
  country: "RU"
  url: "https://puppets.ru/spec/115"
year: 2020
premiereDate:        # human-readable string per locale
  ru: "24 марта 2021 г."
  en: "24 March 2021"
ticketsUrl: "https://puppets.ru/spec/115#performance=..."
ageRating: "18+"
durationMin: 90
role: director       # director | co-director | performer | reader | sketch
form:
  - puppet
  - solo
lineage:
  - btk
  - kudashov
credits:             # per-locale arrays; role labels in source language
  ru:
    - role: Режиссёр
      name: Роман Бокланов
      url: "https://..."   # optional
  en:
    - role: Director
      name: Roman Boklanov
poster:
  src: /productions/bury-me-behind-the-baseboard/poster.jpg
  credit: null       # photographer name — Roman to fill
gallery:
  - src: /productions/bury-me-behind-the-baseboard/01.jpg
    credit: null     # photographer name — Roman to fill
    caption:
      ru: null
      en: null
videos:
  - provider: youtube
    id: "..."
awards:
  - name: "Он.Она.Они."
    category: "Лауреат 1 степени"
    year: 2021
    city: "Екатеринбург"
press:
  - title: "..."
    outlet: "СПб ведомости"
    url: "https://..."
    language: "ru"
tour:                # Plinth only — list of tour stops; empty → band hidden
  - city: London
  - city: Edinburgh
externalLinks:
  - label: "БТК"
    url: "https://puppets.ru/spec/115"
techRider: null      # path to PDF if available
pressKit: null       # path to ZIP if available
featured: true       # editor's choice for landing strip
tags: []
---
```

---

## 8. Anti-patterns (do NOT ship)

- AI-purple / pink gradients
- Glassmorphism, neumorphism, claymorphism
- "AI-Native UI" chips, animated gradient text, kinetic gradient meshes
- Hero video backgrounds
- Bento grids on the home page
- Generic Tailwind defaults (`rounded-2xl shadow-xl`)
- Stock photography (we have real production photos; use them)
- Comic-Sans-as-irony or any "puppet show" pastiche typography
- Loading-spinner skeletons that animate forever
- Cookie banner that takes the bottom 20% of the screen

---

## 9. Open questions

| #   | Question / risk                                                                                              | Owner  | Status         |
| --- | ------------------------------------------------------------------------------------------------------------ | ------ | -------------- |
| Q1  | Does Roman have **photographer credits per image**? Without these, `gallery[].credit` stays null.            | Roman  | **Open** — fill via Obsidian after onboarding |
| Q2  | Does Roman have **technical riders / press kits** as PDFs? Which productions?                                | Roman  | **Open** — fill `techRider` / `pressKit` fields in Obsidian |
| Q3  | The "one signature gesture" — which option?                                                                   | —      | **Resolved 2026-05-02** — DA-3.A slate-strike (320ms one-shot) + DA-3.C static edition-frame fallback. Shipped in `7c26402`. |
| Q4  | German UI-chrome translations: who does them?                                                                 | —      | **Resolved 2026-05-02** — S5 done. All 44 keys in `messages/de.json`. |
| Q5  | **Domain:** keep `boklanov.ru` only, or also `boklanov.com`?                                                  | —      | **Resolved 2026-05-02** — `boklanov.com` canonical (D3). `.ru` deferred. D4 cutover pending. |
| Q6  | **Hosting:** stay on Vercel? CN/RU access intermittent. Cloudflare Pages or Yandex Cloud as alternates.      | —      | **Resolved 2026-05-02** — Vercel stays (D2). No migration. |
| Q7  | **Analytics:** PostHog or Fathom or none?                                                                     | —      | **Resolved 2026-05-02** — PostHog (S4). `booking_cta_click` only; autocapture/pageview/recording disabled. |
| Q8  | What's the **legal language** for press / production photos? Can we host them, or link out only?              | Roman  | **Open** — assumed host-ok based on Roman providing files; confirm explicitly. |

---

_Brief locked: 2026-04-30. Author: Daniil Petrov + Claude Opus 4.7._
_Annotations 2026-05-02: troupe clarification, Russia context, D3/D6/D8 supersessions,_
_Q3–Q7 resolved, content model updated to reflect Phase 8.3 single-source frontmatter._
