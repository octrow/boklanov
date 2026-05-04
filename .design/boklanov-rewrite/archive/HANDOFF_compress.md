Full version (original): .design/boklanov-rewrite/archive/HANDOFF.md
CONTEXT
Branch: `docs/update-planning-docs` (4 commits ahead `main`). Build clean.
Target: Roman Boklanov. No permanent troupe. Outside Russia since 2022. Use past-tense RU staging geography (`ГДЕ СТАВИЛ`). No city in colophon.
Secret: Birthday present. Hide until D4 cutover. Deadline < May 6 2026.

STATE
Phase 8 complete.
`c1c4436` executed `scripts/fold-overlay.ts`. Merged 24 `metadata.yml` files into `index.mdx` frontmatter.
`lib/content.ts` utilizes `fromFm()`. Deleted `yaml` import.
*(2026-05-04 superseding: `index.mdx` split into `index.yaml` + `body.{ru,en,de}.md`; `yaml` re-added as runtime dep; `gray-matter` dropped; `fold-overlay.ts` moved to `scripts/_legacy/`.)*
Moved `scripts/sync-from-notion.ts` to `scripts/_legacy/`. Notion API dead.
Created `content/AUTHORING.ru.md` for Obsidian onboarding.

EXECUTE D4 CUTOVER
Deadline: May 6 2026.
Configure Spaceship.com DNS: A `@` -> `76.76.21.21`, CNAME `www` -> `cname.vercel-dns.com`.
Configure Vercel: Add `boklanov.com` (canonical) and `www.boklanov.com` (301 redirect).

OPEN TASKS
Author must use Obsidian to:
Populate `gallery[].credit` in `index.yaml` *(was `index.mdx` pre-2026-05-04)*.
Confirm `sugar-kid` and `kasztanka` titles.

CONSTRAINTS
Git: Direct `main` push blocked. Run `git push origin docs/update-planning-docs`, merge via PR.
Data: Static MDX.
Locales: `hreflang` RU/EN only. Production cards RU/EN only. Awards/press original language.
UI: No glassmorphism, AI-purple, bento grid, `rounded-2xl`, `shadow-xl`. Mailto sticky CTA.
Analytics: Track `booking_cta_click` only.

---

DOCUMENT CONSOLIDATION PLAN

EXECUTE MERGE
Condense 15 files into 4 core documents. Delete obsolete files.
1. `README.md`: Project root, build scripts, deployment env.
2. `PLAN.md`: Merge `TASKS.md`, `HANDOFF.md`, `orphan-audit-2026-05.md`, `photo-audit.md`. Track active state, bugs, milestones.
3. `DESIGN.md`: Merge `DESIGN_AMBITION.md`, `DESIGN_BRIEF.md`, `DESIGN_REVIEW.md`, `tokens.md`. Document constraints. Retain `tokens.css` strictly for code import.
4. `ARCHITECTURE.md`: Merge `INFORMATION_ARCHITECTURE.md`, `CONTENT_WORKFLOW.md`, `contributing.md`. Document frontmatter schema and Obsidian workflow.

SYNC WORKFLOW
Rule: Single source of truth per domain.
Modify `PLAN.md` for state changes.
Modify `DESIGN.md` for UI/CSS changes.
Modify `ARCHITECTURE.md` for data schema changes.
Never duplicate instructions.
Commit changes: `git commit -am "docs: sync [DOMAIN]"`
Push to active branch: `git push origin [branch-name]`
