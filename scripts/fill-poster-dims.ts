/**
 * scripts/fill-poster-dims.ts — store media.poster.width/height for every
 * production that has a poster but no stored size. New saves get it from
 * the posterDims hook; this fills the rows saved before the hook existed.
 *
 *   npx tsx scripts/fill-poster-dims.ts [--apply]
 *
 * Images are measured from NEXT_PUBLIC_CDN_BASE. Dry run by default.
 * Revalidation is skipped: revalidate the `productions` tag after --apply.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { probeImageSize } from '../lib/imageSize'

const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'productions',
  depth: 0,
  limit: 500,
  pagination: false
})

let filled = 0
let failed = 0
for (const doc of docs) {
  const poster = doc.media?.poster
  if (!poster?.src || (poster.width && poster.height)) continue
  const dims = await probeImageSize(poster.src)
  if (!dims) {
    failed++
    console.log(`  ! ${doc.slug}: can't measure ${poster.src}`)
    continue
  }
  filled++
  console.log(`  + ${doc.slug}: ${dims.width}×${dims.height}`)
  if (apply) {
    await payload.update({
      collection: 'productions',
      id: doc.id,
      data: { media: { ...doc.media, poster: { ...poster, ...dims } } },
      context: { disableRevalidate: true }
    })
  }
}
console.log(
  `${apply ? 'written' : 'dry run'}: ${filled} filled, ${failed} failed, ${docs.length} productions`
)
process.exit(0)
