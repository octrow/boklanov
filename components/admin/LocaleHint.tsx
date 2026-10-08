'use client'

import React from 'react'
import { useLocale } from '@payloadcms/ui'
import {
  useAllLocales,
  LOCALES,
  isLocaleCode,
  type LocaleCode
} from './LocalizedDocContext'
import { toPlainText } from './plainText'

/**
 * Slotted as `admin.components.afterInput` on every localized text /
 * textarea / richText field. Read-only:
 *  - on EN/DE pages, shows the RU original under the field, so translating
 *    needs no second tab;
 *  - lists the locales still missing a translation.
 * Editing always happens in the field above, for the page locale chosen in
 * the document header (LocaleSwitch), and goes live on Save.
 */

const wrapStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--theme-elevation-800)'
}

const sourceStyle: React.CSSProperties = {
  margin: '4px 0 0',
  padding: '6px 10px',
  borderLeft: '1px solid var(--theme-elevation-400)',
  whiteSpace: 'pre-line',
  maxHeight: '14em',
  overflowY: 'auto'
}

const LocaleHint: React.FC<{ path?: string }> = ({ path }) => {
  const code = useLocale().code
  const active: LocaleCode = isLocaleCode(code) ? code : 'ru'
  const values = useAllLocales(path ?? '')
  if (!path || !values) return null

  const text = Object.fromEntries(
    LOCALES.map((l) => [l, toPlainText(values[l]).trim()])
  ) as Record<LocaleCode, string>
  const showSource = active !== 'ru' && text.ru !== ''
  // Nothing to translate from when RU is empty, so no nagging then.
  const missing =
    text.ru === '' ? [] : LOCALES.filter((l) => l !== active && !text[l])
  if (!showSource && missing.length === 0) return null

  return (
    <div style={wrapStyle}>
      {showSource && (
        <>
          <div>Оригинал (RU):</div>
          <p lang='ru' style={sourceStyle}>
            {text.ru}
          </p>
        </>
      )}
      {missing.length > 0 && (
        <div style={{ marginTop: showSource ? 6 : 0 }}>
          Нет перевода: {missing.map((l) => l.toUpperCase()).join(', ')}
        </div>
      )}
    </div>
  )
}

export default LocaleHint
