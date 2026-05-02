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

/* v3 §2.4 rollback (fix-pass 2): the asymmetric "broken-grid" (1 large cell
   spanning 2 rows beside two stacked mediums + 3 small + trailing centred wide)
   was geometrically incompatible with the 4:5 ProductionCard aspect-ratio: the
   wide left cell rendered shorter than the two-row right column, leaving dead
   space below the big card and floating hairline rules.

   Reverted to a clean 3-column equal-cell grid (matches §2.4 rollback trigger:
   "equal-size cells"). Visual variety still arrives via DuotonePoster slugHash%2
   (vermillion / cobalt) and a Sticker on the first card. Card baselines align;
   bottom hairlines align across rows. Plakat energy is in the colour and
   stickers, not in card geometry. */

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
