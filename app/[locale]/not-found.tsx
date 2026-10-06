'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'

import { Link } from '@/i18n/navigation'

import styles from './not-found.module.css'

// Client component: translations come from the layout's NextIntlClientProvider.
// A server version reads the request locale from headers, which throws inside
// statically generated routes (/productions/[slug]) and turned 404s into 500s.
export default function NotFound() {
  const t = useTranslations('notFound')
  const tA11y = useTranslations('accessibility')

  return (
    <main id='main' className={styles.page}>
      <title>{t('title')}</title>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>{t('heading')}</h1>
      <p className={styles.body}>{t('body')}</p>
      <nav className={styles.links} aria-label={tA11y('returnLinks')}>
        <Link href='/' className={styles.link}>
          {t('home')}
        </Link>
        <Link href='/productions' className={styles.link}>
          {t('productions')}
        </Link>
        <Link href='/contact' className={styles.link}>
          {t('contact')}
        </Link>
      </nav>
    </main>
  )
}
