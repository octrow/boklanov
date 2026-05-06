# Keystatic Image Upload — Architecture & Setup

## TL;DR

Keystatic Cloud's GitHub App credentials are internal and unexposed. There
is no API to piggyback on them for custom binary uploads. The correct approach
is a fine-grained GitHub PAT stored in Vercel. The production upload route
already implements this; only the `GITHUB_TOKEN` env var is missing.

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

## Current production upload flow

```
Editor clicks "Upload image" in Keystatic
  → POST /api/keystatic-asset  { file, directory }
  → app/api/keystatic-asset/route.ts

  In PARALLEL:
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
  │    Commit: "chore(media): upload … via ks"  │
  └─────────────────────────────────────────────┘

  → Returns { src: "/productions/cow-on-ice/foo.jpg" }
  → ImagePathPreview sets the text field value
  → Editor saves YAML → Keystatic Cloud commits index.yaml
  → Vercel redeploys (both commits on main)
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

All four R2 vars are already set (confirmed working after credentials fix).
The only missing piece:

| Variable | Value | Where to create |
|----------|-------|-----------------|
| `GITHUB_TOKEN` | Fine-grained PAT | GitHub → Settings → Developer settings → Fine-grained personal access tokens |

### Creating the PAT

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
