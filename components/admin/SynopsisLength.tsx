'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import { toPlainText } from './plainText'

/** Character count under the synopsis. Soft limit: it warns, never blocks
 *  Save — the synopsis feeds <meta description> and the one-line summary on
 *  the page, so longer prose belongs in the body (review №3, п. 2). */
const SYNOPSIS_MAX = 300

const SynopsisLength: React.FC<{ path?: string }> = ({ path }) => {
  const { value } = useField<unknown>({ path: path ?? '' })
  const n = toPlainText(value).trim().length
  if (!path || n === 0) return null
  const over = n > SYNOPSIS_MAX

  return (
    <div
      style={{
        marginTop: 8,
        fontSize: 13,
        color: over ? 'var(--theme-error-600)' : 'var(--theme-elevation-500)'
      }}
    >
      {n} / {SYNOPSIS_MAX}
      {over && ' — длинно для синопсиса: остальное перенесите в «Полный текст»'}
    </div>
  )
}

export default SynopsisLength
