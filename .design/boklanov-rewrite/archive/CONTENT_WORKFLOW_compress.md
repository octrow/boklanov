# CONTENT_WORKFLOW_compress.md

Status: Locked 2026-05-02. Phase 8 Complete.
Full version (original): .design/boklanov-rewrite/archive/CONTENT_WORKFLOW.md
Companion to `DESIGN_BRIEF.md` D3, `PLAN.md` Phase 8.

## Phase 8 Implementation Status (2026-05-02)

* **8.1 Vault config (Done `11bef4d`)**: `.obsidian/{app,types,community-plugins}.json` committed.
  `useMarkdownLinks: true`. Properties defined: `year/featured/ageRating/durationMin/ticketsUrl/form/lineage/tour/tags`.
  `scripts/lint-mdx.ts` + `npm run lint-mdx` blocks `![[wikilinks]]`. Vault requires `obsidian-git` + `mdx-as-md`
  plugins. Ignore `workspace.json`, `cache`, `plugins/`.
* **8.2 R2 image migration (Code done `8339141`, DNS blocked)**: `lib/cdn.ts` `cdnUrl(path)` implemented.
  `scripts/upload-images.ts` created (S3-compatible, `--slug`, `--dry-run`). `<Image src>` wrapped in `cdnUrl()`.
  `next.config.js` allows `cdn.boklanov.com`. **Blocker**: `boklanov.com` DNS migration to Cloudflare pending.
  `NEXT_PUBLIC_CDN_BASE` unset in prod. Images fallback to `public/`.
* **8.3 Fold overlay (Done `c1c4436`)**: `scripts/fold-overlay.ts` executed. 24 `metadata.yml` files folded into
  `index.mdx` frontmatter. `lib/content.ts` simplified: `fromFm()` replaces `merge()`/`pick()`. `yaml` dependency
  dropped. `scripts/sync-from-notion.ts` moved to `scripts/_legacy/` (frozen).
* **8.4 Authoring guide (Done `c1c4436`)**: `content/AUTHORING.ru.md` written. Replaces Notion-centric `README.md`.
* **8.5 Orphan audit (Done `c1c4436`)**: `.design/boklanov-rewrite/orphan-audit-2026-05.md` created.
  `MANUAL_SIBLING_PAIRS` `sugar-kid` + `kasztanka` confirmed.

## Architecture Decisions

* **Source of Truth**: Obsidian + `obsidian-git`. Vault = Repo. Local MDX edits. Git push triggers Vercel build.
* **Data Structure**: MDX frontmatter + prose. `metadata.yml` overlay deprecated.
* **Image Hosting**: Cloudflare R2 (`boklanov-content` bucket) + custom domain (`cdn.boklanov.com`). 10GB free, free
  egress.
* **Rejected Workflows**: Notion sync (legacy: whole-DB export friction, extraction heuristics failures, dual
  source-of-truth), GitHub UI (raw YAML), TinaCMS, Sanity, Logseq, Anytype, Google Docs.
* **Deferred**: Decap CMS. See Phase 9 below.

## Editorial Workflow (AUTHORING.ru.md Core)

1. **Setup**: Install Obsidian (desktop/mobile). Clone via GitHub PAT. Enable `obsidian-git` and `mdx-as-md`.
2. **Edit**: Open `content/productions/<slug>/index.mdx`. Edit metadata via Obsidian Properties panel. Edit prose in
   standard markdown view.
3. **Images**: Place files in `public/productions/<slug>/`. Run `npm run upload-images`. Update MDX references.
4. **Publish**: Use `obsidian-git` "Commit and push". Vercel auto-deploys `main`.
5. **Drafts**: Create branch `draft/<name>`. Edit and push. Review Vercel preview URL. Merge to `main`.

## Deferred: Decap CMS Layer (Phase 9)

**Status**: Ready for activation if web/mobile editing requested without Obsidian app dependency. Layers onto existing
Obsidian vault.

**Implementation constraints**:

* Add `public/admin/index.html` + `public/admin/config.yml`.
* Deploy Vercel serverless GitHub OAuth proxy.
* Lock configuration: `editorial_workflow: false` (commit directly to branch).
* Lock configuration: `backend.branch: draft` (never push direct to main, require manual merge).
* No `_diagnostics.md` generation.
* Media library: Use S3-compatible R2 endpoint configuration. Schema mirrors MDX frontmatter with Cyrillic labels.
