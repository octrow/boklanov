/**
 * lib/image-variants.ts — Pipeline A AVIF variant baking, shared module.
 *
 * Single source of truth for the variant matrix, naming convention, encode
 * settings, and R2 ops used by:
 *
 *   - `scripts/bake-image-variants.ts` — bulk backfill / re-encode
 *   - `app/api/r2-asset/route.ts`      — inline bake on admin upload
 *
 * Naming: `<dir>/<basename>.<W>.avif` (period-separated, four widths).
 * See `.design/boklanov-rewrite/IMAGE_UPLOAD_STANDARD.md` for the contract.
 *
 * Side effect on import: pins libvips threading to 1 per call. Without this,
 * each sharp() call defaults to `os.cpus().length` threads and N concurrent
 * pipelines contend for N² threads. One thread per call + concurrent
 * pipelines is the proven batch-image pattern.
 */

import path from 'node:path'
import { Buffer } from 'node:buffer'

import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import sharp from 'sharp'

// -----------------------------------------------------------------------------
// Variant matrix
// -----------------------------------------------------------------------------

export interface Variant {
  width: number
  quality: number
}

/** Width / quality matrix matches FeaturedStrip.tsx sizes + detail-page
 *  `(min-width:1024px) 640px, 100vw`. See PAYLOAD_IMAGE_VARIANTS_PLAN.md.
 *  Quality lowered (2026-05-14) after Lighthouse flagged ~100 KiB
 *  per-image savings on the 420/600 widths — posters render under a
 *  duotone CSS blend so the visual cost is minimal. Re-bake with
 *  `npm run bake-variants -- --force` after editing. */
export const VARIANTS: ReadonlyArray<Variant> = [
  { width: 420, quality: 55 },
  { width: 600, quality: 58 },
  // 720w was added (2026-05-14) after Lighthouse mobile flagged that the
  // 828w variant was being picked on Moto G Power (412 viewport × DPR 1.75
  // = ~720 physical px ideal). Without 720, the browser fell up to 828w
  // and Lighthouse counted ~25 % of bytes as "wasted". 720w fits the
  // DPR-1.75 case exactly; iPhones at DPR 2.0+ still jump to 1080w.
  { width: 720, quality: 55 },
  { width: 828, quality: 55 },
  { width: 1080, quality: 52 }
]

/** Source extensions we bake from. AVIF / GIF / SVG sources are skipped —
 *  AVIF is already optimal, GIF + SVG are animation/vector. */
export const BAKEABLE_EXTS: ReadonlySet<string> = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
])

/** AVIF encoder effort. 6 = slow-but-tight; produces ~10–15 % smaller files
 *  than 4 at 5–10× the encode cost. The bulk catalog bake (1244 variants)
 *  lands in ~10–15 min at concurrency = cores, which is acceptable. */
export const AVIF_EFFORT = 6

// Pin libvips to one thread per call. Module-level side effect — runs once
// at first import. Safe to import this module multiple times; sharp.concurrency()
// is idempotent.
sharp.concurrency(1)

// -----------------------------------------------------------------------------
// Path helpers
// -----------------------------------------------------------------------------

/** Derive the variant key from a source key, e.g.
 *  `productions/x/poster.jpg` + width 420 → `productions/x/poster.420.avif`. */
export function variantKey(sourceKey: string, width: number): string {
  const ext = path.extname(sourceKey)
  const stem = sourceKey.slice(0, -ext.length)
  return `${stem}.${width}.avif`
}

/** Return the bakeable variant keys for a given source key. Returns an empty
 *  array if the source extension isn't bakeable. */
export function variantKeysFor(sourceKey: string): string[] {
  const ext = path.extname(sourceKey).toLowerCase()
  if (!BAKEABLE_EXTS.has(ext)) return []
  return VARIANTS.map((v) => variantKey(sourceKey, v.width))
}

/** Normalise an editor-stored src like `/productions/foo/poster.jpg` to the
 *  R2 object key (no leading slash). Skips http(s), non-bakeable, and
 *  out-of-tree paths. */
export function srcToR2Key(
  src: unknown,
  allowedPrefixes: ReadonlyArray<string> = ['productions/']
): string | null {
  if (typeof src !== 'string' || src.length === 0) return null
  if (/^https?:/i.test(src)) return null
  const trimmed = src.replace(/^\/+/, '')
  const ext = path.extname(trimmed).toLowerCase()
  if (!BAKEABLE_EXTS.has(ext)) return null
  if (!allowedPrefixes.some((p) => trimmed.startsWith(p))) return null
  return trimmed
}

// -----------------------------------------------------------------------------
// R2 client factory
// -----------------------------------------------------------------------------

/** Construct an S3Client pointed at R2. Accepts the long-standing
 *  `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` env trio,
 *  with `S3_*` fallbacks so we share creds with the Payload s3Storage plugin
 *  (which reads `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_ENDPOINT`). */
export function makeR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const keyId = process.env.R2_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID
  const keySecret =
    process.env.R2_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY
  if (!accountId || !keyId || !keySecret) {
    throw new Error(
      'R2 creds missing. Need R2_ACCOUNT_ID + (R2|S3)_ACCESS_KEY_ID + (R2|S3)_SECRET_ACCESS_KEY.'
    )
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: keySecret },
    forcePathStyle: true
  })
}

export function r2Bucket(): string {
  return process.env.R2_BUCKET ?? process.env.S3_BUCKET ?? 'boklanov-content'
}

// -----------------------------------------------------------------------------
// R2 ops
// -----------------------------------------------------------------------------

export async function r2HeadExists(
  client: S3Client,
  bucket: string,
  key: string
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (err) {
    const code = (err as { $metadata?: { httpStatusCode?: number } }).$metadata
      ?.httpStatusCode
    if (code === 404 || code === 403) return false
    throw err
  }
}

export async function r2GetBytes(
  client: S3Client,
  bucket: string,
  key: string
): Promise<Buffer> {
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  )
  const body = res.Body
  if (!body) throw new Error(`empty body for ${key}`)
  const bytes = await (
    body as { transformToByteArray: () => Promise<Uint8Array> }
  ).transformToByteArray()
  return Buffer.from(bytes)
}

async function r2PutAvif(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'image/avif',
      ContentLength: body.length,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  )
}

async function r2Delete(
  client: S3Client,
  bucket: string,
  key: string
): Promise<void> {
  // R2 DeleteObject is free + idempotent (returns 204 even when absent).
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

// -----------------------------------------------------------------------------
// Encoding
// -----------------------------------------------------------------------------

export async function encodeVariant(
  src: Buffer,
  width: number,
  quality: number
): Promise<Buffer> {
  return sharp(src, { failOn: 'none' })
    .rotate() // honor EXIF orientation
    .resize({ width, withoutEnlargement: true })
    .avif({ quality, effort: AVIF_EFFORT })
    .toBuffer()
}

// -----------------------------------------------------------------------------
// Public API — bake + delete
// -----------------------------------------------------------------------------

export type BakePhase = 'head' | 'get' | 'encode' | 'put'

/** Structured per-variant failure. Carries enough context to diagnose the
 *  root cause without re-running: pipeline phase, source + variant keys,
 *  source size, AWS metadata when present, plus the stack. */
export interface VariantFailure {
  sourceKey: string
  variantKey: string
  width: number
  phase: BakePhase
  message: string
  errorName?: string
  awsCode?: string
  awsStatusCode?: number
  awsRequestId?: string
  sourceBytes?: number
  stack?: string
}

export interface BakeOpts {
  /** Re-encode even if all four variants already exist. */
  force?: boolean
  /** Print planned PUTs without writing. */
  dryRun?: boolean
  /** Per-variant write callback for progress reporting. */
  onWrite?: (key: string, bytes: number) => void
  /** Per-variant failure callback. Fires alongside the failure being added
   *  to the result so callers can stream errors to a log file or counter. */
  onFailure?: (failure: VariantFailure) => void
}

export interface BakeResult {
  built: number
  skipped: number
  failures: VariantFailure[]
}

interface AwsLikeError {
  name?: string
  message?: string
  stack?: string
  Code?: string
  $metadata?: {
    httpStatusCode?: number
    requestId?: string
  }
}

function describeFailure(
  err: unknown,
  ctx: {
    sourceKey: string
    variantKey: string
    width: number
    phase: BakePhase
    sourceBytes?: number
  }
): VariantFailure {
  const e = (err ?? {}) as AwsLikeError
  return {
    ...ctx,
    message: e.message ?? String(err),
    errorName: e.name,
    awsCode: e.Code,
    awsStatusCode: e.$metadata?.httpStatusCode,
    awsRequestId: e.$metadata?.requestId,
    stack: e.stack
  }
}

/** Encode + PUT all four widths from an in-memory source buffer. Idempotent
 *  via HEAD-skip on each target key. Variants are encoded + uploaded in
 *  parallel (one sharp pipeline per width). Failures on one width do NOT
 *  abort the others — switched from Promise.all to Promise.allSettled so
 *  we surface a structured per-variant failure list instead of throwing on
 *  the first error and masking which specific widths went wrong. */
export async function bakeVariantsFromBuffer(
  srcBytes: Buffer,
  sourceKey: string,
  client: S3Client,
  bucket: string,
  opts: BakeOpts = {}
): Promise<BakeResult> {
  const targets = VARIANTS.map((v) => ({
    width: v.width,
    quality: v.quality,
    key: variantKey(sourceKey, v.width)
  }))

  // HEAD probes — track failures separately so a flaky HEAD doesn't get
  // counted as a successful skip.
  const headResults = await Promise.allSettled(
    targets.map(async (t) =>
      opts.force ? false : r2HeadExists(client, bucket, t.key)
    )
  )
  const failures: VariantFailure[] = []
  const missing: typeof targets = []
  let skipped = 0
  headResults.forEach((res, i) => {
    const t = targets[i]
    if (res.status === 'rejected') {
      const failure = describeFailure(res.reason, {
        sourceKey,
        variantKey: t.key,
        width: t.width,
        phase: 'head',
        sourceBytes: srcBytes.length
      })
      failures.push(failure)
      opts.onFailure?.(failure)
      return
    }
    if (res.value) {
      skipped += 1
    } else {
      missing.push(t)
    }
  })

  if (missing.length === 0) {
    return { built: 0, skipped, failures }
  }

  if (opts.dryRun) {
    for (const t of missing) {
      opts.onWrite?.(t.key, 0)
    }
    return { built: missing.length, skipped, failures }
  }

  const writeResults = await Promise.allSettled(
    missing.map(async (t) => {
      // Encode phase — sharp throws here on corrupt sources, OOM, etc.
      let buf: Buffer
      try {
        buf = await encodeVariant(srcBytes, t.width, t.quality)
      } catch (encodeErr) {
        const failure = describeFailure(encodeErr, {
          sourceKey,
          variantKey: t.key,
          width: t.width,
          phase: 'encode',
          sourceBytes: srcBytes.length
        })
        throw failure
      }
      // PUT phase — AWS SDK throws here on throttling, auth, etc.
      try {
        await r2PutAvif(client, bucket, t.key, buf)
      } catch (putErr) {
        const failure = describeFailure(putErr, {
          sourceKey,
          variantKey: t.key,
          width: t.width,
          phase: 'put',
          sourceBytes: srcBytes.length
        })
        throw failure
      }
      opts.onWrite?.(t.key, buf.length)
      return { key: t.key, bytes: buf.length }
    })
  )

  let built = 0
  writeResults.forEach((res) => {
    if (res.status === 'fulfilled') {
      built += 1
    } else {
      // Already-described failure from the inner try/catch.
      const failure = res.reason as VariantFailure
      failures.push(failure)
      opts.onFailure?.(failure)
    }
  })

  return { built, skipped, failures }
}

/** Variant-baking wrapper that fetches the source from R2 first. Used by
 *  the bulk script when iterating over keys it didn't upload itself. */
export async function bakeVariantsFromR2(
  sourceKey: string,
  client: S3Client,
  bucket: string,
  opts: BakeOpts = {}
): Promise<BakeResult & { missingSource: boolean }> {
  // Pre-check existence on all variants so we can skip the GET entirely
  // when fully baked.
  const targets = VARIANTS.map((v) => ({
    width: v.width,
    key: variantKey(sourceKey, v.width)
  }))
  const existence = await Promise.all(
    targets.map(async (t) =>
      opts.force ? false : r2HeadExists(client, bucket, t.key)
    )
  )
  const allPresent = existence.every(Boolean)
  if (allPresent)
    return {
      built: 0,
      skipped: targets.length,
      failures: [],
      missingSource: false
    }

  if (!(await r2HeadExists(client, bucket, sourceKey))) {
    return { built: 0, skipped: 0, failures: [], missingSource: true }
  }

  if (opts.dryRun) {
    const result = await bakeVariantsFromBuffer(
      // dry-run never touches the buffer, so pass an empty one
      Buffer.alloc(0),
      sourceKey,
      client,
      bucket,
      opts
    )
    return { ...result, missingSource: false }
  }

  // GET phase — convert failures into one VariantFailure per width so the
  // caller sees structured errors even when the source download is what
  // actually broke.
  let srcBytes: Buffer
  try {
    srcBytes = await r2GetBytes(client, bucket, sourceKey)
  } catch (getErr) {
    const failures = targets.map((t) =>
      describeFailure(getErr, {
        sourceKey,
        variantKey: t.key,
        width: t.width,
        phase: 'get'
      })
    )
    failures.forEach((f) => opts.onFailure?.(f))
    return { built: 0, skipped: 0, failures, missingSource: false }
  }

  const result = await bakeVariantsFromBuffer(
    srcBytes,
    sourceKey,
    client,
    bucket,
    opts
  )
  return { ...result, missingSource: false }
}

/** Remove all four variant keys for a source. Used on editor DELETE to
 *  prevent orphan AVIFs from accumulating in R2 after a source is removed.
 *  Each delete is idempotent (R2 returns 204 for absent keys). */
export async function deleteVariants(
  sourceKey: string,
  client: S3Client,
  bucket: string
): Promise<{ removed: number }> {
  const keys = variantKeysFor(sourceKey)
  if (keys.length === 0) return { removed: 0 }
  await Promise.all(keys.map((k) => r2Delete(client, bucket, k)))
  return { removed: keys.length }
}
