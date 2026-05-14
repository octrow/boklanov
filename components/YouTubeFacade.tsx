'use client'

import * as React from 'react'

import styles from './YouTubeFacade.module.css'

interface Props {
  /** YouTube video ID — the `v` query param or the path segment in /embed/{id}. */
  videoId: string
  /** Used for both the <iframe title> and the play-button aria-label. */
  title: string
  /** Localized "Play video" label for the button. */
  playLabel: string
}

/**
 * Click-to-play YouTube embed. Renders a static thumbnail (mq-default.jpg from
 * i.ytimg.com — no cookies, no JS) until the user activates it; only then does
 * the privacy-enhanced iframe mount. Without the facade Lighthouse logs ~39
 * third-party cookies, ~2.2 MiB of unused YouTube JS, gstatic Roboto fetches,
 * and BP-tanking console noise on first load.
 *
 * After activation we autoplay so the click feels like a normal play button.
 */
export function YouTubeFacade({ videoId, title, playLabel }: Props) {
  const [activated, setActivated] = React.useState(false)

  if (activated) {
    return (
      <iframe
        className={styles.frame}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        loading='lazy'
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture'
        allowFullScreen
        referrerPolicy='strict-origin-when-cross-origin'
      />
    )
  }

  // i.ytimg.com hdefault is 480x360 — preview-only assets, no cookies set.
  const poster = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return (
    <button
      type='button'
      className={styles.facade}
      onClick={() => setActivated(true)}
      aria-label={`${playLabel}: ${title}`}
      style={{ backgroundImage: `url(${poster})` }}
    >
      <span className={styles.play} aria-hidden='true'>
        <svg viewBox='0 0 68 48' width='68' height='48'>
          <path
            d='M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z'
            fill='#212121'
            fillOpacity='0.8'
          />
          <path d='M45 24 27 14v20' fill='#fff' />
        </svg>
      </span>
    </button>
  )
}
