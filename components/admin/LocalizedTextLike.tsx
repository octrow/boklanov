'use client'

import React from 'react'
import { useField, useLocale } from '@payloadcms/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  const { mode, setMode } = useLocaleMode()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const activeLocaleRaw = useLocale().code
  const activeLocale: LocaleCode = isLocaleCode(activeLocaleRaw)
    ? activeLocaleRaw
    : 'ru'

  // Pill click handler: RU/EN/DE → page-global switch + URL locale flip;
  // ALL → page-global show-all. Spec §Round-2 R1 in
  // PAYLOAD_ADMIN_UX_PLAN.md.
  const onPillClick = (pill: LocaleCode | 'all') => {
    if (pill === 'all') {
      if (mode !== 'all') setMode('all')
      return
    }
    if (mode !== 'switch') setMode('switch')
    if (pill === activeLocale) return
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    next.set('locale', pill)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

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

  const pills: Array<LocaleCode | 'all'> = [...LOCALES, 'all']
  const isPillActive = (pill: LocaleCode | 'all') =>
    pill === 'all' ? mode === 'all' : mode === 'switch' && pill === activeLocale

  const pillStrip = (
    <div
      style={{
        display: 'flex',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--theme-elevation-150)'
      }}
    >
      {pills.map((pill) => (
        <button
          key={pill}
          type='button'
          onClick={() => onPillClick(pill)}
          style={isPillActive(pill) ? tabActiveStyle : tabBaseStyle}
          aria-pressed={isPillActive(pill)}
          title={
            pill === 'all'
              ? 'Показать все языки сразу'
              : `Переключиться на ${pill.toUpperCase()}`
          }
        >
          {pill === 'all' ? 'ALL' : pill.toUpperCase()}
        </button>
      ))}
    </div>
  )

  if (mode === 'all') {
    return (
      <div className='field-type' style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          {label}
        </label>
        {pillStrip}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            paddingTop: 8
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
      {pillStrip}
      <div style={{ paddingTop: 8 }}>{renderInput(activeLocale)}</div>
    </div>
  )
}
