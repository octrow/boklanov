# Content workflow — audit + research + recommendation

> Companion to `DESIGN_BRIEF.md` D3 ("Content source"), `PLAN.md`
> Phase 8, and `content/README.md`.
> **Status: ✅ locked 2026-05-02.**
> Date: 2026-05-02.

## Decision summary

| Axis | Choice | Why |
|------|--------|-----|
| **Source of truth** | **F — Obsidian + obsidian-git, vault = repo** | Lowest infra (no proxy, no Action), real editor for prose, single source of truth fixes P2–P4 at root. |
| **Image hosting** | **R2 with custom CDN domain** | 10 GB free, free egress, slim repo, S3-compatible. Migrated alongside Q1 cutover (one rclone + path rewrite). |
| **Edit cadence assumption** | Several / month, daily early on | Comfortably above the threshold where migration pays back. |
| **Editorial workflow** | Trust-on-publish + `draft` branch for WIP | Vercel preview URLs per branch; merge to `main` = publish. |
| **`metadata.yml` overlay** | **Folded into MDX frontmatter** (overlay deprecated) | B4 answer 2026-05-02: single source of truth per field. Migration script merges every `overlay.*` field into `index.mdx` frontmatter once; `metadata.yml` is deleted. `lib/content.ts` `pick(overlay, fm)` collapses to `fm`. |
| **Cyrillic-only-Name orphans** | Manual audit included in migration (Phase 8.5) | One-time correction before they freeze in the new source. |
| **Roman onboarding** | Mini-guide (`AUTHORING.ru.md`) instead of screen-share | Async, repeatable, doubles as future onboarding for collaborators. |

Locked migration plan: **§6** below (~2.5 days, Phase 8.1–8.5).

**Variant status (2026-05-02):**

- **F (Obsidian) — locked for Phase 8.** Ships first, alone.
- **C (Decap CMS) — deferred, not rejected.** Roman opted for
  Obsidian first with Decap "in support for the future" (B1
  answer). Decap will be added as a **second admin surface on
  the same vault** in a later phase, when Roman actually requests
  a web/mobile editing path. Locks for the future Decap layer
  (when it lands): `editorial_workflow: false`, `backend.branch:
  draft` from day one, no `_diagnostics.md`. See §6B in this doc
  for the Decap migration plan, which becomes Phase 8.x or
  Phase 9 if/when Roman activates it.
- **D (TinaCMS), E (Sanity), G (Logseq), H (Anytype/AppFlowy/
  SiYuan), I (Google Docs+R2)** — rejected. Pro/con analysis in
  §3 for future reference.

The body of this doc (§1–§4, §7, §9, §11) is preserved as the
research trail behind the decision.

---

## 1. Today's process

Locked in brief D3, executed by `scripts/sync-from-notion.ts`:

```
Roman edits in Notion  →  re-exports the *whole* DB to a ZIP  →
drops the export into notion-data/Роман Бокланов/  →
Daniil runs `npm run sync`  →
sync regenerates content/productions/*/index.mdx + public/productions/<slug>/*  →
Daniil reviews diff, optionally hand-edits metadata.yml overlays  →
Daniil commits + pushes to GitHub  →  Vercel rebuilds  →  live
```

### Pain points (observed during Q1–Q8 fixes 2026-05-01/02)

| #  | Pain                                                                                                                                                                                                                             | Where it bites                                                                                                                   |
|----|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| P1 | **Notion export is whole-database, every time.** 250 MB / 419 images / 89 records redeposited even for a single-field correction.                                                                                                | Roman: Notion's bulk-export UI is slow. Daniil: re-running sync re-copies all images, re-encodes LQIPs, re-emits all MDX.        |
| P2 | **Notion export format drifts.** Q1 surfaced 6 navigation/role/festival pages exported as `Public=Yes` rows. Q2 surfaced Cyrillic-only-Name rows whose `Slug` column was empty. Each export drift requires a sync-script change. | Daniil: invisible failure mode. Bogus or mis-paired records ship without warning unless someone manually browses `/productions`. |
| P3 | **Heuristic extraction is fragile.** Q3, Q4, Q8 all fixed extractors — synopsis, awards, theatre, credits, premiere date. Each pattern has a ~95% hit rate; the remaining 5% needs a `metadata.yml` overlay.                     | Roman: never sees the wrong data; Daniil has to spot it.                                                                         |
| P4 | **Two-source-of-truth tension.** Notion is editorial; `metadata.yml` is the override for things the sync gets wrong. Roman doesn't know which file owns which field.                                                             | Cognitive overhead: who do I tell to fix the wrong year — Notion, or the file in the repo?                                       |
| P5 | **No preview before deploy.** Roman edits in Notion, but doesn't see the rendered site until after Daniil syncs + pushes.                                                                                                        | Iterations require pings to Daniil; corrections to typos / image picks accumulate.                                               |
| P6 | **Daniil is in the loop for every change.** Vacation, sleep, time-zone gap = stale site.                                                                                                                                         | Single point of failure.                                                                                                         |
| P7 | **Image management is opaque.** Photos live in Notion; the export pulls them by Notion-relative path. Adding new photos means uploading to Notion first, then re-exporting the whole DB.                                         | Roman uploads to Notion → waits → asks Daniil to sync.                                                                           |
| P8 | **Notion's CSV column shape is brittle.** `Slug`, `Public`, `Featured`, `Tags` are columns Roman maintains by hand. Forgetting `Public=Yes` hides a production silently.                                                         | Same family as P2.                                                                                                               |

The current process *works* for the rewrite (Daniil + Roman are
co-pilots), but doesn't scale to **Roman editing on his own**.

---

## 2. What "good" looks like

Goals, in order of priority:

1. **Roman edits without Daniil.** New show, photo swap, typo fix —
   Roman handles end-to-end.
2. **Preview before publish.** Roman sees the rendered page on a
   staging URL before it goes live.
3. **Single source of truth per field.** No "is this in Notion or
   `metadata.yml`?" ambiguity.
4. **Editorial control over the rendered page is preserved.**
   Heuristics-with-overlay → curated structured data. The page never
   ships with mojibake or actor-name-as-festival.
5. **Cyrillic + Latin + future German content all first-class.** RU is
   canonical for Roman's voice; EN/DE are translations.
6. **No vendor lock-in beyond what we already accept** (Vercel for
   hosting; Lora/Inter/JetBrains Mono for fonts).
7. **Static-site build stays fast.** Build runs on Vercel push; no
   runtime CMS calls.
8. Edit data in headers, contacts, etc

Non-goals:

- A multi-author workflow with permissions / draft branches per
  contributor. Roman is the only author; Daniil is the only engineer.
- Full WYSIWYG layout editing. The page layout is locked by
  `DESIGN.md`; only field values change.
- Comment threads, reactions, scheduling, AB testing. None of those
  are in the brief.

---

## 3. Options surveyed

Five candidates with comparable footprints. Cost / vendor / preview /
Roman-friction columns are the tradeoff axis.

### 3.A — Status quo (Notion + sync script)

Keep what we have. Improve the sync script as new patterns surface.
Roman edits in Notion → tells Daniil → Daniil runs sync.

| Pro                                   | Con                               |
|---------------------------------------|-----------------------------------|
| Zero migration cost                   | Daniil-in-the-loop forever (P6)   |
| Roman likes Notion's editor           | No preview before deploy (P5)     |
| Cyrillic + multilingual already works | Heuristics keep accumulating (P3) |
| Free                                  | Whole-DB re-export friction (P1)  |

**When this is right:** if Roman edits ≤ once a quarter and tolerates
the round trip. Today's volume is roughly that.

### 3.B — Drop Notion, edit MDX + metadata.yml directly in GitHub

Roman gets a GitHub account, edits files via the GitHub web UI (or
locally if he wants). Photos uploaded via drag-and-drop in the GitHub
file editor. Sync script retired.

| Pro                                                    | Con                                                                                    |
|--------------------------------------------------------|----------------------------------------------------------------------------------------|
| Single source of truth (P4 fixed)                      | Roman writes YAML / MDX (steep)                                                        |
| Diff-reviewable (P5 partially: PR previews via Vercel) | No editorial UI; raw fields                                                            |
| No vendor lock-in beyond Git                           | Image upload via GitHub UI is clunky                                                   |
| Free                                                   | Cyrillic in YAML keys works, but field names like `ageRating: "6+"` are coder-flavored |

**When this is right:** if Roman is willing to learn ~5 YAML
conventions and read PR previews. Most directors are not.

### 3.C — Decap CMS (formerly Netlify CMS)

Open-source, git-backed CMS that overlays a web UI on the existing
repo. Roman logs in via GitHub OAuth at e.g.
`boklanov.com/admin/`, sees a form for each field defined in a
`config.yml`, edits, and clicks Publish — Decap commits the changes
to a branch (or main) on his behalf. No backend, no DB; everything
goes through git.

| Pro                                                  | Con                                                                                   |
|------------------------------------------------------|---------------------------------------------------------------------------------------|
| Web UI for Roman (P6 fixed, P1/P5 fixed)             | Decap is on maintenance mode (active fork: `decap-cms`); ~stable but not feature-rich |
| Git-backed → existing CI/Vercel build flow unchanged | Cyrillic in field labels works; file paths must be ASCII (we already are)             |
| Self-hostable, no vendor invoice                     | OAuth setup required (GitHub OAuth app)                                               |
| Field-level validation, image upload widget          | Heavier setup than 3.B; more pieces to learn                                          |
| Multilingual via per-locale collections              | Editorial workflow (draft/review) is opt-in but adds friction                         |
| Roman writes prose without YAML                      | UI styling is generic; doesn't match the editorial site itself                        |

**When this is right:** Roman edits monthly+, wants a web UI, accepts
generic admin chrome. **This is the option closest to the original
brief intent** — content stays in repo, single source of truth, but
Roman doesn't touch raw files.

### 3.D — TinaCMS

Commercial Git-backed CMS with **inline visual editing**: Roman opens
the production page on a staging URL, clicks the synopsis, edits in
place, saves — Tina commits to the branch. Visual feedback is live.

| Pro                                            | Con                                                                                                     |
|------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Best-in-class editing UX — visual + git-native | Hosted Tina Cloud has a paid tier (~$29/mo Team) for non-trivial use; self-host possible but more setup |
| Single source of truth in MDX                  | Tina Cloud account = vendor footprint                                                                   |
| Preview is the editor (P5 fully fixed)         | TinaCMS schema needs to be defined and maintained alongside the MDX shape                               |
| Multilingual works                             | More complex than Decap to set up correctly                                                             |
| Active development                             | Inline editing for non-React content (gallery image-uploads, etc.) takes more wiring                    |

**When this is right:** Roman edits weekly+, demands a polished
editing experience, the budget allows ~$29/mo (or self-hosting effort).

### 3.E — Sanity (or other headless CMS)

Sanity Studio = separate React app (lives at `studio.boklanov.com`),
edits stored in Sanity's hosted DB, content fetched at build time
from Sanity's GraphQL/Groq API → MDX is no longer the source of
truth; Sanity is.

| Pro                                            | Con                                                                           |
|------------------------------------------------|-------------------------------------------------------------------------------|
| Best editing experience for structured content | **Vendor lock-in** — content lives in Sanity's DB                             |
| Real-time collab, draft-vs-published, history  | Adds runtime fetch step (or a sync-from-sanity script — same shape as today!) |
| Strong i18n primitives                         | Free tier limits (3 users, 10k docs) probably enough; paid tier ~$99/mo+      |
| Image CDN included                             | Migration cost: rewrite content model; teach Roman a new tool                 |

**When this is right:** if the team grows or Roman wants a designer
mode for layout. **Overkill** for the current scope (one author,
30 productions).

### 3.F — Obsidian + Git plugin (vault = repo)

Roman installs Obsidian (free, including for commercial use — confirmed
on `obsidian.md/license` 2026-05-02), clones the repo as a vault, and
edits `content/productions/<slug>/index.mdx` directly. Frontmatter is
rendered by Obsidian's **Properties** panel as a form (fields, dropdowns,
dates) — Roman never sees raw YAML for known keys. The
[obsidian-git](https://github.com/Vinzent03/obsidian-git) community
plugin handles `pull` on open, `commit + push` on demand or schedule.
Vercel rebuilds on push.

| Pro                                                                                     | Con                                                                                                                                                                 |
|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Vault = repo. **Sync pipeline disappears entirely.** (P1, P2, P3 fixed at root)         | Roman has to install a desktop app (and mobile app for on-the-go edits)                                                                                             |
| Properties UI auto-renders YAML frontmatter as a typed form (P4 fixed)                  | MDX with custom JSX components is *editable* but not previewable inside Obsidian — only the prose + frontmatter render                                              |
| Free for personal **and** commercial use; no account, no telemetry, no vendor invoice   | Image embeds: Obsidian uses `![[file.jpg]]` wikilinks; we'd need a small convention (paste into `public/productions/<slug>/`) and use standard `![](path)` markdown |
| Works fully offline. Mobile apps (iOS/Android) free. Cyrillic native.                   | Obsidian itself is closed-source (the editor; the file format is plain MD)                                                                                          |
| Git plugin commits + pushes from inside Obsidian — no terminal                          | First-time git setup (clone + auth token) is a 10-minute Daniil walkthrough                                                                                         |
| Vercel preview URL per branch → "preview before publish" by editing on a `draft` branch | No editorial-workflow primitive (PR-per-edit). Convention-based: edit on `draft`, merge to `main` when ready                                                        |

**When this is right:** Roman is comfortable installing one app and
running "commit + push" from a sidebar button. For a single author
this is the **simplest free architecture** that eliminates the sync
step and keeps the repo as the only source of truth. Strongest
free competitor to Decap.

### 3.G — Logseq (vault = repo, outliner UX)

Same architecture as Obsidian — Logseq points at a folder of markdown
files and edits them in place. Open-source (AGPL), free, mobile apps.

| Pro                                              | Con                                                                                                                                                      |
|--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| Fully open-source (vs. Obsidian's closed editor) | Outliner-first UX: every line is a bullet by default. Awkward for prose-heavy production synopses                                                        |
| Free, no account, local-first                    | Frontmatter handling is weaker than Obsidian's Properties panel; Logseq prefers `property:: value` inline syntax which would diverge from our YAML shape |
| Git integration via plugins                      | Smaller plugin ecosystem; obsidian-git equivalents exist but are less polished                                                                           |

**When this is right:** if Roman strongly prefers AGPL purity over
UX polish. Otherwise Obsidian wins on editing experience for prose.

### 3.H — Anytype / AppFlowy / SiYuan (Notion-style local-first apps)

Three free, local-first "Notion alternatives" the user asked about.
**They all share the same architectural problem for our use case:**
each one stores notes in its **own database / object format** (Anytype:
encrypted block tree synced over `any-sync`; AppFlowy: SQLite + Yjs CRDT;
SiYuan: `.sy` JSON workspace). Plain markdown is an *export*, not the
storage format.

That means none of them can edit the repo's MDX files in place. To use
any of them in our pipeline we'd:

1. Make Roman maintain a mirror workspace inside the app, **and**
2. Run a sync script that exports → diffs → writes MDX into the repo.

This is **structurally identical to today's Notion → ZIP → sync**
pipeline (P1, P2, P3 all return), just with a different vendor.

| Tool     | License                                                              | Sync model            | Why it doesn't help us                                                                      |
|----------|----------------------------------------------------------------------|-----------------------|---------------------------------------------------------------------------------------------|
| Anytype  | Open-protocol, free; self-host backups via `any-sync-node`           | P2P, E2E encrypted    | Custom block format. MD export is lossy and one-way.                                        |
| AppFlowy | AGPL, free; self-host AppFlowy Cloud                                 | Yjs CRDT over server  | SQLite + Yjs storage. MD export available, but we'd need an export-watch loop.              |
| SiYuan   | AGPL, free desktop; paid cloud sync ($24/yr) or self-host via WebDAV | E2EE block-level sync | `.sy` JSON workspace. MD export exists but block refs / databases don't round-trip cleanly. |

**Verdict:** these are excellent tools **for personal knowledge
management**, but they're a strict downgrade vs. options C (Decap) and
F (Obsidian-on-vault) for our scenario, because they reintroduce the
two-source-of-truth problem we are trying to eliminate.

**When this is right:** never, for this site. The reason to evaluate
them was thoroughness, not fit.

### 3.I — Google Docs + Sheet + R2 (publish-to-web fetch)

Roman edits in tools he already uses. **Source of truth is split**:

- **Google Sheet** = production index. One row per show; columns =
  `slug`, `title (RU)`, `title (EN)`, `year`, `theatre`, `premiere`,
  `public`, `featured`, `tags`, `docId` (link to the prose doc),
  `imagesFolderId` (link to Drive folder).
- **Google Doc per production** = prose body (synopsis, awards,
  director's note). Roman follows a light template: first paragraph
  = synopsis lede; lines starting with `Премьера:` / `Театр:` /
  `Награды:` get parsed as structured fields.
- **Google Drive folder per production** = photo dump.

Everything is link-shared ("Anyone with the link can view"), which
unlocks the publish-to-web export endpoints **without API auth**:

```
https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid=0
https://docs.google.com/document/d/{ID}/export?format=md
```

A scheduled GitHub Action (every 15 min, plus a webhook from a tiny
Apps Script `onEdit` trigger for instant pushes) does:

1. Fetches the sheet as CSV.
2. For each row: GET the doc's `/export?format=md` with `If-None-Match`
   against an ETag stored in **R2**; skip on 304.
3. Syncs new images from Drive → R2 bucket `productions/<slug>/`,
   computes LQIPs, writes a manifest.
4. Diffs the resulting MDX + image manifest against the repo;
   commits + pushes only what changed.
5. Vercel rebuilds; `<Image>` points at `cdn.boklanov.com/...`.

| Pro                                                                                                                        | Con                                                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Roman installs **nothing**. Edits in Google Docs (mobile, real-time, suggestions, comments, version history — all native). | Drafts are public-link-readable from the moment Roman starts typing. No private editing.                                         |
| Best mobile editing experience of any option (Google Docs mobile is best-in-class).                                        | Parsing problem (P3) returns: prose → typed fields needs a template Roman follows.                                               |
| Free at this scale: Google free tier + R2 free 10 GB / free egress + GitHub Actions free + Vercel hobby.                   | More moving pieces than F or C: GitHub Action + Apps Script trigger + R2 bucket + custom CDN domain. Daniil maintains all of it. |
| Real-time collab (Daniil + Roman can edit same doc); suggestions mode = built-in editorial review.                         | Multiple vendor accounts (Google + Cloudflare + GitHub + Vercel = 4).                                                            |
| R2 caching of fetched MD makes incremental builds fast. R2 hosts images with free egress and a custom CDN domain.          | Image flow lags by one cron tick (≤ 15 min) unless the Apps Script webhook fires.                                                |
| No OAuth proxy, no API keys in CI — just public URLs.                                                                      | Sheet column drift (Roman renames a column) breaks the sync; needs a schema-validation step in the Action.                       |

**When this is right:** Roman refuses to install any app, won't touch a
git button, but is fine following a doc-template convention. This is
the **lowest-friction-for-Roman** option, at the cost of
highest-infra-surface for Daniil.

---

## 4. Comparison matrix

| Axis                     | A. Notion+sync               | B. GitHub direct       | C. Decap           | D. Tina                 | E. Sanity                | F. Obsidian                                | G. Logseq              | H. Anytype/AppFlowy/SiYuan    | I. Google Docs+R2                                         |
|--------------------------|------------------------------|------------------------|--------------------|-------------------------|--------------------------|--------------------------------------------|------------------------|-------------------------------|-----------------------------------------------------------|
| Roman friction           | medium                       | high (raw YAML)        | low (web form)     | very low (visual)       | low (separate app)       | low (Properties form, prose-friendly)      | medium (outliner)      | medium (own app, like Notion) | **lowest** (tools he already uses)                        |
| Daniil friction          | high (in-loop)               | low                    | low (config once)  | low–med (schema)        | medium (model migration) | very low (one-time vault setup)            | low                    | high (sync pipeline returns)  | **highest** (Action + Apps Script + R2 + parsing)         |
| Vendor lock-in           | none                         | none                   | none               | Tina Cloud or self-host | Sanity                   | none (closed-source app, open file format) | none                   | none, **but own data format** | Google + Cloudflare (both free tiers)                     |
| Cost / month             | $0                           | $0                     | $0                 | $0–$29                  | $0–$99                   | $0                                         | $0                     | $0 (or $24/yr SiYuan cloud)   | $0 (Google free + R2 free 10 GB)                          |
| Preview before publish   | no                           | PR preview             | branch preview     | live inline             | hosted preview           | branch preview via Vercel                  | branch preview         | export → preview → fix loop   | yes (Action commits to `draft` branch first)              |
| Single source of truth   | no (P4)                      | yes                    | yes                | yes                     | yes (in Sanity)          | yes (vault = repo)                         | yes (vault = repo)     | **no** — app DB ≠ repo        | no — Google docs are source, repo is derived (P4 returns) |
| Cyrillic + Latin         | yes                          | yes                    | yes                | yes                     | yes                      | yes                                        | yes                    | yes                           | yes                                                       |
| Image upload UX          | re-export DB                 | drag-into-GitHub       | upload widget      | upload widget           | hosted CDN               | drag into vault folder                     | drag into vault folder | export and copy               | drop into Google Drive folder                             |
| Build flow change        | none                         | none                   | none               | none                    | add fetch step           | none                                       | none                   | new sync script (like today!) | new GitHub Action + R2 bucket                             |
| Mobile editing           | no (Notion ✓ but no preview) | clunky (GitHub mobile) | usable (web admin) | usable (Tina web)       | yes (Sanity Studio web)  | yes (Obsidian iOS/Android, free)           | yes (Logseq mobile)    | yes (per-app)                 | **best** (Google Docs mobile)                             |
| Static site stays static | yes                          | yes                    | yes                | yes                     | yes (build trigger)      | yes                                        | yes                    | yes                           | yes (Action commits MDX)                                  |
| Migration effort         | 0                            | very low               | low (1–2 days)     | medium (3–5 days)       | high (1–2 weeks)         | low (½–1 day)                              | low (1 day)            | medium (rewrite sync)         | medium (3–4 days; new Action + R2 + template)             |

---

## 5. Decision (locked 2026-05-02)

**✅ F — Obsidian + obsidian-git plugin, vault = repo.**
**✅ R2 — Cloudflare R2 with custom CDN domain for images.**

Decision tree, resolved:

```
Will Roman install Obsidian and click "commit + push"?
└── Yes ✅ → F (Obsidian).  ← chosen
```

### 5.1 — Why F (kept)

- Lowest infrastructure footprint of all options. No OAuth proxy, no
  GitHub Action, no Apps Script trigger, no admin URL to host.
  Daniil can disappear from the loop completely.
- Vault literally is the repo. Single source of truth — closes P2/P3/P4
  at the root.
- Real prose editor (vs. Decap's web form). Roman is writing a
  director's voice, not filling a CRM record.
- Free for personal **and** commercial use (license confirmed
  `obsidian.md/license`, Feb 2025). Mobile apps free.
- Cyrillic native; Properties UI auto-renders YAML frontmatter as a
  typed form with Cyrillic field labels.
- Migration is the smallest of any non-trivial option (~2.5 days
  including R2 + orphan audit).

### 5.2 — Why R2 (kept)

- 10 GB free storage; 30× headroom on current photo volume.
- Free egress (R2's killer feature vs S3) — any traffic spike costs $0.
- Custom domain `cdn.boklanov.com`, S3-compatible API, Cloudflare CDN
  globally cached.
- Migrated **as part of** Phase 8 cutover, not separately.

### 5.3 — Other variants considered

| Option | Verdict | Note |
|--------|---------|-----------------|
| A — Notion + sync (status quo) | rejected | Daniil-in-the-loop, P1/P5/P6/P7 unfixed. |
| B — Edit MDX in GitHub web UI | rejected | Raw YAML; prose UX too rough for Roman. |
| **C — Decap CMS** | **deferred** | **Not rejected.** Layered onto the F vault as a second admin surface in a later phase, when Roman actively requests web/mobile editing without the desktop app. Locks for the future C layer: `editorial_workflow: false`, `backend.branch: draft` from day one, no `_diagnostics.md` parser-warning file. Migration plan in §6B. |
| D — TinaCMS | rejected | $29/mo and visual-editing demand isn't there. |
| E — Sanity | rejected | Vendor lock-in, overkill for one author. |
| G — Logseq | rejected | Outliner UX wrong for prose synopses. |
| H — Anytype / AppFlowy / SiYuan | rejected | Reintroduce export+sync (P1–P3 return). |
| I — Google Docs + R2 | rejected | Lowest Roman-friction but highest Daniil-infra; F won the trade because Roman accepted installing one app. |

Each option's full pro/con discussion is preserved in §3 for future
reference if circumstances change (e.g., new editor joins, Roman
switches to mobile-only).

---

## 6. Migration plan — Phase 8 (locked)

**Total: ~2.5 working days. Zero ongoing infra cost** (R2 free tier
covers expected volume by ~30×). Phase 8 = Obsidian + R2 cutover.

### Phase 8.1 — Vault layout + Properties schema (½ day)

- Register `.mdx` as markdown in Obsidian (community plugin
  `obsidian-mdx-as-md` or `app.json` extensions setting).
- Configure Obsidian Properties to render the canonical frontmatter
  keys (`title`, `titleEn`, `year`, `theatre`, `premiereDate`,
  `featured`, `public`, `tags`, `synopsis`, …) as typed form fields
  with Cyrillic labels (`.obsidian/types.json` or settings UI).
- Add `obsidian-git` to `.obsidian/community-plugins.json`; commit
  the vault config so any clone gets the same setup.
- Add a build-time linter (`scripts/lint-mdx.ts`) that fails on
  Obsidian-flavoured `![[wikilink]]` syntax — enforces standard
  markdown image refs in committed files.

### Phase 8.2 — R2 image migration (½ day)

- Provision R2 bucket `boklanov-content`, public-read access,
  custom domain `cdn.boklanov.com` (Cloudflare DNS, auto-SSL).
- One-shot copy:
  `rclone sync public/productions/ r2://boklanov-content/productions/`.
- Search-replace `<Image>` `src` paths from `/productions/<slug>/...`
  to `https://cdn.boklanov.com/productions/<slug>/...` (or, cleaner:
  introduce a `CDN_BASE` env var so dev still resolves locally).
- Keep LQIPs / blurhashes inline in MDX frontmatter; only the byte
  blobs move to R2.
- Authoring convention: Roman drops new photos into
  `public/productions/<slug>/`, runs `npm run upload-images` (a
  10-line `wrangler r2 object put` wrapper) — Daniil documents this
  in `AUTHORING.ru.md`. Long-term: convert to a vault hook so the
  step is automatic.

### Phase 8.3 — Retire the Notion sync pipeline + fold `metadata.yml` (½ day)

- **Fold `metadata.yml` overlay into MDX frontmatter (one-shot).**
  Write `scripts/fold-overlay.ts`: for every
  `content/productions/<slug>/`, merge non-null `metadata.yml` fields
  into `index.mdx` frontmatter (overlay-wins, matching today's
  `lib/content.ts` precedence), then `git rm` the `metadata.yml`.
- Simplify `lib/content.ts`: drop the `pick(overlay, fm)` helper and
  every `overlay.*` reference; `getProduction()` reads only MDX
  frontmatter. Single source of truth per field — closes P4
  permanently.
- Move `scripts/sync-from-notion.ts` → `scripts/_legacy/sync-from-notion.ts`
  with header `// frozen 2026-05-02; do not re-run`. Kept 1–2 months
  for forensic reference, then deleted.
- Move `notion-data/` to a separate `archive/notion-export-2026-05`
  branch — keep accessible, drop from `main` (frees ~250 MB).
- Update `package.json`: `npm run sync` →
  `echo "sync retired; edit in Obsidian"`.
- Rewrite `content/README.md` to point at `AUTHORING.ru.md` and
  describe the new "edit MDX directly in Obsidian, no overlay" flow.

### Phase 8.4 — Authoring guide for Roman (½ day)

Author **`content/AUTHORING.ru.md`** — the mini-guide Roman uses
day-to-day. Skeleton in §6.5 below; final copy written during this
phase. Daniil also walks through it once (Telegram or async video).

### Phase 8.5 — Cyrillic-only-Name orphan audit (½ day)

- List productions whose RU title was synthesized via
  `MANUAL_SIBLING_PAIRS` (`Сахарный ребёнок`, `Каштанка`, …).
- For each: open in Obsidian, surface the Properties panel, ask
  Roman to confirm or correct. Single git commit per production.
- This is one-shot — never repeated. Captured in
  `.design/boklanov-rewrite/orphan-audit-2026-05.md`.

---

### 6.5 — Mini-guide skeleton (`AUTHORING.ru.md`, для Романа)

Финальный текст пишется на Phase 8.4. Скелет ниже — то, что в нём
обязательно должно быть. Язык: русский. Тон: дружелюбный, шаги
пронумерованы, скриншоты добавит Daniil после установки на машине
Романа.

```markdown
# Как редактировать сайт boklanov.com

> Источник правды — папка `content/productions/`. Там лежит
> по одному файлу на спектакль. Редактируем в Obsidian, публикуем
> кнопкой "commit + push" — сайт пересобирается автоматически.

## Один раз: установка

1. Скачать Obsidian с [obsidian.md](https://obsidian.md) (бесплатно).
2. Получить от Daniil: GitHub Personal Access Token (PAT).
3. В Obsidian: **Open vault → Clone existing remote vault →
   `git@github.com:.../boklanov.git`**, использовать PAT как пароль.
4. Установить плагины (уже включены в репо):
   `obsidian-git` + `mdx-as-md`. Если Obsidian спросит "включить?"
   — да, для всех.
5. Установить Obsidian Mobile на телефон, повторить шаг 3.

## Каждодневно

### Изменить поле спектакля (год, театр, флаг "опубликован")

1. Открыть `content/productions/<slug>/index.mdx`.
2. Вверху страницы — панель **Properties** (свойства). Это форма
   с полями: Название, Год, Театр, Премьера, Опубликован, …
3. Нажать на значение, поправить, **Cmd+S** (или Ctrl+S).
4. В сайдбаре справа — **Source Control** → **Commit** → ввести
   короткое описание ("исправил год сахарного ребёнка") →
   **Commit-and-push**.
5. Через 1–2 минуты Vercel пересоберёт сайт. Свериться с
   `boklanov.com`.

### Изменить текст синопсиса / описание

1. Тот же файл, но скроллим ниже Properties — там идёт обычный
   текст. Редактировать как Word.
2. **Cmd+S** → **Commit-and-push**.

### Добавить новый спектакль

1. Скопировать любой существующий `content/productions/<slug>/`
   как шаблон. Переименовать папку (slug — латиницей, дефисы вместо
   пробелов; пример: `solnyshko`, `bezymyannaya-zvezda`).
2. Открыть `index.mdx`, заполнить Properties, написать описание.
3. Положить фотографии в ту же папку (форматы: `.webp`, `.jpg`).
4. Запустить `npm run upload-images` — фотографии уйдут на CDN.
   (Daniil настроит однократно; кнопку добавим в Obsidian.)
5. Commit-and-push.

### Добавить или заменить фотографии существующего спектакля

1. Положить новые файлы в `public/productions/<slug>/`.
2. Удалить старые из той же папки.
3. `npm run upload-images`.
4. Если в `index.mdx` менялся набор картинок — отредактировать
   галерею вручную (Daniil покажет где).
5. Commit-and-push.

## Черновики (если правка большая или сомнительная)

1. В Source Control → **Create branch** → `draft/<что-делаю>`.
2. Все правки коммитятся в эту ветку.
3. Vercel создаёт **отдельный preview URL** — он приходит
   ботом-комментарием в GitHub. Открыть, проверить как выглядит.
4. Если ок: **Merge branch into main** (там же в Source Control).
5. Если не ок: продолжить править в той же ветке либо удалить её.

## Что-то сломалось

- Сайт не обновился через 5 минут → проверить вкладку Vercel в
  GitHub: красный значок = билд упал. Скриншот → Daniil.
- Obsidian-git ругается "merge conflict" → не паниковать. Кнопка
  **Pull** (стрелка вниз), потом написать Daniil — он покажет.
- Случайно опубликовал что-то лишнее → ничего не пропало,
  поправить и commit-and-push заново. История в git.
- Забыл PAT → Daniil выдаст новый.

## Контакт
Daniil: Telegram / e-mail. Для срочного — ставить флаг "🆘" в
описании коммита, прилетит уведомление.
```

---

### 6B — Decap CMS layer (deferred; activate when Roman asks for web editing)

Decap is **deferred, not rejected**. The plan below sits ready for
activation as a later phase (Phase 9 or 8.x) when Roman explicitly
asks for a web/mobile editing path that doesn't require the desktop
Obsidian app. It layers onto the same vault — Obsidian and Decap
edit the same files; both commit to the same `draft` branch.

**Activation triggers** (any one is enough):
- Roman travels for a stretch and finds Obsidian Mobile insufficient.
- A second contributor joins and won't install Obsidian.
- Browser-based copy-edit becomes a friction point Daniil hears about
  more than once.

**Migration plan (~2 days when activated):**

1. **Decap setup (½ day).** Add `public/admin/index.html` +
   `public/admin/config.yml`. Configure GitHub OAuth via a free
   Vercel serverless OAuth proxy (single function, no VPS).
2. **Schema mapping (½ day).** `config.yml` collections mirror the
   MDX frontmatter shape. Cyrillic field labels.
   **Locks:**
   - `editorial_workflow: false` (convention is the `draft` branch,
     same as Phase 8 for Obsidian — no PR-per-edit).
   - `backend.branch: draft` from day one — Decap never pushes to
     `main`. Roman merges `draft → main` from GitHub or Obsidian
     when he's ready to publish.
   - No `_diagnostics.md` parser-warning file (we don't have a
     parser anymore — Decap writes structured data directly).
3. **Media library wired to R2 (½ day).** S3-compatible endpoint
   pointed at the same R2 bucket Phase 8 creates. Image upload UX
   becomes "click + select" in addition to the Obsidian drag-drop
   path.
4. **Roman onboarding (½ day).** Append a "веб-редактор" section to
   `AUTHORING.ru.md` documenting the admin URL flow.

**Rejected variants** (D, E, G, H, I) stay rejected — their
pro/con analysis lives in §3 if circumstances ever change enough to
warrant another look.

---

## 7. Risks of the locked plan (F + R2)

| Risk                                                                                 | Mitigation                                                                                                                                      |
|--------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| Obsidian becomes paid / changes license                                              | Vault is plain markdown in our repo. Worst case Roman switches to VS Code or any editor; cost = 0.                                              |
| `obsidian-git` plugin breaks on a release                                            | Roman runs `git pull` / `git push` from a terminal, or asks Daniil. Editing continues; only sync is interrupted.                                |
| Roman accidentally publishes broken content                                          | Trust-on-publish + `draft` branch convention (see §6.5 mini-guide). Vercel preview URL per branch catches issues before `main`.                 |
| Image embeds use Obsidian-flavoured `![[wikilinks]]` that don't render in production | `scripts/lint-mdx.ts` (Phase 8.1) fails the build on any `![[…]]`. Standard markdown enforced by CI.                                            |
| Daniil loses visibility into edits                                                   | All changes flow through git. `git log content/productions/` is the audit trail.                                                                |
| R2 outage breaks images on the live site                                             | Cloudflare R2 SLA is 99.9%; in practice rare. Mitigation: keep `public/productions/` as a fallback for ~3 months post-cutover before removing.  |
| R2 free tier exceeded (10 GB)                                                        | ~30× headroom today. Cloudflare dashboard alert at 80%; per-GB-pennies if it ever happens.                                                      |
| `npm run upload-images` step forgotten — broken image links                          | Build-time check: every `<Image src="cdn.boklanov.com/...">` must HEAD-200. Fails the build with a clear error pointing to missing file.        |

Risks for rejected variants (C and I) are preserved in git history for
the day someone revisits §3.

---

## 8. Open questions for Roman

Before we commit, the goal is to pick from the §5 decision tree.
Three forking questions, in order:

1. **Will you install Obsidian** (free desktop+mobile app, looks like
   Notion but local) and click a "commit + push" button after each
   edit session? → **F** but alo support Decap CMS.
2. If no: **will you log in to a web admin URL** at
   `boklanov.com/admin/` and edit a form? → **C** (Decap CMS).
3. If no: **are Google Docs / Sheets your preferred tools**, and are
   you OK following a doc-template convention? → **I** (skip if it too complex/hard).

Plus:

- How often do you expect to edit? Once a month, once a week? -> maybe first mounth every two day, and later every 1-2
  weeek
- Do you want to write on the train (mobile)? Obsidian mobile is
  excellent; Google Docs mobile is best-in-class; Decap web admin is
  usable but cramped. -> Yes, i want if possible (but its not very important)
- Do you want to *preview* before publish? (Rules out A.) -> maybe, its not very important if i can fast edit/reboot
- Are you OK with drafts being publicly readable by anyone with the
  link? (Only matters for I.) -> ok
- For F or C: are you OK using your GitHub account as the login? -> ok if necessary

---

## 9. Open questions for Daniil

- Pick from the §5 decision tree based on Roman's §8 answers. Default
  is F (lowest infra). Reach for I (Google Docs + R2) only if Roman
  flatly refuses to install an app **and** prefers Google Docs over a
  web admin. -> lets try obsidian + Decap CMS
- Are you OK retiring `scripts/sync-from-notion.ts` and the
  `notion-data/` import folder? Both have served their purpose. -> maybe, after we completed implementation and check
  it.
- Do you want to keep `metadata.yml` overlay as a power-user escape
  hatch, or fold its fields into the main frontmatter schema? -> move all to Frontmatter
- Editorial workflow vs trust-on-publish? -> draft branch
  - F: convention via `draft` branch.
  - C: `editorial_workflow: true` config flag (PR per edit).
  - I: Action commits to `draft` branch first; manual merge to `main`.
- Where do images live? See §11 for the R2-as-image-host decision; it
  is **orthogonal** to the F/C/I source-of-truth choice. -> move to Cloudflare R2
- For I only: are you OK babysitting a GitHub Action + Apps Script
  trigger? They're free but become critical-path infra. -> not reallly

---

## 10. Decision checkpoint — locked 2026-05-02

| Axis | Picked | Other (see §5.3 for reasons) |
|------|--------|-------------------------------|
| **Source of truth (Phase 8)** | ✅ **F** — Obsidian + obsidian-git, vault = repo | A, B, D, E, G, H, I rejected |
| **Future second admin surface** | ⏳ **C — Decap CMS deferred** (added later if Roman requests web editing; locks: `editorial_workflow: false`, `backend.branch: draft`) | — |
| **Image hosting** | ✅ **R2** — Cloudflare R2 with custom CDN domain | In-repo `public/` |
| **Edit cadence** | ✅ Several / month, daily early on | — |
| **Editorial workflow** | ✅ Trust-on-publish + `draft` branch for WIP | PR-per-edit |
| **`metadata.yml` overlay** | ✅ **Folded into MDX frontmatter** (Phase 8.3 one-shot merge; overlay deprecated) | Kept as escape hatch |
| **Cyrillic-only-Name orphans** | ✅ Manual audit included in Phase 8.5 | Deferred / skipped |
| **Roman onboarding** | ✅ Mini-guide `AUTHORING.ru.md` (Phase 8.4) | Synchronous screen-share |

`PLAN.md` status table gets a Phase 8 row pointing at §6 of this doc.

---

## 11. Image hosting (orthogonal sub-decision)

Where image bytes live is **independent** of the source-of-truth
choice. Today they live in `public/productions/<slug>/*.{webp,jpg}`,
committed to the repo.

### 11.1 — Stay in repo (simplest)

Keep `public/productions/`. Roman (or Decap, or Obsidian's drag-drop)
puts files there; they ship with the build.

| Pro                                                                               | Con                                                                               |
|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| Zero infra. Already works.                                                        | Repo size grows monotonically. Today: ~45 MB. At ~10×, clones get slow (~500 MB). |
| Atomic with the MDX that references them — git history pairs prose + photo edits. | Vercel build pulls and serves them; no CDN tuning.                                |
| Works offline (Obsidian vault carries the bytes).                                 | Same image referenced from multiple productions = duplicate copies.               |

### 11.2 — Cloudflare R2 with custom domain (recommended)

Bucket `boklanov-content`, custom domain `cdn.boklanov.com`,
public-read access. MDX references `cdn.boklanov.com/productions/<slug>/photo-1.webp`.

| Pro                                                                                    | Con                                                                          |
|----------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **Free tier: 10 GB storage, 1M Class A writes/mo, 10M Class B reads/mo, free egress.** | Cloudflare account becomes a dependency.                                     |
| Repo stays slim. Clones fast forever.                                                  | Image upload UX depends on the source-of-truth choice (see matrix below).    |
| Free egress is the killer feature: any traffic spike costs $0.                         | One more failure surface (DNS + R2 + CDN domain).                            |
| LQIPs / blurhashes still in repo; bytes on R2.                                         | Initial migration has to copy ~150 MB and rewrite all `<Image>` `src` paths. |
| S3-compatible API: rclone, Wrangler, AWS SDK all work.                                 | Custom domain SSL via Cloudflare is automatic but takes ~5 min to provision. |

### 11.3 — How R2 plugs into each source-of-truth option

| Option              | Image upload UX with R2                                                                                                                                                                                        |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **F (Obsidian)**    | Roman drags into the vault's `images-staging/` folder; an obsidian-git pre-commit hook (or post-commit GitHub Action) uploads to R2 and rewrites the MDX path. Or skip the hook and keep small images in repo. |
| **C (Decap)**       | Decap supports a custom media-library widget; configure for an S3-compatible endpoint (R2 honours S3 API). Or use the Cloudinary widget pointed at a free-tier Cloudinary account if simpler.                  |
| **I (Google Docs)** | Native fit. The GitHub Action already syncs Drive folder → R2 as part of the build pipeline (see §6C.2).                                                                                                       |

### 11.4 — Recommendation

**Adopt R2 as part of whichever source-of-truth migration ships,
not before.** Migrating image hosting in isolation is busywork; doing
it alongside the §6 cutover is a single clean diff. The 10 GB free
tier covers ~30× current photo volume; the migration is a one-time
script (`rclone sync public/productions/ r2://boklanov-content/productions/`)
plus a search-replace of `<Image>` `src` paths.

If we stay on status quo (A), keep images in repo. R2 is overhead
without the source-of-truth migration to pair with.

---

_Author: Claude Opus 4.7 (1M context)._
_Status: ✅ locked 2026-05-02 — F (Obsidian + obsidian-git) + R2._
_Next step: execute Phase 8 (`§6` of this doc, also tracked in
`PLAN.md` as Phase 8 — Authoring handoff)._
