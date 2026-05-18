'use client'

import React, { useState } from 'react'
import { useField, useLocale } from '@payloadcms/ui'
import { useLocaleMode } from './LocaleModeProvider'
import {
  useLocalizedDoc,
  LOCALES,
  type LocaleCode
} from './LocalizedDocContext'

/**
 * Shared body for LocalizedText and LocalizedTextarea. Renders either a
 * tab strip (switch mode) or a 3-column grid (all mode) of inputs. The
 * input element itself is configurable via `as` so the same component
 * powers single-line and multi-line fields.
 *
 * Active locale routes through Payload's `useField` (form state +
 * dirty + Save). Inactive locales route through `useLocalizedDoc`
 * (debounced REST PATCH).
 */

const isLocaleCode = (s: string): s is LocaleCode =>
  (LOCALES as readonly string[]).includes(s)

// Longhand borders only — mixing shorthand (`border`/`borderBottom`)
// with longhand on the same element across active/inactive states
// triggers the React "Removing a style property during rerender" warning.
const tabBaseStyle: React.CSSProperties = {
  borderTopWidth: 1,
  borderRightWidth: 1,
  borderBottomWidth: 1,
  borderLeftWidth: 1,
  borderStyle: 'solid',
  borderTopColor: 'var(--theme-elevation-150)',
  borderRightColor: 'var(--theme-elevation-150)',
  borderBottomColor: 'var(--theme-elevation-150)',
  borderLeftColor: 'var(--theme-elevation-150)',
  borderTopLeftRadius: 4,
  borderTopRightRadius: 4,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  background: 'var(--theme-elevation-50)',
  color: 'var(--theme-elevation-600)',
  padding: '4px 12px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  marginRight: 2,
  marginBottom: -1
}

const tabActiveStyle: React.CSSProperties = {
  ...tabBaseStyle,
  background: 'var(--theme-elevation-150)',
  color: 'var(--theme-text)'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--theme-elevation-150)',
  borderRadius: 4,
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-text)',
  fontSize: 14,
  lineHeight: 1.4,
  fontFamily: 'inherit'
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 88,
  resize: 'vertical'
}

const localeChipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: 'var(--theme-elevation-600)'
}

const activeDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 3,
  background: 'var(--theme-success-500, #16a34a)'
}

type Props = {
  path: string
  label: React.ReactNode
  as: 'input' | 'textarea'
}

export const LocalizedTextLike: React.FC<Props> = ({ path, label, as }) => {
  const { mode } = useLocaleMode()
  const activeLocaleRaw = useLocale().code
  const activeLocale: LocaleCode = isLocaleCode(activeLocaleRaw)
    ? activeLocaleRaw
    : 'ru'

  const { value: activeValue, setValue: setActiveValue } = useField<string>({
    path
  })

  const doc = useLocalizedDoc()
  const shadow = doc?.getValue(path) ?? {
    ru: undefined,
    en: undefined,
    de: undefined
  }

  const valueFor = (locale: LocaleCode): string => {
    if (locale === activeLocale) {
      return (activeValue as string | undefined) ?? shadow[locale] ?? ''
    }
    return shadow[locale] ?? ''
  }

  const setValueFor = (locale: LocaleCode, next: string) => {
    if (locale === activeLocale) {
      setActiveValue(next)
    } else if (doc) {
      doc.setValue(path, locale, next)
    }
  }

  const [activeTab, setActiveTab] = useState<LocaleCode>(activeLocale)

  const renderInput = (locale: LocaleCode) => {
    const sharedProps = {
      value: valueFor(locale),
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setValueFor(locale, e.target.value)
    }
    if (as === 'textarea') {
      return <textarea {...sharedProps} style={textareaStyle} />
    }
    return <input type='text' {...sharedProps} style={inputStyle} />
  }

  if (mode === 'all') {
    return (
      <div className='field-type' style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          {label}
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12
          }}
        >
          {LOCALES.map((loc) => (
            <div key={loc}>
              <div style={localeChipStyle}>
                <span>{loc}</span>
                {loc === activeLocale && (
                  <span style={activeDotStyle} title='Active locale' />
                )}
              </div>
              {renderInput(loc)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // switch mode
  return (
    <div className='field-type' style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--theme-elevation-150)'
        }}
      >
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type='button'
            onClick={() => setActiveTab(loc)}
            style={loc === activeTab ? tabActiveStyle : tabBaseStyle}
            aria-pressed={loc === activeTab}
          >
            {loc.toUpperCase()}
            {loc === activeLocale && (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 6,
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  background: 'var(--theme-success-500, #16a34a)',
                  verticalAlign: 'middle'
                }}
                title='Active locale'
              />
            )}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: 8 }}>{renderInput(activeTab)}</div>
    </div>
  )
}
