'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `recognition.externalLinks` — shows the localized
 * `label`, falling back to the URL hostname.
 */
export default function LinkRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; url?: string }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const label = data?.label?.trim()
  if (label) return <span>{label}</span>
  if (data?.url) {
    let display = data.url
    try {
      display = new URL(data.url).hostname
    } catch {
      // fall back to raw URL
    }
    return <span>{display}</span>
  }
  return <span>{fallback}</span>
}
