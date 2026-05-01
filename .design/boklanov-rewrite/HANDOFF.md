# Handoff prompt — boklanov.ru rewrite, R2 real-device QA → D1 Vercel preview

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**All code work through Q1–Q7 post-R1 fixes is done. Build is clean.**
24 productions × 3 locales = 72 detail routes, plus per-locale chrome.
`strictNullChecks` + ESLint pass. I5 is cut. Both the `DESIGN_REVIEW.md`
list and the post-R1 manual-QA findings (Q1–Q7) are fully exhausted.
The next milestone is **R2 real-device QA** (Daniil + Roman), then
**D1 Vercel preview**.

### What's landed (full history)

**Foundation (F1–F8):** App Router shell, i18n (next-intl v4), self-hosted
fonts (Lora + JetBrains Mono + Inter), sync pipeline, content loader, base
styles.

**Core UI (C1–C11):** ProductionCard + Grid, Production detail (72 routes
post-Q1: 24 productions × 3 locales), Home, Filter panel + URL state,
About + lineage, Awards, Press, Contact, Archive, Layout shell, Cmd-K
palette.

**Phase 5 SEO/OG (S1–S5):** sitemap (hreflang RU↔EN), robots, RSS
(RU+EN), JSON-LD `Person` + `CreativeWork`, OG ImageResponse (1200×630),
PostHog `booking_cta_click` only, DE chrome translations.

**Phase 6 Interactions + Polish (I1, I4, P1, P2, P3):**
- I1 — unified `--shadow-focus` ring across all interactive elements.
- I4 — empty + loading + error states (LQIP, clear-all, not-found).
- I5 — 🚫 cut formally in R1 per `DESIGN.md` §13.
- P1 — mobile-first layout pass (44px touch targets, on-screen Cmd-K trigger).
- P2 — accessibility pass (contrast AA, landmarks, focus trap, alt text).
- P3 — Lighthouse mobile ≥ 95 (woff2 subsets, next/image AVIF/WebP, LCP
  preload, locale-aware font preloads).

**Review + R1.fix (`73620e6`, `871f287`):** zero `DESIGN.md` §11
anti-patterns; desktop sticky CTA in real right rail; cover/title
separator; filter group labels; ThemeToggle SVG, search × suppression,
LQIP gating.

**Final polish (`09d5005`):** mono spec sheet in right rail above sticky
CTA (sticky as a unit); gallery masonry via `columns: 2`; wordmark
token parity.

**Phase 6.6 — Post-R1 manual QA fixes (Q1–Q7), 2026-05-02:**
- Q1 (`10f951f`) — sync filters non-production sub-pages
  (`NON_PRODUCTION_SLUGS`: `contacts`, `roman-boklanov-english`,
  `puppet-director`, `total-fest-dialogs`). Detail routes 84 → 72.
- Q2 (`10f951f`) — RU↔EN merge fixed: `rowLocale()` driven by CSV slug
  suffix (no body sniffing); `MANUAL_SIBLING_PAIRS` attaches Cyrillic-only
  orphan rows (`Сахарный ребёнок`, `Каштанка`) to their EN sibling's
  group. `sugar-kid` / `jagger-jagger` / `kasztanka` now have correct
  `{ ru, en }` title pairs.
- Q3 (`b3bded7`) — synopsis extractor strips `[X](Y)` and Notion's
  nested `[[X]](Y)`, skips URL-only / promo / cast-list paragraphs,
  strips `<aside>` HTML.
- Q4 (`fdbae94`) — awards extracted from RU body (canonical), `/u`
  flag on emoji char classes (`🏅` press-citation lines no longer
  leak), year clamped 1990–2030, `isPersonLink()` filter on
  `/pers/` URLs and Cyrillic "First Last" patterns. Overlay path
  added: `lib/content.ts` now `pick`s `overlay.awards` over
  `fm.awards`, and the metadata stub emits the auto-extracted list
  as commented-out lines for hand-fixes.
- Q5 (`99299de`) — about-page chronology corrected. Previous
  `2003 РГИСИ` and `2008 БТК director` were impossible (Roman born
  1993). Replaced with five anchored dates (1993 DOB, 2017/2018
  performer awards, 2020 BTK premiere, 2022 return to Almaty).
- Q6 (`8dae0b2`) — no-poster ProductionCard fallback re-composed as
  newspaper title-card: title flush top-left, hairline rule below,
  mono year mark. Replaces the bottom-fade gradient that read
  placeholder-y at grid scale.
- Q7 (`c7647bf`) — `/contact` reordered: Telegram + Instagram are
  now the oxblood primaries side-by-side; mailto demoted to
  hairline secondary. Brief D8 + IA §Contact updated. Production-
  detail sticky CTA stays mailto (booking magnet, brief D1).

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — canonical task list. All code items ✅.
   Next open items: R2 + D1.
2. `.design/boklanov-rewrite/DESIGN_REVIEW.md` — R1 verdict (fully resolved;
   reference only).
3. `.design/boklanov-rewrite/DESIGN_BRIEF.md` — locked brief (D1–D15).
   D8 reordered 2026-05-01.
4. `DESIGN.md` (repo root) — visual identity contract (§11 anti-patterns).
5. `.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md` — URL strategy
   (§Contact reordered to match D8 revision).
6. `content/README.md` — authoring workflow + the new `awards`
   overlay path.

### R2 scope (real-device QA — requires Daniil + Roman)

R2 is a manual pass on real hardware, not something Claude can run. The
scenarios and checklist are in `TASKS.md` § R2. Key scenario:

> iPhone SE (375px) · open link from Instagram DM · 90 seconds · RU locale
> → home → featured strip → tap a production → reach booking CTA → tap it.

Devices: iPhone SE, iPhone 14 Pro, iPad, 13" laptop, 27" desktop.

**Also check during R2:**
- Sticky CTA appears in right rail from landing on desktop (R1.fix #1).
- Spec sheet (year/duration/age/country) visible in right rail above CTA
  on desktop.
- Gallery images retain original aspect ratios (masonry, not cropped grid).
- Cover/title editorial breath consistent on pages without poster credit.
- Filter group labels readable on tablet (≥768px).
- ThemeToggle sun/moon glyphs legible.
- LQIP blur resolves on first featured card in production (not just dev build).
- **(post-Q6)** No-poster cards on `/productions` read as deliberate
  title-cards (title top-left, hairline rule, mono year), not as
  missing assets.
- **(post-Q7)** `/contact` shows Telegram + Instagram side-by-side as
  oxblood primaries on desktop; mailto + copy-email demoted to
  secondary under "or by email" subhead.
- **(post-Q3)** Production-detail synopsis blocks render real prose
  (or are absent) — no raw `[https://…](https://…)` strings.
- **(post-Q4)** `/awards` is RU-canonical: zero language mixing, zero
  person names, zero out-of-range years.

### Open content tasks (Roman to confirm before R2 sign-off)

These were left in the docs because Claude can't independently verify
them:

- Year of RGISI enrolment + year first directed at BTK — flag in
  `content/about/{ru,en}.mdx` comment block.
- Two festival-in-plain-prose awards the heuristic can't extract —
  hand-overlay via the new `awards:` block in
  `content/productions/cinderella/metadata.yml` (festival is КУКАРТ)
  and `content/productions/sugar-kid/metadata.yml` (festival is
  V Всероссийский молодежный театральный фестиваль им. В.С. Золотухина).
- Photographer credits per gallery image (brief Q1).
- Tech rider / press kit PDFs where they exist (brief Q2).

### D1 scope (Vercel preview — can begin before R2 completes)

```
D1 — Vercel preview from `rewrite/v2`
```

- Push branch to GitHub → connect to Vercel project.
- Set `NEXT_PUBLIC_BASE_URL` env var (Vercel URL or boklanov.com).
- Set `NEXT_PUBLIC_POSTHOG_KEY` if PostHog is enabled.
- Verify Cyrillic fonts render on real Vercel edge (not just localhost).
- Share preview URL with Roman.

After D1: D2 hosting decision, D3 domain, D4 cutover.

### Important constraints (do not violate)

- No live Notion API. Content is static MDX.
- `hreflang` on RU↔EN only — DE excluded.
- Production-card text stays RU/EN regardless of locale.
- No glassmorphism, no AI-purple, no hero video, no bento grid,
  no `rounded-2xl shadow-xl` (`DESIGN.md` §11 anti-patterns).
- Analytics: only `booking_cta_click` — never expand autocapture.
- I5 is **cut**, not deferred.
- Awards / press: original-language only (DESIGN §3). RU is canonical
  for festival names; international festivals stay Latin in both
  locales.
- The production-detail sticky booking CTA stays mailto — D1 booking
  magnet. Don't flip it to TG/IG without explicit sign-off; the
  prefilled subject + body is the conversion driver.

### Recent commits on `rewrite/v2` for context

```
09e75b3  docs: mark phase 6.6 (Q1–Q7) as ✅ done in PLAN.md
c7647bf  contact: TG + IG primary, email demoted (Q7)
8dae0b2  ProductionCard: brutalist no-poster fallback (Q6)
99299de  content: correct about-page chronology (Q5)
fdbae94  sync: clean awards extraction (Q4)
b3bded7  sync: clean synopsis extraction (Q3)
10f951f  sync: filter non-productions + pair orphan RU siblings (Q1, Q2)
9689e90  docs: brief D8 reorder + IA + readme rewrite
09d5005  polish: spec sheet in right rail, gallery masonry, wordmark token
871f287  polish: ThemeToggle SVG, search × suppression, LQIP gating
73620e6  R1.fix: sticky CTA right rail, cover/title rule, filter group labels
```

**All DESIGN_REVIEW.md items and Q1–Q7 are resolved.** No further code
work is needed before R2. If R2 surfaces new issues, track them in
TASKS.md and land fixes before D1.
