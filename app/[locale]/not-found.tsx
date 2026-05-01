import { getTranslations } from 'next-intl/server'
import * as React from 'react'

import { Link } from '@/i18n/navigation'

import styles from './not-found.module.css'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>{t('heading')}</h1>
      <p className={styles.body}>{t('body')}</p>
      <nav className={styles.links} aria-label='Return links'>
        <Link href='/' className={styles.link}>
          {t('home')}
        </Link>
        <Link href='/productions' className={styles.link}>
          {t('productions')}
        </Link>
      </nav>
    </main>
  )
}
