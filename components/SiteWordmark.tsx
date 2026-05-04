import * as React from 'react'

import styles from './SiteWordmark.module.css'

/* v3 §4.4 (revised 2026-05-03 after visual review):
   Hero stays Unbounded ALL CAPS gradient - the one decisive plakat gesture.
   Header + footer reverted to v1/v2 Lora lowercase. Unbounded at chrome scale
   read as too tech and broke editorial register. Hero is the only Unbounded
   surface in chrome. */

interface SiteWordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'hero' | 'header' | 'footer'
  text: string
}

export function SiteWordmark({
  variant,
  text,
  className,
  ...rest
}: SiteWordmarkProps) {
  return (
    <span
      className={[styles.wordmark, styles[variant], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {text}
    </span>
  )
}
