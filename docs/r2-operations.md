# Cloudflare R2 — Operations & Pricing Reference

## Free tier limits (monthly)

| Metric             | Free limit         |
| ------------------ | ------------------ |
| Storage            | 10 GB-month        |
| Class A operations | 1,000,000 / month  |
| Class B operations | 10,000,000 / month |
| Egress             | Free               |

Paid rates (if exceeded): Class A $4.50 / million · Class B $0.36 / million · Storage $0.015 / GB-month.

## What counts as what

**Class A** (write / mutate state — more expensive):

- `ListObjectsV2`, `PutObject`, `CopyObject`, `CreateMultipartUpload`, `CompleteMultipartUpload`

**Class B** (read existing state — cheaper):

- `HeadObject`, `GetObject`, `HeadBucket`, `GetBucketLocation`

**Free** (no charge):

- `DeleteObject`, `DeleteBucket`, `AbortMultipartUpload`

## Where our operations come from

### `scripts/upload-images.ts` (manual runs)

| Operation                 | API call                    | Class | Count per run    |
| ------------------------- | --------------------------- | ----- | ---------------- |
| Fetch existing keys+sizes | `ListObjectsV2` (paginated) | A     | 1                |
| Upload new/changed file   | `PutObject`                 | A     | N new files only |

Before the May 2026 refactor the script called `HeadObjectCommand` per file (315 files → 315 Class B per run). Now it does one `ListObjectsV2` (Class A) and compares locally.

### `.github/workflows/backup-r2-to-git.yml` (runs on push to `main` paths `content/**`, daily cron 03:00 UTC, or manual dispatch)

Mirrors R2 → `public/` so git stays the eventual source of truth for
editor-uploaded media. Replaces the older `sync-r2.yml` (which went
the opposite direction; deleted after the R2-only migration — see
[`KEYSTATIC_R2_ONLY_PLAN.md`](../.design/boklanov-rewrite/KEYSTATIC_R2_ONLY_PLAN.md)).

| Operation                 | API call        | Class | Count per run    |
| ------------------------- | --------------- | ----- | ---------------- |
| List bucket for diff      | `ListObjectsV2` | A     | 1                |
| Download new/changed file | `GetObject`     | B     | N new files only |

The script (`scripts/backup-r2-to-git.ts`) allowlists prefixes
(`productions/`, `about/`, `uploads/`) plus image extensions before
downloading, so non-media R2 objects don't churn through Class B
operations or land in `public/`.

### `app/api/keystatic-asset/route.ts` (Keystatic editor upload, fires per editor click)

| Operation       | API call    | Class | Count per upload |
| --------------- | ----------- | ----- | ---------------- |
| Upload new file | `PutObject` | A     | 1                |

### Site visitors (images served via `r2.dev` public URL through Cloudflare CDN)

Each unique image is fetched from R2 once per Cloudflare edge PoP on the first cache miss (`GetObject` = Class B). Subsequent requests from the same PoP are served from CDN cache (`Cache-Control: public, max-age=31536000, immutable`) and do not hit R2.

## Observed usage — May 1–5 2026

|                         | Class A   | Class B    |
| ----------------------- | --------- | ---------- |
| 5-day total             | 1,140     | 7,780      |
| Monthly pace (×6)       | ~6,800    | ~46,700    |
| Free limit              | 1,000,000 | 10,000,000 |
| **% of free tier used** | **0.68%** | **0.47%**  |

Primary sources:

- **Class B**: `upload-images.ts` called ~24 times during active development (315 HeadObject × 24 = ~7,560). Fixed by the ListObjectsV2 refactor.
- **Class A**: 17 push-triggered workflow runs (one-poster-per-commit pattern) × ~2 ListObjectsV2 each + PutObject for new files.

Pace estimate after the R2-only migration (2026-05-06):

- **Class A**: 1 ListObjectsV2 per `backup-r2-to-git` run + 1 PutObject per editor upload. Push-triggered backup ≈ N runs/month following editor saves (likely ≤ 30); daily cron adds ~30 runs/month. Editor uploads ≈ ≤ 30 PutObjects/month. Total ≈ 60–100 Class A/month.
- **Class B**: 1 GetObject per new file per backup run. With one or two new uploads per backup-triggering save, ≪ 100/month.

Both well under 1 % of the free tier.

## Staying within the free tier

Current usage is ~150–200× below the free limits. To stay there:

1. **Batch poster/image commits** — one commit per production instead of one per file. Fewer workflow triggers = fewer `ListObjectsV2` calls.
2. **Don't run `upload-images.ts` repeatedly** for unchanged files — the script now costs 1 Class A op regardless of file count, so running it often is cheap but unnecessary.
3. **Watch storage** — the meaningful limit to watch is the 10 GB storage cap. At 234 MB current usage you have room for ~43× growth before hitting it.

## Checking current usage

Cloudflare dashboard → R2 → Overview → Usage tab.  
Account ID: `534e18f36968949bf03935b0d40b0216`
