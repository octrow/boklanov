'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `about.timeline.lineage` — surfaces localized `name`
 * (falling back to the stable `key` slug). Optional `role` is appended
 * in parentheses when present so collapsed rows distinguish multiple
 * entries for the same person.
 */
export default function LineageRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    key?: string
    name?: string
    role?: string
  }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const name = data?.name?.trim() || data?.key?.trim()
  const role = data?.role?.trim()
  if (name && role) return <span>{`${name} (${role})`}</span>
  return <span>{name || fallback}</span>
}
