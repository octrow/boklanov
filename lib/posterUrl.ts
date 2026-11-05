import { cdnUrl } from './cdn'

/** Absolute poster URL for the OG image and JSON-LD. Admin uploads live in
 *  R2 only, so the CDN is the source; with no CDN (local dev) the site origin
 *  serves `public/`. */
export function absolutePosterUrl(src: string, origin: string): string {
  const url = cdnUrl(src) ?? src
  return url.startsWith('http') ? url : `${origin}${url}`
}

/** satori draws JPEG and PNG only; webp and avif render blank. */
export function satoriCanDraw(src: string): boolean {
  return !/\.(webp|avif)$/i.test(src)
}
