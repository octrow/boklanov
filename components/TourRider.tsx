import * as React from 'react'

import styles from './TourRider.module.css'

interface TourRiderRowProps {
  label: string
  value: React.ReactNode
}

interface TourRiderProps {
  productionLabel?: string | null
  year?: number | null
  durationMin?: number | null
  ageRating?: string | null
  country?: string | null
  language?: string | null
  form?: string[]
  lineage?: string[]
  /** True when tour[] has cities (Plinth-tier indicator). */
  tourSolo?: boolean
  /** PDF path; if absent, no TECH RIDER row is rendered. */
  techRider?: string | null
  /** ZIP path; if absent, no PRESS KIT row is rendered. */
  pressKit?: string | null
}

/**
 * TourRider — production technical/tour metadata as a real tech rider.
 * Per DESIGN_v2_PROPOSAL.md §4.4. Replaces the inline right-rail .slate
 * div from app/[locale]/productions/[slug]/page.tsx (DA-2.B).
 *
 * Short-circuits null fields: never renders a placeholder row, never
 * renders an empty link. The "data model is the layout" principle —
 * partial provenance is honest, not apologetic.
 *
 * Desktop-only (≥1024px); on mobile, the production-detail chips row
 * carries year/age/duration data.
 */
export function TourRider({
  productionLabel,
  year,
  durationMin,
  ageRating,
  country,
  language,
  form,
  lineage,
  tourSolo,
  techRider,
  pressKit,
}: TourRiderProps) {
  const rows: TourRiderRowProps[] = []
  if (year) rows.push({ label: 'YEAR', value: year })
  if (durationMin) rows.push({ label: 'RUN', value: <>{durationMin}&thinsp;MIN</> })
  if (ageRating) rows.push({ label: 'AGE', value: ageRating })
  if (country) rows.push({ label: 'COUNTRY', value: country })
  if (language) rows.push({ label: 'LANGUAGE', value: language.toUpperCase() })
  if (form && form.length > 0) {
    rows.push({ label: 'FORM', value: form.map((f) => f.toUpperCase()).join(' · ') })
  }
  if (lineage && lineage.length > 0) {
    rows.push({ label: 'LINEAGE', value: lineage.map((l) => l.toUpperCase()).join(' · ') })
  }
  if (tourSolo) rows.push({ label: 'TOURING', value: 'SOLO' })
  if (techRider) {
    rows.push({
      label: 'TECH RIDER',
      value: (
        <a
          className={styles.docLink}
          href={techRider}
          target='_blank'
          rel='noreferrer noopener'
          aria-label='Technical rider, PDF'
        >
          PDF
        </a>
      ),
    })
  }
  if (pressKit) {
    rows.push({
      label: 'PRESS KIT',
      value: (
        <a
          className={styles.docLink}
          href={pressKit}
          target='_blank'
          rel='noreferrer noopener'
          aria-label='Press kit, ZIP'
        >
          ZIP
        </a>
      ),
    })
  }

  if (rows.length === 0 && !productionLabel) return null

  /* v3 9v3.6: <details> so ≥1280px collapses to free margin for Marginalia float.
     At 1024-1279px CSS forces body visible. aria-hidden keeps AT unaffected. */
  return (
    <details className={styles.rider} aria-hidden='true'>
      {/* tabIndex={-1} prevents keyboard focus since aria-hidden covers AT */}
      <summary className={styles.header} tabIndex={-1}>
        <span className={styles.index}>{productionLabel ?? 'SPEC SHEET'}</span>
      </summary>
      <dl className={styles.body}>
        {rows.map((r) => (
          <div className={styles.row} key={r.label}>
            <dt className={styles.key}>{r.label}</dt>
            <dd className={styles.val}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
