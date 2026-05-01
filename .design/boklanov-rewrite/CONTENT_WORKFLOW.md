# Content workflow — audit + research + recommendation

> Companion to `DESIGN_BRIEF.md` D3 ("Content source"), `PLAN.md`
> Phase 3, and `content/README.md`. **Status: research, not locked.**
> Open for discussion before any change to Phase 7 deploy plan.
> Date: 2026-05-02.

The site is shipping. Now Roman wants a process for adding new shows,
correcting facts, and swapping photos that doesn't depend on Daniil
running `npm run sync` on his laptop. This doc audits what we have,
surveys options, and recommends a direction.

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

| # | Pain | Where it bites |
|---|------|----------------|
| P1 | **Notion export is whole-database, every time.** 250 MB / 419 images / 89 records redeposited even for a single-field correction. | Roman: Notion's bulk-export UI is slow. Daniil: re-running sync re-copies all images, re-encodes LQIPs, re-emits all MDX. |
| P2 | **Notion export format drifts.** Q1 surfaced 6 navigation/role/festival pages exported as `Public=Yes` rows. Q2 surfaced Cyrillic-only-Name rows whose `Slug` column was empty. Each export drift requires a sync-script change. | Daniil: invisible failure mode. Bogus or mis-paired records ship without warning unless someone manually browses `/productions`. |
| P3 | **Heuristic extraction is fragile.** Q3, Q4, Q8 all fixed extractors — synopsis, awards, theatre, credits, premiere date. Each pattern has a ~95% hit rate; the remaining 5% needs a `metadata.yml` overlay. | Roman: never sees the wrong data; Daniil has to spot it. |
| P4 | **Two-source-of-truth tension.** Notion is editorial; `metadata.yml` is the override for things the sync gets wrong. Roman doesn't know which file owns which field. | Cognitive overhead: who do I tell to fix the wrong year — Notion, or the file in the repo? |
| P5 | **No preview before deploy.** Roman edits in Notion, but doesn't see the rendered site until after Daniil syncs + pushes. | Iterations require pings to Daniil; corrections to typos / image picks accumulate. |
| P6 | **Daniil is in the loop for every change.** Vacation, sleep, time-zone gap = stale site. | Single point of failure. |
| P7 | **Image management is opaque.** Photos live in Notion; the export pulls them by Notion-relative path. Adding new photos means uploading to Notion first, then re-exporting the whole DB. | Roman uploads to Notion → waits → asks Daniil to sync. |
| P8 | **Notion's CSV column shape is brittle.** `Slug`, `Public`, `Featured`, `Tags` are columns Roman maintains by hand. Forgetting `Public=Yes` hides a production silently. | Same family as P2. |

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

| Pro | Con |
|-----|-----|
| Zero migration cost | Daniil-in-the-loop forever (P6) |
| Roman likes Notion's editor | No preview before deploy (P5) |
| Cyrillic + multilingual already works | Heuristics keep accumulating (P3) |
| Free | Whole-DB re-export friction (P1) |

**When this is right:** if Roman edits ≤ once a quarter and tolerates
the round trip. Today's volume is roughly that.

### 3.B — Drop Notion, edit MDX + metadata.yml directly in GitHub

Roman gets a GitHub account, edits files via the GitHub web UI (or
locally if he wants). Photos uploaded via drag-and-drop in the GitHub
file editor. Sync script retired.

| Pro | Con |
|-----|-----|
| Single source of truth (P4 fixed) | Roman writes YAML / MDX (steep) |
| Diff-reviewable (P5 partially: PR previews via Vercel) | No editorial UI; raw fields |
| No vendor lock-in beyond Git | Image upload via GitHub UI is clunky |
| Free | Cyrillic in YAML keys works, but field names like `ageRating: "6+"` are coder-flavored |

**When this is right:** if Roman is willing to learn ~5 YAML
conventions and read PR previews. Most directors are not.

### 3.C — Decap CMS (formerly Netlify CMS)

Open-source, git-backed CMS that overlays a web UI on the existing
repo. Roman logs in via GitHub OAuth at e.g.
`boklanov.com/admin/`, sees a form for each field defined in a
`config.yml`, edits, and clicks Publish — Decap commits the changes
to a branch (or main) on his behalf. No backend, no DB; everything
goes through git.

| Pro | Con |
|-----|-----|
| Web UI for Roman (P6 fixed, P1/P5 fixed) | Decap is on maintenance mode (active fork: `decap-cms`); ~stable but not feature-rich |
| Git-backed → existing CI/Vercel build flow unchanged | Cyrillic in field labels works; file paths must be ASCII (we already are) |
| Self-hostable, no vendor invoice | OAuth setup required (GitHub OAuth app) |
| Field-level validation, image upload widget | Heavier setup than 3.B; more pieces to learn |
| Multilingual via per-locale collections | Editorial workflow (draft/review) is opt-in but adds friction |
| Roman writes prose without YAML | UI styling is generic; doesn't match the editorial site itself |

**When this is right:** Roman edits monthly+, wants a web UI, accepts
generic admin chrome. **This is the option closest to the original
brief intent** — content stays in repo, single source of truth, but
Roman doesn't touch raw files.

### 3.D — TinaCMS

Commercial Git-backed CMS with **inline visual editing**: Roman opens
the production page on a staging URL, clicks the synopsis, edits in
place, saves — Tina commits to the branch. Visual feedback is live.

| Pro | Con |
|-----|-----|
| Best-in-class editing UX — visual + git-native | Hosted Tina Cloud has a paid tier (~$29/mo Team) for non-trivial use; self-host possible but more setup |
| Single source of truth in MDX | Tina Cloud account = vendor footprint |
| Preview is the editor (P5 fully fixed) | TinaCMS schema needs to be defined and maintained alongside the MDX shape |
| Multilingual works | More complex than Decap to set up correctly |
| Active development | Inline editing for non-React content (gallery image-uploads, etc.) takes more wiring |

**When this is right:** Roman edits weekly+, demands a polished
editing experience, the budget allows ~$29/mo (or self-hosting effort).

### 3.E — Sanity (or other headless CMS)

Sanity Studio = separate React app (lives at `studio.boklanov.com`),
edits stored in Sanity's hosted DB, content fetched at build time
from Sanity's GraphQL/Groq API → MDX is no longer the source of
truth; Sanity is.

| Pro | Con |
|-----|-----|
| Best editing experience for structured content | **Vendor lock-in** — content lives in Sanity's DB |
| Real-time collab, draft-vs-published, history | Adds runtime fetch step (or a sync-from-sanity script — same shape as today!) |
| Strong i18n primitives | Free tier limits (3 users, 10k docs) probably enough; paid tier ~$99/mo+ |
| Image CDN included | Migration cost: rewrite content model; teach Roman a new tool |

**When this is right:** if the team grows or Roman wants a designer
mode for layout. **Overkill** for the current scope (one author,
30 productions).

---

## 4. Comparison matrix

| Axis | A. Notion+sync | B. GitHub direct | C. Decap | D. Tina | E. Sanity |
|------|----------------|------------------|----------|---------|-----------|
| Roman friction | medium (Notion ✓, but full export every time) | high (raw YAML) | low (web form UI) | very low (visual) | low (separate app) |
| Daniil friction | high (in-loop) | low | low (config once) | low–med (schema) | medium (model migration) |
| Vendor lock-in | none | none | none | Tina Cloud (or self-host) | Sanity |
| Cost / month | $0 | $0 | $0 | $0–$29 | $0–$99 |
| Preview before publish | no | PR preview | branch preview | live inline | hosted preview |
| Single source of truth | no (P4) | yes | yes | yes | yes (in Sanity) |
| Cyrillic + Latin | yes | yes | yes | yes | yes |
| Image upload UX | re-export DB | drag-into-GitHub | upload widget | upload widget | hosted CDN |
| Build flow change | none | none | none (writes to git) | none (writes to git) | add fetch step |
| Static site stays static | yes | yes | yes | yes | yes (with build trigger) |
| Migration effort | 0 | very low | low (1–2 days) | medium (3–5 days) | high (1–2 weeks) |

---

## 5. Recommendation

**Move to Decap CMS (option C).** Rationale:

- It maps to the brief intent: content stays in the repo, one source
  of truth, Roman edits without Daniil.
- It's free, open-source, no vendor lock-in.
- The migration is 1–2 days: define the collections matching the
  current frontmatter shape, point Decap at `content/productions/`,
  add an OAuth proxy.
- It eliminates the Notion-export round trip (P1, P5, P6, P7).
- It keeps the heuristic-extraction work we just did (Q1–Q8) **as a
  one-time historical import** — sync runs once to seed the repo,
  then never again. From that point Roman edits structured fields
  directly in Decap; no more heuristics drift (P2, P3).
- It preserves `metadata.yml` overlay as a power-user escape hatch
  for any field Decap's UI doesn't yet expose.

**TinaCMS (D)** is the runner-up if Roman demands inline visual
editing and the team takes the ~$29/mo cost. Reach for it only if
Decap proves too rough on the eyes — Decap's admin chrome is generic
and doesn't match the editorial register of the public site.

**Status quo (A)** stays viable if Roman edits ≤ quarterly. Today's
volume isn't above that line yet.

---

## 6. Decap migration plan (if approved)

> This is what Phase 8 would look like. Not started; not committed.

### Phase 8.1 — Decap setup (½ day)

- `npm install decap-cms-app netlify-cms-proxy-server`
  (or use Decap's CDN script directly — no build dependency).
- Add `public/admin/index.html` + `public/admin/config.yml`.
- Configure GitHub OAuth via [decaporg/decap-server](https://github.com/decaporg/decap-server)
  on a tiny VPS or use a serverless OAuth proxy on Vercel.
- Define the production collection in `config.yml` mapping 1:1 to
  the frontmatter shape from `content/README.md`. Cyrillic field
  labels.

### Phase 8.2 — Roman onboarding (½ day)

- Daniil + Roman screen-share. Walk through:
  edit a production → preview on a branch → publish.
- Document the workflow in `content/AUTHORING.md` (replaces the
  Notion-centric steps in the current `content/README.md`).

### Phase 8.3 — Retire the sync pipeline (½ day)

- Move `scripts/sync-from-notion.ts` → `scripts/_legacy/sync-from-notion.ts`
  with a top-level comment: "imported once 2026-05-02; do not re-run".
- Move `notion-data/` to a separate archive branch
  (`archive/notion-export-2026-05`) — keep accessible, drop from
  main to free 250 MB.
- Update `package.json`: `npm run sync` → `echo "sync retired; edit
  via /admin or content/productions/* directly"`.

### Phase 8.4 — Cyrillic-only-Name orphan check (½ day)

- Manually audit `Сахарный ребёнок` / `Каштанка` and any other
  productions whose RU title was synthesized via
  `MANUAL_SIBLING_PAIRS`. Confirm Roman is happy with the data Decap
  will surface for editing.

### Phase 8.5 — Deploy + cutover (½ day)

- Roman tests the admin on a Vercel preview branch.
- Production deploy.
- Daniil drops out of the loop.

**Total: ~2.5 working days.** Same magnitude as Phase 5.

---

## 7. Risks if we move

| Risk | Mitigation |
|------|------------|
| Decap goes unmaintained — fork or alternative? | Self-hosted, git-backed: worst case we drop the UI and Roman edits via GitHub web UI (option B). Migration cost = 0. |
| OAuth proxy outage blocks Roman from editing | Same fallback. Plus `content/` lives in repo; Roman can also edit via GitHub web UI directly. |
| Roman accidentally publishes broken content | Branch-based editorial workflow in Decap (`editorial_workflow: true`) — every edit becomes a PR. Daniil reviews before merge. Costs a click per edit; pays back in safety. |
| Image upload fills the repo / inflates clones | Decap can upload to a CDN (Cloudinary free tier or Vercel Blob) instead of `public/`. Configurable. Recommended: stay in `public/` for v1; revisit if photos exceed ~500 MB. |
| Cyrillic slugs in Decap auto-generate ASCII slugs that don't match existing | Decap supports custom slug functions; we already transliterate. Wire in a slug field that accepts manual override. |

---

## 8. Open questions for Roman

Before we commit:

- Do you want a web UI to edit the site, or is "tell Daniil what to
  change" working for you?
- How often do you expect to edit? Once a month, once a week?
- Do you want to write a synopsis on the train (mobile)? Decap and
  Tina both render usably on mobile; raw GitHub editing does not.
- Do you want to be able to *preview* a production before publishing
  it? (This rules out option A.)
- Are you OK using your GitHub account as the login? (Required for
  C and D; Sanity uses its own account.)

---

## 9. Open questions for Daniil

- Are you OK with adding an OAuth proxy as the only ongoing infra
  cost (negligible — single-digit dollar VPS or a free Vercel
  serverless function)?
- Are you OK retiring `scripts/sync-from-notion.ts` and the
  `notion-data/` import folder? Both have served their purpose.
- Do you want to keep `metadata.yml` overlay as a power-user escape
  hatch, or fold its fields into Decap's main schema?
- Do you want the editorial workflow (every edit is a PR you
  approve), or trust-on-publish (Roman edits go live)?

---

## 10. Decision checkpoint

- ❓ Roman + Daniil pick A vs C vs D from §3.
- ❓ If C/D: confirm the questions in §8 / §9.
- ❓ If A (status quo): close this doc; revisit at next pain point.

Once decided, this doc gets a "Status: locked / chose option X /
date" header and the `PLAN.md` status table gets a Phase 8 row.

---

_Author: Claude Opus 4.7 (1M context). Status: research / discussion._
_If you've read this far and want to act on it, the next step is a
~30-minute call between Roman and Daniil to pick a direction._
