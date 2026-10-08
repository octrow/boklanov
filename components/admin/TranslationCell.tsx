import React from 'react'
import type { DefaultServerCellComponentProps } from 'payload'
import { untranslatedById } from './untranslated'

/**
 * Productions list column «Нет перевода»: EN / DE badges for the languages
 * the production is Untranslated into (CONTEXT.md); empty when it reads in
 * all three. Server component — a list row only carries the current
 * locale, so the check runs on one all-locales query shared by the cells.
 */
export default async function TranslationCell({
  payload,
  rowData
}: DefaultServerCellComponentProps) {
  const missing = (await untranslatedById(payload)).get(String(rowData?.id))
  if (!missing?.length) return null
  return (
    <span className='list-untranslated'>
      {missing.map((l) => (
        <span key={l} className='list-untranslated__lang'>
          {l.toUpperCase()}
        </span>
      ))}
    </span>
  )
}
