# Keystatic Image Upload — Architecture & Setup

## Overall goal

From the Keystatic admin UI — both at
**https://boklanov.com/keystatic** and **http://localhost:3000/keystatic** —
the editor must be able to **add, update, and remove one or many photos**
on any content entry (productions, about, etc.).

A single upload action performs three things end-to-end:

1. **Add the file to `public/<directory>/<filename>`**
   - Dev: written directly to disk so Next.js serves it locally.
   - Prod: committed to GitHub via the Contents API so it lands in
     `public/` on the next deploy and exists in git as source of truth.
2. **Link the path in YAML** — the editor's `ImagePathPreview` field stores
   the bare path (`/productions/cow-on-ice/foo.jpg`) into the entry's text
   field; Keystatic's normal Save persists the YAML change.
3. **Upload the file to R2** at the same key
   (`<directory>/<filename>`), so `cdnUrl()` (which prepends
   `NEXT_PUBLIC_CDN_BASE`) can serve the image immediately in both the
   Keystatic preview thumbnail and the live page — no deploy wait.

Removal is handled by deleting/clearing the YAML reference; orphaned files
in R2 / `public/` are cleaned up out-of-band (sync-r2 keeps R2 aligned
with `public/` on push).

## TL;DR

The upload route at `app/api/keystatic-asset/route.ts` is the single
endpoint that fans out the file to disk/GitHub + R2. All required Vercel
env vars (`R2_*`, `GITHUB_TOKEN`, `NEXT_PUBLIC_CDN_BASE`) are now set, so
both environments perform the full goal above.

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
no hook point to inject custom file writes into this flow.

**Conclusion: the Keystatic bot cannot be reused for arbitrary file commits.**

---

## Why `fields.image` alone doesn't solve it

Keystatic does have native image handling:

| Field | Where files land | Status |
|-------|-----------------|--------|
| `fields.image` (local mode) | `public/` on disk | Works in dev only |
| `fields.image` (cloud mode) | Keystatic Cloud Image Library | Paid add-on, experimental |
| `fields.cloudImage` | Keystatic Cloud Image Library | Deprecated/experimental |

The productions schema keeps images as `fields.text` (path strings) because:
- Editors need to paste an existing path without uploading (legacy R2-synced files)
- `fields.image` in cloud mode requires the Image Library, which is not enabled
- The custom `ImagePathPreview` component provides an equivalent UX with more control

---

## Upload flow (unified across dev + prod)

```
Editor clicks "Upload image" in Keystatic
  → POST /api/keystatic-asset  { file, directory }
  → app/api/keystatic-asset/route.ts

  ── Production (NODE_ENV=production) ──────────
  In PARALLEL (both required, 500 on any failure):
  ┌─────────────────────────────────────────────┐
  │ 1. R2 upload                                │
  │    S3Client → boklanov-content R2 bucket    │
  │    Key: productions/cow-on-ice/foo.jpg      │
  │    Available immediately at:                │
  │    pub-...r2.dev/productions/.../foo.jpg    │
  └─────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────┐
  │ 2. GitHub commit                            │
  │    PUT /repos/octrow/boklanov/contents/     │
  │       public/productions/cow-on-ice/foo.jpg │
  │    Auth: GITHUB_TOKEN (fine-grained PAT)    │
  │    Overwrites existing files (uses sha)     │
  │    Commit: "chore(media): upload … via ks"  │
  └─────────────────────────────────────────────┘

  ── Development (localhost) ───────────────────
  1. Write to public/<directory>/<filename> on disk (overwrite OK).
  2. Best-effort R2 upload using local R2_* env vars; skipped with
     a warning if creds aren't set so dev still works offline.

  → Returns { src: "/productions/cow-on-ice/foo.jpg" }
  → ImagePathPreview sets the text field value
  → Editor saves YAML → Keystatic Cloud commits index.yaml
  → Vercel redeploys (both commits on main in prod)
  → sync-r2.yml GitHub Action re-syncs public/ → R2 (idempotent)
```

The `src` path stored in YAML is always a bare path like
`/productions/cow-on-ice/foo.jpg`. At render time `cdnUrl()` in
`lib/cdn.ts` prepends `NEXT_PUBLIC_CDN_BASE` (the R2 public URL), so the
page loads the image from R2.

---

## Why both R2 and GitHub?

| Destination | Benefit |
|-------------|---------|
| R2 (immediate) | Preview thumbnail in Keystatic works right away — `NEXT_PUBLIC_CDN_BASE` is set to the R2 public URL, so `resolveSrc()` in `ImagePathPreview` can show the image before any deploy |
| GitHub (commit) | File is in the repo as source of truth; included in every future clone, deploy, and the `sync-r2.yml` re-sync |

If only R2 → image is invisible on a fresh clone / local dev; not in git.  
If only GitHub → image isn't on R2 yet; preview blank until sync-r2 runs after the deploy.

---

## Required Vercel environment variables

All required vars are set in Production + Preview as of 2026-05-06:

| Variable | Status | Notes |
|----------|--------|-------|
| `R2_ACCOUNT_ID` | set | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | set | R2 API token id |
| `R2_SECRET_ACCESS_KEY` | set | R2 API token secret |
| `R2_BUCKET` | optional | defaults to `boklanov-content` |
| `NEXT_PUBLIC_CDN_BASE` | set | R2 public URL, used by `cdnUrl()` |
| `GITHUB_TOKEN` | set | fine-grained PAT, Contents: read+write on `octrow/boklanov` |

Stale / orphaned (safe to delete from Vercel — not referenced in code):

- `KEYSTATIC_STORAGE`
- `KEYSTATIC_ENABLE`

### Creating the GitHub PAT (for reference / future rotation)

1. GitHub → your profile → **Settings**
2. **Developer settings** → **Fine-grained personal access tokens** → **Generate new token**
3. Settings:
   - **Token name**: `boklanov-keystatic-uploads` (or similar)
   - **Expiration**: 1 year (set a calendar reminder to rotate)
   - **Repository access**: `Only select repositories` → `octrow/boklanov`
   - **Permissions** → Repository permissions → **Contents**: `Read and write`
4. Copy the token → Vercel **Project → Settings → Environment Variables**:
   - Name: `GITHUB_TOKEN`
   - Value: paste token (no quotes)
   - Environment: ✓ **Production** (+ Preview if you want it there too)
5. Redeploy (env-var changes don't auto-deploy).

Optional: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` default to
`octrow`, `boklanov`, `main` — only override if the repo moves.

---

## How commits appear in the repo

With the PAT approach, commits appear under the PAT owner's GitHub account
(Daniil), not as the Keystatic bot. If you want a dedicated bot identity:

1. Create a GitHub machine-user account (e.g. `boklanov-bot`)
2. Add it as a collaborator on the repo with Write access
3. Generate the PAT under that account
4. Use those credentials for `GITHUB_TOKEN`

Commits will then appear as `boklanov-bot` — visually identical to the
Keystatic Cloud bot pattern.

---

## Relevant files

| File | Role |
|------|------|
| `app/api/keystatic-asset/route.ts` | Upload handler — R2 + GitHub in parallel |
| `app/keystatic/ImagePathPreview.tsx` | Upload button + preview, CDN-aware `resolveSrc` |
| `lib/cdn.ts` | `cdnUrl()` — prepends `NEXT_PUBLIC_CDN_BASE` at render time |
| `.github/workflows/sync-r2.yml` | Syncs `public/productions/**` + `public/about/**` → R2 on push |
| `keystatic.config.ts` | `storage: cloud` in production, `local` in dev |
| `.env.example` | R2 and CDN env var documentation |
