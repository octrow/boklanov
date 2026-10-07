import { cdnUrl } from './cdn'

const PROBE_TIMEOUT_MS = 15_000

/** Pixel size of an image path as displayed (EXIF rotation applied), or null
 *  when it can't be fetched or decoded. Used to store poster dimensions so
 *  the page reserves the right box before the image loads. */
export async function probeImageSize(
  src: string
): Promise<{ width: number; height: number } | null> {
  // Only paths under the CDN: an absolute URL typed into the field is not
  // fetched server-side.
  if (/^[a-z]+:/i.test(src)) return null
  const url = cdnUrl(src)
  if (!url?.startsWith('http')) return null
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS)
    })
    if (!res.ok) return null
    const { default: sharp } = await import('sharp')
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata()
    const { width, height } = meta.autoOrient ?? meta
    return width && height ? { width, height } : null
  } catch (err) {
    console.warn(
      `[imageSize] ${url}: ${err instanceof Error ? err.message : String(err)}`
    )
    return null
  }
}
