'use client'

import React from 'react'
import { useLocale } from '@payloadcms/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { RichTextFieldDescriptionClientComponent } from 'payload'
import { LOCALES, type LocaleCode } from './LocalizedDocContext'

/**
 * Tiny tab strip rendered ABOVE every localized richText field via
 * admin.components.Description. Lets the editor jump between RU/EN/DE
 * without going to the top-right global selector.
 *
 * Why URL navigation rather than in-place editing? Mounting Lexical
 * once per locale × 5 richText fields is a perf cliff; rebuilding a
 * full Lexical instance against a shadow-state value is a non-trivial
 * project on its own (the Lexical state shape, feature plumbing, save
 * hooks, drafts integration all have to be reproduced).
 *
 * Trade-off: a tab click does refresh the whole edit form, but with
 * `scroll: false` the editor stays anchored to where they were. This
 * already removes the user's primary pain ("must change Локаль:
 * Deutsch on top right corner — extremely uncomfortable") on a
 * per-field basis.
 *
 * NOTE: this component is mounted in the Description slot rather than
 * Field, so Lexical itself keeps rendering through Payload's default
 * pipeline (toolbar features, draft state, save flow — all
 * unchanged). The original description text is still rendered below
 * the tabs from props.description.
 */

const isLocaleCode = (s: string): s is LocaleCode =>
  (LOCALES as readonly string[]).includes(s)

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
  borderRadius: 4,
  background: 'var(--theme-elevation-50)',
  color: 'var(--theme-elevation-600)',
  padding: '3px 10px',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
  marginRight: 4
}

const tabActiveStyle: React.CSSProperties = {
  ...tabBaseStyle,
  background: 'var(--theme-elevation-150)',
  color: 'var(--theme-text)',
  cursor: 'default'
}

const LocalizedRichTextTabs: RichTextFieldDescriptionClientComponent = ({
  description
}) => {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const activeLocaleRaw = useLocale().code
  const activeLocale: LocaleCode = isLocaleCode(activeLocaleRaw)
    ? activeLocaleRaw
    : 'ru'

  const navigateTo = (locale: LocaleCode) => {
    if (locale === activeLocale) return
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    next.set('locale', locale)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  // description from field config: string | object | falsey
  const descText =
    typeof description === 'string'
      ? description
      : description && typeof description === 'object'
        ? ((description as Record<string, string>).ru ??
          (description as Record<string, string>).en ??
          '')
        : ''

  return (
    <div style={{ marginTop: 4, marginBottom: 6 }}>
      <div style={{ display: 'flex', gap: 0, marginBottom: descText ? 4 : 0 }}>
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type='button'
            onClick={() => navigateTo(loc)}
            style={loc === activeLocale ? tabActiveStyle : tabBaseStyle}
            aria-pressed={loc === activeLocale}
            title={
              loc === activeLocale
                ? 'Сейчас редактируется'
                : `Переключиться на ${loc.toUpperCase()}`
            }
          >
            {loc.toUpperCase()}
          </button>
        ))}
      </div>
      {descText && (
        <div
          className='field-description'
          style={{ color: 'var(--theme-elevation-600)', fontSize: 12 }}
        >
          {descText}
        </div>
      )}
    </div>
  )
}

export default LocalizedRichTextTabs
