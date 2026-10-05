import Image from 'next/image'
import * as React from 'react'

import styles from './SpecimenPlate.module.css'

interface SpecimenPlateProps {
  src: string
  alt: string
  credit?: string | null
  /** 1-based plate index for archival caption "07 / 24". */
  plateNumber: number
  total: number
  loading?: 'lazy' | 'eager'
  /** next/image sizes hint. Default suits the about-page 2-up. Gallery thumbs
   *  override with something much smaller — they render as ~226px columns. */
  sizes?: string
  quality?: number
  /** Pre-baked AVIF variants (PAYLOAD_IMAGE_VARIANTS_PLAN.md). When set,
   *  the plate renders a plain `<img srcset>` and skips `/_next/image`. */
  variants?: {
    w420: string
    w600: string
    w720: string
    w828: string
    w1080: string
  } | null
}

/**
 * Photographic plate per DESIGN_v2_PROPOSAL.md §4.2.
 * Frame uses --specimen-rule (inset 1px) at ≥768px to signal "object
 * catalogued, not floated" — opposite failure mode from the original
 * §11 drop-shadow ban. Caption is never empty: zero-padded index "07 / 24"
 * plus optional credit. When credit is null, the index alone serves as
 * an honest cataloguing fact, not as a UI absence.
 */
export function SpecimenPlate({
  src,
  alt,
  credit,
  plateNumber,
  total,
  loading = 'lazy',
  sizes = '(min-width: 768px) 50vw, 90vw',
  quality,
  variants
}: SpecimenPlateProps) {
  const indexLabel = `${String(plateNumber).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  return (
    <figure className={styles.plate}>
      <div className={styles.frame}>
        {variants ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={variants.w600}
            srcSet={`${variants.w420} 420w, ${variants.w600} 600w, ${variants.w720} 720w, ${variants.w828} 828w, ${variants.w1080} 1080w`}
            sizes={sizes}
            alt={alt}
            decoding='async'
            loading={loading}
            style={{ width: '100%', height: 'auto' }}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={0}
            height={0}
            sizes={sizes}
            quality={quality}
            loading={loading}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.index}>{indexLabel}</span>
        {credit && <span className={styles.credit}>{credit}</span>}
      </figcaption>
    </figure>
  )
}
