import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { FeaturedStrip } from '@/components/FeaturedStrip'
import { ProductionGrid } from '@/components/ProductionGrid'
import { SiteHero } from '@/components/SiteHero'
import { TourTicker } from '@/components/TourTicker'
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
  const tAbout = await getTranslations('about')
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

  return (
    <main className={styles.page}>
      {/* Hero — v3 §7.2: gradient Unbounded wordmark + Lora statement */}
      <SiteHero locale={locale} statement={t('statement')} />

      {/* Tour ticker — §2.9: past-tense staging cities, between hero and featured */}
      <TourTicker cities={STAGING_CITIES} accent="mustard" label={tAbout('stagedIn')} />

      {/* Featured strip — v3 §2.4: broken-grid, 1 large + 2 medium + 3 small */}
      {featured.length > 0 && (
        <>
          <section className={styles.section} aria-label={t('featuredLabel')}>
            <p className={styles.sectionLabel}>{t('featuredLabel')}</p>
            <FeaturedStrip productions={featured} priorityFirst />
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
