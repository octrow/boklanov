# Keystatic Image Upload — Architecture & Setup

## Overall goal

From the Keystatic admin UI — both at
**https://boklanov.com/keystatic** and **http://localhost:3000/keystatic** —
the editor must be able to **add, update, and remove one or many photos**
on any content entry (productions, about, etc.).

A single editor save lands as **one commit on `main`** (the Keystatic
bot's YAML save). Image binaries reach git asynchronously via the
`backup-r2-to-git` workflow — see
[`KEYSTATIC_R2_ONLY_PLAN.md`](KEYSTATIC_R2_ONLY_PLAN.md) for the
rationale.

End-to-end, an image upload performs two synchronous steps:

1. **Upload to R2** at `<directory>/<filename>` so `cdnUrl()` (which
   prepends `NEXT_PUBLIC_CDN_BASE`) can serve the image immediately —
   both in the Keystatic preview thumbnail and on the live page, with
   no deploy wait.
2. **Link the path in YAML** — the editor's `ImagePathPreview` field
   stores the bare path (`/productions/cow-on-ice/foo.jpg`) into the
   entry's text field; Keystatic's normal Save persists the YAML
   change.

A backup workflow then runs (on every push to `content/**`, plus a
daily cron) and mirrors R2 ↔ `public/` in one batched
`chore(media): sync R2 → public/ (...)` commit: it both downloads any
new R2 objects and removes any `public/` files that no longer exist in
R2. This keeps git as eventual source of truth without forcing two
commits per save.

**Removing a photo** uses the `Remove` button next to `Upload image`
in the same field. One click `DELETE`s the binary from R2 (and from
disk in dev) and clears the field value; the editor then saves the
entry to commit the cleared YAML reference. The next backup-workflow
run sees the orphaned `public/` file and `git rm`s it, so removals
land in git the same way uploads do.

## TL;DR

The upload route at `app/api/keystatic-asset/route.ts` writes only to
R2 in production and to disk + R2 in dev. The
`backup-r2-to-git.yml` workflow brings binaries into git afterwards.
All required Vercel env vars (`R2_*`, `NEXT_PUBLIC_CDN_BASE`,
`GITHUB_TOKEN`) are set as of 2026-05-06.

The legacy `KEYSTATIC_STORAGE` / `KEYSTATIC_ENABLE` Vercel vars are not
referenced in the codebase and can be deleted to reduce clutter.

---

## How Keystatic Cloud saves YAML files

When the editor clicks "Save" in Keystatic:

```
Browser
  → POST /api/keystatic/[...params]   (session cookie from keystatic.cloud)
  → @keystatic/next route handler
  → Keystatic Cloud backend (keystatic.cloud)
  → GitHub App (installed on octrow/boklanov)
  → github.com API PUT /repos/octrow/boklanov/contents/…
  → commit appears as "Keystatic Cloud[bot]"
```

The GitHub App token lives entirely inside Keystatic Cloud's infrastructure.
Your server-side code never sees it. The `@keystatic/next` route handler
proxies the session and delegates all auth to the cloud service. There is
no hook point to inject custom file writes into this flow — which is
exactly why the binary write is decoupled from the save.

---

## Why `fields.image` alone doesn't solve it

Keystatic does have native image handling:

| Field                       | Where files land              | Status                    |
| --------------------------- | ----------------------------- | ------------------------- |
| `fields.image` (local mode) | `public/` on disk             | Works in dev only         |
| `fields.image` (cloud mode) | Keystatic Cloud Image Library | Paid add-on, experimental |
| `fields.cloudImage`         | Keystatic Cloud Image Library | Deprecated/experimental   |

The productions schema keeps images as `fields.text` (path strings) because:

- Editors need to paste an existing path without uploading (legacy R2-synced files)
- `fields.image` in cloud mode requires the Image Library, which is not enabled
- The custom `ImagePathPreview` component provides an equivalent UX with more control

---

## Upload flow

```
Editor clicks "Upload image" in Keystatic
  → POST /api/keystatic-asset  { file, directory }
  → app/api/keystatic-asset/route.ts

  ── Production (NODE_ENV=production) ──────────
  R2 upload only. 500 on failure.
  ┌─────────────────────────────────────────────┐
  │ R2 upload                                   │
  │   S3Client → boklanov-content R2 bucket     │
  │   Key: productions/cow-on-ice/foo.jpg       │
  │   Available immediately at:                 │
  │   pub-...r2.dev/productions/.../foo.jpg     │
  └─────────────────────────────────────────────┘

  ── Development (localhost) ───────────────────
  1. Write to public/<directory>/<filename> on disk (overwrite OK).
  2. Best-effort R2 upload using local R2_* env vars; skipped with
     an `r2Warning` if creds aren't set so dev still works offline.

  → Returns { src: "/productions/cow-on-ice/foo.jpg" }
  → ImagePathPreview sets the text field value
  → Editor saves YAML → Keystatic Cloud commits index.yaml on main
    (the only commit per save)

Asynchronously, after the YAML commit lands on main:
  → push to main paths: ['content/**'] triggers backup-r2-to-git.yml
  → workflow lists R2, filters allowlist (productions/, about/, uploads/
    + image extensions), downloads any objects missing under public/
  → batched chore(media): backup N upload(s) from R2 commit lands
  → Vercel rebuilds with the binary now in public/
```

The `src` path stored in YAML is always a bare path like
`/productions/cow-on-ice/foo.jpg`. At render time `cdnUrl()` in
`lib/cdn.ts` prepends `NEXT_PUBLIC_CDN_BASE` (the R2 public URL), so the
page loads the image from R2 even before the backup commit lands.

---

## Backup workflow

`.github/workflows/backup-r2-to-git.yml` keeps `public/` in sync with
R2 in both directions:

| Trigger                              | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `push` to `main`, paths `content/**` | Catches changes alongside YAML saves |
| `schedule: cron '0 3 * * *'`         | Daily safety net for stray uploads   |
| `workflow_dispatch`                  | Manual smoke runs                    |

The script `scripts/backup-r2-to-git.ts` allowlists prefixes
(`productions/`, `about/`, `uploads/`) and image extensions. For each
run it:

1. **Adds**: lists R2, downloads any allowlisted image not in `public/`.
2. **Removes**: walks `public/` under the allowlisted prefixes; any
   image file not present in R2 is `unlink`ed locally so the workflow's
   `git add -A public/` captures it as a deletion.

Anything else in R2 — runtime caches, debug dumps, etc. — is filtered
out and neither downloaded nor allowed to influence the deletion set.

A safety cap (`BACKUP_DELETE_LIMIT`, default 50) aborts the run if a
single invocation would delete more files than that. This prevents an
empty / mis-listed R2 bucket from silently wiping `public/`. Bump the
env var for one-off catch-up runs.

---

## Required Vercel environment variables

All required vars are set in Production + Preview as of 2026-05-06:

| Variable               | Status   | Notes                                                                |
| ---------------------- | -------- | -------------------------------------------------------------------- |
| `R2_ACCOUNT_ID`        | set      | Cloudflare account id                                                |
| `R2_ACCESS_KEY_ID`     | set      | R2 API token id                                                      |
| `R2_SECRET_ACCESS_KEY` | set      | R2 API token secret                                                  |
| `R2_BUCKET`            | optional | defaults to `boklanov-content`                                       |
| `NEXT_PUBLIC_CDN_BASE` | set      | R2 public URL, used by `cdnUrl()`                                    |
| `GITHUB_TOKEN`         | set      | kept for future / optional reuse only — the route no longer needs it |

The same `R2_*` vars are mirrored as GitHub Actions secrets so the
backup workflow can read R2.

Stale / orphaned (safe to delete from Vercel — not referenced in code):

- `KEYSTATIC_STORAGE`
- `KEYSTATIC_ENABLE`

### Creating the GitHub PAT (for reference / future rotation)

The route no longer needs `GITHUB_TOKEN` — kept around in case we
re-introduce a synchronous git write path. Steps to rotate:

1. GitHub → your profile → **Settings**
2. **Developer settings** → **Fine-grained personal access tokens** → **Generate new token**
3. Settings:
   - **Token name**: `boklanov-keystatic-uploads` (or similar)
   - **Expiration**: 1 year (set a calendar reminder to rotate)
   - **Repository access**: `Only select repositories` → `octrow/boklanov`
   - **Permissions** → Repository permissions → **Contents**: `Read and write`
4. Copy the token → Vercel **Project → Settings → Environment Variables** under `GITHUB_TOKEN`.
5. Redeploy (env-var changes don't auto-deploy).

---

## How commits appear in the repo

| Source        | Author                                   | When                              |
| ------------- | ---------------------------------------- | --------------------------------- |
| YAML save     | `keystatic-cloud[bot]`                   | On every editor Save              |
| Media backup  | `github-actions[bot]`                    | On `content/**` push + daily cron |
| Manual upload | The dev who runs `npm run upload-images` | Bulk legacy syncs                 |

---

## Relevant files

| File                                     | Role                                                               |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `app/api/keystatic-asset/route.ts`       | Upload handler — R2 only in prod, disk + R2 in dev                 |
| `app/keystatic/ImagePathPreview.tsx`     | Upload button + preview, CDN-aware `resolveSrc`                    |
| `lib/cdn.ts`                             | `cdnUrl()` — prepends `NEXT_PUBLIC_CDN_BASE` at render time        |
| `.github/workflows/backup-r2-to-git.yml` | R2 → `public/` mirror; push + daily cron                           |
| `scripts/backup-r2-to-git.ts`            | Allowlisted lister/downloader the workflow runs                    |
| `scripts/upload-images.ts`               | Manual `public/` → R2 bulk upload, kept for legacy / one-off syncs |
| `keystatic.config.ts`                    | `storage: cloud` in production, `local` in dev                     |
| `.env.example`                           | R2 and CDN env var documentation                                   |
