'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { countryCode } from '@/components/ProductionCard'
import { ProductionGrid } from '@/components/ProductionGrid'
import type { ProductionView } from '@/lib/content'

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
  { labelKey: 'reader', value: 'reader' }
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

  // ── Parse URL params (safe with null — hooks must run before any return) ─
  // `role` default = 'director' (brief D5 curator default)
  const activeRole = searchParams?.get('role') ?? 'director'
  const activeForms = parseList(searchParams?.get('form') ?? null)
  const activeAges = parseList(searchParams?.get('age') ?? null)
  const activeCountries = parseList(searchParams?.get('country') ?? null)

  // Non-default filters are "active" (show clear-all)
  const hasActiveFilters =
    activeRole !== 'director' ||
    activeForms.length > 0 ||
    activeAges.length > 0 ||
    activeCountries.length > 0

  // ── Derive available options from data ───────────────────────────────

  const availableForms = React.useMemo(
    () => [...new Set(productions.flatMap((p) => p.form))].sort(),
    [productions]
  )

  const availableCountries = React.useMemo(
    () =>
      [
        ...new Set(
          productions
            .map((p) => countryCode(p.theatre.country))
            .filter((c): c is string => c !== null)
        )
      ].sort(),
    [productions]
  )

  // ── Filter productions ───────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    return productions.filter((p) => {
      if (activeRole !== 'all' && p.role !== activeRole) return false
      if (activeForms.length > 0 && !activeForms.some((f) => p.form.includes(f)))
        return false
      if (activeAges.length > 0) {
        const bucket = ageBucketValue(p.ageRating)
        if (!bucket || !activeAges.includes(bucket)) return false
      }
      if (activeCountries.length > 0) {
        const code = countryCode(p.theatre.country)
        if (!code || !activeCountries.includes(code)) return false
      }
      return true
    })
  }, [productions, activeRole, activeForms, activeAges, activeCountries])

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
    reader: labels.roleReader
  }

  return (
    <div className={styles.panel}>
      {/* Filter strip — horizontally scrollable on mobile */}
      <div className={styles.filterBar} role='toolbar' aria-label='Filters'>
        {/* Role — radio group (single selection) */}
        <div className={styles.group} role='radiogroup'>
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

        {/* Form — multi-select (only show options present in data) */}
        {availableForms.length > 0 && (
          <>
            <span className={styles.sep} aria-hidden="true">·</span>
            <div className={styles.group} role='group'>
              {availableForms.map((form) => (
                <button
                  key={form}
                  className={`${styles.chip} ${activeForms.includes(form) ? styles.chipActive : ''}`}
                  aria-pressed={activeForms.includes(form)}
                  onClick={() => toggleMulti('form', form, activeForms)}
                >
                  {form}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Age buckets — multi-select */}
        <span className={styles.sep}>·</span>
        <div className={styles.group} role='group'>
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

        {/* Country — multi-select (hidden when data has only one country) */}
        {availableCountries.length > 1 && (
          <>
            <span className={styles.sep} aria-hidden="true">·</span>
            <div className={styles.group} role='group'>
              {availableCountries.map((code) => (
                <button
                  key={code}
                  className={`${styles.chip} ${activeCountries.includes(code) ? styles.chipActive : ''}`}
                  aria-pressed={activeCountries.includes(code)}
                  onClick={() => toggleMulti('country', code, activeCountries)}
                >
                  {code}
                </button>
              ))}
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
