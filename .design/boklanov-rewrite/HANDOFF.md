# Handoff prompt — boklanov.ru rewrite, D1 live / R2 QA next

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `main`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`main` (formerly `rewrite/v2`, merged 2026-05-02). This is a
Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Two structural facts that affect copy and proposals:**
1. Roman is a director **without a permanent troupe**. He stages
   productions at producing theatres (Бремен · Алматы · Вена · Берлин ·
   Ташкент …) and tours one solo show, *Похороните меня за плинтусом*
   ("the Plinth"), alone — no company travels with him.
2. Roman has **not been in Russia since the 2022 mobilisation**.
   Productions he directed in Russia before 2022 (e.g. the Plinth at
   БТК) remain part of the body of work, but no copy on the site may
   claim present-tense work in Russia. Colophon is city-free;
   staging-geography labels use past-tense.

**Current state — Phase 7.5 Rounds 1 + 2 + 3 shipped. D1 live at https://boklanov.vercel.app/. R2 QA is next.**

Round 1 (`c7a1b50`, 2026-05-02):
- `lib/folio.ts` — `folioFor(pathname, productions)` → `{ sectionKey, index? }`
- `components/Cue.tsx` + `Cue.module.css` — section cue marks
- `SiteHeader`: folio band above wordmark row; accepts `productions` prop
- `SiteFooter`: `<small class="colophon">` edition stamp; `footer.colophon` i18n key
- `/about`, `/awards`, `/productions/[slug]`: section heads wrapped in `<Cue>`
- `messages/{ru,en,de}.json`: new `footer` namespace with `colophon` key

Round 2 (`0bebf3c`, 2026-05-02):
- DA-2.A — credits `<dl>` leader grid + CREDITS Cue header
- DA-2.B — theatre slate in right rail (bordered box, PRODUCTION 01/24 index,
  TOURING · SOLO row for Plinth)
- DA-2.C — `ГДЕ СТАВИЛ / STAGED IN` section on `/about`; home echo below statement;
  new `about` i18n namespace; about-page label strings moved to `tAbout()`
- DA-2.D — `tour[]` in `merge()` with overlay support; 9 seed cities in
  `bury-me-behind-the-baseboard/metadata.yml`; ON TOUR band above gallery
- DA-2.E — `PREM 2021` on production cards (was bare `2021`)

Round 3 (`7c26402`, 2026-05-02):
- DA-3.A — `components/SlateStrike.tsx` + `SlateStrike.module.css`:
  320ms one-shot slate-top drop on first paint; gated by
  `sessionStorage.firstPaintDone`, `?gesture=off`, `prefers-reduced-motion`
- Edition-frame (`::after` hairline rule) present in all static states
- `<Suspense fallback={null}>` boundary wraps `<SlateStrike>` in home page
- `--duration-slate: 320ms` token added to `globals.css`

**Build state:** clean. `main` is live on Vercel at https://boklanov.vercel.app/
Vercel project: https://vercel.com/octrows-projects/boklanov

**Next milestones, in order:**
1. ~~**Phase 7.5 Round 1**~~ ✅ **done** (`c7a1b50`)
2. ~~**Phase 7.5 Round 2**~~ ✅ **done** (`0bebf3c`)
3. ~~**Phase 7.5 Round 3**~~ ✅ **done** (`7c26402`)
4. ~~**D1 Vercel preview**~~ ✅ **live** — https://boklanov.vercel.app/ (`476af22`)
5. **R2 real-device QA** — manual pass by Daniil + Roman on real
   hardware. Claude cannot run this. See R2 checklist below.
   Note: `?gesture=off` gate on slate-strike is still active — lift after R2 sign-off.
6. **D2/D3/D4** — hosting decision, custom domain, cutover.
7. **Phase 8** — Authoring handoff (Obsidian + R2). After D4 cutover.

---

### R2 scope (real-device QA — requires Daniil + Roman)

Manual pass on real hardware. Checklist:

**Round 3 chrome (new in `7c26402`):**
- Home page first visit (fresh session): slate-top hairline drops 1.5em
  onto wordmark, then hairline rule fades in. Animation is ~320ms, one-shot.
- Home page second visit (sessionStorage set): end-state only — wordmark
  sits on hairline rule, no motion.
- Home with `?gesture=off`: no animation at all; end-state static.
- Reduced-motion OS setting: no animation; identical end-state.

**Round 2 chrome (new in `0bebf3c`):**
- Credits block on production detail: leader-dot `<dl>` table with CREDITS
  cue header. No troupe claim.
- Theatre slate in right rail: bordered box, `PRODUCTION 01/24` header, key/value
  rows. `TOURING · SOLO` appears on the Plinth's page.
- `/about` staging-geography row (`ГДЕ СТАВИЛ` / `STAGED IN`): 7 city
  names in mono between bio and chronology sections.
- Home: compressed city echo below statement, above featured strip.
- Production cards: year now reads `PREM 2021`, not bare `2021`.
- Plinth detail: `ON TOUR / В ГАСТРОЛЯХ` band above gallery with 9 cities.

**Round 1 chrome:**
- Folio band visible above header wordmark on section pages (PRODUCTIONS,
  О РЕЖИССЁРЕ, etc.); hidden on home. `01 / 24` index on production detail.
- Cue marks (`CUE I`, `CUE II`, …) above sections on `/about`, `/awards`,
  `/productions/[slug]`.
- `2026 EDITION` / `2026 ИЗДАНИЕ` stamp at bottom of every page footer.

**Existing checks (carry over from R1 QA list):**
- Sticky CTA right-rail visible on desktop from landing.
- Gallery masonry (original aspect ratios, not cropped).
- No-poster cards read as title-cards, not placeholders.
- `/contact`: TG + IG oxblood primaries; mailto secondary.
- Synopsis prose (no raw Markdown links).
- Awards page: zero language mixing.

---

### D1 — ✅ done (2026-05-02)

- Live at https://boklanov.vercel.app/
- Vercel project: https://vercel.com/octrows-projects/boklanov
- `main` branch auto-deploys on every push.
- `NEXT_PUBLIC_BASE_URL` not yet set (defaults to `https://boklanov.com`
  — fine until D3 domain cutover).
- `?gesture=off` slate-strike gate still active — lift after R2 sign-off.
- Next: D2 hosting decision, D3 custom domain, D4 cutover.

---

### Phase 8 scope (authoring handoff — queued behind Phase 7 cutover)

Locked 2026-05-02 in `CONTENT_WORKFLOW.md`. Tasks in `TASKS.md` § Phase 8.
~2.5 days: vault layout + Obsidian config (8.1), R2 image migration (8.2),
fold metadata.yml overlay into MDX frontmatter (8.3), `AUTHORING.ru.md`
guide (8.4), Cyrillic-only-Name orphan audit (8.5).

Phase 9 (Decap CMS) is deferred — activate only when Roman asks.

---

### Open content tasks (Roman to confirm before R2 sign-off)

- Year of RGISI enrolment + year first directed at BTK — flag in
  `content/about/{ru,en}.mdx` comment block.
- Two festival-in-plain-prose awards: hand-overlay via `awards:` block
  in `content/productions/cinderella/metadata.yml` (КУКАРТ) and
  `content/productions/sugar-kid/metadata.yml` (V Всероссийский…).
- Photographer credits per gallery image (brief Q1).
- Canonical Plinth tour city list (Roman extends `tour[]` in Phase 8).

---

### Important constraints (do not violate)

- No live Notion API. Content is static MDX.
- `hreflang` on RU↔EN only — DE excluded.
- Production-card text stays RU/EN regardless of locale.
- No glassmorphism, no AI-purple, no hero video, no bento grid,
  no `rounded-2xl shadow-xl` (`DESIGN.md` §11 anti-patterns).
- Analytics: only `booking_cta_click` — never expand autocapture.
- I5 is **cut**, not deferred.
- Awards / press: original-language only (DESIGN §3).
- The production-detail sticky booking CTA stays mailto.
- Staging geography labels are **past-tense** (`ГДЕ СТАВИЛ` /
  `STAGED IN`). Never present-tense ("stages in" / "ставит в").
- No city links in the staging-geography row — C4 has no `city=`
  filter parameter.
- DA-3.A (slate-strike) **must ship paired with the static edition-frame**
  as the `prefers-reduced-motion` fallback — both must render an
  identical end-state visually. ✅ Done.

---

### Recent commits on `rewrite/v2` for context

```
7c26402  feat: Phase 7.5 Round 3 — slate-strike + edition-frame fallback (DA-3.A)
0bebf3c  feat: Phase 7.5 Round 2 — credits dl, theatre slate, staging geography, tour band, premiere mark
c7a1b50  feat: Phase 7.5 Round 1 — folio + cue numbers + edition stamp
8eaacf1  docs: research — content authoring workflow options
33d9c75  production-detail: surface theatre + credits + premiere + tickets (Q8)
```

**Build state:** clean. No uncommitted edits.
