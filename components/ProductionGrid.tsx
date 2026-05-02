'use client'

import * as React from 'react'

import type { ProductionView } from '@/lib/content'

import { DuotonePoster } from './DuotonePoster'
import { EmptyState } from './EmptyState'
import { ProductionCard } from './ProductionCard'
import styles from './ProductionGrid.module.css'

export interface ProductionGridProps {
  productions: ProductionView[]
  emptyLabel: string
  clearAllLabel?: string
  onClearAll?: () => void
  priorityFirst?: boolean
  /** v3: sticker badge rendered on the first card only. */
  firstCardSticker?: React.ReactNode
  /** v3 §2.4: when true, wrap every card in <DuotonePoster> regardless of
   *  `featured`. Used on the home below-fold grid so the whole `/` reads as a
   *  Bauhaus plakat surface. Default false — `/productions`, filter panel,
   *  and other routes keep photos as-shot. Cards with `featured: true` are
   *  always wrapped, regardless of this flag. */
  duotoneAll?: boolean
}

export function ProductionGrid({
  productions,
  emptyLabel,
  clearAllLabel,
  onClearAll,
  priorityFirst = false,
  firstCardSticker,
  duotoneAll = false
}: ProductionGridProps) {
  if (productions.length === 0) {
    return (
      <EmptyState
        body={emptyLabel}
        action={clearAllLabel && onClearAll ? (
          <button className={styles.emptyReset} onClick={onClearAll}>
            <span aria-hidden="true">→ </span>{clearAllLabel}
          </button>
        ) : undefined}
      />
    )
  }
  return (
    <div className={styles.grid}>
      {productions.map((p, i) => {
        const card = (
          <ProductionCard
            production={p}
            priority={priorityFirst && i === 0}
            sticker={i === 0 ? firstCardSticker : undefined}
          />
        )
        const wrapInDuotone = duotoneAll || p.featured
        return wrapInDuotone ? (
          <DuotonePoster key={p.slug} slug={p.slug}>{card}</DuotonePoster>
        ) : (
          <React.Fragment key={p.slug}>{card}</React.Fragment>
        )
      })}
    </div>
  )
}
