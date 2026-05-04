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

// Cell widths track the broken-grid geometry: hero cols 1–7 (~58vw, capped at
// max-width-page → ~580px @ 1693), mediums cols 8–12 (~42vw, ~420px), smalls
// 4/12 each (~320px). Mobile + tablet fall back to 100vw / 50vw.
const FEATURED_SIZES = [
  '(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw',
  '(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw',
  '(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw',
  '(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw',
  '(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw',
  '(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw'
]

export function FeaturedStrip({
  productions,
  priorityFirst = false
}: FeaturedStripProps) {
  const cards = productions.slice(0, 6)
  return (
    <ul className={styles.grid}>
      {cards.map((p, i) => (
        <li key={p.slug} className={styles.cell}>
          <DuotonePoster slug={p.slug}>
            <ProductionCard
              production={p}
              priority={priorityFirst && i === 0}
              sizes={FEATURED_SIZES[i] ?? FEATURED_SIZES[5]}
              sticker={
                i === 0 ? (
                  <Sticker accent='vermillion' rotate={3} shadow>
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
