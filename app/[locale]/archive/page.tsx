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
  const t = await getTranslations({ locale, namespace: 'archive' })
  const tMeta = await getTranslations({ locale, namespace: 'meta' })

  const url = locale === 'en' ? `${BASE}/archive` : `${BASE}/${locale}/archive`
  const title = `${tMeta('siteName')} — ${t('title')}`

  return {
    title,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE}/archive`,
        de: `${BASE}/de/archive`,
        ru: `${BASE}/ru/archive`
      }
    },
    openGraph: { title, url, type: 'website' }
  }
}

const DIRECTOR_ROLES = new Set(['director'])

export default async function ArchivePage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('archive')
  const productions = await getAllProductions(locale)

  // Long-tail CV: exclude director role; sort year asc for chronological doc feel.
  const entries = productions
    .filter((p) => !p.role.some((r) => DIRECTOR_ROLES.has(r)))
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>

      {entries.length === 0 ? (
        <EmptyState body={t('empty')} />
      ) : (
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.thYear}>{t('colYear')}</th>
              <th className={styles.thTitle}>{t('colTitle')}</th>
              <th className={styles.thTheatre}>{t('colTheatre')}</th>
              <th className={styles.thRole}>{t('colRole')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((prod) => (
              <tr key={prod.slug} className={styles.row}>
                <td className={styles.tdYear}>{prod.year ?? '—'}</td>
                <td className={styles.tdTitle}>
                  <Link
                    href={`/productions/${prod.slug}`}
                    className={styles.titleLink}
                  >
                    {prod.title}
                  </Link>
                </td>
                <td className={styles.tdTheatre}>
                  {[
                    prod.theatre.shortName ?? prod.theatre.name,
                    prod.theatre.city
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </td>
                <td className={styles.tdRole}>{prod.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
