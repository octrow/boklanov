'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import type { SearchItem } from '@/lib/search'
import { transliterate } from '@/lib/translit'

import styles from './CommandPalette.module.css'

function searchKey(s: string): string {
  const lower = s.toLowerCase()
  return lower + ' ' + transliterate(lower)
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

type GroupKey = 'production' | 'award' | 'press' | 'theatre' | 'city'

const GROUP_ORDER: GroupKey[] = [
  'production',
  'award',
  'press',
  'theatre',
  'city'
]
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
    case 'production':
      return [item.title, item.theatre, item.city, item.year].join(' ')
    case 'award':
      return [item.name, item.productionTitle, item.year].join(' ')
    case 'press':
      return [item.articleTitle, item.outlet, item.productionTitle].join(' ')
    case 'theatre':
      return [item.name, item.city].join(' ')
    case 'city':
      return item.name
  }
}

function itemHref(item: SearchItem): string {
  return `/productions/${item.slug}`
}

function itemLabel(item: SearchItem): string {
  switch (item.type) {
    case 'production':
      return item.title
    case 'award':
      return item.name
    case 'press':
      return item.articleTitle
    case 'theatre':
      return item.name
    case 'city':
      return item.name
  }
}

function itemMeta(item: SearchItem): string {
  switch (item.type) {
    case 'production':
      return [item.theatre, item.city, item.year].filter(Boolean).join(' · ')
    case 'award':
      return item.productionTitle + (item.year ? ` · ${item.year}` : '')
    case 'press':
      return [item.outlet, item.productionTitle].filter(Boolean).join(' · ')
    case 'theatre':
      return item.city
    case 'city':
      return ''
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

// Fallback for browsers without `closedby` (Safari): a click that lands on the
// dialog element itself and outside its box is a backdrop click.
function closeOnBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
  if ('closedBy' in HTMLDialogElement.prototype) return
  if (e.target !== e.currentTarget) return
  const r = e.currentTarget.getBoundingClientRect()
  const inside =
    e.clientX >= r.left &&
    e.clientX <= r.right &&
    e.clientY >= r.top &&
    e.clientY <= r.bottom
  if (!inside) e.currentTarget.close()
}

const LIGHT_DISMISS = { closedby: 'any' } as Record<string, string>

export function CommandPalette({
  items,
  onClose,
  locale
}: CommandPaletteProps) {
  const t = useTranslations('search')
  const GROUP_LABELS: Record<GroupKey, string> = {
    production: t('groupProductions'),
    award: t('groupAwards'),
    press: t('groupPress'),
    theatre: t('groupTheatres'),
    city: t('groupCities')
  }
  const [query, setQuery] = React.useState('')
  const [activeIdx, setActiveIdx] = React.useState(0)
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const uid = React.useId()
  const listboxId = `${uid}-listbox`
  const optionId = (i: number) => `${uid}-opt-${i}`
  const scrollToActive = React.useRef(false)

  const results = filterItems(items, query)

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // The dialog's `close` event (Esc, light dismiss, close()) calls onClose.
  const close = () => dialogRef.current?.close()

  React.useEffect(() => {
    if (!scrollToActive.current) return
    scrollToActive.current = false
    document
      .getElementById(`${uid}-opt-${activeIdx}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx, uid])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      scrollToActive.current = true
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      scrollToActive.current = true
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      const href = itemHref(results[activeIdx])
      const localePrefix = locale === 'en' ? '' : `/${locale}`
      router.push(localePrefix + href)
      close()
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
  const hasQuery = query.trim() !== ''
  const expanded = hasQuery && flat.length > 0
  const activeOption = expanded && activeIdx < flat.length
  const status = !hasQuery
    ? ''
    : flat.length > 0
      ? t('resultsCount', { count: flat.length })
      : t('noResults')

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={t('dialogAria')}
      {...LIGHT_DISMISS}
      onClose={onClose}
      onClick={closeOnBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.inputWrapper}>
        <input
          autoFocus
          type='search'
          role='combobox'
          aria-expanded={expanded}
          aria-controls={expanded ? listboxId : undefined}
          aria-autocomplete='list'
          aria-activedescendant={activeOption ? optionId(activeIdx) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIdx(0)
          }}
          className={styles.input}
          placeholder={t('placeholder')}
          aria-label={t('inputAria')}
          autoComplete='off'
          spellCheck={false}
        />
      </div>

      <div className={styles.srOnly} role='status' aria-live='polite'>
        {status}
      </div>

      {hasQuery && !expanded && (
        <div className={styles.results}>
          <div className={styles.noResults}>
            <span aria-hidden='true' className={styles.noResultsLabel}>
              {t('errata')}
            </span>
            <p className={styles.noResultsBody}>{t('noResults')}</p>
          </div>
        </div>
      )}

      {expanded && (
        <div
          id={listboxId}
          className={styles.results}
          role='listbox'
          aria-label={t('resultsAria')}
        >
          {grouped.map(({ group, items: gItems }) => (
            <div
              key={group}
              className={styles.group}
              role='group'
              aria-labelledby={`${uid}-group-${group}`}
            >
              <p id={`${uid}-group-${group}`} className={styles.groupLabel}>
                {GROUP_LABELS[group]}
              </p>
              {gItems.map((item, localIdx) => {
                const globalIdx = flat.indexOf(item)
                const href = itemHref(item)
                const localePrefix = locale === 'en' ? '' : `/${locale}`
                return (
                  <a
                    key={`${item.type}-${item.slug}-${localIdx}`}
                    id={optionId(globalIdx)}
                    href={localePrefix + href}
                    className={
                      globalIdx === activeIdx
                        ? `${styles.result} ${styles.resultActive}`
                        : styles.result
                    }
                    role='option'
                    aria-selected={globalIdx === activeIdx}
                    onClick={close}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                  >
                    <span className={styles.resultLabel}>
                      {itemLabel(item)}
                    </span>
                    {itemMeta(item) && (
                      <span className={styles.resultMeta}>
                        {itemMeta(item)}
                      </span>
                    )}
                  </a>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </dialog>
  )
}
