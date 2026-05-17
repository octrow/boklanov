import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { BASE_URL as BASE } from '@/lib/baseUrl'
import { getAllProductions } from '@/lib/content'

import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'awards' })
  const tMeta = await getTranslations({ locale, namespace: 'meta' })

  const url = locale === 'en' ? `${BASE}/awards` : `${BASE}/${locale}/awards`
  const title = `${tMeta('siteName')} — ${t('title')}`

  return {
    title,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE}/awards`,
        de: `${BASE}/de/awards`,
        ru: `${BASE}/ru/awards`
      }
    },
    openGraph: { title, url, type: 'website' }
  }
}

export default async function AwardsPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('awards')
  const productions = await getAllProductions(locale)

  const groups = productions
    .filter(
      (p) =>
        (p.awards && p.awards.length > 0) ||
        (p.festivals && p.festivals.length > 0)
    )
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      awards: p.awards,
      festivals: p.festivals ?? []
    }))

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>

      {groups.length === 0 ? (
        <EmptyState body={t('empty')} />
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.slug} className={styles.group}>
              <h2 className={styles.productionTitle}>
                <Link
                  href={`/productions/${group.slug}`}
                  className={styles.productionLink}
                >
                  {group.title}
                </Link>
                <span
                  className={styles.awardCount}
                  aria-label={`${group.awards.length + group.festivals.length} entries`}
                >
                  ×{group.awards.length + group.festivals.length}
                </span>
              </h2>

              {group.awards.length > 0 && (
                <>
                  {group.festivals.length > 0 && (
                    <p className={styles.subLabel}>{t('awardsLabel')}</p>
                  )}
                  <ul className={styles.awardsList}>
                    {group.awards.map((award, i) => (
                      <li key={i} className={styles.awardRow}>
                        <span className={styles.awardMeta}>
                          {award.year != null && award.year > 1900
                            ? String(award.year)
                            : ''}
                        </span>
                        <span className={styles.awardName}>{award.name}</span>
                        {(award.city || award.category) && (
                          <span className={styles.awardDetail}>
                            {[award.city, award.category]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {group.festivals.length > 0 && (
                <>
                  {group.awards.length > 0 && (
                    <p className={styles.subLabel}>{t('festivalsLabel')}</p>
                  )}
                  <ul className={styles.awardsList}>
                    {group.festivals.map((fest, i) => (
                      <li key={i} className={styles.awardRow}>
                        <span className={styles.awardMeta}>
                          {fest.year != null && fest.year > 1900
                            ? String(fest.year)
                            : ''}
                        </span>
                        <span className={styles.awardName}>{fest.name}</span>
                        {(fest.city || fest.category) && (
                          <span className={styles.awardDetail}>
                            {[fest.city, fest.category]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
