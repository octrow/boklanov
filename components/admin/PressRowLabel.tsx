'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `recognition.press` — `<outlet> — <title>` (title is
 * localized; the current admin-locale value comes in via useRowLabel).
 */
export default function PressRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    title?: string
    outlet?: string
  }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const outlet = data?.outlet?.trim()
  const title = data?.title?.trim()
  if (outlet && title) return <span>{`${outlet} — ${title}`}</span>
  return <span>{outlet || title || fallback}</span>
}
