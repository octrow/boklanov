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
  loading = 'lazy'
}: SpecimenPlateProps) {
  const indexLabel = `${String(plateNumber).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  return (
    <figure className={styles.plate}>
      <div className={styles.frame}>
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes='(min-width: 768px) 50vw, 100vw'
          loading={loading}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.index}>{indexLabel}</span>
        {credit && <span className={styles.credit}>{credit}</span>}
      </figcaption>
    </figure>
  )
}
