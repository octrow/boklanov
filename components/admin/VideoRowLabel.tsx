'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `media.videos` — `<provider>:<id>` matches the legacy
 * Keystatic itemLabel exactly.
 */
export default function VideoRowLabel() {
  const { data, rowNumber } = useRowLabel<{ provider?: string; id?: string }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  if (data?.provider && data?.id) {
    return (
      <span>
        {data.provider}:{data.id}
      </span>
    )
  }
  return <span>{data?.id || fallback}</span>
}
