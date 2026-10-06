'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'

import styles from './TourTicker.module.css'

type TickerAccent = 'vermillion' | 'cobalt' | 'mustard' | 'paper'

interface TourTickerProps {
  cities: string[]
  accent: TickerAccent
  /** Accessible label prefix - caller passes t('onTour') from its i18n context. */
  label?: string
}

// 'auto': hover/focus pause the band. After the toggle is used the visitor's
// choice wins, so pressing "play" resumes even while the button has focus.
type Motion = 'auto' | 'paused' | 'playing'

export function TourTicker({ cities, accent, label }: TourTickerProps) {
  const t = useTranslations('accessibility')
  const [motion, setMotion] = React.useState<Motion>('auto')
  const paused = motion === 'paused'
  const band = cities.join(' · ') + ' · '
  const ariaLabel = label ? `${label}: ${cities.join(', ')}` : cities.join(', ')

  return (
    <section
      className={styles.section}
      data-accent={accent}
      data-motion={motion}
      aria-label={ariaLabel}
    >
      {/* Marquee is decorative; full city list is in aria-label above. */}
      <div className={styles.ticker} aria-hidden='true'>
        <div className={styles.track}>
          <span>{band}</span>
          <span>{band}</span>
        </div>
      </div>
      <button
        type='button'
        className={`${styles.toggle} tap-target`}
        aria-pressed={paused}
        aria-label={t('pauseTicker')}
        onClick={() => setMotion(paused ? 'playing' : 'paused')}
      >
        <svg viewBox='0 0 12 12' width='12' height='12' aria-hidden='true'>
          {paused ? (
            <path d='M3 1.5v9l7.5-4.5z' fill='currentColor' />
          ) : (
            <path d='M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z' fill='currentColor' />
          )}
        </svg>
      </button>
    </section>
  )
}
