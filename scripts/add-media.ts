/**
 * scripts/add-media.ts — add a poster, gallery photos and videos to existing
 * productions from a reviewed JSON file. Images are downloaded, re-encoded
 * to WebP, uploaded to R2 with their AVIF variants, then written to
 * media.poster / media.gallery / media.videos.
 *
 *   npx tsx scripts/add-media.ts <media.json> [--apply]
 *
 * JSON: { <slug>: { poster?: { url, credit? }, gallery?: [{ url, credit? }],
 *                   videos?: [{ provider: 'youtube'|'vimeo', id }] } }
 *
 * Only fills what is empty: a poster is set when the production has none,
 * gallery photos are added when its gallery is empty, videos are appended
 * when their id is not there yet. Re-running is a no-op. Dry run by
 * default. Revalidation is skipped: revalidate the `productions` tag after
 * --apply.
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

type Image = { url: string; credit?: string }
type Video = { provider: 'youtube' | 'vimeo'; id: string }
type Spec = Record<
  string,
  { poster?: Image; gallery?: Image[]; videos?: Video[] }
>

const POSTER_MAX_WIDTH = 1200
const PHOTO_MAX_WIDTH = 1600
const QUALITY = 86

const file = process.argv[2]
if (!file || file.startsWith('--')) {
  console.error('usage: npx tsx scripts/add-media.ts <media.json> [--apply]')
  process.exit(1)
}
const apply = process.argv.includes('--apply')
const spec = JSON.parse(readFileSync(file, 'utf8')) as Spec

const client = apply ? makeR2Client() : null
const bucket = apply ? r2Bucket() : ''

/** Download, re-encode, upload (when --apply) and bake variants. */
const upload = async (url: string, key: string, maxWidth: number) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const img = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer({ resolveWithObject: true })
  console.log(
    `    ${key} ← ${url.slice(0, 70)} (${img.info.width}×${img.info.height}, ${Math.round(img.data.length / 1024)} KB)`
  )
  if (client) {
    if (!(await r2HeadExists(client, bucket, key)))
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: img.data,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable'
        })
      )
    const bake = await bakeVariantsFromBuffer(img.data, key, client, bucket)
    if (bake.failures.length) throw new Error(bake.failures[0].message)
  }
  return { src: `/${key}`, width: img.info.width, height: img.info.height }
}

const payload = await getPayload({ config })
let writes = 0
for (const [slug, want] of Object.entries(spec)) {
  const { docs } = await payload.find({
    collection: 'productions',
    where: { slug: { equals: slug } },
    locale: 'ru',
    depth: 0,
    limit: 1
  })
  const doc = docs[0]
  if (!doc) {
    console.log(`  ! slug ${slug} not found — skipped`)
    continue
  }
  const media = doc.media ?? {}
  const data: Record<string, unknown> = {}
  console.log(`■ ${slug}`)

  if (want.poster && !media.poster?.src) {
    const p = await upload(
      want.poster.url,
      `productions/${slug}/poster.webp`,
      POSTER_MAX_WIDTH
    )
    data.poster = { ...p, credit: want.poster.credit ?? null }
  } else if (want.poster) console.log('    poster already set — kept')

  if (want.gallery?.length && !media.gallery?.length) {
    const rows: { src: string; credit: string | null }[] = []
    for (const [i, g] of want.gallery.entries()) {
      const key = `productions/${slug}/${String(i + 1).padStart(2, '0')}.webp`
      const { src } = await upload(g.url, key, PHOTO_MAX_WIDTH)
      rows.push({ src, credit: g.credit ?? null })
    }
    data.gallery = rows
  } else if (want.gallery?.length)
    console.log(`    gallery has ${media.gallery?.length} photo(s) — kept`)

  const videos = media.videos ?? []
  const newVideos = (want.videos ?? []).filter(
    (v) => !videos.some((x) => x.id === v.id)
  )
  for (const v of newVideos) console.log(`    video ${v.provider} ${v.id}`)
  if (newVideos.length) data.videos = [...videos, ...newVideos]

  if (!Object.keys(data).length) {
    console.log('    nothing to add')
    continue
  }
  if (apply) {
    await payload.update({
      collection: 'productions',
      id: doc.id,
      locale: 'ru',
      data: { media: { ...media, ...data } } as Partial<Production>,
      context: { disableRevalidate: true }
    })
    writes++
  }
}
console.log(
  `\n${writes} write(s)${apply ? '' : ' — dry run, nothing uploaded or written'}`
)
process.exit(0)
