import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'
import { Suspense } from 'react'

import { ProductionGrid } from '@/components/ProductionGrid'
import { SectionStripe } from '@/components/SectionStripe'
import { SlateStrike } from '@/components/SlateStrike'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'

import styles from './home.module.css'

const STAGING_CITIES = ['СПБ', 'МОСКВА', 'АЛМАТЫ', 'БРЕМЕН', 'ВЕНА', 'БЕРЛИН', 'ТАШКЕНТ']

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const tProductions = await getTranslations('productions')

  const productions = getAllProductions(locale)

  // Featured: curated (featured: true), must have a poster so no typographic
  // fallback lands in the above-the-fold strip (DESIGN §9). Cap at 6.
  const featured = productions.filter((p) => p.featured && p.poster.src).slice(0, 6)

  // Below-fold grid: director role only (brief D5 — curator default).
  // Exclude titles already shown in the featured strip above.
  const featuredSlugs = new Set(featured.map((p) => p.slug))
  const directorProductions = productions.filter(
    (p) => p.role.includes('director') && !featuredSlugs.has(p.slug)
  )

  const wordmark = locale === 'ru' ? 'роман бокланов' : 'roman boklanov'

  return (
    <main className={styles.page}>
      <SectionStripe />
      {/* Hero — DESIGN §10: type-led wordmark, no photo overlay */}
      <Suspense fallback={null}>
        <SlateStrike>
          <section className={styles.hero}>
            <h1 className={styles.wordmark}>{wordmark}</h1>
            <p className={styles.heroMeta}>{t('heroMeta')}</p>
            <p className={styles.statement}>{t('statement')}</p>
            {/* Compressed staging-geography echo — DA-2.C */}
            <p className={styles.geographyEcho} aria-hidden="true">
              {STAGING_CITIES.join(' · ')}
            </p>
          </section>
        </SlateStrike>
      </Suspense>

      {/* Featured strip — 4–6 hand-curated cards (brief D5) */}
      {featured.length > 0 && (
        <>
          <section className={styles.section} aria-label={t('featuredLabel')}>
            <p className={styles.sectionLabel}>{t('featuredLabel')}</p>
            <ProductionGrid productions={featured} emptyLabel='' priorityFirst />
          </section>
          <hr />
        </>
      )}

      {/* Director productions grid — filterable in C4, defaulted here */}
      <section className={styles.section} aria-label={t('allLabel')}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>{t('allLabel')}</p>
          <Link href='/productions' className={styles.viewAll}>
            {t('viewAll')}
          </Link>
        </div>
        <ProductionGrid
          productions={directorProductions}
          emptyLabel={tProductions('empty')}
        />
      </section>
    </main>
  )
}
