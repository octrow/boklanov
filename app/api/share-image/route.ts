import sharp from 'sharp'

import { cdnUrl } from '@/lib/cdn'
import { getAbout } from '@/lib/content'

const WIDTH = 1200
const HEIGHT = 630
// The URL carries ?v=<path hash> (lib/shareImage.ts), so a cached response
// never outlives the photo it was cut from.
const CACHE = 'public, max-age=86400, s-maxage=31536000'

/** About › Share preview, cropped to 1200×630 JPEG around the most salient
 *  area — editors can pick any photo without preparing a social crop. */
export async function GET(req: Request): Promise<Response> {
  const fallback = Response.redirect(new URL('/og.jpg', req.url), 307)
  const src = cdnUrl((await getAbout()).shareImage)
  if (!src) return fallback

  const res = await fetch(src)
  if (!res.ok) {
    console.error(`share-image: ${src} → ${res.status}`)
    return fallback
  }
  let jpeg: Buffer
  try {
    jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize(WIDTH, HEIGHT, {
        fit: 'cover',
        position: sharp.strategy.attention
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer()
  } catch (err) {
    // A file sharp can't decode must not take the preview down with it.
    console.error(`share-image: cannot decode ${src}`, err)
    return fallback
  }
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': CACHE }
  })
}
