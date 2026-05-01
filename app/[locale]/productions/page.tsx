import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { ProductionGrid } from '@/components/ProductionGrid'
import type { Locale } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'

import styles from './page.module.css'

export default async function ProductionsIndexPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('productions')
  const productions = getAllProductions(locale)

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.count}>{productions.length}</p>
      </header>

      <ProductionGrid productions={productions} emptyLabel={t('empty')} />
    </main>
  )
}
