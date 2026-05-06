# Keystatic media — R2-only single-commit plan

Goal: when an editor uploads an image and saves an entry through Keystatic,
the repo gets **one** commit on `main` (the bot's YAML save), not two.

Today there are two: the bot commits the YAML, our `/api/keystatic-asset`
route commits the binary to `public/` via the GitHub Contents API. The
two-commit pattern is documented in `.design/boklanov-rewrite/KEYSTATIC_IMAGE_UPLOAD.md`
("Upload flow" + "Why both R2 and GitHub?"). It's not a bug — it's the cost
of keeping git as a source of truth for media while delegating YAML save to
Keystatic Cloud's GitHub App.

This plan removes the binary write to git. R2 becomes the only canonical
store for editor-uploaded media. The Keystatic save flow then produces one
commit per save.

---

## Why this is the right move

- **Architecturally**: the only ways to get one commit are (a) move the
  binary out of git, or (b) take YAML save off Keystatic Cloud and write
  both files in one tree+commit via the GitHub Git Data API. (b) means
  writing a Keystatic storage adapter — substantial work and we lose the
  bot UI polish. (a) matches how every CMS-as-CDN works (Sanity, Contentful,
  Storyblok).
- **Operationally**: R2 free tier headroom is ~150–200× current usage
  (`docs/r2-operations.md` — Class A/B at 0.5–0.7% of free limits, storage
  at 234 MB of 10 GB). R2 durability is fine for a single-author site if
  we add a periodic backup.
- **Workflow**: the `chore(media): upload …` commits are already noise in
  `git log` — they don't carry useful context (the YAML reference is in
  the next commit). One-commit-per-save makes history readable.

---

## What stays, what changes, what goes away

### Stays

- `public/productions/**` and `public/about/**` files **already in git**.
  They are legacy uploads from before Keystatic Cloud — leaving them in
  git costs nothing and keeps the deploy artefact self-contained for
  rendering during edge cases (R2 outage, fresh clone before R2 sync).
  See "Open question 1" below if we want to pull them out later.
- `scripts/upload-images.ts` — manual one-off bulk uploads (legacy
  productions, batch poster swap). Still needed.
- `lib/cdn.ts` `cdnUrl()` — already serves everything via R2 via
  `NEXT_PUBLIC_CDN_BASE`. No change.
- `app/keystatic/ImagePathPreview.tsx` — preview from R2 already works
  via `cdnUrl()`. No change.
- The fine-grained `GITHUB_TOKEN` PAT in Vercel — leave it (might be
  reused later; deleting it is a one-line later step).

### Changes

- `app/api/keystatic-asset/route.ts`: drop the `commitToGitHub()` branch
  and the GitHub helper. Both dev and prod become "write to R2 only";
  dev additionally writes to `public/` on disk for offline preview.
- `.design/boklanov-rewrite/KEYSTATIC_IMAGE_UPLOAD.md`: rewrite the
  "Overall goal", "Upload flow", and "Why both R2 and GitHub?" sections.
  Goal becomes 2 steps (R2 + YAML link), not 3.

### Goes away

- `.github/workflows/sync-r2.yml` — its job was to sync `public/` → R2 on
  push. With editor uploads going straight to R2 and not landing in
  `public/`, that direction has nothing to do. It's replaced by a new
  workflow going the **opposite** direction (R2 → `public/` git backup,
  see "What we give up" §1 below). Keep `npm run upload-images` for
  manual bulk syncs of legacy `public/` content; that's separate.
- The "GitHub commit" branch in `KEYSTATIC_IMAGE_UPLOAD.md`'s flow diagram.

### Comes in

- `.github/workflows/backup-r2-to-git.yml` — scheduled (daily) and
  triggered on `push` to `content/**`. Lists R2, downloads any objects
  not yet present under `public/`, commits them in one batched
  `chore(media): backup N upload(s) from R2` commit. This re-establishes
  git as source of truth, just asynchronously and batched.

---

## File-by-file change list

| File                                                 | Change                                                                                                                                                                                                                                                                                                                                            | Notes                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `app/api/keystatic-asset/route.ts`                   | Remove `commitToGitHub()` and the prod parallel `Promise.allSettled`. Prod path becomes: R2 upload only. Dev path: disk + R2 (unchanged).                                                                                                                                                                                                         | Roughly halves the route's LOC.                                   |
| `.github/workflows/sync-r2.yml`                      | Delete.                                                                                                                                                                                                                                                                                                                                           | Replaced by the new R2 → git backup workflow.                     |
| `.github/workflows/backup-r2-to-git.yml`             | **New.** Lists R2 on `push` to `content/**` and on a daily cron, downloads new objects under `public/`, batches them into one `chore(media): backup N upload(s) from R2` commit. Uses `aws s3 sync` or a small TS reusing the `scripts/upload-images.ts` client.                                                                                  | The mechanism that re-establishes git as source of truth.         |
| `docs/r2-operations.md`                              | Replace `sync-r2.yml` subsection with a `backup-r2-to-git.yml` subsection. Note that Keystatic uploads go directly to R2 and are mirrored back into git on a schedule. Update "Class A monthly pace" estimate.                                                                                                                                    | Pricing tables stay.                                              |
| `.design/boklanov-rewrite/KEYSTATIC_IMAGE_UPLOAD.md` | Rewrite Overall goal (3 steps → 2), simplify the flow diagram (drop synchronous GitHub branch, add async R2 → git arrow), remove the GitHub PAT requirement from the env-var table (PAT may still be used by the backup workflow — check Q3), drop the "Why both R2 and GitHub?" section, add a "Backup" subsection pointing at the new workflow. | Largest doc edit.                                                 |
| `.design/boklanov-rewrite/MAP.md`                    | Add this plan to §1 active list as item 8. After execution, demote to archive once shipped.                                                                                                                                                                                                                                                       | §7 conventions require this in the same commit that adds the doc. |
| `.env.example`                                       | Keep `R2_*`, `NEXT_PUBLIC_CDN_BASE`, and `GITHUB_TOKEN` (PAT stays per Q3).                                                                                                                                                                                                                                                                       | No row removals expected.                                         |
| `keystatic.config.ts`                                | No change. Storage stays `cloud` in prod / `local` in dev.                                                                                                                                                                                                                                                                                        | Save flow itself isn't changing.                                  |

---

## What we give up — and the mitigations

### 1. Git is briefly out of sync with R2 (eventual consistency)

**Risk**: if R2 is wiped or credentials are lost between an editor
upload and the next backup run, fresh-uploaded images are unrecoverable.
The window is bounded by the backup cadence.

**Mitigation**: a new `.github/workflows/backup-r2-to-git.yml` workflow
that re-establishes git as source of truth on a schedule.

Shape:

- **Triggers**: `push` to `main` filtered to `content/**` (so every
  YAML save kicks a backup) **plus** `schedule: cron '0 3 * * *'` (daily
  at 03:00 UTC as a safety net for any uploads that didn't accompany a
  YAML save) **plus** `workflow_dispatch`.
- **Logic**: `aws s3 sync r2://boklanov-content public/` (or a small
  TS script reusing `scripts/upload-images.ts`'s S3 client). List R2,
  diff against working tree, download new objects into `public/`. If
  the working tree is clean after sync (no R2-only objects), exit. If
  there are new files, `git add public/` + `git commit -m "chore(media):
backup N upload(s) from R2"` + `git push`.
- **Auth**: uses the existing `GITHUB_TOKEN` PAT (kept per Q3) or the
  default `GITHUB_TOKEN` action token — pick whichever lets the commit
  bypass branch protection cleanly. Default action token is fine if main
  has no required-status-checks gate.
- **Concurrency**: `concurrency: { group: backup-r2, cancel-in-progress: false }`
  so two pushes in quick succession queue rather than race.
- **Cost** (per `docs/r2-operations.md`): 1 Class A `ListObjectsV2` per
  run + 0 ops on no-op runs. Daily + push-triggered ≈ 50–100 Class A
  ops/month, ≪ 1 % of the 1 M free tier.

Net effect on history: instead of two commits per save (today), there's
one save commit immediately and one batched backup commit shortly after.
If the editor saves multiple entries with new uploads close together,
the backup commit batches them into one.

### 2. Fresh clones can't preview the very newest productions without R2

**Risk**: `git clone` + `npm run dev` won't show images uploaded in the
window between the last backup-r2-to-git run and clone time.

**Mitigation**: small. The backup-r2-to-git workflow runs on every
content push, so the window is minutes, not hours. For dev offline
without R2 the legacy `public/productions/**` files (kept per Q1) cover
everything except the most recently uploaded media, and `cdnUrl()` +
`NEXT_PUBLIC_CDN_BASE` already handle the missing-binary case at render
time.

### 3. `chore(media): …` commits stop being a deploy trigger

**Risk**: today, commits to `public/productions/**` trigger a Vercel
build (deploy includes the new binary). With binaries skipping git, a
new image won't trigger a redeploy by itself. The YAML save still
triggers a build (Keystatic bot commits to `content/`), and Next.js
renders from R2 at request time anyway, so the binary is reachable
without a redeploy. **Net effect: none** — the build was redundant.

---

## Migration steps

In this order so each step is independently sane (each one its own commit
so partial revert is easy):

1. **Add `.github/workflows/backup-r2-to-git.yml`** with `workflow_dispatch`
   only — no schedule, no push trigger yet. Trigger it manually once and
   verify it produces a sane "no-op" run on a clean tree. This is the
   safety net before step 2.
2. **Rewrite `app/api/keystatic-asset/route.ts`** — strip the GitHub
   commit branch, keep R2 upload, keep dev disk write. Verify on
   localhost:
   - upload a new image → file appears on R2 (check `aws s3 ls` or
     Cloudflare dashboard);
   - file appears in `public/<dir>/<name>` locally (dev only);
   - editor preview thumbnail loads.
3. **Deploy to Vercel**, upload an image through `boklanov.com/keystatic`,
   verify only the bot's YAML commit lands on `main` (no parallel
   `chore(media)` commit), and the live page renders the image.
4. **Trigger `backup-r2-to-git.yml` manually**. It should detect the new
   R2 object from step 3, download it into `public/`, and create one
   `chore(media): backup 1 upload from R2` commit. Verify the live page
   still renders unchanged after the backup commit deploys.
5. **Enable `push: branches: [main]` (paths: `content/**`) and the daily
cron** on `backup-r2-to-git.yml`. From now on, every editor save
   that introduces new media triggers the backup automatically.
6. **Delete `.github/workflows/sync-r2.yml`**.
7. **Update docs**: `KEYSTATIC_IMAGE_UPLOAD.md` + `docs/r2-operations.md`
   - `MAP.md` per the file-by-file table.

`GITHUB_TOKEN` PAT stays (Q3) — if the backup workflow ends up using it,
that's an extra reason to keep it.

---

## Rollback

If R2-only turns out to be insufficient (durability concern, save-flow
regression, etc.):

1. Restore `app/api/keystatic-asset/route.ts` from git
   (commit-before-step-2). The synchronous GitHub commit branch comes
   back.
2. Restore `sync-r2.yml`.
3. `GITHUB_TOKEN` PAT was kept — no re-issuing needed (Q3).

The `backup-r2-to-git.yml` workflow stays regardless. It's the same
mechanism the R2-only model relies on, and it's harmless under the
dual-write model (it would just always be a no-op, since git already
has every R2 object).

---

## Decisions (resolved 2026-05-06)

1. **Q1 — Legacy `public/productions/**`and`public/about/**`**: keep
   in git as legacy / backup. The new `backup-r2-to-git.yml` will only
   ever add to this directory tree, never remove from it.
2. **Q2 — Backup mechanism**: scheduled R2 → `public/` git workflow,
   commits land in this repo (not a second R2 bucket). This re-establishes
   git as eventual source of truth and keeps the deploy artefact
   self-contained. Specified in §"What we give up" above.
3. **Q3 — `GITHUB_TOKEN` PAT**: keep. Don't revoke now. Defer cleanup
   for a later session if the backup workflow ends up not needing it.

## Still open

- **Backup commit attribution**: should `backup-r2-to-git.yml` commit as
  `github-actions[bot]` (default action token) or as the PAT owner
  (Daniil)? Bot is cleaner-looking in `git log`; PAT bypasses any future
  branch protection. Default to bot; revisit if branch protection lands.
- **Daily cron time**: 03:00 UTC suggested above. Adjust if it overlaps
  with usual editing hours (avoids racing with `push`-triggered runs).
- **PR-preview deploys uploading to a separate R2 prefix?** Out of
  scope here — flag if previews ever land.

---

## Cross-references

- Two-commit problem origin: `KEYSTATIC_IMAGE_UPLOAD.md` "Upload flow"
- R2 cost model: `docs/r2-operations.md`
- Manual bulk uploader (kept): `scripts/upload-images.ts`
- Legacy sync workflow (deleted): `.github/workflows/sync-r2.yml`
- Doc-management conventions: `.design/boklanov-rewrite/MAP.md` §6, §7
- Render-time R2 URL composition: `lib/cdn.ts`
