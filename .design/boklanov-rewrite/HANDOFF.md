# Handoff prompt — boklanov.ru rewrite, Phase 7.5 Round 3

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
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

**Current state — Phase 7.5 Rounds 1 + 2 shipped, Round 3 is next.**

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

**Build state:** clean. No uncommitted edits. `npm run build` passes.

**Next milestones, in order:**
1. ~~**Phase 7.5 Round 1**~~ ✅ **done** (`c7a1b50`)
2. ~~**Phase 7.5 Round 2**~~ ✅ **done** (`0bebf3c`)
3. **R2 real-device QA** — manual pass by Daniil + Roman on real
   hardware. Claude cannot run this. See R2 checklist below.
4. **D1 Vercel preview** — push `rewrite/v2` to GitHub, connect Vercel,
   set `NEXT_PUBLIC_BASE_URL`. Can begin before R2 sign-off.
5. **Phase 7.5 Round 3** — DA-3.A slate-strike + edition-frame fallback.
   After D1, behind `?gesture=off` for first 48h. **Implement this now**
   if D1 has already been done; otherwise queue it.
6. **Phase 8** — Authoring handoff (Obsidian + R2). After D4 cutover.

---

### Phase 7.5 Round 3 — full implementation brief

One task. Ships as a single PR after D1.

#### DA-3.A — Slate-strike + edition-frame fallback (§4.1.A + §4.1.C)

**What it is:**
A 320ms one-shot CSS animation on the home page's first paint only.
The wordmark "slate top" — a thin pseudo-element — drops 1.5em onto
the wordmark's baseline while a hairline rule fades in beneath it.
Reads as a theatre-programme opening cue, not a SaaS hero animation.

**Gated by:**
1. `sessionStorage.firstPaintDone` — animation fires once per session;
   subsequent navigations show end-state statically.
2. `?gesture=off` query param — disables the animation entirely for the
   first 48h after D1, so the team can screenshot end-state vs
   animated-state for design review.
3. `prefers-reduced-motion: reduce` — falls through to the static
   edition-frame fallback (identical end-state, no motion).

**Static fallback (edition-frame, §4.1.C):**
The end-state of the animation must be visually indistinguishable from
the static version. The "edition frame" is just the wordmark sitting
on its hairline rule with no motion. This is the `prefers-reduced-motion`
and `?gesture=off` state. It must ship in the same PR as the animation.

---

**Step 1 — Home page component:**

In `app/[locale]/page.tsx`, import and render a new Client Component
`<SlateStrike>` that wraps the `.hero` section:

```tsx
import { SlateStrike } from '@/components/SlateStrike'

// Inside the return, replace:
<section className={styles.hero}>
  <h1 className={styles.wordmark}>{wordmark}</h1>
  ...
</section>

// With:
<SlateStrike>
  <section className={styles.hero}>
    <h1 className={styles.wordmark}>{wordmark}</h1>
    ...
  </section>
</SlateStrike>
```

**Step 2 — `components/SlateStrike.tsx`:**

```tsx
'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'

import styles from './SlateStrike.module.css'

export function SlateStrike({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const gestureOff = searchParams.get('gesture') === 'off'

  const [animate, setAnimate] = React.useState(false)

  React.useEffect(() => {
    if (gestureOff) return
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem('firstPaintDone')) return
    sessionStorage.setItem('firstPaintDone', '1')
    setAnimate(true)
  }, [gestureOff])

  return (
    <div className={animate ? `${styles.slate} ${styles.slateAnimate}` : styles.slate}>
      {children}
    </div>
  )
}
```

**Step 3 — `components/SlateStrike.module.css`:**

```css
/* Edition-frame wrapper — static end-state for reduced-motion + gesture=off. */
.slate {
  position: relative;
}

/* Hairline rule below the wordmark — this is the edition-frame (§4.1.C).
   It exists in both the static and animated states; only the animation
   differs. Positioned by the wordmark's natural flow, not absolutely. */
.slate::after {
  content: '';
  display: block;
  width: 100%;
  height: 1px;
  background: var(--rule);
  /* Static: immediately visible. Animation overrides opacity below. */
  opacity: 1;
  margin-top: var(--space-2);
}

/* ── Animation ──────────────────────────────────────────────────────────
   Only added by JS when sessionStorage.firstPaintDone is absent AND
   gesture != 'off' AND prefers-reduced-motion is not 'reduce'.
   prefers-reduced-motion is handled by the @media query below — it
   removes the animation keyframes, leaving the static end-state. */

@keyframes slateTopDrop {
  from {
    /* Pseudo-element starts 1.5em above the wordmark baseline */
    transform: translateY(-1.5em);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes ruleFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.slateAnimate::before {
  /* The "slate top" — thin horizontal mark dropping onto wordmark */
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--rule-strong);
  transform-origin: top left;

  animation: slateTopDrop var(--duration-slate, 320ms) var(--easing-default) forwards;
}

.slateAnimate::after {
  /* Edition-frame hairline fades in after the drop */
  opacity: 0;
  animation: ruleFadeIn var(--duration-slate, 320ms) var(--easing-default)
    calc(var(--duration-slate, 320ms) * 0.6) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .slateAnimate::before,
  .slateAnimate::after {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

**Step 4 — Add CSS custom property to `app/globals.css`:**

```css
/* Slate-strike timing — can be overridden by ?gesture=off state or tests */
--duration-slate: 320ms;
```

**Step 5 — Wrap `<SlateStrike>` in a Suspense boundary** (required
because `useSearchParams` is a client hook that opts into dynamic
rendering):

In `app/[locale]/page.tsx`:

```tsx
import * as React from 'react'
import { Suspense } from 'react'

// …

return (
  <main className={styles.page}>
    <Suspense fallback={null}>
      <SlateStrike>
        <section className={styles.hero}>
          …
        </section>
      </SlateStrike>
    </Suspense>
    {/* rest of page */}
  </main>
)
```

**Step 6 — Verify end-states:**
- Static (`?gesture=off`): wordmark sits on hairline rule, no animation.
  Identical to current page + a hairline rule below `.hero`.
- Animated (first visit, no flag): slate-top drops, rule fades in.
- Reduced-motion: same as static.
- Subsequent visits (sessionStorage set): same as static.

---

### i18n changes for Round 3

None — DA-3.A is purely visual/structural. No new translation keys.

---

### R2 scope (real-device QA — requires Daniil + Roman)

Manual pass on real hardware. Checklist:

**Round 2 chrome (new in the last build `0bebf3c`):**
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

### D1 scope (Vercel preview — can begin before R2 sign-off)

- Push branch → connect Vercel project.
- Set `NEXT_PUBLIC_BASE_URL` env var.
- Set `NEXT_PUBLIC_POSTHOG_KEY` if PostHog enabled.
- Verify Cyrillic fonts render on Vercel edge (not just localhost).
- Share preview URL with Roman.

After D1: D2 hosting decision, D3 domain, D4 cutover.

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
  identical end-state visually.

---

### Recent commits on `rewrite/v2` for context

```
0bebf3c  feat: Phase 7.5 Round 2 — credits dl, theatre slate, staging geography, tour band, premiere mark
c7a1b50  feat: Phase 7.5 Round 1 — folio + cue numbers + edition stamp
8eaacf1  docs: research — content authoring workflow options
33d9c75  production-detail: surface theatre + credits + premiere + tickets (Q8)
08f54c0  docs: refresh all planning docs to current state
```

**Build state:** clean. No uncommitted edits.
