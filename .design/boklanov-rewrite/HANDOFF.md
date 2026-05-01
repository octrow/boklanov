# Handoff prompt — boklanov.ru rewrite, R2 real-device QA → D1 Vercel preview

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**All code work through the final polish commit is done. Build is clean.**
110 static pages pre-render. `strictNullChecks` + ESLint pass. I5 is cut.
The `DESIGN_REVIEW.md` item list is fully exhausted. The next milestone is
**R2 real-device QA** (Daniil + Roman), then **D1 Vercel preview**.

### What's landed (full history)

**Foundation (F1–F8):** App Router shell, i18n (next-intl v4), self-hosted
fonts (Lora + JetBrains Mono + Inter), sync pipeline, content loader, base
styles.

**Core UI (C1–C11):** ProductionCard + Grid, Production detail (84 pages ×
3 locales), Home, Filter panel + URL state, About + lineage, Awards, Press,
Contact, Archive, Layout shell, Cmd-K palette.

**Phase 5 SEO/OG (S1–S5):** sitemap (105 URLs, hreflang RU↔EN), robots,
RSS (RU+EN), JSON-LD `Person` + `CreativeWork`, OG ImageResponse (1200×630),
PostHog `booking_cta_click` only, DE chrome translations.

**Phase 6 Interactions + Polish (I1, I4, P1, P2, P3):**
- I1 — unified `--shadow-focus` ring across all interactive elements.
- I4 — empty + loading + error states (LQIP, clear-all, not-found).
- I5 — 🚫 cut formally in R1 per `DESIGN.md` §13.
- P1 — mobile-first layout pass (44px touch targets, on-screen Cmd-K trigger).
- P2 — accessibility pass (contrast AA, landmarks, focus trap, alt text).
- P3 — Lighthouse mobile ≥ 95 (woff2 subsets, next/image AVIF/WebP, LCP
  preload, locale-aware font preloads).

**Review + R1.fix (`73620e6`, `871f287`):**
- R1 design review complete. Zero `DESIGN.md` §11 anti-patterns.
- R1.fix Must-Fix #1: desktop sticky CTA now in real CSS-grid right rail
  (`[minmax(0,720px)] [1fr]`). Visible from landing — no more scroll-to-reveal.
- R1.fix Must-Fix #2: `.titleBlock` `border-top` + `padding-top` — cover/title
  separator present whether or not `poster.credit` rendered.
- R1.fix optional: filter group labels (РОЛЬ/ФОРМА/ВОЗРАСТ/СТРАНА) above chip
  groups on ≥768px. `·` separators on mobile preserved.
- Polish: ThemeToggle ●/○ → sun/moon SVG; search `×` suppressed; LQIP gated on
  `poster.src && poster.lqip`.

**Final polish (`09d5005`) — all DESIGN_REVIEW items exhausted:**
- Should-Fix #1: mono spec sheet in right rail above sticky CTA
  (year/duration/age/country, one token per line, mono uppercase, aria-hidden).
  `.rail` wrapper is `position:sticky` on desktop — whole right column sticks
  as a unit from landing.
- Could-Improve #2: gallery masonry — switched from `grid repeat(2,1fr)` to
  `columns: 2` on tablet+. Original aspect ratios preserved (`break-inside:avoid`).
- Could-Improve #5: SiteHeader wordmark `letter-spacing: -0.015em` →
  `var(--letter-spacing-tight)` for token parity.

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — canonical task list. All code items ✅.
   Next open items: R2 + D1.
2. `.design/boklanov-rewrite/DESIGN_REVIEW.md` — R1 verdict (fully resolved;
   reference only).
3. `.design/boklanov-rewrite/DESIGN_BRIEF.md` — locked brief (D1–D15).
4. `DESIGN.md` (repo root) — visual identity contract (§11 anti-patterns).
5. `.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md` — URL strategy.

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

### Recent commits on `rewrite/v2` for context

```
09d5005  polish: spec sheet in right rail, gallery masonry, wordmark token
871f287  polish: ThemeToggle SVG, search × suppression, LQIP gating
73620e6  R1.fix: sticky CTA right rail, cover/title rule, filter group labels
6ddb466  P3: Lighthouse mobile ≥95 — woff2 subsets, next/image, LCP priority
c125fc0  P2: accessibility pass — contrast, landmarks, focus trap, alt text
```

**All DESIGN_REVIEW.md items are now resolved.** No further code work is
needed before R2. If R2 surfaces new issues, track them here and land fixes
before D1.
