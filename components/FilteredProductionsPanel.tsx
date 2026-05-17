'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { ProductionGrid } from '@/components/ProductionGrid'
import type { ProductionView } from '@/lib/content'
import { countryCode } from '@/lib/countryCode'

import styles from './FilteredProductionsPanel.module.css'

// ── Age bucket helpers ──────────────────────────────────────────────────

const AGE_BUCKETS = [
  { label: '3+', value: '3' },
  { label: '6+', value: '6' },
  { label: '12+', value: '12' },
  { label: '18+', value: '18' }
] as const

function ageBucketValue(rating: string | null | undefined): string | null {
  if (!rating) return null
  const n = parseInt(rating)
  if (isNaN(n)) return null
  if (n < 6) return '3'
  if (n < 12) return '6'
  if (n < 18) return '12'
  return '18'
}

// ── Role options (values must match content loader `role` field) ─────────

const ROLE_OPTIONS = [
  { labelKey: 'director', value: 'director' },
  { labelKey: 'coDirector', value: 'co-director' },
  { labelKey: 'performer', value: 'performer' },
  { labelKey: 'reader', value: 'other' }
] as const

// ── Component ───────────────────────────────────────────────────────────

export interface FilterLabels {
  roleDirector: string
  roleCoDirector: string
  rolePerformer: string
  roleReader: string
  roleAll: string
  clearAll: string
  emptyLabel: string
  clearAllLabel: string
  groupLabelRole: string
  groupLabelForm: string
  groupLabelAge: string
  groupLabelCountry: string
  filtersAria: string
}

export interface FilteredProductionsPanelProps {
  productions: ProductionView[]
  labels: FilterLabels
}

export function FilteredProductionsPanel({
  productions,
  labels
}: FilteredProductionsPanelProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [countryOpen, setCountryOpen] = React.useState(false)
  const countryRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!countryOpen) return
    function onDocClick(e: MouseEvent) {
      if (!countryRef.current?.contains(e.target as Node)) setCountryOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCountryOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [countryOpen])

  // ── Parse URL params (safe with null — hooks must run before any return) ─
  // `role` default = 'director' (brief D5 curator default)
  const activeRole = searchParams?.get('role') ?? 'director'
  const activeForm = searchParams?.get('form') ?? null
  const activeAges = parseList(searchParams?.get('age') ?? null)
  const activeCountry = searchParams?.get('country') ?? null

  // Non-default filters are "active" (show clear-all)
  const hasActiveFilters =
    activeRole !== 'director' ||
    activeForm !== null ||
    activeAges.length > 0 ||
    activeCountry !== null

  // ── Derive available options from data ───────────────────────────────

  const availableForms = React.useMemo(
    () =>
      [...new Set(productions.flatMap((p) => p.form))]
        .filter((f) => f !== 'ensemble' && f !== 'theater')
        .sort(),
    [productions]
  )

  // Countries derive from MDX (theatre.country). Sort alphabetical, but force
  // KZ/RU to the tail so European venues read first regardless of frequency.
  const availableCountries = React.useMemo(() => {
    const demoted = new Set(['KZ', 'RU'])
    const codes = [
      ...new Set(
        productions
          .map((p) => countryCode(p.theatre.country))
          .filter((c): c is string => c !== null)
      )
    ]
    const head = codes.filter((c) => !demoted.has(c)).sort()
    const tail = codes.filter((c) => demoted.has(c)).sort()
    return [...head, ...tail]
  }, [productions])

  // ── Filter productions ───────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    const mainRoles = ['director', 'co-director', 'performer']
    return productions.filter((p) => {
      if (activeRole === 'other') {
        if (p.role.some((r) => mainRoles.includes(r))) return false
      } else if (activeRole !== 'all' && !p.role.includes(activeRole))
        return false
      if (activeForm !== null && !p.form.includes(activeForm)) return false
      if (activeAges.length > 0) {
        const bucket = ageBucketValue(p.ageRating)
        if (!bucket || !activeAges.includes(bucket)) return false
      }
      if (activeCountry !== null) {
        const code = countryCode(p.theatre.country)
        if (code !== activeCountry) return false
      }
      return true
    })
  }, [productions, activeRole, activeForm, activeAges, activeCountry])

  // Null during SSR in Suspense boundary — page fallback is shown instead.
  if (!searchParams) return null
  // Narrowed const so TypeScript understands it's non-null in inner functions.
  const sp = searchParams

  // ── URL update helpers ───────────────────────────────────────────────

  const base = pathname ?? '/'

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString())
    if (!value) params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
  }

  function toggleMulti(key: string, value: string, current: string[]) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setParam(key, next.join(',') || null)
  }

  function clearAll() {
    router.replace(base, { scroll: false })
  }

  // ── Render ───────────────────────────────────────────────────────────

  const roleLabelMap: Record<string, string> = {
    director: labels.roleDirector,
    'co-director': labels.roleCoDirector,
    performer: labels.rolePerformer,
    other: labels.roleReader
  }

  return (
    <div className={styles.panel}>
      {/* Filter strip — wraps on overflow. Country group is a disclosure popover
          to keep the bar narrow even when many countries appear in the data. */}
      <div
        className={styles.filterBar}
        role='toolbar'
        aria-label={labels.filtersAria}
      >
        {/* Role — radio group (single selection) */}
        <div
          className={styles.group}
          role='radiogroup'
          aria-label={labels.groupLabelRole}
        >
          <span className={styles.groupLabel} aria-hidden='true'>
            {labels.groupLabelRole}
          </span>
          <div className={styles.chipRow}>
            {ROLE_OPTIONS.map(({ value }) => (
              <button
                key={value}
                className={`${styles.chip} ${activeRole === value ? styles.chipActive : ''}`}
                role='radio'
                aria-checked={activeRole === value}
                onClick={() =>
                  setParam('role', value === 'director' ? null : value)
                }
              >
                {roleLabelMap[value]}
              </button>
            ))}
            <button
              className={`${styles.chip} ${activeRole === 'all' ? styles.chipActive : ''}`}
              role='radio'
              aria-checked={activeRole === 'all'}
              onClick={() => setParam('role', 'all')}
            >
              {labels.roleAll}
            </button>
          </div>
        </div>

        {/* Form — single-select radio group (only show options present in data) */}
        {availableForms.length > 0 && (
          <>
            <span className={styles.sep} aria-hidden='true'>
              ·
            </span>
            <div
              className={styles.group}
              role='radiogroup'
              aria-label={labels.groupLabelForm}
            >
              <span className={styles.groupLabel} aria-hidden='true'>
                {labels.groupLabelForm}
              </span>
              <div className={styles.chipRow}>
                {availableForms.map((form) => (
                  <button
                    key={form}
                    className={`${styles.chip} ${activeForm === form ? styles.chipActive : ''}`}
                    role='radio'
                    aria-checked={activeForm === form}
                    onClick={() =>
                      setParam('form', activeForm === form ? null : form)
                    }
                  >
                    {form}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Age buckets — multi-select */}
        <span className={styles.sep} aria-hidden='true'>
          ·
        </span>
        <div
          className={styles.group}
          role='group'
          aria-label={labels.groupLabelAge}
        >
          <span className={styles.groupLabel} aria-hidden='true'>
            {labels.groupLabelAge}
          </span>
          <div className={styles.chipRow}>
            {AGE_BUCKETS.map(({ label, value }) => (
              <button
                key={value}
                className={`${styles.chip} ${activeAges.includes(value) ? styles.chipActive : ''}`}
                aria-pressed={activeAges.includes(value)}
                onClick={() => toggleMulti('age', value, activeAges)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Country — single-select disclosure popover. Trigger doubles as group
            label, so the mono-caps "СТРАНА" title is omitted here on purpose. */}
        {availableCountries.length > 1 && (
          <>
            <span className={styles.sep} aria-hidden='true'>
              ·
            </span>
            <div
              className={`${styles.group} ${styles.groupCountry}`}
              role='group'
              aria-label={labels.groupLabelCountry}
            >
              <div className={styles.countryWrap} ref={countryRef}>
                <button
                  type='button'
                  className={`${styles.chip} ${styles.countryTrigger} ${activeCountry !== null ? styles.chipActive : ''}`}
                  aria-haspopup='true'
                  aria-expanded={countryOpen}
                  aria-controls='country-popover'
                  onClick={() => setCountryOpen((v) => !v)}
                >
                  <span className={styles.countryTriggerLabel}>
                    {activeCountry ?? labels.groupLabelCountry}
                  </span>
                  <span className={styles.caret} aria-hidden='true'>
                    ▾
                  </span>
                </button>
                {countryOpen && (
                  <div
                    id='country-popover'
                    className={styles.countryPopover}
                    role='radiogroup'
                    aria-label={labels.groupLabelCountry}
                  >
                    {availableCountries.map((code) => (
                      <button
                        key={code}
                        className={`${styles.chip} ${activeCountry === code ? styles.chipActive : ''}`}
                        role='radio'
                        aria-checked={activeCountry === code}
                        onClick={() => {
                          setParam(
                            'country',
                            activeCountry === code ? null : code
                          )
                          setCountryOpen(false)
                        }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Clear-all — oxblood per DESIGN §5.2 (only when non-default active) */}
        {hasActiveFilters && (
          <button className={styles.clearAll} onClick={clearAll}>
            {labels.clearAll}
          </button>
        )}
      </div>

      <ProductionGrid
        productions={filtered}
        emptyLabel={labels.emptyLabel}
        clearAllLabel={hasActiveFilters ? labels.clearAllLabel : undefined}
        onClearAll={hasActiveFilters ? clearAll : undefined}
      />
    </div>
  )
}

// ── Util ─────────────────────────────────────────────────────────────────

function parseList(param: string | null): string[] {
  if (!param) return []
  return param.split(',').filter(Boolean)
}
