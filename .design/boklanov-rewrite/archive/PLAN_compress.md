Full version (original): .design/boklanov-rewrite/archive/PLAN.md

# boklanov.com Rewrite Plan

Branch: rewrite/v2. Source of truth: TASKS.md, DESIGN.md.

## STATUS

* P0-P6.6: DONE. Notion decoupled, MDX sync complete, C1-C11 shipped, SEO/i18n/RSS shipped, I1-I4 shipped, Q1-Q8 QA
  closed.
* P7: PARTIAL. D1/D2 live at `boklanov.vercel.app`. D3/D4 DNS cutover deferred (birthday deadline lapsed; no blocker).
* P7.5: DONE. Editorial fingerprints (R1-R3).
* P7.6: DONE. All 10 tasks shipped — Tier 1 `00c2501`, Tier 2 `3106d26`, DA-7.6.I `0288258`, DA-7.6.J `e1920af`.
* P8: IN PROGRESS. 8.1–8.5 shipped (`11bef4d` `8339141` `c1c4436`). R2 CDN blocked on Cloudflare DNS (deferred with
  D3/D4). Next: Roman onboarding (Obsidian + obsidian-git), orphan-title audit, photographer credits. *(2026-05-02 also `mdx-as-md`; retired 2026-05-04 in mdx→yaml split.)*
* P9: DEFERRED. Decap CMS — activates on Roman demand. ~2 days.

## ARCHITECTURE

* Stack: Next.js 15 App Router, React 19, TypeScript.
* Content: Static MDX in repo (frontmatter + `.obsidian` sync). Replace `react-notion-x`.
* i18n: `next-intl`. RU default, EN parallel (`/en`).

## AESTHETICS (STRICT DIRECTIVES)

* Style: Warm editorial + brutalist metadata. Japanese Ma spacing.
* Palette: Base #F4F2EC, Ink #161514, Accent #6B0F0F. Dark: #0E0D0C, #E8E5DD, #A82626.
* Typography: Display: GT Sectra/Newsreader/EB Garamond. Body: Inter/Söhne. Caption/Metadata: JetBrains Mono.
* Layout: 12-col Swiss grid, hairline rules. Type-led hero, no photo-led hero.
* Motion: 200ms fade transitions, 150ms hover underline reveal. Respect `prefers-reduced-motion`. No parallax.
* Anti-patterns (REJECT): Glassmorphism, neumorphism, AI purple/pink gradients, AI-native UI chips, hero video
  backgrounds, Bento grids, scroll-entrance animations.

## EXECUTION WORKFLOW

* P0: Snapshot. Run `npx skills add julianoczkowski/designer-skills`. Run `uipro init --ai claude`.
* P1: Discovery. Run `/grill-me`, `/design-brief`, `/information-architecture`. Output: IA (Home, About, Productions
  grid, Detail, Awards, Press, Contact).
* P2: Identity. Run `/design-tokens`. Output: `DESIGN.md`, `globals.css`.
* P3: Content. Run `scripts/sync-from-notion.ts`. Extract Notion data to MDX frontmatter. Download images.
* P4: Frontend. Run `/frontend-design` sequentially: Card -> Detail -> Home -> About -> Awards -> Shell. Mobile-first (
  375px).
* P5: SEO. Configure `next-intl`. Port `@vercel/og`. Generate Sitemap, RSS, JSON-LD (`Person`, `CreativeWork`).
* P6: QA. Run `/design-review`. Fix rule violations.
* P7: Deploy. Vercel prod deploy. DNS alias `boklanov.com`.
* P8: Authoring. Configure Obsidian MDX Git sync. Implement R2 CDN image workflow.

## FILE MUTATIONS

* CREATE: `app/[locale]/**/*.tsx`, `components/*.tsx`, `content/**/*.mdx` *(2026-05-04: now `index.yaml` + `body.{ru,en,de}.md`)*, `scripts/sync-from-notion.ts`,
  `lib/{content,i18n,og}.ts`, `DESIGN.md`.
* DELETE: `pages/`, `styles/notion.css`, `components/Notion*.tsx`, `react-notion-x`, `notion-client`, `notion-types`,
  `notion-utils`.
* RETAIN: `next.config.js`, `public/fonts/`, Vercel config, `pages/api/social-image` (port to app router).

## SYSTEM PROMPTS

*

`/grill-me Context: boklanov.com rewrite. Subject: Roman Boklanov, theatre director (puppet/object). Audience: programmers, press, parents. Constraints: RU/EN, mobile-heavy.`

*

`/design-tokens Editorial/Magazine, Swiss grid. Base #F4F2EC, Ink #161514, Accent #6B0F0F. Serif display, grotesque body, mono caption. Light + dark.`

*

`/frontend-design Build [component]. Use tokens.md. Mobile-first 375px. Adhere to warm editorial + brutalist metadata constraints. Reject AI slop.`

* `/design-review Critique against DESIGN_BRIEF.md. Check layout, typography, anti-patterns.`
