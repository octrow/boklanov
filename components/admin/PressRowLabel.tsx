'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `recognition.press` — `<outlet> — <title>` (title is
 * localized; the current admin-locale value comes in via useRowLabel).
 * Soft check: an item with neither link nor outlet can't be traced to a
 * source, so the label says so instead of blocking Save (review №3, п. 5).
 */
export default function PressRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    title?: string
    outlet?: string
    url?: string
  }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const outlet = data?.outlet?.trim()
  const title = data?.title?.trim()
  const text =
    outlet && title ? `${outlet} — ${title}` : outlet || title || fallback
  const unsourced = !outlet && !data?.url?.trim()
  return (
    <span>
      {text}
      {unsourced && (
        <span style={{ color: 'var(--theme-error-600)' }}>
          {' · нет ссылки и издания'}
        </span>
      )}
    </span>
  )
}
