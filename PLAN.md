# Rewrite plan — boklanov.com

> **Status (2026-05-01).** Live execution on branch `rewrite/v2`. The
> operational checklist is `.design/boklanov-rewrite/TASKS.md`; this
> document is the *vision* it was generated from.
>
> | Phase | Status | Where |
> |-------|--------|-------|
> | 0 — Skills + branch snapshot | ✅ done | `rewrite/v2` cut from `main` |
> | 1 — Discovery & brief | ✅ done | `.design/boklanov-rewrite/{DESIGN_BRIEF, INFORMATION_ARCHITECTURE, TASKS}.md` |
> | 2 — Visual identity & DESIGN.md | ✅ done | `DESIGN.md`, `app/globals.css`, `.design/boklanov-rewrite/tokens.{md,css}` |
> | 3 — Content migration (F1–F8) | ✅ done | `scripts/sync-from-notion.ts`, `content/productions/<slug>/`, `lib/content.ts`. Notion deps fully removed in F8. |
> | 4 — Frontend rebuild | ✅ done (11 / 11) | C1–C11 all committed. Layout shell, Cmd-K palette, theme toggle, lang switch shipped. 110 static pages × 3 locales. Last commit: `ab2ce8b`. |
> | 5 — i18n + SEO + OG | ✅ done (5 / 5) | S1–S5 shipped. Sitemap (105 URLs, hreflang RU↔EN), robots, RSS (RU+EN), JSON-LD `Person` + `CreativeWork`, `app/api/og/[slug]`, PostHog `booking_cta_click` only, DE chrome translations complete. |
> | 6 — Polish & interactions | ✅ done (5 / 5) | I1, I4, P1, P2, P3 shipped. **I5 (signature gesture) cut formally in R1** per `DESIGN.md` §13. Last commit: `09d5005`. |
> | 6.5 — Design review + R1.fix + R1.polish | ✅ done | `DESIGN_REVIEW.md`. Zero §11 anti-patterns. R1.fix: sticky-CTA right-rail grid, cover→title rule, filter group labels, ThemeToggle SVG, search × suppression, LQIP gating. R1.polish: spec sheet in right rail, gallery masonry, wordmark token. **All DESIGN_REVIEW.md items resolved.** Commits `73620e6` `871f287` `09d5005`. |
> | 7 — Deploy + cutover | ⏳ pending | **R2 real-device QA** (unblocked) + **D1 Vercel preview** (can run in parallel) → D2 hosting → D3 domain → D4 cutover |
>
> Decisions D1–D6 from §7 are all **confirmed migrate / editorial /
> next-intl / repo MDX / no Anthropic Design / .ru status quo**. Aesthetic
> family was sharpened during Phase 1 from "editorial minimalism" to
> *warm editorial + brutalist metadata* (DESIGN_BRIEF D10) — DESIGN.md
> §2 is the locked statement, not §4 below.
>
> Where this file disagrees with TASKS.md or DESIGN.md, **TASKS.md and
> DESIGN.md win**. They are kept current; this file is preserved as the
> origin record.

## 0. What we have today

- **Stack:** Next.js 15 + React 19 + TypeScript, `react-notion-x` rendering a live Notion page (root id
  `d997b20454e24c9685624e4eb254935b`). Boilerplate is Travis Fischer's `nextjs-notion-starter-kit`.
- **Content source:** the actual content is **fetched live from Notion at runtime** via `notion-client`. `notion-data/`
  is just a one-file Markdown export of the index page (276 lines). All sub-pages (productions, awards, press, English
  mirror) live in Notion and are crawled.
- **Subject:** Roman Boklanov — theatre director (puppet theatre, theatre of objects, contemporary theatre for
  kids/teens/family), bilingual RU/EN. ~30+ productions, ~20+ awards, international touring (KZ, RU, DE, ES, AT, BY),
  strong editorial press section.
- **Pain points to fix in the rewrite:**
  1. Visual identity = generic Notion. No theatre-specific atmosphere.
  2. No content model — productions are just bullet lists, can't be filtered by age rating / country / year / role.
  3. Awards/press are buried in long lists, not surfaced as social proof.
  4. Bilingual handling is just a separate Notion page link.
  5. SEO/open-graph is weak; production pages have no canonical structure.
  6. Site is permanently coupled to a public Notion page (fragile, slow, no offline build).

## 1. Strategic direction (recommended)

Rebuild as a **content-owned, statically generated, editorially designed director portfolio**. Three core decisions:

| Decision       | Recommendation                                                                                                                                                                                                   | Why                                                                                                                                                                                                          |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Content source | **Migrate Notion → MDX in repo** (one MDX per production, structured frontmatter)                                                                                                                                | Removes runtime dependency on Notion; lets us model `ageRating`, `country`, `year`, `role`, `theatre`, `awards[]`, `posters[]`, `videos[]`. Notion stays editor-of-record for new drafts → script syncs MDX. |
| Framework      | **Stay on Next.js 15**, drop `react-notion-x`, render MDX with `next-mdx-remote` or `contentlayer`                                                                                                               | Reuses what works, kills the Notion render coupling. App Router + ISR.                                                                                                                                       |
| i18n           | **next-intl**, RU as default, EN parallel routes (`/` and `/en`)                                                                                                                                                 | The English Notion page already exists; structured i18n is a natural payoff of MDX migration.                                                                                                                |
| Aesthetic      | **"Editorial minimalism" with theatrical typography accents** — Swiss/grid-locked base, oversized serif display headers, monochrome + one ink color, generous negative space (Japanese Ma), kinetic type on hero | Matches puppet/object theatre programming aesthetics; differentiates from generic SaaS. Anti-pattern: AI purple-pink gradients, glassmorphism, AI-native UI.                                                 |

If this sounds right, the plan below executes it. If you'd rather **keep Notion as the runtime source** (faster, less
migration), there is a "design-only" variant of the same plan.

## 2. Skill stack — which tool does what

The four resources are complementary, not redundant. Use them in this order:

| Phase                             | Tool                                                                                                                                                                             | Why this one                                                                                                                                                                                                                    |
|-----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Discovery / IA / brief            | **`julianoczkowski/designer-skills`** (`/grill-me` → `/design-brief` → `/information-architecture` → `/brief-to-tasks`)                                                          | Encodes a real designer's process. Saves outputs to `.design/<feature>/`. Mobile-first, dark-mode-by-default, "respect existing code" detection. Free.                                                                          |
| Visual identity (DESIGN.md)       | **`rohitg00/awesome-claude-design`** (read `design-md/editorial/linear.md`, `design-md/warm/claude.md`, `design-md/indie/granola.md` as templates) → produce our own `DESIGN.md` | Vetted catalog of aesthetic families with real-world references and an "anti-slop kit" (avoid Claude Design's default fingerprints).                                                                                            |
| Tokens + 8 aesthetic philosophies | **`designer-skills` `/design-tokens` + `/frontend-design`** (pick "Editorial / Magazine" + Swiss accents)                                                                        | Generates light/dark token sets, mobile-first CSS custom properties, philosophy-specific implementation params.                                                                                                                 |
| Industry-rule sanity check        | **`nextlevelbuilder/ui-ux-pro-max-skill`** (`uipro-cli`, run `--design-system` for "creative portfolio / theatre / arts")                                                        | Cross-checks our chosen palette/typography against 161 industry rules and an anti-pattern list. Use it as a *second opinion*, not the primary driver — its 67-style menu can pull toward generic-modern.                        |
| Refinement (optional)             | **Anthropic Claude Design** (claude.ai/design, web capture → handoff bundle)                                                                                                     | If you have a Pro/Max/Team plan, scrape boklanov.ru, pull existing photo assets, generate a starter prototype. Export → handoff bundle → Claude Code reads it. Skip if you don't already pay for it; the open skills cover 95%. |

## 3. Phased plan

GSD-style phases — each ends with a verifiable artifact.

### Phase 0 — Install skills, snapshot current site (½ day)

- `npx skills add julianoczkowski/designer-skills` (interactive, install at project scope)
- `npm install -g uipro-cli && uipro init --ai claude` in repo
- Clone `rohitg00/awesome-claude-design` to `~/refs/awesome-claude-design` for reference reading (don't add as dep)
- Branch the current site to `legacy/notion-renderer` so the live site keeps working during migration
- **Artifact:** `.design/`, `.claude/skills/`, `legacy/notion-renderer` branch

### Phase 1 — Discovery & brief (1 day)

Run designer-skills sequence:

- `/grill-me` — answer questions about audience (theatre programmers, festival selectors, parents, press), goals (
  booking inquiries, festival submissions, press kit access), constraints (RU/EN, mobile-heavy traffic from Instagram
  bio link).
- `/design-brief` — produces `.design/boklanov-rewrite/DESIGN_BRIEF.md`. Output includes existing-code detection (Inter
  font, Notion CSS, Vercel deploy).
- `/information-architecture` — produces IA skeleton. Suggested target IA:

```
/                       Home (hero portrait, 1-line bio, 6 latest productions)
/about                  Long-form bio + education + photo
/productions            Filterable grid: by year, age rating, country, role, theatre
/productions/[slug]     Production page: cover, synopsis, credits, awards, press, photos, video, dates
/awards                 Awards timeline grouped by production
/press                  Press clippings grid
/contact                Contact + booking form
/en/*                   English mirror
```

- **Artifact:** `.design/boklanov-rewrite/{DESIGN_BRIEF.md, INFORMATION_ARCHITECTURE.md, TASKS.md}`

### Phase 2 — Visual identity & DESIGN.md (1 day)

- Read `design-md/editorial/linear.md`, `design-md/warm/claude.md`, `design-md/indie/granola.md` from
  awesome-claude-design as references.
- Run `uipro` for cross-check:
  `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "theatre director portfolio editorial" --design-system --persist -p "Boklanov"`
- Run designer-skills `/design-tokens` with prompt: *"Editorial / Magazine philosophy with Swiss grid accents.
  Monochrome base (off-white #F4F2EC, ink #161514), one accent (deep theatre red #8E1B1B or stage curtain crimson
  #6B0F0F), generous negative space, oversized serif display (e.g., GT Sectra / Newsreader), one neutral grotesque (
  e.g., Inter / Söhne), monospace caption (JetBrains Mono). Light + dark."*
- Reconcile both outputs into one canonical `DESIGN.md` at repo root (not `design-system/MASTER.md` — keep it visible).
- **Artifact:** `DESIGN.md`, `app/globals.css` token layer, `.design/boklanov-rewrite/tokens.md`

### Phase 3 — Content migration: Notion → MDX (2 days)

- Write `scripts/notion-to-mdx.ts`: traverses the live Notion tree, parses each production page, emits MDX with
  frontmatter:

```yaml
---
slug: bury-me-behind-the-baseboard
title: { ru: "Похороните меня за плинтусом", en: "Bury Me Behind the Baseboard" }
theatre: БТК
city: Saint Petersburg
country: RU
year: 2020
ageRating: "18+"
role: director
durationMin: 90
poster: /productions/bury-me/poster.jpg
gallery: [ /productions/bury-me/01.jpg, ... ]
videos: [ { provider: youtube, id: "..." } ]
awards: [
  { name: "Он.Она.Они.", category: "Лауреат 1 степени", year: 2021, city: "Екатеринбург" },
  { name: "Прорыв", category: "Лучший режиссер (номинация)", year: 2022 }
]
press: [ { title: "...", url: "...", outlet: "..." } ]
externalLinks: [ { label: "БТК", url: "https://puppets.ru/spec/115" } ]
---
```

- Output: `content/productions/*.mdx`, `content/about.{ru,en}.mdx`, `content/contact.{ru,en}.mdx`
- Pull photos from Notion's CDN to `public/productions/<slug>/`. Run `lqip-modern` to pre-generate blur placeholders.
- **Artifact:** ~30 MDX files + image assets, `scripts/notion-to-mdx.ts` (re-runnable for future updates)

### Phase 4 — Frontend rebuild (3–4 days)

Run designer-skills `/frontend-design` per page in this order:

1. **Production card + grid** (the most repeated unit — design first, scales to everything)
2. **Production detail page** (the money page; drives festival/press/booking decisions)
3. **Home** (hero with portrait + tagline + 6 cards)
4. **About** (long-form bio, education timeline, press)
5. **Awards** + **Press** + **Contact**
6. **Layout shell** (header, footer, nav, language switch, dark toggle)

Each page run produces a vertical slice (page + components + tokens consumed). Mandate from the skill: mobile-first
375px, then 768/1024/1440. Touch targets ≥44px. `prefers-reduced-motion` respected. Dark mode parity.

Strip the legacy: remove `react-notion-x`, `notion-client`, `notion-utils`, `notion-types`, `lqip-modern` (or keep just
for build-time image processing), all `pages/` files (move to `app/`), `styles/notion.css`, `components/Notion*.tsx`.

- **Artifact:** working site at `npm run dev`, all pages routable, lighthouse ≥95 on mobile

### Phase 5 — i18n + SEO + OG (1 day)

- `next-intl` setup, route groups `app/[locale]/...`
- Per-production OpenGraph: dynamic image with poster + title + age rating. Reuse the existing `@vercel/og` plumbing
  from `pages/api/social-image.tsx` — that one already worked, port it.
- Sitemap.xml, RSS for productions, `/feed`, JSON-LD `Person` + `CreativeWork` schemas
- **Artifact:** valid OG previews on Telegram/IG/FB share, sitemap indexed

### Phase 6 — Design review (½ day)

- `/design-review` from designer-skills against the brief — runs both code-level and screenshot-level critique. Fix what
  it flags.
- Manual visual QA on iPhone SE / iPhone 14 Pro / iPad / 13" / 27".
- Cross-check against awesome-claude-design's "anti-slop kit" — make sure we haven't accidentally produced Claude
  Design's default fingerprints (purple-pink gradients, generic glass cards, AI-native UI motifs).
- **Artifact:** `.design/boklanov-rewrite/DESIGN_REVIEW.md`, fixes committed

### Phase 7 — Deploy + cutover (½ day)

- Vercel preview from rewrite branch
- Daniil + Roman review on real devices
- Swap DNS / merge to main, archive `legacy/notion-renderer` branch as fallback
- **Artifact:** boklanov.ru on the new build

**Total estimate:** 8–10 working days of Claude Code time, parallelizable in places (content migration script can run
while frontend is being designed).

## 4. Aesthetic direction (concrete)

**Family:** *Editorial minimalism* with *Japanese Ma* spacing and one *theatrical* signature.

- **Palette:** off-white `#F4F2EC` / ink `#161514` / curtain red `#6B0F0F` accent (used sparingly — buttons, hover
  underlines, age-rating badges, season callouts). Dark mode: `#0E0D0C` / `#E8E5DD` / `#A82626`.
- **Type:** display = transitional serif (GT Sectra / Newsreader / EB Garamond); body = humanist grotesque (Inter /
  Söhne); caption = mono (JetBrains Mono) for credits and metadata.
- **Layout:** 12-col Swiss grid, hairline rules, generous tracking on display. Hero is type-led, not photo-led —
  portrait sits to the right of an oversized name. Production cards are postcard-format with all metadata visible (no
  hover-to-reveal).
- **Motion:** subtle. Page transitions = 200ms fade. Hover = underline reveal at 150ms. No parallax, no blur, no
  entrance animations on scroll. `prefers-reduced-motion` always respected.
- **Imagery:** production photos get full-bleed treatment on detail pages, contained 4:5 portraits in grids. Posters
  where they exist (puppet theatre productions usually have great poster art).
- **Anti-patterns we'll explicitly reject:** glassmorphism, neumorphism, AI-purple/pink gradients, Claymorphism, "
  AI-Native UI" chips, animated gradient text, hero video backgrounds, Bento grids on the home page.

## 5. Files to touch / create

```
new:
  app/                                  # App Router replaces pages/
  app/[locale]/{layout,page}.tsx
  app/[locale]/productions/{page,[slug]/page}.tsx
  app/[locale]/{about,awards,press,contact}/page.tsx
  components/{ProductionCard,ProductionGrid,Header,Footer,LangSwitch,...}.tsx
  content/productions/*.mdx
  content/{about,contact}.{ru,en}.mdx
  scripts/notion-to-mdx.ts
  lib/{content,i18n,og}.ts
  public/productions/<slug>/*.jpg
  DESIGN.md
  .design/boklanov-rewrite/*.md
  i18n/{ru,en}.json

remove:
  pages/[pageId].tsx, pages/index.tsx (replaced by app/)
  components/NotionPage*.tsx, PageAside, PageActions
  lib/{notion,notion-api,resolve-notion-page,get-site-map,preview-images,map-image-url,map-page-url}.ts
  styles/notion.css
  deps: react-notion-x, notion-client, notion-types, notion-utils

keep:
  next.config.js (adjust)
  components/PageHead.tsx → adapt for App Router metadata API
  pages/api/social-image (port to app/api/og/route.ts)
  Inter font files in public/fonts/
  Vercel deploy config
```

## 6. Reusable prompts to drop into Claude Code

Feed Claude Code one of these to invoke the right skill at each phase:

```
# Phase 1
/grill-me I'm rewriting boklanov.com — a Russian/English bilingual portfolio for
Roman Boklanov, theatre director specialising in puppet theatre, object theatre,
and contemporary theatre for kids/teens/family. Audience: festival programmers,
theatre booking managers, parents, theatre press. Read /home/octrow/develompent/
boklanov/notion-data/Роман\ Бокланов\ d997b20454e24c9685624e4eb254935b.md and
ground your questions in the real content.

# Phase 2
/design-tokens Editorial / Magazine philosophy with Swiss grid accents.
Monochrome off-white + ink, one curtain-red accent. Display serif + grotesque
body + mono caption. Light + dark. Theatre director portfolio context.

# Phase 4 (per page)
/frontend-design Build the production card and production grid for boklanov.com.
Use tokens from .design/boklanov-rewrite/tokens.md. Mobile-first 375px. Each
card shows: 4:5 cover, RU title, EN title (smaller), theatre, year, age rating
badge, country flag. Filterable parent grid. Editorial / Magazine philosophy.
Respect existing Inter font and dark mode tokens.

# Phase 6
/design-review Run a structured critique of the implemented site against
.design/boklanov-rewrite/DESIGN_BRIEF.md. Code review + screenshot review
of the homepage, a production detail page, and the productions grid.
```

## 7. Risks and decisions to make now

| #  | Decision                                                                          | Default if "auto"                                                     |
|----|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| D1 | Migrate content out of Notion, or keep Notion at runtime?                         | **Migrate to MDX.** Cleaner long-term, but +2 days vs. design-only.   |
| D2 | Aesthetic family — editorial / warm editorial / cinematic dark / brutalist?       | **Editorial with theatre-red accent.** Reject glass/AI-native styles. |
| D3 | Bilingual strategy — parallel routes (`/en/...`) or query param?                  | **Parallel routes via next-intl.** Better SEO.                        |
| D4 | Where to host content — repo MDX, or a headless CMS like Sanity?                  | **Repo MDX.** One contributor, git-native, zero vendor cost.          |
| D5 | Use Anthropic's hosted Claude Design (claude.ai/design) for the visual prototype? | **Skip unless already on a paid plan.** Open skills cover it.         |
| D6 | Keep `boklanov.ru` domain, or also `boklanov.com`?                                | Status quo (`.ru`).                                                   |

## 8. Two flags before kickoff

- **The Notion renderer is the entire site.** "Full rewrite" genuinely means replacing ~80% of the codebase. The plan
  does that on a separate branch so the live site never breaks.
- **Phase 0 is safe** (install skills, branch, snapshot). **Phases 3–4 delete files and migrate content.** Confirm D1 (
  migrate vs. keep Notion) and D2 (aesthetic family) before anything irreversible.

Say "go" to start Phase 0, or pick a different direction on D1/D2 to re-shape the plan.
