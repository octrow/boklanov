'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `recognition.awards` and `recognition.festivals` —
 * surfaces the localized `name` plus optional `year` so collapsed rows
 * read as "Золотая Маска (2022)" rather than "Row 03".
 *
 * The localized `name` arrives in the current admin locale via Payload's
 * locale switcher.
 */
export default function NameYearRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    name?: string
    year?: number | null
  }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const name = data?.name?.trim()
  if (name && data?.year) return <span>{`${name} (${data.year})`}</span>
  return <span>{name || (data?.year ? String(data.year) : fallback)}</span>
}
