/**
 * scripts/backfill-media.ts
 *
 * One-shot: populate the Payload `media` collection by re-uploading every
 * image currently referenced by `Productions.media.*.src` + `gallery[].src`
 * + `About.portrait.src` + `About.photos[].src`.
 *
 * Run with: npm run payload:backfill-media
 *
 * Honest tradeoff (PAYLOAD_MIGRATION_PLAN §Q2 default was "don't do this"):
 *
 *   - Existing R2 keys (`productions/<slug>/poster.jpg`) stay in place and
 *     the live site keeps serving them via NEXT_PUBLIC_CDN_BASE.
 *   - This script downloads each unique image from R2 and re-uploads it
 *     through Payload's s3Storage plugin, which writes a SECOND copy under
 *     a different R2 key (`productions/<filename>`, no slug subdir,
 *     possibly suffixed to avoid collisions).
 *   - The `media` collection then has one row per image. /admin/collections/media
 *     is no longer empty.
 *   - Productions still reference the ORIGINAL R2 paths via their string
 *     `src` fields. Nothing on the public site changes.
 *
 * So this is a "make the gallery view useful" pass, not a true migration.
 * If you want to also rewire productions to reference media rows via
 * `upload: true` relationships, that requires schema changes + a second
 * migration. Deferred until / if Roman needs it.
 *
 * Idempotent: skips media rows whose `alt` already matches the source key.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import config from '../payload.config'
import path from 'node:path'
import type { Payload } from 'payload'

type AnyMap = Record<string, unknown>

const arrayWrap = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

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

/** Walk a doc and yield every (label, src) tuple worth backfilling. */
function* collectSrcs(
  doc: AnyMap
): Generator<{ key: string; credit: string | null }> {
  const seen = new Set<string>()
  const yieldIf = (
    raw: unknown,
    credit: unknown
  ): { key: string; credit: string | null } | null => {
    if (typeof raw !== 'string') return null
    const key = pathToR2Key(raw)
    if (!key) return null
    if (seen.has(key)) return null
    seen.add(key)
    return {
      key,
      credit: typeof credit === 'string' && credit.length > 0 ? credit : null
    }
  }
  const collect = (raw: unknown, credit: unknown) => {
    const result = yieldIf(raw, credit)
    if (result) emit.push(result)
  }
  const emit: Array<{ key: string; credit: string | null }> = []

  const media = (doc.media as AnyMap) ?? {}
  for (const k of ['poster', 'productionsPhoto', 'featuredPhoto'] as const) {
    const g = (media[k] as AnyMap) ?? {}
    collect(g.src, g.credit)
  }
  for (const g of arrayWrap<AnyMap>(media.gallery)) {
    collect(g.src, g.credit)
  }
  yield* emit
}

async function fetchFromR2(
  client: S3Client,
  key: string
): Promise<{ data: Buffer; mimetype: string; size: number } | null> {
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket(), Key: key })
    )
    if (!res.Body) return null
    const chunks: Buffer[] = []
    // Body is a Node Readable in SDK v3; the typing is broad but iterates fine.
    for await (const c of res.Body as AsyncIterable<Buffer | string>) {
      chunks.push(typeof c === 'string' ? Buffer.from(c) : Buffer.from(c))
    }
    const data = Buffer.concat(chunks)
    const ext = path.extname(key).toLowerCase()
    return {
      data,
      mimetype: res.ContentType ?? MIME[ext] ?? 'application/octet-stream',
      size: data.byteLength
    }
  } catch (err) {
    console.warn(
      `  ⚠ R2 fetch failed for ${key}: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
    return null
  }
}

async function backfillProductions(payload: Payload, client: S3Client) {
  // pagination:false + locale:'all' pulls everything.
  const { docs } = await payload.find({
    collection: 'productions',
    locale: 'all',
    depth: 0,
    limit: 500,
    pagination: false
  })

  let created = 0
  let skipped = 0
  let failed = 0

  for (const doc of docs as unknown as AnyMap[]) {
    const slug = String(doc.slug)
    for (const { key, credit } of collectSrcs(doc)) {
      // Idempotency: skip if a media row already exists with this exact R2
      // key remembered in its `alt` field (we abuse alt as a marker).
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

      const file = await fetchFromR2(client, key)
      if (!file) {
        failed++
        continue
      }

      const filename = path.basename(key)
      try {
        await payload.create({
          collection: 'media',
          file: {
            data: file.data,
            mimetype: file.mimetype,
            name: filename,
            size: file.size
          },
          data: {
            // Stash the original R2 key in `alt` so the next run knows we've
            // already processed it. Roman can overwrite alt later via the
            // admin (it's just a string field, gets localized fallback chain).
            alt: key,
            credit: credit ?? null
          }
        })
        created++
        process.stdout.write(`  ✓ ${slug}/${filename}\n`)
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
    `\nProductions: ${created} created, ${skipped} skipped, ${failed} failed`
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

    const file = await fetchFromR2(client, key)
    if (!file) continue

    try {
      await payload.create({
        collection: 'media',
        file: {
          data: file.data,
          mimetype: file.mimetype,
          name: path.basename(key),
          size: file.size
        },
        data: { alt: key, credit: credit ?? null }
      })
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
