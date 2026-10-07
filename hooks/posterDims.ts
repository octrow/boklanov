import type { CollectionBeforeChangeHook } from 'payload'

import { probeImageSize } from '../lib/imageSize'

type Poster = {
  src?: string | null
  width?: number | null
  height?: number | null
}

/** Store the poster's pixel size whenever its path changes, so the
 *  production page reserves the right box (landscape posters too) before
 *  the image loads. A failed probe stores null and the page falls back to
 *  the portrait default. */
export const posterDims: CollectionBeforeChangeHook = async ({
  data,
  originalDoc
}) => {
  const poster: Poster | undefined = data?.media?.poster
  if (!poster) return data
  // Same path and the size already in the payload (the admin form sends the
  // hidden fields back; the backfill sets them): nothing to measure.
  const prev: Poster | undefined = originalDoc?.media?.poster
  if (poster.src === prev?.src && poster.width && poster.height) {
    return data
  }
  const dims = poster.src ? await probeImageSize(poster.src) : null
  return {
    ...data,
    media: {
      ...data.media,
      poster: {
        ...poster,
        width: dims?.width ?? null,
        height: dims?.height ?? null
      }
    }
  }
}
