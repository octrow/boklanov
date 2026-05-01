# Handoff prompt — boklanov.ru rewrite, finish F8 and start Phase 4

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `rewrite/v2`) to continue after the rate limit.

---

## Prompt

I'm continuing the boklanov.com / boklanov.ru rewrite on branch
`rewrite/v2`. This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Foundation phases F1 through F7 are committed and verified.**
However, the previous session hit a rate limit right in the middle of executing **F8** (cutting the legacy renderer). The working tree might have staged deletions (like `pages/robots.txt.tsx`, `styles/global.css`), but the F8 cleanup is incomplete.

I need you to **finish F8** to complete the Foundation phase, and then move immediately into **Phase 4 (Core UI: C1 and C2)**.

### Read these first, in order

1. `.design/boklanov-rewrite/TASKS.md` — the canonical ordered task
   list. Top of the file has a **Progress log** table. Each F-task and C-task has acceptance prose beneath the checklist.
2. `.design/boklanov-rewrite/DESIGN_BRIEF.md` — locked brief (D1–D15
   decisions, §5 tokens, §7 frontmatter shape, §6 content audit).
   **Source of truth for any visual or content question.**
3. `DESIGN.md` (repo root) — visual identity contract. Aesthetic
   philosophy: warm editorial + brutalist metadata accents. §15 has
   the Phase 4 build order.
4. `.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md` — URL
   strategy, navigation, page hierarchy. Note especially §URL Strategy
   (RU is canonical at `/` with no prefix; EN/DE prefixed).
5. `.design/boklanov-rewrite/tokens.md` — design token rationale. The
   bundled token CSS is `app/globals.css`.

### What's already in the repo

- **App Router shell & i18n** (`app/[locale]/{layout,page}.tsx`, `i18n/`) — RU default at `/`, EN/DE prefixed.
- **Sync pipeline & manual overlays (F4 & F5)** — `scripts/sync-from-notion.ts` parses the local export, emits `index.mdx` + `metadata.yml` (preserved manual-pass data) to `content/productions/<slug>/`.
- **Content loader API (F6)** — `lib/content.ts` exposes `getAllProductions()`, `getProduction()`. Tested and working.
- **Base styles & fonts (F7)** — Self-hosted Lora/Inter/JetBrains Mono + warm editorial CSS reset injected into `app/globals.css`.
- **next.config.js** — `serverExternalPackages: ['gray-matter']` added to fix bundling.

### Your task

Work through **Finishing F8 → C1 → C2** in that order.

1. **Finish F8 (Cut Legacy Renderer):**
   - Run `git status` to see what the previous session deleted before timing out.
   - Delete the remaining legacy files: `pages/` (except `api/social-image.tsx` which we port later), `components/Notion*.tsx`, `components/PageA*.tsx`, `lib/notion*.ts`, `lib/get-site-map.ts`, `lib/preview-images.ts`, `lib/resolve-notion-page.ts`, `lib/map-*.ts`, `styles/notion.css`, `styles/prism-theme.css`.
   - Remove legacy dependencies from `package.json`: `react-notion-x`, `notion-client`, `notion-types`, `notion-utils`.
   - **Crucial Tech Debt:** Remove `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` from `next.config.js`.
   - Run `npx next build` to verify the App Router shell is perfectly type-clean.
   - Commit F8 and update the Progress log.
2. **C1 (Production Card + Grid):** Build the canonical `<ProductionCard>` and `<ProductionGrid>` components. Read DESIGN.md §7.2 for exact anatomy. Render them at `app/[locale]/productions/page.tsx`.
3. **C2 (Production Detail Page):** Build `app/[locale]/productions/[slug]/page.tsx`. Layout strictly follows DESIGN.md §7.3.

For each task: implement, verify (build/dev server), commit with a focused message, update the Progress log table in `TASKS.md`, and check the `[ ]` box.

### Constraints from the brief (do not violate)

- No live Notion API anywhere.
- Aesthetic: warm editorial + brutalist metadata. Reject AI-purple
  gradients, glassmorphism, `rounded-2xl shadow-xl`, hero video,
  bento grids, generic Tailwind shape language. Sharp corners,
  hairline rules, mono captions.
- Oxblood `#6B0F0F` is reserved for the booking CTA and primary hover underlines only.
- Three locales (`ru`, `en`, `de`); RU canonical at `/`.
- Component grammar: Read DESIGN.md carefully. Do not invent drop-shadows or border-radii not specified in the tokens.

### Recent commits on `rewrite/v2` for context

```
728ea69  F7: app/globals.css reset + base styles (warm editorial)
34514c2  F6: lib/content.ts — content loader API
ea58b40  F5: metadata.yml overlay + manual-pass workflow
65f0d22  F4: scripts/sync-from-notion.ts — local export → MDX pipeline
a0c89a4  F3: locale routing + RU default (next-intl v4)
06af4f7  F2: self-host Lora + Inter Medium + JetBrains Mono (woff2 + OFL)
```

Proceed with finishing F8.

---

## Notes for the operator (you, the human)

- The handoff above intentionally does **not** include the full file
  contents — the new conversation should read the docs itself so
  context isn't bloated by paste.
- If the new conversation drifts on aesthetic or scope, paste back the
  "Constraints from the brief" block.
- Phase 4 (C1/C2) is the visual core of the site. Make sure Claude closely reads `DESIGN.md` for spacing, typography scale tokens, and the `<ProductionCard>` anatomy.
