/**
 * scripts/fill-gallery-dims.ts — store width/height for every gallery photo
 * that has none. New photos get it from the galleryDims hook; this fills the
 * rows saved before the hook existed.
 *
 *   npx tsx scripts/fill-gallery-dims.ts [--apply]
 *
 * Writes the two columns with plain SQL rather than payload.update, so the
 * gallery array (and its per-locale captions) is never re-saved. Images are
 * measured from NEXT_PUBLIC_CDN_BASE. Dry run by default; --apply writes all
 * of it in one transaction. Revalidation is skipped: revalidate the
 * `productions` tag after --apply.
 */
import 'dotenv/config'
import pg from 'pg'

import { probeImageSize } from '../lib/imageSize'

// Parallel downloads: enough to finish ~450 photos in a few minutes without
// hammering the CDN.
const CONCURRENCY = 6

const apply = process.argv.includes('--apply')
const dbUrl = process.env.DATABASE_URL ?? ''
// Same guard as payload.config.ts: prod only on purpose.
if (dbUrl.includes('neon.tech') && process.env.ALLOW_PROD_DB !== '1') {
  throw new Error('DATABASE_URL is production Neon; set ALLOW_PROD_DB=1')
}

const client = new pg.Client({ connectionString: dbUrl })
await client.connect()
try {
  const { rows } = await client.query<{ id: string; src: string }>(
    `SELECT id, src FROM productions_media_gallery
     WHERE src <> '' AND (width IS NULL OR height IS NULL)`
  )

  const sizes = new Map<string, { width: number; height: number }>()
  let next = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < rows.length) {
        const row = rows[next++]
        const dims = await probeImageSize(row.src)
        if (dims) sizes.set(row.id, dims)
        else console.log(`  ! can't measure ${row.src}`)
      }
    })
  )

  await client.query('BEGIN')
  for (const [id, { width, height }] of sizes) {
    await client.query(
      'UPDATE productions_media_gallery SET width = $2, height = $3 WHERE id = $1',
      [id, width, height]
    )
  }
  await client.query(apply ? 'COMMIT' : 'ROLLBACK')
  console.log(
    `${apply ? 'written' : 'dry run'}: ${sizes.size} filled, ${rows.length - sizes.size} failed, ${rows.length} unmeasured`
  )
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  throw err
} finally {
  await client.end()
}
