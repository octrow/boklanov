'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `history.tour` array — each row is a localized `city`
 * string. Surfaces the current-locale city (or any non-empty fallback)
 * on the collapsed row.
 *
 * Slotted via `admin.components.RowLabel`. Per PAYLOAD_POLISH_PLAN §3.3
 * option 1: zero schema change, pure UI win.
 */
export default function CityRowLabel() {
  const { data, rowNumber } = useRowLabel<{ city?: string }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  return <span>{data?.city?.trim() || fallback}</span>
}
