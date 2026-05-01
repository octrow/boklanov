# Handoff prompt — boklanov.ru rewrite, Phase 6 (Polish & Review)

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Foundation (F1–F8), Core UI (C1–C11), Phase 5 SEO/OG (S1–S5), and
Phase 6 interactions (I1, I4, P1, P2) are all committed and verified.**
The site builds clean under `strictNullChecks` + ESLint. 110 static pages
pre-render successfully (sitemap.xml + robots.txt included).

**P1 and P2 are complete.** Next up is P3 (Lighthouse mobile ≥ 95). In
TASKS.md order.

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — canonical ordered task list.
   Progress log at the top. P3 is the only open polish task.
2. `.design/boklanov-rewrite/DESIGN_BRIEF.md` — locked brief (D1–D15).
3. `DESIGN.md` (repo root) — visual identity contract (§11 anti-patterns).
4. `.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md` — URL strategy.
5. `.design/boklanov-rewrite/tokens.md` — token rationale.

### What's shipped (all phases)

**Foundation:** App Router shell, i18n (next-intl v4), self-hosted fonts
(Lora + JetBrains Mono + Inter), sync pipeline, content loader, base styles.

**Core UI (C1–C11):**
- C1 — `<ProductionCard>` + `<ProductionGrid>`
- C2 — Production detail (84 pages × 3 locales)
- C3 — Home page
- C4 — Filter panel + URL state
- C5 — About + lineage block
- C6 — Awards page
- C7 — Press page
- C8 — Contact page
- C9 — Archive page
- C10 — Layout shell (SiteHeader + SiteFooter + theme toggle + anti-flash)
- C11 — Cmd-K palette (lazy-loaded, grouped, Cyr↔Lat transliteration)

**Phase 5 SEO/OG (S1–S5):**
- S1 — `app/sitemap.ts` (105 URLs, hreflang RU↔EN, DE no-alternate),
  `app/robots.ts`, `app/[locale]/feed/route.ts` (RSS, RU+EN only)
- S2 — JSON-LD: `Person` on `/about`, `CreativeWork` on each production detail
- S3 — `app/api/og/[slug]/route.tsx` (ImageResponse, 1200×630 PNG,
  Lora title + JetBrains Mono chips + oxblood bar), `generateMetadata`
  wired in production detail + about pages
- S4 — PostHog analytics: `components/Analytics.tsx`, autocapture/
  pageview/recording disabled, only `booking_cta_click` tracked via
  `data-ph-event` delegation
- S5 — DE chrome translations: all 44 keys complete in `messages/de.json`

**Phase 6 Interactions + Polish (I1, I4, P1, P2):**
- I1 — Unified `--shadow-focus` ring (paper gap + oxblood) across all
  interactive elements; oxblood hover parity on CTAs + press links.
  — commit `df6dda1`
- I4 — `ProductionGrid` empty state + LQIP blur-up + `not-found.tsx`.
  — commit `7b691c6`
- P1 — Mobile-first layout pass: `CommandPaletteContext` exposes
  `toggle()`; `SiteHeader` renders 44×44px search icon button on mobile
  (on-screen Cmd-K trigger). Touch targets ≥44px fixed across filter chips,
  clearAll, mobile nav drawer links, locale links in drawer, contact
  copyButton, home viewAll ghost link, ProductionGrid emptyReset.
  Contact mailtoButton full-width on mobile. — commit `7ba8106`
- P2 — Accessibility pass: locale links contrast fixed (--ink-faint 2.86:1
  → --ink-mute 5.46:1); CommandPalette groupLabel/noResults same fix.
  localeSwitcher div→nav, footer nav col→nav. CommandPalette: aria-label on
  input + listbox, Tab focus trap. Alt text: full DESIGN §12 format (role,
  title, theatre, year, photographer) in ProductionCard + detail cover.
  Decorative sep spans aria-hidden. hreflang RU↔EN confirmed, DE excluded.

### Key open tasks

```
P3 — Lighthouse mobile ≥ 95 (font subsetting, critical CSS, AVIF/WebP)
R1 — /design-review against the brief (depends on P1–P3)
```

### Important constraints (do not violate)

- No live Notion API. Content is static MDX.
- `hreflang` on RU↔EN only — DE excluded.
- Production-card text stays RU/EN regardless of locale.
- No glassmorphism, no AI-purple, no hero video, no bento grid,
  no `rounded-2xl shadow-xl` (DESIGN.md §11 anti-patterns).
- Analytics: only `booking_cta_click` — never expand autocapture.

### Recent commits on `rewrite/v2` for context

```
(P2 commit — see git log)  P2: accessibility pass — contrast, landmarks, focus trap, alt text
7ba8106  P1: mobile-first layout pass — touch targets + Cmd-K on-screen button
7b691c6  I4: empty + loading + error states — lqip, clear-all, not-found
df6dda1  I1: hover & focus audit — unified shadow-focus ring, oxblood hover parity
25aeef9  docs: mark S1–S5 done in TASKS.md progress log — Phase 5 complete
```

Proceed with P3 (Lighthouse mobile ≥ 95).
