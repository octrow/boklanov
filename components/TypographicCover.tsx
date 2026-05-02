import * as React from 'react'

import styles from './TypographicCover.module.css'

interface TypographicCoverProps {
  /** Slug used to deterministically pick layout variant (top/centre/bottom-set). */
  slug: string
  title: string
  /** Theatre short name (top of meta line). */
  theatre?: string | null
  /** Optional country/city marker (mid of meta line). */
  countryCode?: string | null
  year?: number | null
  /** Optional synopsis line — proposal §6.2 collision-buster. Rendered as
   * italic Lora above meta when present, truncated to 60 chars. */
  synopsis?: string | null
}

type Variant = 'top' | 'centre' | 'bottom'

function variantForSlug(slug: string): Variant {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i)) | 0
  return (['bottom', 'top', 'centre'] as const)[Math.abs(hash) % 3]
}

/**
 * Canonical cover for productions without a photographic poster.
 * Per DESIGN_v2_PROPOSAL.md §4.5 + §6.2: not a fallback — the frame IS
 * the cover. 4:5 aspect, Lora display title, JetBrains Mono meta line.
 *
 * Slug-hash mod 3 picks one of three layout variants (top / centre /
 * bottom-set title placement) so two productions sharing theatre+year
 * don't render visually identical plates in an index grid.
 *
 * aria-hidden because the visible <h3> title below the cover (in
 * ProductionCard) already carries the name for SR.
 */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

export function TypographicCover({
  slug,
  title,
  theatre,
  countryCode,
  year,
  synopsis,
}: TypographicCoverProps) {
  const variant = variantForSlug(slug)
  const metaParts = [theatre, countryCode, year].filter(Boolean)
  const synopsisLine = synopsis ? truncate(synopsis, 60) : null

  return (
    <div
      className={`${styles.cover} ${styles[variant]}`}
      data-cover-style='typographic'
      aria-hidden='true'
    >
      <h4 className={styles.title}>{title}</h4>
      {synopsisLine && <p className={styles.synopsis}>{synopsisLine}</p>}
      {metaParts.length > 0 && (
        <p className={styles.meta}>{metaParts.join(' · ')}</p>
      )}
    </div>
  )
}
