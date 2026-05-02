import * as React from 'react'

import type { ProductionView } from '@/lib/content'

import { DuotonePoster } from './DuotonePoster'
import { ProductionCard } from './ProductionCard'
import { Sticker } from './Sticker'
import styles from './FeaturedStrip.module.css'

interface FeaturedStripProps {
  productions: ProductionView[]
  priorityFirst?: boolean
}

export function FeaturedStrip({ productions, priorityFirst = false }: FeaturedStripProps) {
  const cards = productions.slice(0, 6)
  return (
    <div className={styles.grid}>
      {cards.map((p, i) => (
        <div
          key={p.slug}
          className={[styles.cell, styles[`cell${i + 1}`]].join(' ')}
        >
          <DuotonePoster slug={p.slug}>
            <ProductionCard
              production={p}
              priority={priorityFirst && i === 0}
              sticker={
                i === 0 ? (
                  <Sticker accent="vermillion" rotate={3} shadow>
                    PICK
                  </Sticker>
                ) : undefined
              }
            />
          </DuotonePoster>
        </div>
      ))}
    </div>
  )
}
