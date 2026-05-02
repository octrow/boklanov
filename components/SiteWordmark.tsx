import * as React from 'react'

import type { Locale } from '@/i18n/routing'

import styles from './SiteWordmark.module.css'

/* v3 §4.4 (revised 2026-05-03 after visual review):
   Hero stays Unbounded ALL CAPS gradient — the one decisive plakat gesture.
   Header + footer reverted to v1/v2 Lora lowercase. Unbounded at chrome scale
   read as too tech and broke editorial register. Hero is the only Unbounded
   surface in chrome. */

const TEXT_HERO: Record<Locale, string> = {
  ru: 'Роман Бокланов',
  en: 'Roman Boklanov',
  de: 'Roman Boklanov',
}

const TEXT_CHROME: Record<Locale, string> = {
  ru: 'роман бокланов',
  en: 'roman boklanov',
  de: 'roman boklanov',
}

interface SiteWordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'hero' | 'header' | 'footer'
  locale: Locale
}

export function SiteWordmark({ variant, locale, className, ...rest }: SiteWordmarkProps) {
  const text = variant === 'hero' ? TEXT_HERO[locale] : TEXT_CHROME[locale]
  return (
    <span
      className={[styles.wordmark, styles[variant], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {text}
    </span>
  )
}
