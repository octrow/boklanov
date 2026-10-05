'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * RowLabel for `about.margins.marginalia` — shows a short preview of the
 * localized `note` text. Truncates at 60 chars so long notes don't
 * overflow the collapsed row.
 */
export default function NoteRowLabel() {
  const { data, rowNumber } = useRowLabel<{ note?: string }>()
  const fallback = `${(rowNumber ?? 0) + 1}`.padStart(2, '0')
  const note = data?.note?.trim()
  if (!note) return <span>{fallback}</span>
  return <span>{note.length > 60 ? `${note.slice(0, 60)}…` : note}</span>
}
