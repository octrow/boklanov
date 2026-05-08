import * as React from 'react'

import styles from './TourTicker.module.css'

type TickerAccent = 'vermillion' | 'cobalt' | 'mustard' | 'paper'

interface TourTickerProps {
  cities: string[]
  accent: TickerAccent
  /** Accessible label prefix - caller passes t('onTour') from its i18n context. */
  label?: string
}

export function TourTicker({ cities, accent, label }: TourTickerProps) {
  const band = cities.join(' · ') + ' · '
  const ariaLabel = label ? `${label}: ${cities.join(', ')}` : cities.join(', ')

  return (
    <section
      className={styles.section}
      data-accent={accent}
      aria-label={ariaLabel}
    >
      {/* Marquee is decorative; full city list is in aria-label above. */}
      <div className={styles.ticker} aria-hidden='true'>
        <div className={styles.track}>
          <span>{band}</span>
          <span>{band}</span>
        </div>
      </div>
    </section>
  )
}
