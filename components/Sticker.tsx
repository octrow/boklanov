import * as React from 'react'

import styles from './Sticker.module.css'

type StickerAccent = 'vermillion' | 'cobalt' | 'mustard'

interface StickerProps {
  variant?: 'award' | 'tour' | 'form'
  accent: StickerAccent
  /** Slug-hash screen-print misregister. Even slug-hash → +3, odd → -3. */
  rotate?: -3 | 0 | 3
  shadow?: boolean
  /** Layout mode.
   * - `'floating'` (default) - `position: absolute`, top-right of nearest
   *   `position: relative` ancestor (typically ProductionCard `.cover`). Used
   *   for card-overlay badges in FeaturedStrip.
   * - `'inline'` - `position: static`, no absolute escape. Used for the
   *   production-detail `<div>.stickerRow` row above the title.
   */
  layout?: 'floating' | 'inline'
  children: React.ReactNode
}

export function Sticker({
  variant = 'form',
  accent,
  rotate = 0,
  shadow = false,
  layout = 'floating',
  children
}: StickerProps) {
  return (
    <span
      className={[
        styles.sticker,
        layout === 'inline' ? styles.inline : '',
        shadow ? styles.shadow : ''
      ]
        .filter(Boolean)
        .join(' ')}
      data-variant={variant}
      data-accent={accent}
      style={rotate !== 0 ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      {children}
    </span>
  )
}
