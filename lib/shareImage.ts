import { createHash } from 'node:crypto'

import { DEFAULT_OG_IMAGE } from '@/lib/baseUrl'
import { getAbout } from '@/lib/content'

/** og:image for every page without its own: the About › Share preview photo
 *  (cropped by /api/share-image) or the bundled portrait. `v` changes with
 *  the path, so Telegram/VK re-fetch instead of keeping their cached copy. */
export async function getShareImage(): Promise<typeof DEFAULT_OG_IMAGE> {
  const { shareImage } = await getAbout()
  if (!shareImage) return DEFAULT_OG_IMAGE
  // ponytail: keyed on the path only; re-uploading under the same file name
  // keeps the old preview cached. Hash the bytes if that ever bites.
  const v = createHash('sha1').update(shareImage).digest('hex').slice(0, 10)
  return { ...DEFAULT_OG_IMAGE, url: `/api/share-image?v=${v}` }
}
