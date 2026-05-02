import * as React from 'react'

import type { Locale } from '@/i18n/routing'

import { SiteWordmark } from './SiteWordmark'
import styles from './SiteHero.module.css'

const SR_NAME: Record<Locale, string> = {
  ru: 'Роман Бокланов',
  en: 'Roman Boklanov',
  de: 'Roman Boklanov'
}

interface SiteHeroProps {
  locale: Locale
  statement: string
}

export function SiteHero({ locale, statement }: SiteHeroProps) {
  return (
    <section className={styles.hero}>
      {/* SR reads plain text; visible wordmark is aria-hidden gradient */}
      <h1 className={styles.srOnly}>{SR_NAME[locale]}</h1>
      <p className={styles.heroWordmark} aria-hidden="true">
        <SiteWordmark variant="hero" locale={locale} />
      </p>
      <p className={styles.statement}>{statement}</p>
      <p className={styles.scrollHint} aria-hidden="true">↓</p>
    </section>
  )
}
