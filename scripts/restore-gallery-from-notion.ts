/**
 * scripts/restore-gallery-from-notion.ts — upload gallery photos that are in
 * Payload but were never uploaded to R2 (68 at 2026-10-06; the site hides
 * them, see lib/content.ts checkImagesInR2). The originals are in the local
 * Notion export (notion-data/, gitignored), under:
 *   - the same filename (most);
 *   - a "__копия" suffix (2 in online);
 *   - Cyrillic where Payload has the transliteration (nikita: Никита_ищет_море).
 *
 *   npx tsx scripts/restore-gallery-from-notion.ts [--apply]
 *
 * Dry run by default. --apply PUTs each original at its `src` key plus the
 * AVIF variants. Never overwrites: only keys absent from the bucket are
 * written. DB access is read-only. Revalidate the `productions` tag after.
 */

import 'dotenv/config'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import config from '../payload.config'
import {
  bakeVariantsFromBuffer,
  makeR2Client,
  r2Bucket
} from '../lib/image-variants'
import { transliterate } from '../lib/translit'

const NOTION_DIR = 'notion-data'
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

/** Notion filename → the name Payload stores: URL-decoded, "__копия"
 *  dropped, Cyrillic transliterated (lowercases, so compare lowercased). */
const normalize = (file: string): string =>
  transliterate(decodeURIComponent(file).replace(/__копия(?=\.[^.]+$)/, ''))

function indexNotion(dir: string, out = new Map<string, string>()) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) indexNotion(p, out)
    else if (MIME[path.extname(name).toLowerCase()]) {
      out.set(name.toLowerCase(), p)
      out.set(normalize(name), p)
    }
  }
  return out
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const client = makeR2Client()
  const bucket = r2Bucket()

  const keys = new Set<string>()
  let token: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })
    )
    for (const o of res.Contents ?? []) if (o.Key) keys.add(o.Key)
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'productions',
    depth: 0,
    limit: 500,
    pagination: false
  })
  const notion = indexNotion(NOTION_DIR)

  let found = 0
  let notFound = 0
  for (const doc of docs) {
    for (const g of doc.media?.gallery ?? []) {
      const src = g.src
      if (!src || /^https?:/i.test(src)) continue
      const key = src.replace(/^\/+/, '')
      if (keys.has(key)) continue
      const local = notion.get(path.basename(key).toLowerCase())
      if (!local) {
        notFound++
        console.log(`  ! ${doc.slug}: ${key} — not in notion-data`)
        continue
      }
      found++
      console.log(`  + ${key} ← ${path.relative(NOTION_DIR, local)}`)
      if (!apply) continue
      const bytes = readFileSync(local)
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: MIME[path.extname(key).toLowerCase()]
        })
      )
      const res = await bakeVariantsFromBuffer(bytes, key, client, bucket)
      if (res.failures.length)
        console.log(`    variants failed: ${res.failures.length}`)
    }
  }
  console.log(
    `\n${found} to upload, ${notFound} not found${apply ? ' — uploaded' : ' — dry run, nothing written'}`
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
