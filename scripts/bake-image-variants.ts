/**
 * scripts/bake-image-variants.ts
 *
 * Plan B (PAYLOAD_IMAGE_VARIANTS_PLAN.md): pre-bake 420/600/828/1080 AVIF
 * variants for every legacy R2-resident poster + gallery image and PUT them
 * back to R2 alongside the source. Served straight as `<img srcset>`, no
 * `/_next/image` transform.
 *
 * Naming: `<dir>/<basename>.<W>.avif`, e.g. `productions/<slug>/poster.420.avif`.
 *
 * Idempotent: HEAD-checks all four variant keys before any GET/encode; skips
 * the source if all variants are already present.
 *
 * Usage:
 *   npm run bake-variants               # whole library
 *   npm run bake-variants -- --dry-run  # print planned PUTs, no writes
 *   npm run bake-variants -- --slug bury-me-behind-the-baseboard
 *   npm run bake-variants -- --force    # re-encode even if all variants exist
 */

import 'dotenv/config'
import path from 'node:path'
import os from 'node:os'
import { Buffer } from 'node:buffer'

import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import pMap from 'p-map'
import sharp from 'sharp'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../payload.config'

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

interface Variant {
  width: number
  quality: number
}

const VARIANTS: Variant[] = [
  { width: 420, quality: 65 },
  { width: 600, quality: 65 },
  { width: 828, quality: 62 },
  { width: 1080, quality: 60 }
]

const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

// Pin each sharp call to one libvips thread. Default is `os.cpus().length`
// per call — with N pipelines in flight that's N² threads competing for the
// same cores, and each call ends up slower. One thread per call + many
// concurrent pipelines is the proven batch pattern; total throughput tracks
// physical cores almost linearly.
sharp.concurrency(1)

// Default source-level concurrency = physical cores. Each source then
// encodes all 4 widths in parallel inside that slot. Override with
// `--concurrency=N` if you want to push your laptop harder (or back off).
const DEFAULT_CONCURRENCY = Math.max(2, os.cpus().length)

// AVIF encoder effort. 6 produces ~10–15 % smaller files than 4 but is
// 5–10× slower per encode; on the 379-source catalog that ballooned to
// hours. Effort 4 is the sweet spot — still beats WebP/JPEG by a wide
// margin while keeping the full bake under ~15 min on a laptop.
const AVIF_EFFORT = 6

// -----------------------------------------------------------------------------
// R2 client
// -----------------------------------------------------------------------------

function r2Client(): S3Client {
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

const BUCKET =
  process.env.R2_BUCKET ?? process.env.S3_BUCKET ?? 'boklanov-content'

// -----------------------------------------------------------------------------
// Path helpers
// -----------------------------------------------------------------------------

type AnyMap = Record<string, unknown>

/** Normalise an editor-stored src like `/productions/foo/poster.jpg` to the
 *  R2 object key (no leading slash). Skips http(s), non-image, and out-of-tree
 *  paths. */
function srcToR2Key(src: unknown): string | null {
  if (typeof src !== 'string' || src.length === 0) return null
  if (/^https?:/i.test(src)) return null
  const trimmed = src.replace(/^\/+/, '')
  const ext = path.extname(trimmed).toLowerCase()
  if (!SOURCE_EXTS.has(ext)) return null
  if (!trimmed.startsWith('productions/')) return null
  return trimmed
}

/** Derive the variant key from a source key, e.g.
 *  `productions/x/poster.jpg` + width 420 → `productions/x/poster.420.avif`. */
function variantKey(sourceKey: string, width: number): string {
  const ext = path.extname(sourceKey)
  const stem = sourceKey.slice(0, -ext.length)
  return `${stem}.${width}.avif`
}

// -----------------------------------------------------------------------------
// R2 ops
// -----------------------------------------------------------------------------

async function r2HeadExists(client: S3Client, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch (err) {
    const code = (
      err as { name?: string; $metadata?: { httpStatusCode?: number } }
    ).$metadata?.httpStatusCode
    if (code === 404 || code === 403) return false
    throw err
  }
}

async function r2GetBytes(client: S3Client, key: string): Promise<Buffer> {
  const res = await client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  )
  const body = res.Body
  if (!body) throw new Error(`empty body for ${key}`)
  // AWS SDK v3 Node stream — `transformToByteArray` covers Node + browser
  // fetch bodies in one call.
  const bytes = await (
    body as { transformToByteArray: () => Promise<Uint8Array> }
  ).transformToByteArray()
  return Buffer.from(bytes)
}

async function r2Put(
  client: S3Client,
  key: string,
  body: Buffer
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: 'image/avif',
      ContentLength: body.length,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  )
}

// -----------------------------------------------------------------------------
// Encoding
// -----------------------------------------------------------------------------

async function encodeVariant(
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
// Per-source pipeline
// -----------------------------------------------------------------------------

interface BakeOpts {
  dryRun: boolean
  force: boolean
}

interface BakeResult {
  source: string
  variantsBuilt: number
  variantsSkipped: number
  missingSource: boolean
}

async function bakeOne(
  client: S3Client,
  sourceKey: string,
  opts: BakeOpts
): Promise<BakeResult> {
  const targetKeys = VARIANTS.map((v) => ({
    width: v.width,
    quality: v.quality,
    key: variantKey(sourceKey, v.width)
  }))

  // Check which variants already exist — skip the GET when complete.
  const existence = await Promise.all(
    targetKeys.map(async (t) =>
      opts.force ? false : r2HeadExists(client, t.key)
    )
  )
  const missing = targetKeys.filter((_, i) => !existence[i])
  const skipped = targetKeys.length - missing.length

  if (missing.length === 0) {
    return {
      source: sourceKey,
      variantsBuilt: 0,
      variantsSkipped: skipped,
      missingSource: false
    }
  }

  // Confirm source exists before we try to GET it (gives a friendlier message
  // for the typo'd-src case).
  if (!(await r2HeadExists(client, sourceKey))) {
    return {
      source: sourceKey,
      variantsBuilt: 0,
      variantsSkipped: skipped,
      missingSource: true
    }
  }

  if (opts.dryRun) {
    for (const t of missing) {
      console.log(`[dry] PUT ${t.key}  (w=${t.width} q=${t.quality})`)
    }
    return {
      source: sourceKey,
      variantsBuilt: missing.length,
      variantsSkipped: skipped,
      missingSource: false
    }
  }

  const srcBytes = await r2GetBytes(client, sourceKey)

  // Encode + PUT all missing widths from this source in parallel. The source
  // is decoded once per worker; sharp re-uses the buffer internally across
  // the 4 pipelines so we pay the decode cost only once per source.
  await Promise.all(
    missing.map(async (t) => {
      const buf = await encodeVariant(srcBytes, t.width, t.quality)
      await r2Put(client, t.key, buf)
      const kb = (buf.length / 1024).toFixed(0)
      console.log(`  ✓ ${t.key}  (${kb} KB)`)
    })
  )

  return {
    source: sourceKey,
    variantsBuilt: missing.length,
    variantsSkipped: skipped,
    missingSource: false
  }
}

// -----------------------------------------------------------------------------
// Source collection — Payload Local API
// -----------------------------------------------------------------------------

function collectFromProduction(doc: AnyMap): string[] {
  const out = new Set<string>()
  const media = (doc.media as AnyMap) ?? {}
  for (const k of ['poster', 'productionsPhoto', 'featuredPhoto'] as const) {
    const g = (media[k] as AnyMap) ?? {}
    const key = srcToR2Key(g.src)
    if (key) out.add(key)
  }
  const gallery = Array.isArray(media.gallery)
    ? (media.gallery as AnyMap[])
    : []
  for (const g of gallery) {
    const key = srcToR2Key(g.src)
    if (key) out.add(key)
  }
  return Array.from(out)
}

async function collectAllSources(
  payload: Payload,
  onlySlug: string | null
): Promise<Array<{ slug: string; keys: string[] }>> {
  const { docs } = await payload.find({
    collection: 'productions',
    locale: 'all',
    depth: 0,
    limit: 500,
    pagination: false,
    ...(onlySlug ? { where: { slug: { equals: onlySlug } } } : {})
  })
  return (docs as unknown as AnyMap[]).map((d) => ({
    slug: String(d.slug),
    keys: collectFromProduction(d)
  }))
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

function parseConcurrency(args: string[]): number {
  // Accept both `--concurrency=N` and `--concurrency N` forms.
  const eqMatch = args.find((a) => a.startsWith('--concurrency='))
  if (eqMatch) {
    const n = Number(eqMatch.split('=')[1])
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  const idx = args.indexOf('--concurrency')
  if (idx !== -1) {
    const n = Number(args[idx + 1])
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  return DEFAULT_CONCURRENCY
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('--dry')
  const force = args.includes('--force')
  const slugIdx = args.indexOf('--slug')
  const onlySlug = slugIdx !== -1 ? (args[slugIdx + 1] ?? null) : null
  const concurrency = parseConcurrency(args)

  console.log(
    `R2 bucket: "${BUCKET}"${dryRun ? '  [DRY RUN]' : ''}${
      force ? '  [FORCE]' : ''
    }${onlySlug ? `  (slug=${onlySlug})` : ''}  concurrency=${concurrency}`
  )

  const client = r2Client()
  const payload = await getPayload({ config })

  const groups = await collectAllSources(payload, onlySlug)
  const allKeys = groups.flatMap((g) => g.keys)
  console.log(
    `\nDiscovered ${allKeys.length} source images across ${groups.length} production${
      groups.length === 1 ? '' : 's'
    }.`
  )

  let built = 0
  let skipped = 0
  let missing = 0
  let errors = 0

  await pMap(
    allKeys,
    async (key) => {
      try {
        const res = await bakeOne(client, key, { dryRun, force })
        built += res.variantsBuilt
        skipped += res.variantsSkipped
        if (res.missingSource) {
          missing += 1
          console.warn(`  ⚠ source missing in R2: ${key}`)
        }
      } catch (err) {
        errors += 1
        console.warn(
          `  ⚠ bake failed for ${key}: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      }
    },
    { concurrency }
  )

  console.log(
    `\nDone. ${built} variant${built === 1 ? '' : 's'} ${
      dryRun ? 'planned' : 'written'
    }, ${skipped} already present, ${missing} sources missing, ${errors} errors.`
  )

  // Payload Local API leaves the pg pool open; explicitly exit so the script
  // terminates instead of hanging.
  process.exit(errors === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
