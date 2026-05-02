import * as React from 'react'

import type { Locale } from '@/i18n/routing'

import styles from './SiteWordmark.module.css'

const TEXT: Record<Locale, string> = {
  ru: 'Роман Бокланов',
  en: 'Roman Boklanov',
  de: 'Roman Boklanov'
}

interface SiteWordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'hero' | 'header' | 'footer'
  locale: Locale
}

export function SiteWordmark({ variant, locale, className, ...rest }: SiteWordmarkProps) {
  return (
    <span
      className={[styles.wordmark, styles[variant], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {TEXT[locale]}
    </span>
  )
}
