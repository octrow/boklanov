'use client'

import React from 'react'
import { useLocale } from '@payloadcms/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocaleMode } from './LocaleModeProvider'
import {
  useLocalizedDoc,
  LOCALES,
  type LocaleCode
} from './LocalizedDocContext'

/**
 * 4-pill control rendered ABOVE every localized richText field via
 * admin.components.beforeInput. Plus, in `all` mode, an additional row
 * of 3 plain-text previews so the editor can see every locale at once
 * without the cost of mounting three Lexical instances.
 *
 * Behaviour (PAYLOAD_ADMIN_UX_PLAN.md §Round-2 + Round-3):
 * - RU/EN/DE pill → setMode('switch') + router.replace('?locale=X').
 *   The full Lexical editor below re-mounts with that locale's
 *   content. This is the slow path (server-side doc refetch) but
 *   it's the only way to bind Payload's form-state to a new locale.
 * - ALL pill → setMode('all'). The standard Lexical editor stays
 *   mounted for the URL's locale; this component adds a preview row
 *   so the other two locales are visible too. No URL nav.
 *
 * Trade-off accepted: in `all` mode the user sees all three locales
 * but can only edit the URL's locale. To edit a different locale the
 * user clicks its pill, paying the ~5 s router round-trip once.
 * Full triple-Lexical editing remains deferred per Risk R1.
 */

type Props = {
  path: string
}

const isLocaleCode = (s: string): s is LocaleCode =>
  (LOCALES as readonly string[]).includes(s)

const tabBaseStyle: React.CSSProperties = {
  borderTopWidth: 1,
  borderRightWidth: 1,
  borderBottomWidth: 1,
  borderLeftWidth: 1,
  borderStyle: 'solid',
  borderTopColor: 'var(--theme-elevation-250)',
  borderRightColor: 'var(--theme-elevation-250)',
  borderBottomColor: 'var(--theme-elevation-250)',
  borderLeftColor: 'var(--theme-elevation-250)',
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
  background: 'var(--theme-elevation-250)',
  color: 'var(--theme-text)',
  cursor: 'default'
}

const previewColumnStyle: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-250)',
  borderRadius: 4,
  background: 'var(--theme-elevation-50)',
  padding: '8px 10px',
  minHeight: 64,
  fontSize: 13,
  lineHeight: 1.4,
  color: 'var(--theme-text)',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  maxHeight: 220,
  overflowY: 'auto'
}

const previewLabelStyle: React.CSSProperties = {
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

/**
 * Recursive plain-text extraction from a SerializedEditorState. Walks
 * the tree, concatenates every `text` leaf with paragraph-level
 * newlines so the result is readable in a previews column. Tolerates
 * any shape — string, null, unknown JSON — and returns '' on miss.
 */
const extractLexicalText = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return ''

  const collect = (node: unknown): string[] => {
    if (!node || typeof node !== 'object') return []
    const n = node as Record<string, unknown>
    if (typeof n.text === 'string') return [n.text]
    const children = Array.isArray(n.children) ? n.children : []
    const parts: string[] = []
    for (const child of children) {
      parts.push(...collect(child))
    }
    // Add a newline after block-level nodes so paragraphs/headings
    // don't collapse into a single line.
    if (typeof n.type === 'string' && n.type !== 'text' && parts.length > 0) {
      parts.push('\n')
    }
    return parts
  }

  const root =
    (value as { root?: unknown }).root ??
    (value as { children?: unknown }).children ??
    value
  return collect(root).join('').trim()
}

const LocalizedRichTextTabs: React.FC<Props> = ({ path }) => {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const { mode, setMode } = useLocaleMode()
  const activeLocaleRaw = useLocale().code
  const activeLocale: LocaleCode = isLocaleCode(activeLocaleRaw)
    ? activeLocaleRaw
    : 'ru'

  const doc = useLocalizedDoc()
  const shadow = doc?.getRawValue(path) ?? {
    ru: undefined,
    en: undefined,
    de: undefined
  }

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

  const isPillActive = (pill: LocaleCode | 'all') =>
    pill === 'all' ? mode === 'all' : mode === 'switch' && pill === activeLocale

  const pills: Array<LocaleCode | 'all'> = [...LOCALES, 'all']

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', gap: 0, marginBottom: 6 }}>
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
                : pill === activeLocale && mode === 'switch'
                  ? 'Сейчас редактируется'
                  : `Переключиться на ${pill.toUpperCase()}`
            }
          >
            {pill === 'all' ? 'ALL' : pill.toUpperCase()}
          </button>
        ))}
      </div>
      {mode === 'all' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 8
          }}
        >
          {LOCALES.map((loc) => {
            const text = extractLexicalText(shadow[loc])
            return (
              <div key={loc}>
                <div style={previewLabelStyle}>
                  <span>{loc}</span>
                  {loc === activeLocale && (
                    <span style={activeDotStyle} title='Редактируется ниже' />
                  )}
                </div>
                <div style={previewColumnStyle}>
                  {text || (
                    <span style={{ color: 'var(--theme-elevation-500)' }}>
                      —
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LocalizedRichTextTabs
