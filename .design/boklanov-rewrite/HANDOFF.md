# Handoff prompt — boklanov.ru rewrite, Phase 6 (Interactions, Polish & Review)

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Foundation (F1–F8), Core UI (C1–C11), and Phase 5 SEO/OG (S1–S5) are
all committed and verified.** The site builds clean under `strictNullChecks`
+ ESLint. 110 static pages pre-render successfully (sitemap.xml + robots.txt
included).

**Phase 5 is complete.** Next up is Phase 6 — interactions/polish tasks:
I1 (hover & focus audit), I4 (empty+loading+error states), P1 (mobile-first
pass), P2 (accessibility pass), P3 (Lighthouse ≥ 95). In TASKS.md order.

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — canonical ordered task list.
   Progress log at the top. I1, I4, P1–P3 are the open tasks.
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
  — commit `576d401`
- S2 — JSON-LD: `Person` on `/about`, `CreativeWork` on each production
  detail — commit `4a66296`
- S3 — `app/api/og/[slug]/route.tsx` (ImageResponse, 1200×630 PNG,
  Lora title + JetBrains Mono chips + oxblood bar), `generateMetadata`
  wired in production detail + about pages — commit `bda0628`
- S4 — PostHog analytics: `components/Analytics.tsx`, autocapture/
  pageview/recording disabled, only `booking_cta_click` tracked via
  `data-ph-event` delegation — commit `19c79ad`
- S5 — DE chrome translations: all 44 keys confirmed complete in
  `messages/de.json` — commit `5939803`

### Key open tasks

```
I1 — Hover & focus audit (oxblood underline 150ms, focus rings, no lift)
I4 — Empty + loading + error states (not-found, empty filter, no spinner)
P1 — Mobile-first layout pass (375px, 44px touch targets, sticky CTA)
P2 — Accessibility pass (contrast 4.5:1, alt text, hreflang, axe-core)
P3 — Lighthouse mobile ≥ 95 (font subsetting, critical CSS, AVIF/WebP)
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
5939803  S5: mark DE chrome translations complete
19c79ad  S4: PostHog analytics — booking-CTA clicks only
bda0628  S3: per-production OG images + page metadata
4a66296  S2: JSON-LD schemas — Person on /about, CreativeWork on production detail
576d401  S1: sitemap + robots + RSS feed
d385485  docs: mark C6–C11 done in TASKS.md progress log — Phase 4 complete
ab2ce8b  C11: Cmd-K command palette — lazy-loaded, grouped, transliterated
941fcdf  C10: layout shell — SiteHeader + SiteFooter wired into locale layout
```

Proceed with I1 (hover & focus states audit).
