import * as React from 'react'

import styles from './Sticker.module.css'

type StickerAccent = 'vermillion' | 'cobalt' | 'mustard'

interface StickerProps {
  variant?: 'award' | 'tour' | 'form'
  accent: StickerAccent
  /** Slug-hash screen-print misregister. Even slug-hash → +3, odd → -3. */
  rotate?: -3 | 0 | 3
  shadow?: boolean
  children: React.ReactNode
}

export function Sticker({ variant = 'form', accent, rotate = 0, shadow = false, children }: StickerProps) {
  return (
    <span
      className={[styles.sticker, shadow ? styles.shadow : ''].filter(Boolean).join(' ')}
      data-variant={variant}
      data-accent={accent}
      style={rotate !== 0 ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      {children}
    </span>
  )
}
