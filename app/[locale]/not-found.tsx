import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import * as React from 'react'

import { Link } from '@/i18n/navigation'

import styles from './not-found.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound')
  return { title: t('title') }
}

export default async function NotFound() {
  const t = await getTranslations('notFound')
  const tA11y = await getTranslations('accessibility')

  return (
    <main id='main' className={styles.page}>
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
