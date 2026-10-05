/**
 * scripts/backfill-media.ts
 *
 * One-shot: populate the Payload `media` collection by **pointing DB rows at
 * existing R2 keys**. Zero copy, zero upload, zero egress.
 *
 * Run with: npm run payload:backfill-media
 *
 * How it works (cheap version — the obvious "download + reupload" path was
 * pure waste):
 *
 *   1. Walk every production + the about global for unique R2 keys
 *      referenced via `media.*.src` / `gallery[].src` / `portrait.src` /
 *      `photos[].src`.
 *   2. HeadObject each key → returns size + content-type, no data transfer.
 *   3. Insert a Payload media row whose `filename` is the key MINUS the
 *      `productions/` prefix (the s3Storage plugin re-adds the prefix when
 *      computing URLs). Slashes in filename are preserved — Payload's
 *      url = `${baseURL}/${prefix}/${filename}` resolves to the existing
 *      R2 object verbatim.
 *   4. **No `file:` arg on payload.create.** The s3Storage plugin's
 *      afterChange hook only uploads when `req.file` exists, so omitting it
 *      keeps the existing R2 object untouched.
 *
 * Effect on production site: zero. Existing keys are read-only from this
 * script. Only metadata rows are added to Postgres.
 *
 * Idempotent: skips media rows whose `alt` already matches the source key.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import config from '../payload.config'
import path from 'node:path'
import type { Payload } from 'payload'

type AnyMap = Record<string, unknown>

const arrayWrap = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

/** s3Storage prefix configured in payload.config.ts — must stay in sync. */
const STORAGE_PREFIX = 'productions'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif'
}

const r2Client = () => {
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

const bucket = () =>
  process.env.R2_BUCKET ?? process.env.S3_BUCKET ?? 'boklanov-content'

/** Normalise an editor-stored path like `/productions/foo/poster.jpg` (or
 *  the slightly-broken `productions/foo/poster.webp` without leading slash)
 *  to the R2 object key (no leading slash). Returns null if not a relative
 *  image path under one of the allowed prefixes. */
function pathToR2Key(src: string | null | undefined): string | null {
  if (!src) return null
  if (src.startsWith('http')) return null
  const trimmed = src.replace(/^\/+/, '')
  if (!trimmed.includes('/')) return null
  const ext = path.extname(trimmed).toLowerCase()
  if (!MIME[ext]) return null
  if (
    !trimmed.startsWith('productions/') &&
    !trimmed.startsWith('about/') &&
    !trimmed.startsWith('uploads/')
  ) {
    return null
  }
  return trimmed
}

/** Walk a doc and yield every (key, credit) tuple worth backfilling. */
function collectSrcs(
  doc: AnyMap
): Array<{ key: string; credit: string | null }> {
  const seen = new Set<string>()
  const out: Array<{ key: string; credit: string | null }> = []
  const collect = (raw: unknown, credit: unknown) => {
    if (typeof raw !== 'string') return
    const key = pathToR2Key(raw)
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push({
      key,
      credit: typeof credit === 'string' && credit.length > 0 ? credit : null
    })
  }

  const media = (doc.media as AnyMap) ?? {}
  for (const k of ['poster', 'productionsPhoto', 'featuredPhoto'] as const) {
    const g = (media[k] as AnyMap) ?? {}
    collect(g.src, g.credit)
  }
  for (const g of arrayWrap<AnyMap>(media.gallery)) {
    collect(g.src, g.credit)
  }
  return out
}

/** HEAD an R2 object — metadata only, no download. Returns null if the key
 *  doesn't exist (common: typo'd src in YAML during legacy editing). */
async function headFromR2(
  client: S3Client,
  key: string
): Promise<{ mimetype: string; size: number } | null> {
  try {
    const res = await client.send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key })
    )
    const ext = path.extname(key).toLowerCase()
    return {
      mimetype: res.ContentType ?? MIME[ext] ?? 'application/octet-stream',
      size: typeof res.ContentLength === 'number' ? res.ContentLength : 0
    }
  } catch (err) {
    console.warn(
      `  ⚠ R2 HEAD failed for ${key}: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
    return null
  }
}

/** Compute the filename that, combined with the storage plugin's prefix,
 *  reconstructs the original R2 key. */
function keyToFilename(key: string): string {
  const prefixWithSlash = `${STORAGE_PREFIX}/`
  return key.startsWith(prefixWithSlash)
    ? key.slice(prefixWithSlash.length)
    : key
}

/** Insert a media row without uploading anything.
 *
 *  Uses `payload.db.create` — the low-level database adapter — instead of
 *  `payload.create`, which is the high-level API that runs validators
 *  (including upload-collection's "file is required" check) before any
 *  plugin hook can opt out. Direct adapter access bypasses validators and
 *  hooks; the s3Storage upload never triggers because we never enter the
 *  collection's afterChange pipeline.
 */
async function createMediaRow(
  payload: Payload,
  key: string,
  meta: { mimetype: string; size: number },
  credit: string | null
): Promise<void> {
  const filename = keyToFilename(key)
  await payload.db.create({
    collection: 'media',
    data: {
      filename,
      mimeType: meta.mimetype,
      filesize: meta.size,
      alt: key, // marker for idempotency
      credit: credit ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
}

async function backfillProductions(payload: Payload, client: S3Client) {
  const { docs } = await payload.find({
    collection: 'productions',
    locale: 'all',
    depth: 0,
    limit: 500,
    pagination: false
  })

  let created = 0
  let skipped = 0
  let missing = 0
  let failed = 0

  for (const doc of docs as unknown as AnyMap[]) {
    const slug = String(doc.slug)
    for (const { key, credit } of collectSrcs(doc)) {
      const existing = await payload.find({
        collection: 'media',
        where: { alt: { equals: key } },
        limit: 1,
        depth: 0
      })
      if (existing.docs[0]) {
        skipped++
        continue
      }

      const meta = await headFromR2(client, key)
      if (!meta) {
        missing++
        continue
      }

      try {
        await createMediaRow(payload, key, meta, credit)
        created++
        process.stdout.write(
          `  ✓ ${slug}/${path.basename(key)} (${meta.size} B)\n`
        )
      } catch (err) {
        failed++
        console.warn(
          `  ⚠ create failed for ${key}: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      }
    }
  }

  console.log(
    `\nProductions: ${created} created, ${skipped} already in DB, ${missing} not in R2, ${failed} insert errors`
  )
}

async function backfillAbout(payload: Payload, client: S3Client) {
  const about = (await payload.findGlobal({
    slug: 'about',
    locale: 'all',
    depth: 0
  })) as unknown as AnyMap

  const candidates: Array<{ key: string; credit: string | null }> = []

  const portrait = (about.portrait as AnyMap) ?? {}
  if (typeof portrait.src === 'string') {
    const k = pathToR2Key(portrait.src)
    if (k) {
      candidates.push({
        key: k,
        credit:
          typeof portrait.credit === 'string' && portrait.credit.length > 0
            ? portrait.credit
            : null
      })
    }
  }
  for (const p of arrayWrap<AnyMap>(about.photos)) {
    if (typeof p.src === 'string') {
      const k = pathToR2Key(p.src)
      if (k) {
        candidates.push({
          key: k,
          credit:
            typeof p.credit === 'string' && p.credit.length > 0
              ? p.credit
              : null
        })
      }
    }
  }

  let created = 0
  for (const { key, credit } of candidates) {
    const existing = await payload.find({
      collection: 'media',
      where: { alt: { equals: key } },
      limit: 1
    })
    if (existing.docs[0]) continue

    const meta = await headFromR2(client, key)
    if (!meta) continue

    try {
      await createMediaRow(payload, key, meta, credit)
      created++
      process.stdout.write(`  ✓ about/${path.basename(key)}\n`)
    } catch (err) {
      console.warn(
        `  ⚠ create failed for ${key}: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }
  console.log(`About: ${created} created`)
}

async function main() {
  console.log('Initialising Payload + R2…')
  const payload = await getPayload({ config })
  const client = r2Client()

  console.log('\nBackfilling productions media…')
  await backfillProductions(payload, client)

  console.log('\nBackfilling about media…')
  await backfillAbout(payload, client)

  console.log('\n✓ done')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
