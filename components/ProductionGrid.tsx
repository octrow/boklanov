import * as React from 'react'

import type { ProductionView } from '@/lib/content'

import { ProductionCard } from './ProductionCard'
import styles from './ProductionGrid.module.css'

export interface ProductionGridProps {
  productions: ProductionView[]
  emptyLabel: string
}

export function ProductionGrid({ productions, emptyLabel }: ProductionGridProps) {
  if (productions.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>
  }
  return (
    <div className={styles.grid}>
      {productions.map((p) => (
        <ProductionCard key={p.slug} production={p} />
      ))}
    </div>
  )
}
