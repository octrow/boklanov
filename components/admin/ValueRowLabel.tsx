'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `array<{ value: text }>` fields (taxonomy.form, .lineage,
 * .tags). Surfaces the inner `value` string on the collapsed row so the
 * editor reads the actual tag — not just "Row 02".
 *
 * Slotted via `admin.components.RowLabel` on the parent array. Per
 * PAYLOAD_POLISH_PLAN §3.3 option 1: zero schema change, pure UI win.
 */
export default function ValueRowLabel() {
  const { data, rowNumber } = useRowLabel<{ value?: string }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  return <span>{data?.value?.trim() || fallback}</span>
}
