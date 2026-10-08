/**
 * scripts/add-production.ts — create one production from a reviewed JSON
 * file: poster from a URL (re-encoded to WebP, uploaded to R2 with its AVIF
 * variants), then the document in ru, en and de.
 *
 *   npx tsx scripts/add-production.ts <production.json> [--apply] [--skip-r2]
 *
 * JSON: { slug, posterUrl, common: {...}, ru: {...}, en: {...}, de: {...} }
 * `common` holds non-localized fields; each locale object holds that
 * locale's localized fields. Rich text is { paragraphs: string[] }. Array
 * rows with localized keys (recognition.press) are created in ru and get
 * their en/de keys by index.
 *
 * Skips if the slug already exists. Dry run by default. --skip-r2 creates
 * the document without uploading (local DB tests). Revalidation is skipped:
 * revalidate the `productions` tag after --apply.
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { getPayload } from 'payload'
import config from '../payload.config'
import type { Production } from '../payload-types'
import {
  bakeVariantsFromBuffer,
  makeR2Client,
  r2Bucket,
  r2HeadExists
} from '../lib/image-variants'

type Row = Record<string, unknown>
type Spec = {
  slug: string
  posterUrl: string
  common: Row
  ru: Row
  en: Row
  de: Row
}

const POSTER_MAX_WIDTH = 1200
const POSTER_QUALITY = 86

const file = process.argv[2]
if (!file || file.startsWith('--')) {
  console.error(
    'usage: npx tsx scripts/add-production.ts <production.json> [--apply] [--skip-r2]'
  )
  process.exit(1)
}
const apply = process.argv.includes('--apply')
const skipR2 = process.argv.includes('--skip-r2')
const spec = JSON.parse(readFileSync(file, 'utf8')) as Spec

const lexical = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      textStyle: '',
      children: [
        {
          type: 'text',
          mode: 'normal',
          text,
          style: '',
          detail: 0,
          format: 0,
          version: 1
        }
      ]
    }))
  }
})

/** Deep-convert { paragraphs } leaves to Lexical. */
const richify = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(richify)
  if (v && typeof v === 'object') {
    if ('paragraphs' in v)
      return lexical((v as { paragraphs: string[] }).paragraphs)
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, richify(x)])
    )
  }
  return v
}

/** Deep merge, objects only; arrays and scalars from `b` win. */
const merge = (a: Row, b: Row): Row =>
  Object.fromEntries(
    [...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => {
      const x = a[k]
      const y = b[k]
      const both =
        x &&
        y &&
        typeof x === 'object' &&
        typeof y === 'object' &&
        !Array.isArray(x) &&
        !Array.isArray(y)
      return [k, both ? merge(x as Row, y as Row) : (y ?? x)]
    })
  )

const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'productions',
  where: { slug: { equals: spec.slug } },
  depth: 0,
  limit: 1
})
if (existing.docs.length) {
  console.log(
    `  ${spec.slug} already exists (id ${existing.docs[0].id}) — nothing to do`
  )
  process.exit(0)
}

const res = await fetch(spec.posterUrl)
if (!res.ok) throw new Error(`poster download failed: HTTP ${res.status}`)
const poster = await sharp(Buffer.from(await res.arrayBuffer()))
  .resize({ width: POSTER_MAX_WIDTH, withoutEnlargement: true })
  .webp({ quality: POSTER_QUALITY })
  .toBuffer({ resolveWithObject: true })
const key = `productions/${spec.slug}/poster.webp`
console.log(
  `  poster → ${key} (${poster.info.width}×${poster.info.height}, ${Math.round(poster.data.length / 1024)} KB)`
)

const ruData = richify(
  merge(merge(spec.common, spec.ru), {
    slug: spec.slug,
    media: {
      poster: {
        src: `/${key}`,
        width: poster.info.width,
        height: poster.info.height
      }
    }
  })
) as Row
console.log(
  `  create ${spec.slug}: ${JSON.stringify(ruData).length} bytes of ru data, then en and de`
)

if (!apply) {
  console.log('\ndry run — nothing uploaded or written')
  process.exit(0)
}

if (!skipR2) {
  const client = makeR2Client()
  const bucket = r2Bucket()
  if (await r2HeadExists(client, bucket, key)) {
    console.log(`  ${key} already in R2 — kept`)
  } else {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: poster.data,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable'
      })
    )
    console.log(`  uploaded ${key}`)
  }
  const bake = await bakeVariantsFromBuffer(poster.data, key, client, bucket)
  console.log(
    `  variants: ${bake.built} built, ${bake.skipped} skipped, ${bake.failures.length} failed`
  )
  if (bake.failures.length) throw new Error(bake.failures[0].message)
}

const created = await payload.create({
  collection: 'productions',
  locale: 'ru',
  data: ruData as unknown as Production,
  context: { disableRevalidate: true }
})
console.log(`  created id ${created.id} (ru)`)

for (const locale of ['en', 'de'] as const) {
  const doc = (await payload.findByID({
    collection: 'productions',
    id: created.id,
    locale,
    fallbackLocale: false,
    depth: 0
  })) as unknown as Row
  const data = richify(spec[locale]) as Row
  const press = (data.recognition as Row | undefined)?.press as
    | Row[]
    | undefined
  if (press) {
    const rows = ((doc.recognition as Row).press as Row[]).map((row, i) => ({
      ...row,
      ...press[i]
    }))
    data.recognition = { ...(data.recognition as Row), press: rows }
  }
  await payload.update({
    collection: 'productions',
    id: created.id,
    locale,
    data: data as Partial<Production>,
    context: { disableRevalidate: true }
  })
  console.log(`  updated ${locale}`)
}
process.exit(0)
