'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `team.creditsRu`, `team.creditsEn`, `team.creditsDe` —
 * `<role> — <name>` matches the legacy Keystatic itemLabel.
 */
export default function CreditRowLabel() {
  const { data, rowNumber } = useRowLabel<{ role?: string; name?: string }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const role = data?.role?.trim()
  const name = data?.name?.trim()
  if (role && name) return <span>{`${role} — ${name}`}</span>
  return <span>{name || role || fallback}</span>
}
