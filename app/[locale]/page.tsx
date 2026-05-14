import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { FeaturedStrip } from '@/components/FeaturedStrip'
import { IconArrowRight } from '@/components/IconArrowRight'
import { ProductionGrid } from '@/components/ProductionGrid'
import { SiteHero } from '@/components/SiteHero'
import { TourTicker } from '@/components/TourTicker'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { cdnUrl } from '@/lib/cdn'
import { getAllProductions } from '@/lib/content'

import styles from './home.module.css'

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

  const productions = await getAllProductions(locale)

  // Featured: curated (featured: true), must have a poster so no typographic
  // fallback lands in the above-the-fold strip (DESIGN §9). Cap at 6.
  // Order: items with explicit `featuredOrder` first (ascending), then the rest
  // alphabetically by slug. Pin a hero piece with e.g. `featuredOrder: 1`.
  const featured = productions
    .filter((p) => p.featured && p.poster.src)
    .sort((a, b) => {
      const ao = a.featuredOrder
      const bo = b.featuredOrder
      if (ao != null && bo != null) return ao - bo
      if (ao != null) return -1
      if (bo != null) return 1
      return a.slug.localeCompare(b.slug)
    })
    .slice(0, 6)

  // Below-fold grid: director role only (brief D5 — curator default).
  // Exclude titles already shown in the featured strip above.
  // Only productions with explicit `listOrder` appear here (choose + order + limit
  // via frontmatter). Sort ascending by listOrder.
  const featuredSlugs = new Set(featured.map((p) => p.slug))
  const directorProductions = productions
    .filter(
      (p) =>
        p.role.includes('director') &&
        !featuredSlugs.has(p.slug) &&
        p.listOrder != null
    )
    .sort((a, b) => (a.listOrder ?? 0) - (b.listOrder ?? 0))

  // LCP preload — the first card's cover image is the LCP element on the
  // homepage. When variants are baked, the card renders a plain `<img>` that
  // would otherwise miss Next's auto-injected preload from `priority`. The
  // sizes string mirrors the first slot in FeaturedStrip's FEATURED_SIZES.
  const lcpCover =
    featured[0]?.featuredPhoto ??
    featured[0]?.productionsPhoto ??
    featured[0]?.poster ??
    null
  const lcpVariants =
    (
      lcpCover as {
        variants?: import('@/lib/content').ImageVariants | null
      } | null
    )?.variants ?? null

  return (
    <main className={styles.page}>
      {lcpVariants && (
        <link
          rel='preload'
          as='image'
          imageSrcSet={`${cdnUrl(lcpVariants.w420)} 420w, ${cdnUrl(lcpVariants.w600)} 600w, ${cdnUrl(lcpVariants.w720)} 720w, ${cdnUrl(lcpVariants.w828)} 828w, ${cdnUrl(lcpVariants.w1080)} 1080w`}
          imageSizes='(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw'
          fetchPriority='high'
        />
      )}
      {/* Hero — v3 §7.2: gradient Unbounded wordmark + Lora statement */}
      <SiteHero heroWordmark={t('heroWordmark')} statement={t('statement')} />

      {/* Tour ticker — §2.9: past-tense staging cities, between hero and featured */}
      <TourTicker
        cities={t.raw('stagingCities') as string[]}
        accent='mustard'
        label={tAbout('stagedIn')}
      />

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
          duotoneAll
        />
        <Link href='/productions' className={styles.allProductionsBtn}>
          <span>{t('viewAll').replace(/\s*→\s*$/, '')}</span>
          <IconArrowRight size={14} />
        </Link>
      </section>
    </main>
  )
}
