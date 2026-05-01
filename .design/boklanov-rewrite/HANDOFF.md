# Handoff prompt — boklanov.ru rewrite, Phase 5 (i18n + SEO + OG)

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Foundation (F1–F8) and ALL Core UI slices C1–C11 are committed and
verified.** The site builds clean under `strictNullChecks` + ESLint
(no `ignoreBuildErrors`). 108 static pages × 3 locales pre-render
successfully.

**Phase 4 is complete.** I need you to continue with Phase 5 — the i18n /
SEO / OG tasks: S1 (sitemap + robots + RSS), S2 (JSON-LD schemas), S3
(per-production OG images), S4 (analytics pick), S5 (DE chrome
translations). In TASKS.md §Phase 5 order.

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — canonical ordered task list.
   Top of the file has the **Progress log** table. S1–S5 are in the
   Phase 5 section.
2. `.design/boklanov-rewrite/DESIGN_BRIEF.md` — locked brief (D1–D15).
3. `DESIGN.md` (repo root) — visual identity contract.
4. `.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md` — URL strategy.
5. `.design/boklanov-rewrite/tokens.md` — token rationale.

### What's already shipped

- **Foundation (F1–F8)** — App Router shell, i18n, self-hosted fonts,
  sync pipeline, content loader, base styles.
- **C1** — `<ProductionCard>` + `<ProductionGrid>`
- **C2** — Production detail page (84 detail pages × 3 locales)
- **C3** — Home page
- **C4** — Filter panel + URL state
- **C5** — About + lineage block
- **C6** — Awards page (`app/[locale]/awards/`) — commit `c7b80c5`
- **C7** — Press page (`app/[locale]/press/`) — commit `2225975`
- **C8** — Contact page (`app/[locale]/contact/`) — commit `292552f`
- **C9** — Archive page (`app/[locale]/archive/`) — commit `40dec94`
- **C10** — Layout shell (`<SiteHeader>` + `<SiteFooter>` + theme toggle
  + anti-flash script) — commit `941fcdf`
- **C11** — Cmd-K palette (`<CommandPalette>` lazy-loaded, grouped,
  transliterated Cyr↔Lat) — commit `ab2ce8b`

### Key file map for S1–S5

```
app/
├── sitemap.ts                    # S1 ← next
├── robots.ts                     # S1
├── [locale]/
│   ├── layout.tsx                # ✅ C10/C11 done
│   ├── feed/route.ts             # S1 — RSS
│   ├── productions/[slug]/
│   │   └── page.tsx              # S2 — add JSON-LD here
│   └── about/page.tsx            # S2 — Person schema
├── api/
│   ├── og/[slug]/route.ts        # S3 — OG images (port from social-image.tsx)
│   └── social-image.tsx          # stub (501) — replace in S3

lib/
├── content.ts                    # ✅
└── search.ts                     # ✅

messages/
├── ru.json                       # ✅ full
├── en.json                       # ✅ full
└── de.json                       # partial — S5 completes DE chrome

components/
├── SiteHeader.tsx                # ✅
├── SiteFooter.tsx                # ✅
├── ThemeToggle.tsx               # ✅
├── CommandPalette.tsx            # ✅
└── CommandPaletteProvider.tsx    # ✅
```

### Constraints from the brief (do not violate)

- No live Notion API anywhere; content is static MDX.
- `hreflang` on RU↔EN page pairs only — DE excluded (chrome-only in v1).
- Production-card text stays RU/EN regardless of locale.
- OG image: poster or typographic fallback, Lora title, mono chips band,
  oxblood accent bar. Test on Telegram preview (primary share vector).
- Analytics: instrument booking-CTA clicks only (if kept at all).

### Recent commits on `rewrite/v2` for context

```
d385485  docs: mark C6–C11 done in TASKS.md progress log — Phase 4 complete
ab2ce8b  C11: Cmd-K command palette — lazy-loaded, grouped, transliterated
941fcdf  C10: layout shell — SiteHeader + SiteFooter wired into locale layout
40dec94  C9: archive page — dense mono table for long-tail CV
292552f  C8: contact page — mailto CTA, copy-email, Telegram + Instagram
2225975  C7: press page — card grid with Lora italic pull-quotes
c7b80c5  C6: awards page — timeline grouped by production
cb0aaab  C5: about page + lineage block
```

Proceed with S1 (sitemap + robots + RSS).
