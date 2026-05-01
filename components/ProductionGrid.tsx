'use client'

import * as React from 'react'

import type { ProductionView } from '@/lib/content'

import { ProductionCard } from './ProductionCard'
import styles from './ProductionGrid.module.css'

export interface ProductionGridProps {
  productions: ProductionView[]
  emptyLabel: string
  clearAllLabel?: string
  onClearAll?: () => void
  priorityFirst?: boolean
}

export function ProductionGrid({
  productions,
  emptyLabel,
  clearAllLabel,
  onClearAll,
  priorityFirst = false
}: ProductionGridProps) {
  if (productions.length === 0) {
    return (
      <p className={styles.empty}>
        {emptyLabel}
        {clearAllLabel && onClearAll && (
          <>
            {' · '}
            <button className={styles.emptyReset} onClick={onClearAll}>
              {clearAllLabel}
            </button>
          </>
        )}
      </p>
    )
  }
  return (
    <div className={styles.grid}>
      {productions.map((p, i) => (
        <ProductionCard key={p.slug} production={p} priority={priorityFirst && i === 0} />
      ))}
    </div>
  )
}
