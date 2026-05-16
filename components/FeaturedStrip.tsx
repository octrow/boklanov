import { getTranslations } from 'next-intl/server'
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
// 4/12 each (~320px). Mobile + tablet fall back to 90vw / 50vw — 90vw (not
// 100vw) reflects the actual rendered width on mobile: .page has 20 px
// gutters, so a 412-px viewport renders 372 px ≈ 90.3 vw. 100vw made the
// srcset picker round up to 828w when 720w fits — costs ~30 % on the LCP
// image on Moto-class viewports. Mirror the hero value in
// app/[locale]/page.tsx's preload `imageSizes`.
const FEATURED_SIZES = [
  '(min-width: 1024px) 600px, (min-width: 768px) 50vw, 90vw',
  '(min-width: 1024px) 420px, (min-width: 768px) 50vw, 90vw',
  '(min-width: 1024px) 420px, (min-width: 768px) 50vw, 90vw',
  '(min-width: 1024px) 320px, (min-width: 768px) 50vw, 90vw',
  '(min-width: 1024px) 320px, (min-width: 768px) 50vw, 90vw',
  '(min-width: 1024px) 320px, (min-width: 768px) 50vw, 90vw'
]

export async function FeaturedStrip({
  productions,
  priorityFirst = false
}: FeaturedStripProps) {
  const t = await getTranslations('home')
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
              coverPhoto={p.featuredPhoto ?? p.productionsPhoto ?? null}
              sticker={
                i === 0 ? (
                  <Sticker accent='vermillion' rotate={3} shadow>
                    {t('featuredPick')}
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
