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

/* v3 §2.4 broken-grid (re-attempt). Geometry + override mechanism in
   FeaturedStrip.module.css header; root-cause + ranked options in
   .design/boklanov-rewrite/FEATURED_STRIP_GRID_RESEARCH.md. */

export function FeaturedStrip({ productions, priorityFirst = false }: FeaturedStripProps) {
  const cards = productions.slice(0, 6)
  return (
    <ul className={styles.grid}>
      {cards.map((p, i) => (
        <li key={p.slug} className={styles.cell}>
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
        </li>
      ))}
    </ul>
  )
}
