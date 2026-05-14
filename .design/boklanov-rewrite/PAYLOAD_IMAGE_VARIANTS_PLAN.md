# Plan B — Pre-baked AVIF variants in R2, bypass `/_next/image`

Status: **code shipped 2026-05-14; bake complete; awaiting env-flag flip + Lighthouse verification.**

Code: `lib/image-variants.ts` (shared module), `scripts/bake-image-variants.ts` (bulk), `app/api/r2-asset/route.ts` (inline-bake on admin upload), consumer dual-paths in `ProductionCard.tsx` / `app/[locale]/productions/[slug]/page.tsx` / `GalleryLightbox.tsx` / `SpecimenPlate.tsx`, head preloads in `app/[locale]/page.tsx` + detail page. Track 1 (`collections/Media.ts` `imageSizes`) also landed. Pairs with [`IMAGE_UPLOAD_STANDARD.md`](./IMAGE_UPLOAD_STANDARD.md) for the editorial workflow.

R2 state after the bake (run 2026-05-14 21:00 ALA):

- **1244 variants** in R2 across 54 productions covering poster + productionsPhoto + featuredPhoto + gallery (cross-checked: 87 written + 1157 already present from interrupted prior runs = 1244, matching the dry-run plan).
- **0 variant failures** (the 73 errors from the user's prior run were transient; idempotent re-run picked them up cleanly).
- **68 dangling DB refs** to gallery photos that don't exist in R2 (`aiaccio/photo_NNNN_result.webp` set, the `nikita-looking-for-the-sea` and `lika-and-beam` sets). Not bake-related — these are upstream content-ingest gaps; either re-upload the missing source files or scrub the gallery entries from Payload. Tracked separately, doesn't block this plan.
- Spot-check: `https://pub-eaffa56b38f2484cb3a48ab54ac582b0.r2.dev/productions/aibolit/poster.600.avif` returns `200 / image/avif / 22 KB / cache-control: public, max-age=31536000, immutable`. Cloudflare ALA PoP serves edge-cached.

Rollout left:

1. `vercel env add NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED preview` → value `1` → redeploy preview.
2. Mobile + desktop Lighthouse vs preview per `LIGHTHOUSE_RUNBOOK.md`.
3. If mobile Perf ≥ 95, `vercel env add … production` → value `1` → promote.
4. Post-verification: drop `image/webp` from `next.config.js#images.formats`, set `minimumCacheTTL: 2678400`. Separate PR.

Pairs with [`LIGHTHOUSE_IMPROVEMENT_PLAN.md`](./LIGHTHOUSE_IMPROVEMENT_PLAN.md) (Pattern A = tuning `next/image`) and the mobile re-test in `archive/lighthouse_14052026_1901.json`. Pattern A is the prerequisite quick win; Pattern B is the architectural follow-up.

## Goal

Replace the runtime `/_next/image?url=…&w=…&q=…` transform pipeline with **build-/upload-time AVIF variants stored alongside the source in R2**, served as plain `<img srcset>` (or `<Image unoptimized />`). Eliminates Vercel image-optimization billing, removes first-request transform latency, and gives deterministic byte budgets per breakpoint.

Why now (2026):

- Vercel switched `/_next/image` to per-transformation pricing (Feb 2025).
- Payload 3 + `sharp` + `@payloadcms/storage-s3` is the canonical pattern for pre-baked variants; `formatOptions` + `imageSizes` was hardened in 3.84.
- AVIF is universal in our browserslist (chrome ≥110, safari ≥15.6, ios ≥15.6). Dual AVIF+WebP encoding is wasted spend.
- R2 has zero egress to Cloudflare's edge; pre-baked variants effectively cache forever.

## Current state (what makes Plan B non-trivial here)

`collections/Media.ts:27` only handles admin uploads (portrait, etc.). The bulk of poster/gallery imagery is **legacy raw paths** on `Productions.media.*.src` pointing at `productions/<slug>/poster.jpg` in R2 — they never went through the Payload upload pipeline, so `imageSizes` alone won't backfill them. See `PAYLOAD_MIGRATION_PLAN §P2.5 Q2 default`.

That forces a two-track approach:

- **Track 1 — Payload Media (future uploads)**: add `imageSizes` + `formatOptions` to `collections/Media.ts` so any new upload bakes variants.
- **Track 2 — Legacy R2 posters (existing)**: a one-shot script generates the same set of variants for every `productions/<slug>/{poster,01,02,…}.jpg` and uploads them to R2, then `lib/content.ts` exposes the variant URLs.

Both tracks converge on the same naming scheme so `ProductionCard` and the detail page can ship one `srcSet`.

## Variant matrix

Source posters are ≥1500w (1526×2160 measured on `bury-me-…/poster.jpg`). Breakpoints from `FeaturedStrip.tsx:23–30` and detail-page `sizes='(min-width:1024px) 640px, 100vw'`:

| Variant suffix | Width | Quality | Used by                                      |
| -------------- | ----- | ------- | -------------------------------------------- |
| `.420.avif`    | 420   | 65      | small grid cells (cols 4/12 cells, sm cards) |
| `.600.avif`    | 600   | 65      | hero cell + 50vw tablet                      |
| `.828.avif`    | 828   | 62      | larger mobile retina + tablet 50vw retina    |
| `.1080.avif`   | 1080  | 60      | desktop hero + retina detail page            |

Naming: `productions/<slug>/poster.420.avif`, `…/poster.600.avif`, etc. (period-separated suffix keeps the source extension parseable). Same scheme for gallery stills (`01.420.avif`, `01.600.avif`, …).

`sizes` attribute stays unchanged — browsers pick the right variant from `srcset`.

## Track 1 — Payload Media collection (future uploads)

Edit `collections/Media.ts`:

```ts
upload: {
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  focalPoint: true,
  crop: true,
  imageSizes: [
    { name: 'w420',  width: 420,  height: undefined, position: 'centre',
      formatOptions: { format: 'avif', options: { quality: 65 } } },
    { name: 'w600',  width: 600,  height: undefined, position: 'centre',
      formatOptions: { format: 'avif', options: { quality: 65 } } },
    { name: 'w828',  width: 828,  height: undefined, position: 'centre',
      formatOptions: { format: 'avif', options: { quality: 62 } } },
    { name: 'w1080', width: 1080, height: undefined, position: 'centre',
      formatOptions: { format: 'avif', options: { quality: 60 } } }
  ],
  adminThumbnail: 'w420'
}
```

Then in `payload.config.ts`:

- Confirm `sharp` is imported and passed to `buildConfig({ sharp })` (Payload 3 requires this explicitly when any size uses `formatOptions`).
- Confirm `s3Storage` `generateFileURL` keeps using `R2_PUBLIC_URL` (already configured per `PAYLOAD_MIGRATION_PLAN`).

Re-run `npm run payload:generate:types` to surface the new size keys on `media.sizes.w420.url`, etc.

## Track 2 — Backfill legacy raw R2 posters (one-shot)

Add `scripts/bake-image-variants.ts` (model after `scripts/upload-images.ts`). For every `Production`, for every `media.*.src` that exists in R2:

```text
1. HEAD the source on R2 → if all four variants already exist, skip.
2. GET the source bytes.
3. sharp(bytes)
     .resize({ width: W, withoutEnlargement: true })
     .avif({ quality: Q, effort: 6 })
     .toBuffer()
4. S3 PutObject → productions/<slug>/<basename>.<W>.avif
     CacheControl: 'public, max-age=31536000, immutable'
     ContentType: 'image/avif'
```

Concurrency: use `p-map` with `concurrency: 4` (it's already a dep).
Idempotent: HEAD-check skip path means re-running is free.
Dry-run flag: `--dry` prints planned PUTs, no writes.

Wire it into `package.json`:

```json
"bake-variants": "tsx scripts/bake-image-variants.ts"
```

Run after the script is reviewed and the bucket policy is confirmed writable from the script's IAM identity.

## Code changes (consumers)

### `lib/content.ts`

Extend `MediaRef` to expose pre-baked variants:

```ts
export interface PosterRef {
  src: string | null // legacy source (jpg/webp)
  credit: string | null
  lqip: string | null
  width: number | null
  height: number | null
  // NEW
  variants?: {
    w420: string
    w600: string
    w828: string
    w1080: string
  } | null
}
```

`buildPosterRef(slug, basename)` derives the four URLs by string substitution
(`<src>` → `<src.dirname>/<basename>.<W>.avif`). Return `null` for `variants`
when the script hasn't been run for that slug yet (so `ProductionCard` can
fall back to the legacy `/_next/image` path until the backfill completes).

### `components/ProductionCard.tsx`

Two render paths, picked by `effectiveCover.variants` presence:

```tsx
{effectiveCover.variants ? (
  <img
    className={styles.coverImg}
    src={effectiveCover.variants.w600}
    srcSet={`${effectiveCover.variants.w420} 420w,
             ${effectiveCover.variants.w600} 600w,
             ${effectiveCover.variants.w828} 828w,
             ${effectiveCover.variants.w1080} 1080w`}
    sizes={sizes}
    alt={alt}
    decoding='async'
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : undefined}
    style={{ objectFit: 'cover' }}
  />
) : (
  <Image … />   {/* existing path, kept as fallback */}
)}
```

For the **LCP card only** (`priority`), also emit a head preload from
`app/[locale]/layout.tsx` (or page) when variants exist — `<img srcset>`
does NOT auto-emit `<link rel=preload>` like `next/image` does:

```tsx
<link
  rel='preload'
  as='image'
  imageSrcSet={`${variants.w420} 420w, ${variants.w600} 600w, …`}
  imageSizes={FEATURED_SIZES[0]}
  fetchPriority='high'
/>
```

Pass the hero card's variants up from the page (the home page already
fetches `productions` server-side; the LCP slug is `productions[0]`).

### `app/[locale]/productions/[slug]/page.tsx`

Detail-page poster (line ~286): mirror the same dual-path. Detail `sizes` is
`(min-width:1024px) 640px, 100vw`, so `w600` is the default `src`,
`w828`/`w1080` cover retina + desktop.

### `next.config.js` cleanups (after backfill is verified)

Once variants serve from R2 and `/_next/image` is no longer used for posters:

- Keep `images.remotePatterns` for any remaining `Image` consumers (admin thumbnails, etc.).
- Drop `images.formats: ['image/avif','image/webp']` → `['image/avif']` (Plan A win, also reduces transforms on the residual paths).
- Set `images.minimumCacheTTL: 2678400` (Plan A win).

## Sequencing

| Step                                                                                                               | Status        | Verifies                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------ |
| 1. Land Plan A (`formats`, `minimumCacheTTL`, `quality=62` on LCP)                                                 | ✅ shipped    | Mobile 87 → 91-93 baseline before any Plan B code                              |
| 2. Write `scripts/bake-image-variants.ts`, dry-run on 3 productions                                                | ✅ shipped    | Dry-run output matched expected matrix                                         |
| 3. Extend `lib/content.ts` with `variants` + fallback                                                              | ✅ shipped    | TS compiles; legacy pages unchanged when flag is off                           |
| 4. Switch `ProductionCard` + detail page to variant path (+ gallery + head preloads)                               | ✅ shipped    | Dual-path rendering keyed on `variants` presence                               |
| 5. Update `collections/Media.ts` with `imageSizes` (Track 1)                                                       | ✅ shipped    | `payload-types.ts` carries `media.sizes.wXXX.url`; new admin uploads auto-bake |
| 6. Extract `lib/image-variants.ts` shared module + inline-bake on `/api/r2-asset` POST + delete-variants on DELETE | ✅ shipped    | One module owns the variant contract for bulk + admin paths                    |
| 7. Run bulk `npm run bake-variants`                                                                                | ✅ done       | 1244 variants in R2, 0 failures, 68 dangling DB refs noted                     |
| 8. Spot-check variant URLs on `pub-…r2.dev`                                                                        | ✅ done       | All 8 sampled URLs return `200 image/avif` with immutable cache                |
| 9. `vercel env add NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED preview` (value `1`) + redeploy                              | ⏳ next       | Preview deploys serve `<img srcset>` AVIFs, no `/_next/image` for posters      |
| 10. Lighthouse mobile + desktop vs preview, archive JSON                                                           | ⏳ blocks #11 | Mobile Perf ≥95, LCP ≤2.0 s, zero `/_next/image?` URLs in network panel        |
| 11. Flip `NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED=1` in Production env, redeploy                                        | ⏳ final      | Live site serves variants from R2 edge                                         |
| 12. Cleanup PR — drop `image/webp` from `next.config.js#images.formats`, set `minimumCacheTTL: 2678400`            | ⏳ follow-up  | Residual Image-component usage (admin thumbs) goes single-format AVIF          |

## Risks & mitigations

- **R2 PUT failures mid-backfill** → idempotent HEAD-skip; resume by re-running.
- **AVIF artifacts on high-entropy posters** (`beware-of-the-dog` is the canonical example: 263 KB at q=75, ~165 KB "wasted"). Mitigation: per-slug quality override via a small JSON allowlist (`scripts/variant-overrides.json`: `{ "beware-of-the-dog": { quality: 70 } }`). Spot-check in browser at each ramp.
- **Image-set sizing mismatch** — `<img srcset>` picks variants strictly by `sizes` + DPR. Verify on a real mid-DPR device (iPad 2× picks `w828`, Pixel 8 ~2.6× picks `w1080`). The 420 variant only fires for narrow ≤412 CSS-px viewports at DPR 1.0 (rare); keep it for low-bandwidth fallback.
- **Manual head-preload bookkeeping** — moving from `next/image priority` to raw `<img>` means we lose the automatic `<link rel=preload>` injection. Add the preload in `layout.tsx` from server-side data; cover with a Playwright snapshot test if the front page LCP slug shifts.
- **Storage cost in R2** — four AVIFs per source ≈ 4× small storage hits, but R2 is $0.015/GB/mo and AVIFs are smaller than the source JPEG combined. Net storage delta < 30 %, negligible.
- **Variants drift from `sizes`** — if FeaturedStrip breakpoints change, regenerate. Document the contract in `lib/content.ts` next to `PosterRef`.

## Resolved questions

1. **Bake gallery stills too?** ✅ Yes. `lib/content.ts#buildVariants()` stamps `variants` onto every `GalleryItem`; `GalleryLightbox` + `SpecimenPlate` thread them through and render `<img srcset>` when present, with `next/image` fallback otherwise.
2. **Drop `lqip` blur-up?** Deferred. Hero cards still emit the lqip background on the cover `<div>`; cheap enough to keep, useful while AVIF decodes on slow networks.
3. **Migrate legacy raw-path posters into Payload Media?** ✅ No — see [`IMAGE_UPLOAD_STANDARD.md`](./IMAGE_UPLOAD_STANDARD.md). Path strings stay Pipeline A; Payload Media is reserved for `about.visuals.portrait` and future ancillary uploads. The two pipelines use distinct variant-naming conventions and never mix.

## Re-test protocol

See `LIGHTHOUSE_RUNBOOK.md` for the exact commands. Archive every run as
`archive/lighthouse_DDMMYYYY_HHMM[_label].json`. Required gates before
considering Plan B shipped:

- Mobile prod `/ru` Performance ≥ 95, LCP ≤ 2.0 s
- Mobile prod `/ru/productions/<any>` Performance ≥ 95 (currently 57 — biggest win lives here)
- `network-requests` audit shows zero `/_next/image?` URLs for poster + gallery
- Vercel Observability → Image Optimization tab shows post-deploy transform count dropping toward zero on the affected paths
