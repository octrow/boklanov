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
 * 4-pill control + per-locale editable textareas, rendered ABOVE every
 * localized richText field via admin.components.beforeInput.
 *
 * Two modes (PAYLOAD_ADMIN_UX_PLAN.md §Round-3 R3-5):
 *
 * - SWITCH: only the pills render here. Payload's standard Lexical
 *   editor renders below as usual, bound to the URL's `?locale=`.
 *   Full rich-text formatting available.
 *
 * - ALL: pills + a 3-column row of editable plain-text textareas.
 *   The standard Lexical editor below is CSS-hidden (see
 *   `app/(payload)/custom.scss` — sibling-of-`.localized-rt-pillstrip`
 *   selector). Each textarea reads the locale's content as plain text
 *   (recursive walk of SerializedEditorState) and writes back as a
 *   minimal `{root:{children:[paragraph...]}}` doc.
 *
 * Routing:
 * - Active (URL) locale's textarea routes through `useField` → form
 *   state → Save button. Save still commits this locale normally.
 * - Other locales' textareas route through `LocalizedDocContext` →
 *   debounced REST PATCH. Save button does NOT light up for these,
 *   but the PATCH commits them autonomously.
 *
 * Trade-off accepted: edits in ALL mode lose any pre-existing rich
 * formatting on the touched locale (plain text re-serialized as a
 * single paragraph stack). To keep formatting, click a locale pill —
 * switch mode preserves the full Lexical editor for that locale.
 *
 * Trade-off accepted: the standard hidden Lexical editor does NOT
 * pick up textarea-side edits until the next URL nav re-mounts it.
 * Data IS saved correctly via form state or shadow PATCH; only the
 * editor's in-memory state is stale. Switching pill (URL nav) forces
 * a fresh mount which reads the saved value.
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

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: '8px 12px',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--theme-elevation-250)',
  borderRadius: 4,
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-text)',
  fontSize: 14,
  lineHeight: 1.5,
  fontFamily: 'inherit',
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

/**
 * Recursive plain-text extraction from a SerializedEditorState. Walks
 * the tree, joining `text` leaves with paragraph-level newlines.
 * Tolerates string / null / unknown JSON; returns '' on miss.
 */
const extractLexicalText = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return ''

  const blocks: string[] = []

  const walkInline = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const n = node as Record<string, unknown>
    if (typeof n.text === 'string') return n.text
    if (Array.isArray(n.children)) {
      return (n.children as unknown[]).map(walkInline).join('')
    }
    return ''
  }

  const walkBlock = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    if (typeof n.type === 'string' && typeof n.text === 'string') {
      // Leaf text directly under root (rare). Append as its own line.
      blocks.push(n.text)
      return
    }
    // Block-level node — extract concatenated inline text from children.
    const inline = walkInline(node)
    if (inline.length > 0) {
      blocks.push(inline)
    } else if (Array.isArray(n.children)) {
      for (const c of n.children as unknown[]) walkBlock(c)
    }
  }

  const root =
    (value as { root?: unknown }).root ??
    (value as { children?: unknown }).children ??
    value

  if (root && typeof root === 'object') {
    const r = root as Record<string, unknown>
    if (Array.isArray(r.children)) {
      for (const child of r.children as unknown[]) walkBlock(child)
    } else {
      walkBlock(root)
    }
  }

  return blocks.join('\n\n')
}

/**
 * Convert a plain-text string into a minimal SerializedEditorState.
 * Splits paragraphs on blank lines. Used to round-trip textarea
 * edits back into the JSONB column Payload expects for richText.
 *
 * Loses any prior rich formatting — accepted trade-off for ALL mode
 * (Roman uses ALL for translation; rich formatting happens in SWITCH).
 */
const stringToLexicalState = (text: string): Record<string, unknown> => {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.length > 0)
  const emptyParagraph = {
    type: 'paragraph',
    children: [] as unknown[],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: ''
  }
  const buildParagraph = (p: string) => ({
    type: 'paragraph',
    children: [
      {
        type: 'text',
        text: p,
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        version: 1
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: ''
  })
  return {
    root: {
      type: 'root',
      children:
        paragraphs.length > 0
          ? paragraphs.map(buildParagraph)
          : [emptyParagraph],
      direction: paragraphs.length > 0 ? 'ltr' : null,
      format: '',
      indent: 0,
      version: 1
    }
  }
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

  const { value: activeValue, setValue: setActiveValue } = useField<unknown>({
    path
  })

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

  const valueForLocale = (locale: LocaleCode): string => {
    if (locale === activeLocale) return extractLexicalText(activeValue)
    return extractLexicalText(shadow[locale])
  }

  const onLocaleChange = (locale: LocaleCode, nextText: string) => {
    const lexical = stringToLexicalState(nextText)
    if (locale === activeLocale) {
      setActiveValue(lexical)
    } else if (doc) {
      doc.setValue(path, locale, lexical)
    }
  }

  return (
    <div className='localized-rt-pillstrip' style={{ marginBottom: 6 }}>
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
          {LOCALES.map((loc) => (
            <div key={loc}>
              <div style={localeChipStyle}>
                <span>{loc}</span>
                {loc === activeLocale && (
                  <span style={activeDotStyle} title='Активная локаль' />
                )}
              </div>
              <textarea
                style={textareaStyle}
                value={valueForLocale(loc)}
                onChange={(e) => onLocaleChange(loc, e.target.value)}
                placeholder='—'
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LocalizedRichTextTabs
