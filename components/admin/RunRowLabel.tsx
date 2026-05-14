'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `history.runs` — surfaces venue, city, and year range.
 * Localized fields (venue, city) arrive in the current admin locale.
 */
export default function RunRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    venue?: string
    city?: string
    yearFrom?: number | null
    yearTo?: number | null
  }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const venue = data?.venue?.trim()
  const city = data?.city?.trim()
  const head = [venue, city].filter(Boolean).join(', ')
  const years =
    data?.yearFrom && data?.yearTo
      ? data.yearFrom === data.yearTo
        ? `${data.yearFrom}`
        : `${data.yearFrom}–${data.yearTo}`
      : data?.yearFrom || data?.yearTo || ''
  if (head && years) return <span>{`${head} (${years})`}</span>
  return <span>{head || years || fallback}</span>
}
