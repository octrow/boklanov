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
 *  `(min-width:1024px) 640px, 100vw`. See PAYLOAD_IMAGE_VARIANTS_PLAN.md. */
export const VARIANTS: ReadonlyArray<Variant> = [
  { width: 420, quality: 65 },
  { width: 600, quality: 65 },
  { width: 828, quality: 62 },
  { width: 1080, quality: 60 }
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

export interface BakeOpts {
  /** Re-encode even if all four variants already exist. */
  force?: boolean
  /** Print planned PUTs without writing. */
  dryRun?: boolean
  /** Per-variant write callback for progress reporting. */
  onWrite?: (key: string, bytes: number) => void
}

export interface BakeResult {
  built: number
  skipped: number
}

/** Encode + PUT all four widths from an in-memory source buffer. Idempotent
 *  via HEAD-skip on each target key. Variants are encoded + uploaded in
 *  parallel (one sharp pipeline per width). */
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

  const existence = await Promise.all(
    targets.map(async (t) =>
      opts.force ? false : r2HeadExists(client, bucket, t.key)
    )
  )
  const missing = targets.filter((_, i) => !existence[i])
  const skipped = targets.length - missing.length
  if (missing.length === 0) return { built: 0, skipped }

  if (opts.dryRun) {
    for (const t of missing) {
      opts.onWrite?.(t.key, 0)
    }
    return { built: missing.length, skipped }
  }

  await Promise.all(
    missing.map(async (t) => {
      const buf = await encodeVariant(srcBytes, t.width, t.quality)
      await r2PutAvif(client, bucket, t.key, buf)
      opts.onWrite?.(t.key, buf.length)
    })
  )

  return { built: missing.length, skipped }
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
    return { built: 0, skipped: targets.length, missingSource: false }

  if (!(await r2HeadExists(client, bucket, sourceKey))) {
    return { built: 0, skipped: 0, missingSource: true }
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

  const srcBytes = await r2GetBytes(client, bucket, sourceKey)
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
