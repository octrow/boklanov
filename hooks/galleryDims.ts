import type { CollectionBeforeChangeHook } from 'payload'

import { probeImageSize } from '../lib/imageSize'

type Photo = {
  id?: string | null
  src?: string | null
  width?: number | null
  height?: number | null
}

/** Store each gallery photo's pixel size when it is added or its path
 *  changes, so the gallery grid reserves the right box before the image
 *  loads. A failed probe stores null and the photo renders without a
 *  reserved box. */
export const galleryDims: CollectionBeforeChangeHook = async ({
  data,
  originalDoc
}) => {
  const gallery: Photo[] | undefined = data?.media?.gallery
  if (!Array.isArray(gallery) || gallery.length === 0) return data

  // The admin form sends the hidden fields back, so a photo whose path was
  // edited still carries the old size: compare against the stored row.
  const prevSrc = new Map(
    ((originalDoc?.media?.gallery ?? []) as Photo[]).map((g) => [g.id, g.src])
  )
  const stale = (g: Photo) =>
    Boolean(g.src) &&
    (!g.width ||
      !g.height ||
      (prevSrc.has(g.id) && prevSrc.get(g.id) !== g.src))
  if (!gallery.some(stale)) return data

  const measured = await Promise.all(
    gallery.map(async (g) => {
      if (!stale(g)) return g
      const dims = await probeImageSize(g.src!)
      return { ...g, width: dims?.width ?? null, height: dims?.height ?? null }
    })
  )
  return { ...data, media: { ...data.media, gallery: measured } }
}
