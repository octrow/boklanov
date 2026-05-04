# DESIGN_AMBITION.md — making the frame distinctive

> Companion to `DESIGN.md` and `DESIGN_BRIEF.md`.
> **Status: ✅ Phase 7.5 Round 1–3 shipped 2026-05-02**
> (`c7a1b50` · `0bebf3c` · `7c26402`). R2 QA closed; `?gesture=off`
> gate lifted; slate-strike live for all visitors on first paint.
> Phase 7.6 backlog (10 polish tasks) added in §15 — schedule
> post-D4 cutover.
> Date: 2026-05-02. Author: Claude Opus 4.7 (1M).
>
> This doc exists because, after R1 + Q1–Q7 + R1.fix, the rewrite is
> visually competent but reads "templated." Roman has asked, in plain
> language, that the site feel **cooler, more interesting, more
> unique**. The brief is locked and the anti-pattern list (`DESIGN.md`/how
> §11) rules out almost every common "make it pop" move. This doc
> finds what's left — and argues that what's left is, in fact, the
> right answer.

---

## 0. Reading order

1. §1 — diagnosis ("why does it read flat right now?")
2. §2 — the unifying metaphor (theatre programme / playbill)
3. §3 — the fingerprint catalogue (10 concrete proposals, ranked)
4. §4 — Q3 reopened narrowly (the one-allowed-gesture)
5. §5 — anti-anti-patterns (moves that look forbidden but aren't)
6. §6 — prototype shortlist (3 to build first; what to test)
7. §7 — what we are **not** going to do (and why)

If you only have five minutes: read §1, §3.A–§3.C, §6.

---

## 0.5. LOCKED DECISIONS — 2026-05-02

> Resolved with Roman + Daniil after the §10 / §11 question pass.
> Anything not listed here is still open. Updates to this section
> require explicit sign-off; do not edit silently.

**Structural correction (1) — no troupe.** Roman is a director
without a permanent troupe. He stages productions at producing
theatres (Bremen, Almaty, Vienna, Berlin, Tashkent, …) and tours
one solo show (*Похороните меня за плинтусом*, "the Plinth") alone —
no company travels with him. §3.B and §3.G were materially reframed
to reflect this.

**Structural correction (2) — Roman has not been in Russia since
the 2022 mobilisation.** This affects copy, not just design:

- Productions Roman directed in Russia **before 2022** are still
  part of the body of work and still play at their producing
  theatres (e.g. *Похороните меня за плинтусом* at БТК). They stay
  on the site as historical/current productions.
- Russian cities (СПБ, Москва) belong on the **staging-geography
  list** (§3.G.1) as places where the work was built — but the
  rhetorical frame must not claim Roman is currently working
  there. Avoid present-tense wordings like "stages in" / "ставит в";
  prefer neutral framing — `WORK · GEOGRAPHY` / `СТАВИЛ В` /
  unlabelled list with a hairline rule.
- The `/about` chronology already correctly stops at *2022 — return
  to Almaty* (post-Q5 fix).
- The colophon (§3.A folio bottom + §3.H edition stamp) is now
  **city-free** per A14.1 answer γ — see locks below.

**Round-1 / Round-2 / Round-3 schedule (✅ all shipped 2026-05-02):**

- **Round 1 ✅** — folio §3.A + cue numbers §3.C + edition stamp §3.H.
  Shipped in `c7a1b50`. Folio mark + cue system live; `2026 ИЗДАНИЕ` /
  `2026 EDITION` / `AUSGABE 2026` in the footer.
- **Round 2 ✅** — production credits §3.B + theatre slate §3.F +
  two-geographies §3.G + premiere mark on cards §13.4 N1. Shipped in
  `0bebf3c`. `<dl>` credits with leader-dots; theatre slate w/
  `PRODUCTION 14 / 24` index + `TOURING · SOLO` row; `ГДЕ СТАВИЛ`
  staging row on `/about` + home echo; `ON TOUR` band on Plinth detail
  with seed 9 cities in `metadata.yml`; `PREM YYYY` on cards;
  `tour[]` wired in `lib/content.ts merge()` with overlay support.
- **Round 3 ✅** — slate-strike §4.1.A paired with static
  edition-frame §4.1.C as `prefers-reduced-motion` fallback. Shipped
  in `7c26402`. 320ms `::before`/`::after` CSS animation gated by
  `sessionStorage.firstPaintDone`, `?gesture=off`, and reduced-motion.
  R2 QA signed off; `?gesture=off` gate lifted, animation live for all.

**Phase 7.6 — design polish backlog** (10 tasks, 3 tiers, post-D4):
see §15 below + `TASKS.md` Phase 7.6.

**Catalogue changes:**

- §3.B reframed: per-production credits block, no troupe claim, no
  puppet-as-cast-member naming.
- §3.G split into §3.G.1 (staging geography on `/about` + compressed
  echo on home) and §3.G.2 (Plinth tour band on the show's detail
  page only).
- §3.D specimen-hero — **cut** (deferred indefinitely).
- §3.J errata 404 — **cut**.
- §13.4 N1 (premiere mark on cards, `PREM 2021·09`) — **added** to
  Round 2.
- §13.4 N2 (run-of-show row) — deferred to post-D1, optional.
- §4.1.B string-line pull — **cut**.

**Visual / content locks (no change to brief):**

- Folio bottom line and edition stamp: **city-free, year-only**
  (A14.1 answer γ). Renders as `2026 EDITION` or just `2026`.
  Reasoning: the colophon is supposed to be invariant; with Roman
  unable to enter Russia since 2022, any concrete city set would
  either lie or obsolesce. Geography lives in §3.G, not in chrome.
- Edition stamp in footer: **without `v2` version mark** — year
  only.
- Tour-band cap: **10 cities** per band as a typographic ceiling.
  §3.G.1 staging list is currently 7 cities (locked); §3.G.2
  Plinth tour list is **partial / pending complete list from Roman**.
- Slate-strike gesture: **always paired** with §4.1.C edition
  frame as the motion-off fallback. Not "either/or."
- Staging cities for §3.G.1 (locked, in chronological order of
  first commission): `СПБ · МОСКВА · АЛМАТЫ · БРЕМЕН · ВЕНА ·
  БЕРЛИН · ТАШКЕНТ`. Section label is **past-tense, locked
  2026-05-02**: RU `ГДЕ СТАВИЛ` · EN `STAGED IN` · DE
  `INSZENIERTE IN`. Past-tense is the only form that's literally
  honest about Russian cities (worked there, can't currently) and
  doesn't read as retrospect for the rest (already directed in
  Bremen/Wien/Berlin/Tashkent — productions exist).

**Content workflow locks** (cross-reference `CONTENT_WORKFLOW.md`):

- Source of truth: **Obsidian (variant F) only for Phase 8**. Decap
  CMS (variant C) is **deferred** to a later phase, added as a
  second admin surface on the same vault when Roman actively
  requests it. Phase 8 ships F alone.
- Phase 8 ships in **one wave**: Obsidian setup + R2 image hosting
  + frontmatter merge (overlay → fm) + sync-script retire → all
  in a single PR.
- `scripts/sync-from-notion.ts` → `scripts/_legacy/` with header
  `frozen YYYY-MM-DD`, kept 1–2 months, then deleted.
- All `metadata.yml` overlay fields fold into MDX frontmatter; no
  more two-source-of-truth.
- *(Decap-related locks below apply only when Decap is added in
  the deferred phase; not on the critical path now.)*
  - Decap `editorial_workflow: true` — **off**. Convention is the
    `draft` branch.
  - Decap `backend.branch: draft` — **on from day one** of the
    Decap layer (never push directly to `main`).
  - No `_diagnostics.md` parser-warning file.

---

---

## 1. Diagnosis — what "boring" actually means

The brief's voice is **quiet, curatorial, paper-led, photo-led**. That
voice is not the problem. The brief was right.

The problem is that Phase 4 implemented the brief as a **muted
editorial template** — a default Linear/Granola/Claude.ai posture —
without the **editorial fingerprints** that distinguish the named
references from a thousand similar sites. Linear isn't memorable
because it has hairline rules; it's memorable because the *grammar* of
those rules (where they break, what they frame, how the mono captions
sit relative to the headline) reads as a *fingerprint*. NYT isn't
memorable because it uses a serif; it's memorable because every
artefact on the page — the kicker, the byline mono, the section
slug, the dateline — sits in a programmed relationship to every other
artefact, and that programme is recognisable from twenty feet away.

What the current rewrite has:

- Lora display, Inter body, JetBrains Mono metadata. ✓
- Hairline rules, sharp corners, oxblood reserved. ✓
- Photo-led grid, mono spec sheet on detail pages. ✓
- Strong Cyrillic typography. ✓
- Dark mode that isn't a lazy invert. ✓
- All AAA accessibility floors held. ✓

What it's missing:

| #  | Missing fingerprint                                                                                                | Where it would live                                  |
|----|---------------------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| F1 | A **page-level identity mark** beyond the wordmark — something the eye registers as "this site, not another."       | Header band / page openings / footer                 |
| F2 | **Programmed metadata** — running headers, folio-style page numbers, section slugs that read like a publication.    | Top and bottom of every page                         |
| F3 | **Display moments** — one or two oversized typographic events per page that aren't just "the H1."                   | Home statement, About lineage, Production title page |
| F4 | **Marginalia / dramatis-personae register** — credits and dates rendered like a printed programme, not a bullet list. | Production detail credits, Awards, Archive          |
| F5 | **Photo grammar beyond `object-fit: cover`** — captions, registration marks, intentional crop language.              | Production galleries, About portrait, Press          |
| F6 | **A theatre-specific cue language** — *something* that signals "theatre," not "another portfolio."                   | Site-wide micro-affordance                           |
| F7 | A **first-paint moment** that earns the visitor's 90 seconds of attention without violating §11.                     | Home, on first load only                             |
| F8 | **Local pride** — Almaty / Saint Petersburg / European tour cities rendered as a *map of work*, not a string of dots. | Home / About / Awards                                |

**The thesis of this doc:** the site is dull because the chrome is
**generic editorial**, where it should be **specifically theatrical
editorial**. The fix is not to add motion, gradients, or a hero
video. The fix is to give the chrome a single coherent typographic
register — the **theatre programme** — and apply it ruthlessly.

---

## 2. The unifying metaphor — *the site is Roman's programme*

Every distinctive editorial site is unified by an imagined artefact:
NYT is "the front page." McSweeney's is "the small literary
quarterly." A24 is "the printed film programme."

The boklanov rewrite has been imagining itself as *a portfolio*. That
is the wrong artefact. The right artefact is **a theatre programme** —
the printed booklet a curator hands an audience before the lights go
down. That object has a precise visual grammar:

- **Cover**: title set in display, oversized; one image; no
  instructions.
- **Programme notes**: a director's statement, set in body serif, no
  more than 200 words, often italic.
- **Dramatis personae**: a tabular cast/credits block — role on the
  left, name on the right, in mono or condensed sans, hairline rules
  between rows.
- **Cue / scene markers**: roman numerals, mono numerals, or set caps
  (CUE 1, ACT II, SCENE 3) used as section openers.
- **Marginalia**: production stills credited in small mono, often
  along the gutter.
- **Acknowledgements / sponsors**: a footer block in sentence case,
  smaller type, with hairline ruling — not a CTA wall.
- **Programme metadata**: theatre name + season + premiere date as a
  running line at the top of every spread (a kind of folio).
- **Tipped-in errata / inserts**: little single-page notes that don't
  match the main paper stock — used sparingly, with intent.

This metaphor is **already half-implemented** (mono spec sheet,
hairline rules, mono captions). Pushing it the rest of the way costs
small CSS additions, no new components, and zero violation of §11.

> **Decision-rule for every move below:** would this artefact appear
> in a printed programme for a serious puppet/object-theatre festival
> (Avignon Off, Edinburgh Fringe, FIDENA Bochum, BTK Saint Petersburg)?
> If yes, ship it. If it would appear in a SaaS marketing page or a
> conference website, reject it.

---

## 3. The fingerprint catalogue

Ten proposals, each:
- **named** (so we can talk about them),
- scoped to a component or page,
- evaluated against §11 (*does this violate the anti-patterns?*),
- effort-tagged (S = ½ day, M = 1 day, L = 2+ days).

The catalogue is **ranked by impact-per-effort** for the
non-violating moves. Pick the top three for a first prototype pass
(see §6).

---

### 3.A — *Folio* — running publication-style header / footer line

> **Effort: S** · **Impact: high** · **§11 conflict: none**

Every page gets a thin **running line** above and below the main
content, in mono caps:

```
ROMAN BOKLANOV   ⟶   PRODUCTIONS   ⟶   01 / 24                              2026 EDITION
```

- Top folio: site name · current section · index inside the section
  (e.g. `01 / 24` for production 1 of 24).
- Bottom folio: **year only** (A14.1 answer γ). No cities — the
  colophon is invariant; geography lives in §3.G.

Implementation note: it lives **inside the existing
`<SiteHeader>` / `<SiteFooter>` shell**, above the existing wordmark
row and above the existing footer columns. No new layout.

Why this works:
- It makes every page feel *paginated* — you are reading a
  publication, not browsing a portal.
- The `01 / 24` index is the first piece of theatre-programme
  vocabulary on the page; it implicitly says "this is a curated
  body of work, here's where you are in it."
- Cyrillic + Latin fold neatly into mono caps with the
  `--letter-spacing-wide` token.

Failure mode: if it reads as "breadcrumbs," we lost. The fix is to
keep it **visually quieter than the wordmark below it** — use
`--ink-faint`, never `--ink`, and never make any of its tokens
clickable except the section slug.

---

### 3.B — *Production credits block* — playbill grammar

> **Effort: S** · **Impact: high** · **§11 conflict: none**

> **Reframed 2026-05-02 after troupe clarification.** Roman is a
> director without a permanent company. Each production is staged at
> a producing theatre that owns the local cast. The credits block is
> therefore *per-production* — it lists Roman + his collaborators on
> *that specific show*, in the form the producing theatre would print
> them. The block doesn't claim a troupe that doesn't exist.

The current production-detail credits block (D7 step 5) is a
two-column mono list. Push it one step further into actual
playbill grammar — leader dots, role left, name right, hairline
rules between role-classes:

```
CREDITS

Director ............................................. Roman Boklanov
Set & Puppets ......................................... Лиза Машкова
Light ................................................. Stas Levshin
Sound ................................................. (open)
─────────────────────────────────────────────────────────────────
Cast
Father ................................................. Vladimir Чупин
Mother ................................................. Maria Кострова
The Boy ................................................ Anna Иванова
```

- Leader dots between role and name (CSS:
  `border-bottom: 1px dotted var(--rule)` on a flex row's spacer
  pseudo, or a unicode-leader trick).
- Section header is just `CREDITS` (mono caps via the §3.C cue
  system) — not `DRAMATIS PERSONAE`. The latter implies a troupe;
  the former is neutral.
- Cast block is a sub-block under the main credits, with a hairline
  rule between. No "in order of appearance" subhead — that's another
  twee theatrical claim that overreaches.
- **No naming puppets as cast members** — rejected in A6 as twee.
  The puppet appears in the synopsis and photos; the puppeteer
  appears in the cast block.

Why this works:
- It's already 70% built; the CSS change is the leader-dot row.
- Reads as a real producing-theatre programme entry, not as
  "Roman's company has these members."
- The schema (`metadata.yml.credits`) already supports this shape.

---

### 3.C — *Cue numbers* — section openers as printed cue marks

> **Effort: S** · **Impact: high** · **§11 conflict: none** (mono caps
> chips are already in the spec; this just upgrades their role)

Every section heading on long pages (`/about`, `/awards`, `/press`,
production detail) gets a **cue number** on its left margin or
above:

```
CUE 1                       Лироепическое — поиск формы
   ─────────────
   Lora display, normal section heading, body follows
```

```
CUE 2                       Театр объекта — вход в БТК
   ─────────────
```

- Mono caps, `--ink-faint`, sits above the H2.
- Hairline rule below the cue number, **not** below the heading —
  pulls the eye to the number first, the heading second.
- On `/awards`, cue numbers replace year groupings: `CUE 2017`,
  `CUE 2020`. This is one CSS class swap.
- On production detail, the existing D7 layout's section labels
  (synopsis, credits, photos, awards) become `CUE I`, `CUE II`,
  `CUE III` in roman numerals.

Why this works:
- One tiny lexical move; massive registerual shift. Every section
  feels *staged*.
- Brief D14 said "no recurring motif" — that referred to *motion*.
  A cue-numbering motif is a typographic system, which the brief
  explicitly endorses (warm editorial + brutalist accents).
- §11 forbids *kinetic* type, *animated* gradients. Static caps
  with hairline rules is the opposite of kinetic.

---

### 3.D — *Specimen page* — the hero treats the wordmark as type specimen

> **Effort: M** · **Impact: high** · **§11 conflict: none**

The current home hero is `<h1>роман бокланов</h1>` + meta + statement.
That's the layout of every editorial portfolio published since 2020.

Treat it instead like a **type-specimen sheet**:

- The lowercase wordmark is set at *display ceiling* (`--font-size-4xl`,
  88px desktop), but a **second, larger ghost setting** sits above
  it at `clamp(96px, 18vw, 220px)` in `--ink @ 6%` — a watermark of
  the name, never crossed by the body type, that the wordmark
  itself "settles into" once Lora's first weight loads.
- Below the wordmark, a thin row of **font-specimen-style metadata**
  in mono: `LORA · MEDIUM · OPSZ 88 · CYRILLIC EXTENDED`. (Total
  joke; total seriousness; reads exactly right for a director who
  cares about craft.)
- The artistic statement underneath sits in **two columns** at
  desktop, like a programme spread, with a hairline gutter rule.

Why this works:
- It's the first place the visitor lands. It has 3 seconds of
  attention. The watermark + specimen row is a recognition trigger.
- Static. Zero motion. Survives `prefers-reduced-motion` perfectly.
- Reads as confidence: a director who would publish a programme like
  this is a director who knows what their work is.

Failure mode: if the watermark reads as decoration, we lost. The fix
is to keep the opacity ≤ 8% in light, ≤ 10% in dark, and never have
it animate.

---

### 3.E — *Marginalia* — credits + cities + dates as gutter notes

> **Effort: M** · **Impact: medium-high** · **§11 conflict: none**

On desktop wide layouts (≥ 1280px), the prose body (`/about`,
synopses, production notes) keeps its 65ch measure, but the **margin
to the right of the prose holds notes**:

- Photographer credits (mono, `--ink-faint`).
- Date stamps (mono, e.g. `2020·РУ·БТК`).
- Cross-references (`see also: Идём вдвоём ↗`).
- For `/about`: the lineage names (Кудашов, БТК, РГИСИ) appear as
  marginalia at the moment they're mentioned in the body — like a
  printed book's running citations.

Implementation: a `<aside class="marginalia">` slot, only rendered
above 1280px. On tablet and mobile, the same content collapses
inline as italic Lora subordinate notes. No new content; same data
already in `metadata.yml`.

Why this works:
- Marginalia is *the* register move that distinguishes a publication
  from a webpage. Maciej Cegłowski (`idlewords.com`), Tufte's
  *Visual Display*, McSweeney's, classic Penguin paperbacks all use
  it. None of them feel "boring."
- The prose stays the prose; the marginalia adds *texture*.

---

### 3.F — *Theatre slate* — the production-detail "spec sheet"
> **Effort: S** · **Impact: medium** · **§11 conflict: none** (already
> half-shipped in `09d5005`)

The mono spec sheet that already lives in the right rail is good.
Push it one step further into a **clapperboard / theatre slate**:

```
┌─────────────────────────────────────────────┐
│  ROMAN BOKLANOV          PRODUCTION 14 / 24 │
├─────────────────────────────────────────────┤
│  Лина-Марлина                               │
│  Lina-Marlina                               │
├─────────────────────────────────────────────┤
│  YEAR     2021                              │
│  RUNTIME  60 MIN                            │
│  AGE      6+                                │
│  COUNTRY  KZ                                │
│  THEATRE  TÜZ Almaty                        │
│  PREMIERE 2021·09·17                        │
└─────────────────────────────────────────────┘
```

- Hairline border (`--rule-strong`), inset padding, mono throughout.
- Sits above the sticky CTA on desktop (already does), above the
  cover on mobile.
- The "PRODUCTION 14 / 24" line ties to the §3.A folio system.

Why this works:
- It's a single data block that says "theatre" louder than three
  paragraphs of body copy could.
- Already 70% in the codebase; the upgrade is
  border + tabular-nums + the index line.

---

### 3.G — *Two geographies* — staging cities + Plinth tour

> **Effort: M** · **Impact: medium-high** · **§11 conflict: none**

> **Reframed 2026-05-02.** Original §3.G assumed one "tour map." In
> reality Roman has **two distinct geographic narratives**, with
> different rhythms and different curatorial value, and they need to
> live in different places on the site:
>
> 1. **Staging geography** — cities where Roman directs new
>    productions at producing theatres (Bremen, Almaty, Vienna,
>    Berlin, Tashkent, …). Slow, permanent, builds the body of work.
> 2. **Plinth tour** — the solo show *Похороните меня за плинтусом*
>    travels with Roman alone, no troupe (London, Edinburgh, Bern,
>    Vienna, Almaty, Lisbon, Porto, Luxembourg, Alicante, …).
>    Active, current, booker-relevant.
>
> Mashing these into a single "tour band" loses both signals. Split.

#### 3.G.1 — *Staging geography* (`/about` + compressed line on home)

A single mono row of the cities where Roman has directed
productions, in chronological order of first commission (locked
2026-05-02):

```
СПБ · МОСКВА · АЛМАТЫ · БРЕМЕН · ВЕНА · БЕРЛИН · ТАШКЕНТ
```

- **Primary location: `/about`** — sits between the bio prose and
  the lineage block, as a labelled mono row.
- **Compressed echo on home** — same cities as a single
  `--ink-faint` mono line directly under the artistic statement,
  before the featured strip.
- **Section label (locked 2026-05-02 — past-tense).**
  - RU: `ГДЕ СТАВИЛ`
  - EN: `STAGED IN`
  - DE: `INSZENIERTE IN`

  Past-tense is the only form that's literally truthful: Roman
  *staged* in СПБ and Москва but cannot currently work there
  (post-2022 mobilisation), and *staged* applies equally to
  Bremen / Wien / Berlin / Tashkent where the commissioned
  productions already exist and continue to play. Present-tense
  ("stages in" / "ставит в") would lie about the Russian cities;
  retrospective wrapping ("work geography") would soften the
  active body of work. Past-tense is the honest middle.
- Each city is hover-linked (oxblood underline) to
  `/productions?city=<slug>` — instant filter, ties into existing
  C4 URL state.

#### 3.G.2 — *Plinth tour* (production-detail page only)

Above the photo gallery on
`/productions/bury-me-behind-the-baseboard`, a dedicated band:

```
ON TOUR

LONDON · EDINBURGH · BERN · WIEN · ALMATY · LISBOA · PORTO · LUXEMBOURG · ALICANTE · …
```

- Mono caps, hairline rule above and below.
- Cities as plain type (no links — these are tour stops, not
  filterable categories).
- Roman tours this show **alone** — no cast block changes, but the
  spec sheet (§3.F) gets a `TOURING` field that reads `SOLO`.
- **Status of the city list: partial.** Roman confirmed 2026-05-02
  the listed cities are real stops but the list is **not exhaustive**.
  Block ships only after Roman provides the canonical list (see §14.3).
  Until then, the band is data-driven from a `tour[]` array on the
  Plinth's `index.yaml` *(was `index.mdx` frontmatter pre-2026-05-04)* — empty array → block hidden.
- Year range: deliberately **omitted** until Roman gives the
  authoritative range (originally proposed `2024–2026`; needs Roman's
  voice on whether to include БТК home runs from 2020 onward or
  only post-premiere external stops).

#### Why this split works

- Each band tells the truth on the page where the truth is. Home
  shows curatorial range; the Plinth detail page shows where
  *that* show goes.
- Plinth is the solo flagship; treating it specially in its own
  page is the editorial honesty the brief is asking for.
- 6–10 cities each is the typographic sweet spot identified in §3.G
  original (skill review §13.4).
- Zero data-model change — both sets are derivable from existing
  `metadata.yml.theatre.city` plus a new optional `tour[]` array on
  the Plinth production.

---

### 3.H — *Edition stamp* — first-paint mark

> **Effort: S** · **Impact: medium** · **§11 conflict: none**

The site needs a single recurring **mark**, the way a publication
has an editor's monogram or a press's pressmark. Propose: a
**typographic edition stamp** rendered once per page, top-right of
the footer:

```
      2026 EDITION
      ────────────
```

- Mono, `--ink-faint`, hairline rule under.
- Identical on every page (it's a *colophon*, not a date stamp).
- **Year only.** No version mark (A7), no cities (A14.1 → γ —
  Roman has not been in Russia since 2022, so any "Almaty · СПБ"
  pairing would either lie or read as nostalgic; year-only is
  honest and durable).

Why this works:
- A pressmark is the cheapest, most durable identity mark a
  publication can have. Editors used it for centuries. It's not a
  logo and §11 doesn't forbid it.
- Tightens the footer (which is currently three columns of
  links + a copyright line — generic).

---

### 3.I — *The opening cue* — Q3 reopened (see §4)

> **Effort: S–M** · **Impact: high if right, negative if wrong** ·
> **§11 conflict: none if static** / **possible if motion**

The signature gesture (Q3 / I5) was cut in R1. Correctly. But it
was cut as "any motion gesture is too risky." Reopen it narrowly:
the *one* allowed motion is **the rising of the curtain** — see §4
for three concrete proposals (paper-cut, string-pull, slate-strike)
and a recommendation.

---

### 3.J — *Theatrical 404* and *empty states* as programme errata

> **Effort: S** · **Impact: low** · **§11 conflict: none**

The current 404 is plain. Make it *the inserted errata page* of a
printed programme:

```
ERRATA

The page you requested is not in this edition.

  ⟶ Productions index    ⟶ About    ⟶ Search the archive (⌘K)

— Boklanov edition, 2026
```

- Lora italic for the body; mono for the navigation row.
- Hairline rule top and bottom; centred on the page.
- Same treatment for empty-filter states ("no productions match —
  try removing one filter").

Why this works:
- 404 pages are the cheapest place to land a fingerprint, because
  visitors who land on them are already paying attention.
- Reusable: search empty state, filter empty state, archive
  empty state can all share the *errata* register.

---

## 4. Q3 — the one-allowed-gesture, narrowly reopened

The brief allows exactly one signature motion. It was cut as I5
because three options (paper-cut / string-line / nothing) had no
clear winner and "the site survives without a gesture." That's
still true. But: if we **frame the gesture as a typographic cue
rather than a decorative motif**, the cost falls and the upside
stays.

### 4.1 — Three concrete proposals

#### 4.1.A — *The slate strike* (recommended)

A theatrical clapperboard closes once on home-page first paint:
the wordmark **`роман бокланов`** is rendered with its baseline
*above* its final position, and the upper half (a thin Lora line
of equal height, the "slate top") **drops 1.5em onto the baseline**
in 320ms with the editorial easing curve. A thin horizontal rule
appears underneath as the slate "closes." That rule is the same
hairline rule that demarcates the rest of the page.

- Single CSS animation on a `:has(:root.first-paint)` class.
- The "slate top" is just a `::before` pseudo-element of the
  wordmark; never a separate asset.
- After 320ms it's static for the rest of the session.
- `prefers-reduced-motion` zeros the duration → wordmark just
  appears in place. Identical end-state.

Why this fits:
- Theatre signal: every theatre opens with a clapperboard or a
  bell or a curtain. A 320ms slate is the most *literal* cue
  available without being literal.
- Static end-state: when the gesture finishes, the site is
  identical to a site that never animated. The risk of "gimmicky"
  is low because it doesn't recur.
- §11 says "no kinetic type, no parallax, no animated gradients."
  This is a single transform on a hairline rule and a single
  letter-block. None of those.

#### 4.1.B — *The string-line pull*

A single 1px hairline rule starts at viewport-left and **draws
itself across the page** to viewport-right in 280ms, then pauses,
and the wordmark fades up beneath it in 200ms.

Pros: ties into the puppet metaphor (a string is pulled; the show
begins). Cons: the "draw" animation reads as a loading-bar to a
cold visitor; requires a beat-pause to dispel that read; harder to
land on prefers-reduced-motion.

Recommend if §4.1.A reads gimmicky in prototype.

#### 4.1.C — *No gesture, but a "first edition" frame*

Skip motion entirely. On first paint *only* (cookie-tracked), wrap
the home page in an **edition frame** — a hairline rectangle
spaced 24px in from each viewport edge, with `№ 14` in mono in
the top-left corner. After 600ms (or on first scroll), the frame
fades out. After it fades, it never returns.

This is the lowest-risk option. It's also the option that **makes
the site interesting on first impression even with motion zeroed
by `prefers-reduced-motion`** — the frame is just a static border
in that case, and disappears on first scroll.

### 4.2 — Recommendation

Build **§4.1.A (the slate strike)** as the prototype. Test against:
- Live mobile (iPhone SE, RU locale, cold cache, 4G).
- `prefers-reduced-motion: reduce` (gesture must vanish completely).
- Real audience: show Roman + 2 unrelated curators a 5-second
  clip; ask them what they think the site is *about* before the
  page settles. If anyone says "loading" or "fancy animation," cut
  to §4.1.C. If they say "theatre" or "nothing weird," ship it.

If §4.1.A fails the curator test, fall back to **§4.1.C**, not to
nothing. The "first edition" frame is the cheapest non-motion
identity beat the site can have.

---

## 5. Anti-anti-patterns

Things that *look* like §11 violations on a quick read, but are
explicitly compatible:

| Move                                       | Why §11 doesn't forbid it                                                                                                                                                |
|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Watermark wordmark behind the hero (§3.D)  | §11 forbids "AI-purple gradients" and "kinetic gradient meshes." A static, monochrome ghost letterform is type, not gradient.                                            |
| Cue numbers (§3.C)                         | §11 forbids "Comic-Sans-as-irony" pastiche typography. Roman-numeral or mono-caps cues *are* canonical theatrical typography — the opposite of pastiche.                 |
| Marginalia (§3.E)                          | §11 has no rule against asymmetric layouts. The brief's anti-pattern list is about *fingerprints* (gradient, glass, kinetic), not *grid topology*.                       |
| Folio running header (§3.A)                | §11 forbids "Built with Next.js in the footer," not running publication metadata. The folio is *more restraint*, not less.                                               |
| Slate-strike gesture (§4.1.A)              | §11 forbids "hero video backgrounds" and "kinetic type." A 320ms one-shot translate on a single block, with a static end-state, is none of those.                       |
| Tour band (§3.G)                           | §11 forbids "bento grids." A single horizontal text row is the opposite of a bento grid.                                                                                 |
| Edition frame (§4.1.C)                     | §11 forbids "drop-shadow glow on cards." A 1px hairline rectangle is a frame, not a shadow.                                                                              |

The point of this table is not lawyerly. It's that **the §11 list is
specifically about AI-default fingerprints**, not about visual
ambition. The site can be ambitious in other directions without
violating any of it.

---

## 6. Prototype shortlist (build these first)

If we ship one batch of changes before R2, ship these three
together. They reinforce each other; one without the others reads
as a half-edit.

### Round 1 — *the publication move* (~1 day total)

1. **§3.A — Folio header + footer line.** ½ day. Touches
   `SiteHeader.tsx` and `SiteFooter.tsx`. Adds two CSS rules and
   one `pageIndex` prop computed in the page route.
2. **§3.C — Cue numbers on `/about`, `/awards`, production detail.**
   ¼ day. Pure CSS; new `--cue-number` token in `tokens.md`.
3. **§3.H — Edition stamp in footer.** ¼ day. Pure markup.

After this round:
- Every page has a folio.
- Every section opens with a cue.
- Every page closes with a colophon.

The site will feel like it belongs to a single publication.

### Round 2 — *the theatrical move* (~1.5–2 days, post-R2 / pre-D1)

4. **§3.B — Production credits block.** ½ day. CSS-only on
   `ProductionDetail`'s credits component; no schema change. Reframed
   per A6 — no troupe claim, no puppet-as-cast.
5. **§3.F — Theatre slate spec sheet.** ½ day. Upgrade the existing
   right-rail spec sheet to a bordered, indexed slate.
6. **§3.G.1 — Staging geography.** ½ day. New mono row on `/about`
   + compressed echo on home. Links into existing `?city=` filter.
7. **§3.G.2 — Plinth tour band.** ¼ day. Solo-show detail page only;
   static type, no links.
8. **§13.4 N1 — Premiere mark on cards.** ¼ day. Replace `year` on
   `<ProductionCard>` with `PREM YYYY·MM`. Data already in metadata.

After this round:
- Production detail reads as a real programme entry.
- Home + About show two distinct geographies, truthfully.
- Cards read as theatre, not as blog posts.

### Round 3 — *the gesture* (~1 day, post-D1, optional)

9. **§4.1.A slate-strike** — 320ms one-shot on home first paint.
10. **§4.1.C edition frame** — static rectangle as
    `prefers-reduced-motion` fallback for #9. Ships **with** #9, not
    instead of.

Both behind a `?gesture=off` query flag for first 48h after deploy
so we can grab a comparison screenshot for design review.

### What we're explicitly **not** building

- §3.D (specimen hero with watermark) — **cut indefinitely** (A8).
  Highest risk of "too clever," lowest brief-margin. Revisit only if
  Round 1+2 settle and Roman still wants more.
- §3.E (marginalia) — deferred to a later pass; only above 1280px,
  needs a real desktop test cohort post-R2 to evaluate.
- §3.J (theatrical errata 404) — **cut** (A8). Vanishing readership
  vs. ¼ day spent better on N1.
- §4.1.B (string-line pull) — **cut**. Reads as a progress bar.
- §13.4 N2 (run-of-show row) — deferred to post-D1.

---

## 7. What we are not going to do — and why

Even with Roman's "make it cooler" mandate, these stay forbidden.
Listed so future-Daniil and future-Claude don't relitigate them.

| Tempting move                                           | Why no                                                                                       |
|---------------------------------------------------------|----------------------------------------------------------------------------------------------|
| A scroll-driven full-page parallax of production stills | §11 + brief D14. Parallax is the AI-default "make it interesting" move. It always reads SaaS. |
| An animated gradient on the hero                        | §11. Always reads AI-slop, regardless of taste.                                              |
| A lottie animation for the wordmark                     | §11. Kinetic type. Also a perf cost we don't want.                                           |
| A bento grid on the home page                           | §11. Always reads dashboard, never reads theatre.                                            |
| Tinted card backgrounds for production cards            | §5.3. Photo carries colour; chrome stays neutral.                                            |
| A puppet mascot in the corner                           | §11 ("Comic-Sans-as-irony"). Patronises the work.                                            |
| A photographer-credit badge on hover                    | §9. Credits are visible, not hover-hidden.                                                   |
| Custom display font instead of Lora                     | Brief D13. Lora is locked.                                                                   |
| Hero video                                              | §11.                                                                                         |
| Cookie banner stunt copy                                | Brief D14, §11.                                                                              |

---

## 8. Cost summary

| Round                                                | Effort      | Risk to brief | Risk to perf | Risk to schedule |
|------------------------------------------------------|-------------|---------------|--------------|------------------|
| Round 1 — folio + cues + edition stamp               | ~1 day      | none          | none         | low              |
| Round 2 — dramatis personae + slate + tour band      | ~1.5 days   | none          | none         | low              |
| Round 3 — opening cue (§4.1.A) or edition frame (§4.1.C) | ~1 day  | low           | low (320ms one-shot) | low      |
| **Total to "this site is uniquely Roman's"**         | **~3.5 d**  | **none / low** | **none**    | **fits before R2 sign-off**  |

For comparison: the photo-audit deduplication, the contact-page
reorder, and the Q-series fixes each landed in similar time
windows. None of these proposals is structurally larger than work
already shipped.

---

## 9. How to use this doc

1. **Roman + Daniil read §1, §2, §6 before any new work.** Nine
   pages of reading; one decision: *do we agree the site should
   read as a programme, not a portfolio?* If yes → §6 Round 1
   becomes a Phase 7.5 in `PLAN.md`. If no → archive this doc and
   ship as-is; the brief is still good without it.
2. **Each Round in §6 lands as one PR**, in order. Don't jump
   ahead; the Rounds reinforce each other in sequence.
3. **The Q3 question (§4) re-opens only after Round 1 + 2 ship.**
   The gesture is calibrated against the new chrome, not the old.
4. **Update `DESIGN.md` §13** when the gesture decision is made,
   marking which option won.
5. **Add this doc to `HANDOFF.md`'s "Read these first" list** so
   the next session has the context.

---

## 10. Resolved questions — Roman (2026-05-02)

| #   | Question                                | Answer                                                                                            |
|-----|-----------------------------------------|---------------------------------------------------------------------------------------------------|
| A4  | Folio bottom line — colophon or live?   | **Static colophon** — cities go in §3.G, not in chrome.                                           |
| A5  | Tour-band city count                    | **10** per band (skill-typographic sweet spot).                                                   |
| A6  | Name puppets as cast members?           | **No.** Reframe §3.B; no troupe claim, puppets stay in synopsis + photos, puppeteers in cast.    |
| A7  | Edition stamp — version mark or not?    | **Without `v2`.** Cities + year only.                                                             |
| A8  | Cut §3.D specimen hero + §3.J errata?   | **Yes, cut both.**                                                                                |
| A9  | Add N1 (premiere mark on cards)?        | **Yes, into Round 2.**                                                                            |
| A10 | N2 run-of-show row?                     | **Defer** to post-D1, optional.                                                                   |

**Open follow-ups remaining (need Roman's voice):** see §14 below.

---

## 11. Resolved questions — Daniil (2026-05-02)

| #  | Question                                    | Answer                                                                |
|----|---------------------------------------------|-----------------------------------------------------------------------|
| A1 | Round 1 before R2?                          | **Yes, before R2.**                                                   |
| A2 | Round 2 vs R2 / D1?                         | **After R2, before D1.**                                              |
| A3 | Build the gesture (Round 3)?                | **Yes — §4.1.A + §4.1.C as a paired unit**, not either/or.            |
|    | `pageIndex` global or per-locale?           | **Global.** A single body of work; locale only swaps surrounding text. |
|    | Slate-strike feature flag?                  | **Yes** — `?gesture=off` query flag for first 48h post-deploy.        |

---

## 12. Status

**Status:** **locked** — Round 1 + Round 2 + Round 3 all approved.
Open content follow-ups in §14. Implementation can begin on Round 1
immediately; nothing in Round 1 is blocked by §14.

Locked decisions are recorded in §0.5 at the top of this doc. Any
deviation from §0.5 is a brief change and needs sign-off, not a
silent edit.

---

_Author: Claude Opus 4.7 (1M context). Reviewer: Daniil Petrov._
_Source-of-truth chain unchanged: `DESIGN_BRIEF.md` →_
_`DESIGN.md` → `tokens.md/css` → `app/globals.css`. This doc is_
_a Phase 7.5 proposal, not a brief change. If any move below_
_requires editing the locked brief, it's been mis-specified —_
_flag it back to §0._

---

## 13. UI/UX skill review (`ui-ux-pro-max`, 2026-05-02)

> Skill invoked with the locked-token constraint set (no Tailwind, no
> shadcn, no font swaps). What the skill confirmed, flagged, or added.

### 13.1 Catalogue review against §11 anti-patterns

Skill verdict on each §3 + §4 proposal. "Pass" = brief-compatible.
"Flag" = ship with the noted guardrail. "Cut" = drop it.

| Move                          | Verdict | Note                                                                                                                         |
|-------------------------------|---------|------------------------------------------------------------------------------------------------------------------------------|
| §3.A Folio                    | Pass    | Static caps; no motion; reuses existing semantic `<header>`/`<footer>`. Add `aria-hidden="true"` to the `01 / 24` index — it's decorative; the page already has a real `<h1>`. |
| §3.B Dramatis personae        | Pass    | Pure CSS leader-dot row. Skill's *"semantic HTML before ARIA"* rule fires: ship as `<dl><dt>Director</dt><dd>Roman Boklanov</dd>` — not a flex `<div>` table. |
| §3.C Cue numbers              | Pass    | Roman-numeral / mono caps are content, not decoration. Render in the DOM (`<span class="cue">CUE I</span>`) **before** the H2, with `aria-hidden="true"` so screen readers go straight to the heading text. |
| §3.D Specimen hero (watermark) | **Flag** | The ghost-letter watermark *is* still type, but it sits at 6% opacity and risks reading as "weak gradient" on retina dark mode. Ship at ≤ 8% in light, ≤ 12% in dark, **measured against `--paper`** with a contrast checker — and only if light/dark eyeball-test side-by-side reads "watermark," not "smudge." |
| §3.E Marginalia               | Pass    | Skill's *"line-length 65–75ch"* rule supports it: prose stays at 65ch, marginalia is the overflow column. CSS `grid-template-columns: minmax(0, 65ch) minmax(0, 20ch)` above 1280px. |
| §3.F Theatre slate            | Pass    | Already half-shipped. Add `font-variant-numeric: tabular-nums` so `2021` and `60 MIN` align in the column; without it Lora's old-style figures will misalign. |
| §3.G Tour band                | Pass    | Single horizontal mono row is the **opposite** of the bento-grid anti-pattern. Cap at **10 cities** (skill's "1-2 key elements" rule generalised to lists — readers count past 10 as "many"). |
| §3.H Edition stamp            | Pass    | Trivially compliant. Mark `<small class="colophon">` semantically — that's what `<small>` is for. |
| §3.I Opening cue              | See §4 verdict below. |
| §3.J Errata 404               | Pass    | Already a clean win; skill flags one thing — the search row should expose `⌘K` text, not just hover, since 404 visitors are unfamiliar. |
| §4.1.A Slate strike (320ms)   | **Flag** | Skill's *"Reduced Motion"* rule (Severity: High) applies. Ship via `@media (prefers-reduced-motion: no-preference)` — invert the default. End-state must be identical with motion off. **Hard add:** the animation must not trigger on route-change reloads; gate by a session flag (`sessionStorage.firstPaintDone`). |
| §4.1.B String-line pull       | **Cut**  | The skill's *"Loading States"* rule warns that horizontal-fill animations read as progress-bars. The brief already cut this once; the cut should hold. |
| §4.1.C Edition frame          | Pass    | Lowest-risk first-paint identity. Skill prefers it as the reduced-motion fallback for §4.1.A — i.e., motion-on visitors see the slate strike, motion-off visitors see the static frame. Use *both*, not *either*. |

**Net effect on §6 prototype shortlist: unchanged.** Round 1 (3.A + 3.C + 3.H) all pass cleanly. Round 2 (3.B + 3.F + 3.G) all pass with two small additions (semantic `<dl>`, tabular-nums). Round 3 should ship §4.1.A **with** §4.1.C as its reduced-motion fallback, not as alternatives.

### 13.2 Round 1 — implementation specs

Concrete enough to land as a single PR. Tokens referenced are already in `tokens.css` unless marked **NEW**.

#### 13.2.A — Folio (`§3.A`)

**Files**

- `components/SiteHeader.tsx` (edit)
- `components/SiteHeader.module.css` (edit)
- `components/SiteFooter.tsx` (edit)
- `components/SiteFooter.module.css` (edit)
- `lib/folio.ts` (**NEW**, ~30 LOC) — derives `{ section, indexInSection, totalInSection }` from the current pathname + the production list.

**`lib/folio.ts` shape**

```ts
import type { Locale } from '@/i18n/routing'

export interface FolioMark {
  section: string         // 'PRODUCTIONS' | 'ABOUT' | 'AWARDS' | …
  index?: string          // '01 / 24' or undefined for non-paginated routes
  edition: string         // '2026 EDITION' / '2026 ИЗДАНИЕ' / 'AUSGABE 2026'
                          // — year only, no cities (A14.1 → γ)
}

export function folioFor(
  pathname: string,
  locale: Locale,
  productions: ProductionView[]
): FolioMark { /* … */ }
```

**`SiteHeader.tsx` insertion** — a new `<div class="folio" aria-hidden="true">` sits **above** the existing wordmark row, inside the same `<header>` semantic landmark. `aria-hidden` because the H1 / nav below is the real navigation tree; the folio is decorative metadata.

```tsx
<header className={styles.header}>
  <div className={styles.folio} aria-hidden="true">
    <span className={styles.folioSection}>{folio.section}</span>
    {folio.index && (
      <>
        <span className={styles.folioSep}>⟶</span>
        <span className={styles.folioIndex}>{folio.index}</span>
      </>
    )}
  </div>
  <div className={styles.inner}>
    {/* existing wordmark + nav */}
  </div>
  <hr className={styles.rule} />
</header>
```

**CSS — `SiteHeader.module.css`**

```css
.folio {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--gutter-mobile);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-chip);            /* 11px fixed */
  letter-spacing: var(--letter-spacing-wide);  /* 0.06em */
  text-transform: uppercase;
  color: var(--ink-faint);
  border-bottom: 1px solid var(--rule);
  font-variant-numeric: tabular-nums;
}
.folioSep   { opacity: 0.6; }
.folioIndex { color: var(--ink-mute); }        /* slightly stronger than section */

@media (min-width: 768px)  { .folio { padding-left: var(--gutter-tablet); padding-right: var(--gutter-tablet); } }
@media (min-width: 1024px) { .folio { padding-left: var(--gutter-desktop); padding-right: var(--gutter-desktop); } }
```

**Footer mirror** — `SiteFooter.tsx` gets a matching `<div class="folio">` **above** the three-column links, holding the edition string only (no section, no index).

**Mobile / tablet / desktop**

- 375px: section + index only; edition string moves to footer (already there).
- 768px: same.
- ≥ 1024px: same; the folio is intentionally identical at every width — pagination metadata shouldn't reflow.

**Accessibility**

- `<header>` and `<footer>` semantic landmarks unchanged.
- Folio row marked `aria-hidden="true"`; it duplicates info already exposed via `<h1>` and the `<nav>` active state.
- Skip-link target (`#main`) unchanged; it still skips the entire header including the folio.

#### 13.2.B — Cue numbers (`§3.C`)

**Files**

- `app/[locale]/about/page.tsx` (edit) — wrap each H2 in a `<section className={styles.cue}>` with a leading `<span className={styles.cueMark}>CUE I</span>`.
- `app/[locale]/awards/page.tsx` (edit) — replace year groupings (`2017`, `2020`) with `CUE 2017`, `CUE 2020`.
- `app/[locale]/productions/[slug]/page.tsx` (edit) — wrap synopsis / credits / photos / awards section heads in `.cue`.
- One shared CSS module: `components/Cue.module.css` (**NEW**), or extend `app/[locale]/home.module.css` with a `.cue*` block — pick the one with fewer imports across pages.

**Recommended:** new tiny component `components/Cue.tsx`:

```tsx
import * as React from 'react'
import styles from './Cue.module.css'

export function Cue({ mark, children }: { mark: string; children: React.ReactNode }) {
  return (
    <header className={styles.cueHead}>
      <span aria-hidden="true" className={styles.cueMark}>{mark}</span>
      {children}
    </header>
  )
}
```

Used as:

```tsx
<Cue mark="CUE I">
  <h2>Synopsis</h2>
</Cue>
```

**CSS — `Cue.module.css`**

```css
.cueHead {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-7);
  margin-bottom: var(--space-4);
}
.cueMark {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-chip);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ink-faint);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--rule);
  align-self: flex-start;
  min-width: 4rem;     /* enough for "CUE XII" without reflowing */
  font-variant-numeric: tabular-nums;
}
.cueHead > h2 { margin: 0; }   /* the H2 child carries normal display tokens */
```

**Token addition (none required)** — `--ink-faint`, `--font-size-chip`, `--letter-spacing-wide`, `--rule`, `--space-2/4/7` all already exist. **No new tokens.**

**Accessibility**

- `aria-hidden="true"` on the `<span>` — the cue mark is decorative metadata; the H2 carries the actual section name for the screen reader.
- Tab order unchanged (no new focusable elements).
- Heading order preserved (the H2 inside `<header>` is still an H2).

#### 13.2.C — Edition stamp (`§3.H`)

**Files**

- `components/SiteFooter.tsx` (edit) — add a `<small className={styles.colophon}>` block after the three-column links, before the copyright line.
- `components/SiteFooter.module.css` (edit) — `.colophon` block.

**Markup**

```tsx
<small className={styles.colophon}>
  {t('colophon')}
</small>
```

Where `t('colophon')` resolves to:

| Locale | String         |
|--------|----------------|
| `ru`   | `2026 ИЗДАНИЕ` |
| `en`   | `2026 EDITION` |
| `de`   | `AUSGABE 2026` |

Year-only, no cities, no version mark. Single token in the
i18n catalogue; year is hard-coded for now (revisit at next
edition cut, e.g. when content reshuffles enough to justify
`2027 EDITION`).

**CSS**

```css
.colophon {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--rule);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-chip);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}
```

**Why `<small>`** — this is the HTML element semantically marked for fine-print / colophons. Skill's *"Semantic HTML before ARIA"* rule says use it instead of a generic `<div>` with a class.

### 13.3 Cross-check against editorial-publication design patterns

Each Round-1 move maps to a concrete printed-publication precedent.
This is the "would this appear in a real programme?" rule from §2.

| Move      | Precedent                                                                                                       | Verdict |
|-----------|-----------------------------------------------------------------------------------------------------------------|---------|
| Folio     | Every NYT page running header (`THE NEW YORK TIMES · MONDAY, MAY 2, 2026 · A14`). Penguin Modern Classics folio. | ✓       |
| Cue marks | BAM playbills (Brooklyn Academy of Music) use exactly this — mono caps section markers above serif headings. Volksbühne Berlin programmes use roman numerals. | ✓ |
| Dramatis personae (Round 2) | Universal printed-programme grammar from Shakespeare folios onward. Royal Court, Schaubühne, Avignon all use leader-dot rows. | ✓ |
| Theatre slate (Round 2) | A24 film programmes; Criterion Collection booklet specs. Sharp-cornered bordered data block is canonical. | ✓ |
| Tour band (Round 2) | Festival programmes list tour cities in a single mono row at the front matter (Avignon Off booklet, Edinburgh Fringe brochure). | ✓ |
| Edition stamp | Colophon page in every printed book. Granta's `№ 165 · Spring 2026` pattern. McSweeney's quarterly ID. | ✓ |
| Slate-strike gesture (Round 3) | The literal clapperboard / curtain-up cue in every theatre. Programmatically rare on the web; that's the point. | ✓ |

**No move in Round 1 or 2 lacks a precedent.** Each one would be unsurprising in a printed programme for a serious puppet/object-theatre festival. That's the right test, not "is this novel for the web."

### 13.4 Skill-found additions and cuts

#### Add (worth considering for Round 2.5)

**N1. Premiere mark on production cards.** The card currently shows `theatre · year · ageRating · countryCode`. Change `year` to a **premiere mark** in tabular mono: `PREM 2021·09`. Reads as theatre metadata, not as a generic year tag. Cost: one CSS class + one `metadata.yml` field already shipped in Q8. **Recommend: yes, free win.**

**N2. Run-of-show indicator on the production-detail header.** A tiny mono row above the title: `RUN · BTK · СПБ · 2020–2024 · ~80 PERFORMANCES`. The number can be approximate ("~80") and Roman-confirmed; the data layer already supports a `runs[]` array if we want it precise later. **Recommend: yes, but Round 3, after Round 1+2 settle.**

#### Cut (the skill flags as bloat)

**C1. §3.D specimen hero.** The watermark / specimen-row treatment is the proposal at highest risk of reading as "look how clever I am." It's also the one with the most CSS surface. **Recommend: defer indefinitely.** If Round 1 + 2 land and Roman still wants more, revisit then with a real prototype, not a description. The current hero (wordmark + meta + statement, no watermark) is already brief-compliant.

**C2. §3.J errata 404.** Marginal value; landing pages for 404s are vanishingly rare. The current 404 is already not-bad. **Recommend: cut from this proposal entirely.** Spend the ¼ day on N1 instead.

### 13.5 Skill verdict in one paragraph

The proposal holds. Round 1 is shippable as specified, in ~1 day, with two semantic refinements (`<dl>` for credits, `<small>` for the colophon, `aria-hidden` on decorative metadata). Round 2 holds with `font-variant-numeric: tabular-nums` added wherever Lora's old-style figures collide with mono columns. Round 3's slate-strike (§4.1.A) ships **paired with** the static edition frame (§4.1.C) as its `prefers-reduced-motion` fallback, not as an either/or. Two §3 entries (specimen hero §3.D, errata 404 §3.J) come out of the active list as bloat; one new entry (premiere mark on cards, §13.4 N1) goes in as a free win. Net: +1 / -2 vs. the original §3.

_Skill review appended 2026-05-02. Source: `ui-ux-pro-max`._
_Reviewer: Claude Opus 4.7 with locked-token constraint set._

---

## 14. Resolved content follow-ups (2026-05-02)

### 14.1 — Colophon ✅ resolved → option **γ** (year only)

Final string: `2026 EDITION` / `2026 ИЗДАНИЕ` / `AUSGABE 2026`.
No cities. Reason: Roman has not been in Russia since the 2022
mobilisation — any "Almaty · Saint Petersburg" pairing would
either lie or read as nostalgic retrospect, and any "Almaty ·
Bremen" pairing would obsolesce as soon as his next commission
shifts. Year-only is honest, durable, and consistent with how
real periodicals (Granta, McSweeney's) mark editions.

### 14.2 — Staging cities ✅ resolved (Moscow added)

Final list, chronological order of first commission:

```
СПБ · МОСКВА · АЛМАТЫ · БРЕМЕН · ВЕНА · БЕРЛИН · ТАШКЕНТ
```

(7 cities — under the 10-city ceiling. Russian cities included
as part of the historical body of work; the section label is
tense-neutral — see §3.G.1 for the recommended labels.)

### 14.3 — Plinth tour cities ⚠ partial — awaiting full list

Roman confirmed 2026-05-02 the seed list represents real stops
but is **not exhaustive**. Until Roman provides the canonical
list, §3.G.2 ships **data-driven** from a `tour[]` array on the
Plinth's `index.yaml` *(was `index.mdx` frontmatter pre-2026-05-04)*:

```yaml
# content/productions/bury-me-behind-the-baseboard/index.yaml  (was index.mdx pre-2026-05-04)
tour:
  - city: London
  - city: Edinburgh
  - city: Bern
  - city: Wien
  - city: Almaty
  - city: Lisboa
  - city: Porto
  - city: Luxembourg
  - city: Alicante
  # … Roman to extend
```

If `tour[]` is empty or missing, the band hides — no broken-state
"on tour: …" with nothing after it.

**Sub-questions still open** (do not block Round 2 — the band can
ship with the seed list, then extend on Roman's pass):

- Year range subline (`2024–2026`? `2023–2026`? omitted?). Default:
  **omitted** until Roman gives a range.
- Include БТК home-theatre run (2020–) or only post-premiere
  external stops? Default: **post-premiere external stops only**
  (bookers' definition of "tour"). Override if Roman prefers.

---

_§14 closed 2026-05-02. 14.1 and 14.2 fully resolved. 14.3 ships
with the partial list as the floor; Roman extends the `tour[]`
array via the new content workflow when ready._

---

## 15. Phase 7.6 — design polish backlog (post-D4)

> Added 2026-05-02 after Phase 7.5 Round 1–3 shipped. Detailed task
> entries with files / effort / rationale live in
> `TASKS.md` Phase 7.6. This section is the design-rationale ledger
> for those tasks.

Phase 7.5 closed three rounds of structural design changes (chrome,
production credits, geographies, gesture). The site is now visually
distinctive without violating the brief. **Phase 7.6 is the post-launch
polish backlog** — ten brief-compatible moves grouped in three tiers,
none of which blocks the birthday-surprise launch on 6 May:

### Tier 1 — programme-grammar continuations

These extend the theatre-programme metaphor into corners Phase 7.5
didn't reach.

- **DA-7.6.A — Marginalia (§3.E activation).** Was deferred at
  lock-time pending a real desktop test cohort. The cohort exists now
  (R2 closed, `boklanov.vercel.app` live). Above 1280px on `/about`
  long-form prose and production synopses, the right margin holds
  photographer credits, lineage cross-refs, date stamps in mono.
  Below 1280px collapses inline. CSS-grid template on the prose
  container; new `<Aside>` component.
- **DA-7.6.B — Print stylesheet.** A theatre-programme metaphor that
  doesn't print is a half-truth. `@media print` block: paper white,
  ink black, hairlines 0.5pt, mono caps stay mono caps, page margins
  18mm, `widows`/`orphans` 3.
- **DA-7.6.C — Director's note block.** Optional
  `directorsNote.{ru,en}` field; renders below synopsis as italic
  Lora blockquote with hairline left rule (mirrors the critic-quote
  treatment) — but mono attribution `— РОМАН БОКЛАНОВ` instead of
  outlet. Distinguishes editorial third-person from the director's
  voice. Gated by Roman content via Obsidian.
- **DA-7.6.D — Run-of-show indicator (N2 reactivated).** Tiny mono
  row above the title: `RUN · BTK · СПБ · 2020–2024 · ~80
  PERFORMANCES`. Bookers' metadata, single line, hides when empty.

### Tier 2 — micro-typography polish

- **DA-7.6.E — CUE-count tag on awards.** `CUE 2021 · 4 НАГРАДЫ`.
  Pulls the cue from "decoration" into informative metadata.
- **DA-7.6.F — Theatre slate `LANGUAGE` row.** Optional, useful for
  silent puppet shows + bilingual productions.
- **DA-7.6.G — Year-anchor on no-poster fallback cards.**
  `margin-top: auto` on the year mark so it sticks to bottom regardless
  of title length. Pure CSS.
- **DA-7.6.H — DE chrome length audit.** `INSZENIERTE IN` is 13 chars
  vs `STAGED IN` 9 — verify the §3.G.1 row doesn't wrap awkwardly at
  1024–1100px.

### Tier 3 — first-impression polish

- **DA-7.6.I — OG image chrome upgrade.** First impression on
  Telegram/Slack share. Push the satori `ImageResponse` from baseline
  to programme-grammar: hairline rules, mono section slug top-left,
  Lora-display title centred, mono meta line bottom-left, oxblood
  colophon bottom-right.
- **DA-7.6.J — Editorial empty states.** Filter / search / archive
  empty states currently render plain "No matches" lines. Push into
  editorial register with hairline rule, italic Lora line, mono ghost
  link.

### Why these and not other polish moves

The earlier specimen-hero (§3.D) and errata-404 (§3.J) cuts stand —
the chrome has settled and they would still read as "too clever" and
"vanishing audience" respectively. The string-line gesture (§4.1.B)
stays cut. Phase 7.6 is about **finishing the programme metaphor**,
not about reopening rejected proposals.

### When to ship Phase 7.6

After D4 cutover (post-6 May). None of these blocks the launch and
some (DA-7.6.C, DA-7.6.D) are gated by Roman content that arrives via
Phase 8.4 onboarding. Total Tier-1 effort ~3 days, Tier-2 ~2 hours,
Tier-3 ~1.5 days.

_§15 added 2026-05-02. Detailed task entries in
`TASKS.md` Phase 7.6. None of these is a brief change._
