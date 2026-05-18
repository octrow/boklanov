'use client'

import React from 'react'
import { useLocaleMode } from './LocaleModeProvider'

/**
 * Two-state pill-button rendered in the admin header (top-right) via
 * payload.config.ts → admin.components.actions. Flips the global
 * LocaleMode context between 'switch' and 'all'.
 *
 * Label is RU-leaning to match the rest of the admin chrome (Roman is
 * the primary editor); EN reading is unambiguous regardless.
 */

const labels = {
  switch: { ru: 'Языки: вкладки', en: 'Languages: tabs' },
  all: { ru: 'Языки: все сразу', en: 'Languages: all at once' }
}

const LocaleModeToggle: React.FC = () => {
  const { mode, toggle } = useLocaleMode()
  const next: keyof typeof labels = mode === 'switch' ? 'all' : 'switch'
  const label = labels[mode] // describe current state, button click flips it

  return (
    <button
      type='button'
      onClick={toggle}
      className='btn btn--style-pill btn--size-small'
      title={`${labels[next].ru} / ${labels[next].en}`}
      aria-label={labels[next].en}
      data-current-mode={mode}
      style={{ marginInline: 4 }}
    >
      {label.ru}
    </button>
  )
}

export default LocaleModeToggle
