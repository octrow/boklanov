'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `media.gallery` — surface the image filename (or caption
 * fallback) so collapsed rows are scannable.
 */
export default function GalleryRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    src?: string
    caption?: string
    credit?: string
  }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const basename = data?.src?.split('/').pop()
  return (
    <span>
      {basename || data?.caption?.trim() || data?.credit?.trim() || fallback}
    </span>
  )
}
