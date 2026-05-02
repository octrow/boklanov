'use client'

import * as React from 'react'

import type { ProductionView } from '@/lib/content'

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
}

export function ProductionGrid({
  productions,
  emptyLabel,
  clearAllLabel,
  onClearAll,
  priorityFirst = false,
  firstCardSticker
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
      {productions.map((p, i) => (
        <ProductionCard
          key={p.slug}
          production={p}
          priority={priorityFirst && i === 0}
          sticker={i === 0 ? firstCardSticker : undefined}
        />
      ))}
    </div>
  )
}
