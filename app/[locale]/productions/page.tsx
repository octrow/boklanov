import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'
import { Suspense } from 'react'

import { FilteredProductionsPanel } from '@/components/FilteredProductionsPanel'
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

  // Default view for the Suspense fallback (shown in static HTML pre-hydration).
  // Matches the filter default: role=director per brief D5.
  const directorProductions = productions.filter((p) => p.role === 'director')

  const labels = {
    roleDirector: t('roleDirector'),
    roleCoDirector: t('roleCoDirector'),
    rolePerformer: t('rolePerformer'),
    roleReader: t('roleReader'),
    roleAll: t('roleAll'),
    clearAll: t('clearAll'),
    emptyLabel: t('empty')
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
      </header>

      {/*
       * Suspense boundary: useSearchParams() in FilteredProductionsPanel
       * requires a Suspense parent so the page shell can be statically
       * generated (build stays fully SSG). The fallback renders the
       * default director grid immediately while the client hydrates.
       */}
      <Suspense
        fallback={
          <ProductionGrid productions={directorProductions} emptyLabel='' />
        }
      >
        <FilteredProductionsPanel productions={productions} labels={labels} />
      </Suspense>
    </main>
  )
}
