'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `about.timeline.milestones` — `<year> — <label>` so the
 * collapsed taymlayn row reads as "2018 — Премьера в БТК".
 *
 * Localized `label` arrives in the current admin locale via useRowLabel.
 */
export default function MilestoneRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    year?: number | null
    label?: string
  }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const label = data?.label?.trim()
  const year = data?.year
  if (year && label) return <span>{`${year} — ${label}`}</span>
  return <span>{label || (year ? String(year) : fallback)}</span>
}
