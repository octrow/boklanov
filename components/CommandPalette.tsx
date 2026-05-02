'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import type { SearchItem } from '@/lib/search'

import styles from './CommandPalette.module.css'

// ---------------------------------------------------------------------------
// Transliteration helpers — Cyr ↔ Lat for fuzzy search
// ---------------------------------------------------------------------------

const CYR_TO_LAT: Record<string, string> = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'zh', з:'z',
  и:'i', й:'j', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r',
  с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch',
  ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya'
}

function transliterate(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .map((c) => CYR_TO_LAT[c] ?? c)
    .join('')
}

function searchKey(s: string): string {
  const lower = s.toLowerCase()
  return lower + ' ' + transliterate(lower)
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

type GroupKey = 'production' | 'award' | 'press' | 'theatre' | 'city'


const GROUP_ORDER: GroupKey[] = ['production', 'award', 'press', 'theatre', 'city']
const MAX_PER_GROUP = 5

function filterItems(items: SearchItem[], query: string): SearchItem[] {
  if (!query.trim()) return []
  const needle = searchKey(query)
  const words = needle.split(/\s+/).filter(Boolean)

  function score(item: SearchItem): number {
    const haystack = searchKey(itemText(item))
    const allMatch = words.every((w) => haystack.includes(w))
    return allMatch ? 1 : 0
  }

  const grouped: Partial<Record<GroupKey, SearchItem[]>> = {}
  for (const item of items) {
    if (score(item) === 0) continue
    const g = item.type as GroupKey
    if (!grouped[g]) grouped[g] = []
    grouped[g]!.push(item)
  }

  const result: SearchItem[] = []
  for (const g of GROUP_ORDER) {
    const group = grouped[g]
    if (group && group.length > 0) {
      result.push(...group.slice(0, MAX_PER_GROUP))
    }
  }
  return result
}

function itemText(item: SearchItem): string {
  switch (item.type) {
    case 'production': return [item.title, item.theatre, item.city, item.year].join(' ')
    case 'award':      return [item.name, item.productionTitle, item.year].join(' ')
    case 'press':      return [item.articleTitle, item.outlet, item.productionTitle].join(' ')
    case 'theatre':    return [item.name, item.city].join(' ')
    case 'city':       return item.name
  }
}

function itemHref(item: SearchItem): string {
  return `/productions/${item.slug}`
}

function itemLabel(item: SearchItem): string {
  switch (item.type) {
    case 'production': return item.title
    case 'award':      return item.name
    case 'press':      return item.articleTitle
    case 'theatre':    return item.name
    case 'city':       return item.name
  }
}

function itemMeta(item: SearchItem): string {
  switch (item.type) {
    case 'production': return [item.theatre, item.city, item.year].filter(Boolean).join(' · ')
    case 'award':      return item.productionTitle + (item.year ? ` · ${item.year}` : '')
    case 'press':      return [item.outlet, item.productionTitle].filter(Boolean).join(' · ')
    case 'theatre':    return item.city
    case 'city':       return ''
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  items: SearchItem[]
  onClose: () => void
  locale: string
}

export function CommandPalette({ items, onClose, locale }: CommandPaletteProps) {
  const t = useTranslations('search')
  const GROUP_LABELS: Record<GroupKey, string> = {
    production: t('groupProductions'),
    award:      t('groupAwards'),
    press:      t('groupPress'),
    theatre:    t('groupTheatres'),
    city:       t('groupCities'),
  }
  const [query, setQuery] = React.useState('')
  const [activeIdx, setActiveIdx] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = filterItems(items, query)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  React.useEffect(() => {
    setActiveIdx(0)
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Tab') {
      // Trap focus inside the dialog.
      const dialog = e.currentTarget as HTMLElement
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      const href = itemHref(results[activeIdx])
      const localePrefix = locale === 'ru' ? '' : `/${locale}`
      router.push(localePrefix + href)
      onClose()
    }
  }

  // Group results for display
  const grouped: Array<{ group: GroupKey; items: SearchItem[] }> = []
  for (const g of GROUP_ORDER) {
    const gItems = results.filter((r) => r.type === g)
    if (gItems.length > 0) grouped.push({ group: g, items: gItems })
  }

  // Flat index for keyboard navigation
  const flat = grouped.flatMap((g) => g.items)

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
            placeholder={t('placeholder')}
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {query.trim() && (
          <div className={styles.results} role="listbox" aria-label="Search results">
            {grouped.length === 0 ? (
              <div className={styles.noResults}>
                <span aria-hidden="true" className={styles.noResultsLabel}>ERRATA</span>
                <p className={styles.noResultsBody}>{t('noResults')}</p>
              </div>
            ) : (
              grouped.map(({ group, items: gItems }) => (
                <div key={group} className={styles.group}>
                  <p className={styles.groupLabel}>{GROUP_LABELS[group]}</p>
                  {gItems.map((item, localIdx) => {
                    const globalIdx = flat.indexOf(item)
                    const href = itemHref(item)
                    const localePrefix = locale === 'ru' ? '' : `/${locale}`
                    return (
                      <a
                        key={`${item.type}-${item.slug}-${localIdx}`}
                        href={localePrefix + href}
                        className={
                          globalIdx === activeIdx
                            ? `${styles.result} ${styles.resultActive}`
                            : styles.result
                        }
                        role="option"
                        aria-selected={globalIdx === activeIdx}
                        onClick={onClose}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                      >
                        <span className={styles.resultLabel}>{itemLabel(item)}</span>
                        {itemMeta(item) && (
                          <span className={styles.resultMeta}>{itemMeta(item)}</span>
                        )}
                      </a>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
