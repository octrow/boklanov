# Image upload standard — Pipeline A is canonical

Status: **implemented 2026-05-14**. `lib/image-variants.ts` is the single source of truth for the variant matrix, naming, encode, and bake/delete operations. The bulk script and the `/api/r2-asset` route both call it. Endpoint was renamed from `/api/keystatic-asset` once Payload became the canonical CMS in this branch.

Pairs with [`PAYLOAD_IMAGE_VARIANTS_PLAN.md`](./PAYLOAD_IMAGE_VARIANTS_PLAN.md) (the underlying variant scheme) and [`KEYSTATIC_IMAGE_UPLOAD.md`](./KEYSTATIC_IMAGE_UPLOAD.md) (the existing R2 upload endpoint inherited from the Keystatic era and now reused by the Payload admin).

## TL;DR

- **Production posters, gallery, productionsPhoto, featuredPhoto stay as raw R2 path strings forever.** `Productions.media.*.src` remains a plain text field — never a Media relation.
- **Variants live alongside the source in R2.** Naming `<basename>.<W>.avif` (period-separated). Five widths: 420 / 600 / 720 / 828 / 1080. The 720w slot was added 2026-05-17 (`e8049cd`) to fit Moto G Power's 412 vw × DPR 1.75 ≈ 721 px ideal — without it the browser was falling up to 828w and Lighthouse counted ~25 % of bytes as "wasted".
- **Two pipelines coexist, with clear lanes**:
  - **Pipeline A — path strings + raw R2** is the standard for all public-site media.
  - **Pipeline B — Payload `Media` collection uploads** is a fallback for non-public/admin-only media (currently just `about.visuals.portrait`). Already wired with `imageSizes` in `collections/Media.ts`.
- **The one improvement worth making**: bake the five AVIFs inline inside `/api/r2-asset` so admin uploads don't depend on a human remembering `npm run bake-variants` afterwards.

## Why Pipeline A is non-negotiable for production media

- Editorial workflow today is "type a path" or "click Upload in `ImagePathPreview`". 100% of existing productions reference R2 paths this way. Migrating ~50 productions × N images to Media relations is pure churn with no user-facing benefit.
- Path strings are CMS-agnostic. If Payload is ever swapped, the site still works as long as R2 stays at `cdn.boklanov.com/productions/<slug>/...`.
- No DB row per image, no Payload-generated UUIDs in filenames, no opaque Media IDs in page params. Stable URLs forever.
- The `/api/r2-asset` endpoint (`app/api/r2-asset/route.ts`, formerly `/api/keystatic-asset`) already implements raw R2 PUT with content-type detection, path sanitisation, ALLOWED_EXT validation, and 25 MB limit. It's battle-tested.

## Why Pipeline B stays in place (as a safety net)

- Drag-and-drop UX matters for one-off admin uploads where a non-technical editor isn't going to remember the path-string ritual.
- Currently the only Media-relation field is `about.visuals.portrait`. If we ever add more (e.g. a press-kit downloads field, marketing graphics) they'll hit Pipeline B automatically.
- The `imageSizes` config in `collections/Media.ts` (Track 1 of `PAYLOAD_IMAGE_VARIANTS_PLAN.md`) is already correct. Payload + sharp produces the same five widths, just under its own hyphen-naming (`portrait-w420.avif`). Consumers that read Media docs use `media.sizes.wXXX.url` directly — no path-substitution needed.

The two naming conventions are **a feature, not a bug**. They tell you at a glance which pipeline produced a file:

| File                                  | Pipeline | Naming                | URL source                       |
| ------------------------------------- | -------- | --------------------- | -------------------------------- |
| `productions/aibolit/poster.600.avif` | A        | `<base>.<W>.avif`     | `lib/content.ts#buildVariants()` |
| `productions/portrait-w600.avif`      | B        | `<base>-w<size>.avif` | `media.sizes.w600.url`           |

No code attempts to unify them. Each consumer knows which lane it's in by the data shape it received.

## The "standard" editorial flow

For all public-site media (posters, gallery, productionsPhoto, featuredPhoto):

1. **Editor uploads** via either:
   - The "Upload" button in `ImagePathPreview` (Payload admin) → POSTs to `/api/r2-asset` → file lands at `productions/<slug>/<filename>` in R2.
   - Local workflow: drop the file into `public/productions/<slug>/<basename>.jpg`, then `npm run upload-images`.
2. **Variant bake** (currently manual, soon automatic): `npm run bake-variants -- --slug <slug>` → produces the five AVIFs alongside.
3. **Editor saves** the production. Field value is a path string like `/productions/<slug>/<basename>.jpg`. Done.

For non-public / admin-only media (rare):

1. Drag-and-drop into a Payload Media-relation field.
2. Payload + sharp auto-bakes the five widths on upload.
3. Consumer reads `media.sizes.wXXX.url` off the Media document.

## The one improvement worth making — inline bake on `/api/r2-asset`

### Problem

Step 2 of the standard flow above is manual. Sequence today:

1. Click "Upload" in admin → POST to `/api/r2-asset` → source lands in R2 ✅
2. Save the production ✅
3. **Someone manually remembers** `npm run bake-variants -- --slug <slug>` ⚠️

If step 3 is skipped, the site serves no variants for that production until the next bulk bake. The fall-through path in `lib/content.ts#buildVariants()` is gated on `NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED=1`, so the component code does pick the legacy `<Image>` path when variants don't actually exist — but `buildVariants()` _will_ still emit URLs (because it has no way to know R2 contents). Result: 404s on the variant URLs and a broken `<img srcset>` until either bake is run or the env flag is flipped off.

### Fix

Bake inline in the same request that uploads the source. Run sharp on the buffer we already have in memory, encode all five widths in parallel, PUT to R2 alongside. Same module the bulk script uses, no duplication.

### Implementation sketch

1. **Extract shared module `lib/image-variants.ts`**:

   ```ts
   export const VARIANTS: ReadonlyArray<{ width: number; quality: number }> = [
     { width: 420,  quality: 65 },
     { width: 600,  quality: 65 },
     { width: 828,  quality: 62 },
     { width: 1080, quality: 60 }
   ]

   /** `<dir>/<base>.<W>.avif` */
   export function variantKey(sourceKey: string, width: number): string { … }

   /** Encode + PUT all 4 widths for one source. Idempotent (HEAD-skip).
    *  Honors `sharp.concurrency(1)` set globally. */
   export async function bakeVariants(
     srcBytes: Buffer,
     sourceKey: string,
     client: S3Client,
     bucket: string,
     opts?: { force?: boolean }
   ): Promise<{ built: number; skipped: number }> { … }
   ```

2. **Refactor `scripts/bake-image-variants.ts`** to delete its inlined `encodeVariant` + `bakeOne` + naming helpers; import them from `lib/image-variants.ts`. CLI flags, Payload-source walking, and the `pMap` outer loop stay in the script.

3. **Patch `app/api/r2-asset/route.ts`** in POST, right after `await uploadToR2(buffer, r2Key, contentType)`:

   ```ts
   // Bake the AVIF variant matrix inline so consumers see srcset hits the
   // moment this request returns. Errors here do NOT fail the upload —
   // we already have the source in R2; variants can be rebuilt later via
   // `npm run bake-variants -- --slug <slug>`.
   const ext = path.extname(filename).toLowerCase()
   if (BAKEABLE_EXT.has(ext)) {
     try {
       await bakeVariants(buffer, r2Key, r2Client(), BUCKET)
     } catch (err) {
       console.warn('[keystatic-asset] variant bake failed:', err)
     }
   }
   ```

4. **No client change**. `ImagePathPreview` already reflects the new file via its existing `setValue(src)` call. Variants are server-side state.

### Cost / benefit

- **Cost**: ~2–3 s of added latency on each admin image upload (sharp encoding 4 widths at effort 4 in parallel, on Vercel Fluid Compute — was 3–5 s at effort 6 before the 2026-05-15 perf pass). Editors already wait several seconds for uploads of ≥1 MB files; this is in the same envelope. Bulk re-bakes can opt into the tighter setting with `AVIF_EFFORT=6 npm run bake-variants -- --force`.
- **Cost**: small memory bump in the route — the source buffer stays resident while sharp encodes. Bounded by the existing 25 MB upload limit, so worst case ~25 MB × 4 pipelines = ~100 MB peak. Vercel default Fluid Compute memory (1024 MB) handles this comfortably.
- **Benefit**: no manual step between upload and "site is ready". Editor's mental model becomes "upload → save → done". Removes the fragile race where variants lag the source.
- **Benefit**: the bulk script becomes a backfill / re-encode tool, not a routine operation. Used only after quality tweaks (`--force`), after env-flag flips on legacy data, or for one-off catalog repairs.

### Rollback path

If the inline bake misbehaves in production (sharp segfault, AVIF encode error on a weird input, etc.), the `try/catch` already swallows failures into a warn-log — uploads still succeed, the source still lands in R2, and the manual bake script can be run after the fact. Zero risk of blocking the editor.

## What NOT to change

- **Do not change the variant naming for Pipeline A.** Period-separated `<base>.<W>.avif` is set in stone — 1555 R2 keys (311 sources × 5 widths after the 2026-05-17 720w backfill) plus consumer code already depend on it. If we ever need different widths, add them as new keys (e.g. `.1440.avif`); don't rename existing ones.
- **Do not migrate `Productions.media.*.src` to Media relations.** It's path strings forever. Confirmed by Daniil 2026-05-14.
- **Do not try to unify Pipeline A and Pipeline B naming.** Each pipeline owns its convention; consumers know which one they're reading from based on data shape, not URL pattern matching.
- **Do not delete the bulk `bake-variants` script.** It stays useful for backfill, `--force` re-encodes, and disaster recovery.

## Sequencing

| Step                                                                           | Owner             | Blocker | Verifies                                            |
| ------------------------------------------------------------------------------ | ----------------- | ------- | --------------------------------------------------- |
| 1. Land Plan B as-is, run bulk bake, flip `NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED` | shipped           | —       | Mobile Lighthouse ≥ 95                              |
| 2. Extract `lib/image-variants.ts`, refactor script                            | follow-up PR      | step 1  | Bulk bake still produces identical output           |
| 3. Patch `/api/r2-asset` POST to bake inline                                   | same PR as step 2 | step 2  | One admin upload produces source + 4 variants in R2 |
| 4. Update editor docs (one line in `readme.md` or `STATUS.md`)                 | trivial           | step 3  | New uploads no longer need a manual bake            |

Steps 2 + 3 ship together — they share the new module and are useless apart.

## Open questions

1. **Should the inline bake be opt-out per upload?** Edge case: an editor uploading a placeholder image they intend to replace before deploy. Baking 4 AVIFs for a throw-away source is wasted compute. Recommendation: don't add the toggle — inline bake is cheap, R2 storage is cheap, and the throwaway scenario is rare enough that the simplicity of "always bake" wins.
2. **Should the inline bake also write the LQIP?** `public/productions/<slug>/lqip.json` is currently generated separately. We have the bytes in hand; one more sharp pipeline could produce the LQIP base64 and write it to a sibling key. Out of scope for the v1 of this change — LQIP is a Pipeline A concern but lives in `public/`, not R2. Address only if it becomes a pain point.
3. **What about deletes?** The DELETE handler in `/api/r2-asset/route.ts` removes the source but leaves orphan variants. Recommendation: add a parallel `deleteVariants(sourceKey, client, bucket)` to the shared module, called from the DELETE handler. Small change, prevents R2 cruft.
