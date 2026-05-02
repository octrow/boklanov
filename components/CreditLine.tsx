import * as React from 'react'

import styles from './CreditLine.module.css'

interface CreditLineProps {
  photographer?: string | null
  year?: number | string | null
}

/**
 * Photo credit primitive per DESIGN_v2_PROPOSAL.md §6.3.
 * Renders only the fields that exist; em-dash separated; never inserts
 * placeholder strings. Survives 80% missing data without apologising.
 *
 *   Photo — A. Surname — 2019    (both present)
 *   Photo — A. Surname           (photographer only)
 *   2019                         (year only)
 *   null                         (neither — renders nothing)
 *
 * Provided as a primitive for future call-sites (press credits, hero
 * images, structured gallery credits). Current SpecimenPlate caption
 * already handles unstructured `gallery[].credit` strings directly.
 */
export function CreditLine({ photographer, year }: CreditLineProps) {
  const hasPhoto = !!photographer
  const hasYear = year !== null && year !== undefined && year !== ''

  if (!hasPhoto && !hasYear) return null

  const parts: React.ReactNode[] = []
  if (hasPhoto) parts.push('Photo')
  if (hasPhoto) parts.push(photographer)
  if (hasYear) parts.push(String(year))

  return (
    <small className={styles.credit}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className={styles.sep} aria-hidden='true'> — </span>}
          <span>{p}</span>
        </React.Fragment>
      ))}
    </small>
  )
}
