import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'

import styles from './page.module.css'

const BASE = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com'
).replace(/\/$/, '')

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'press' })
  const tMeta = await getTranslations({ locale, namespace: 'meta' })

  const url = locale === 'en' ? `${BASE}/press` : `${BASE}/${locale}/press`
  const title = `${tMeta('siteName')} — ${t('title')}`

  return {
    title,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE}/press`,
        de: `${BASE}/de/press`,
        ru: `${BASE}/ru/press`
      }
    },
    openGraph: { title, url, type: 'website' }
  }
}

function outletFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname
    return host.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function PressPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('press')
  const productions = await getAllProductions(locale)

  interface PressItem {
    title: string
    url: string
    outlet: string
    productionSlug: string
    productionTitle: string
  }

  const items: PressItem[] = []
  for (const prod of productions) {
    for (const item of prod.press) {
      items.push({
        title: item.title,
        url: item.url,
        outlet: item.outlet ?? outletFromUrl(item.url),
        productionSlug: prod.slug,
        productionTitle: prod.title
      })
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>

      {items.length === 0 ? (
        <EmptyState body={t('empty')} />
      ) : (
        <div className={styles.grid}>
          {items.map((item, i) => (
            <article key={i} className={styles.card}>
              <blockquote className={styles.quote}>
                <a
                  href={item.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.quoteLink}
                >
                  {item.title}
                </a>
              </blockquote>
              <footer className={styles.cardFooter}>
                <a
                  href={item.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.outletLink}
                >
                  {item.outlet}
                </a>
                <span className={styles.separator}>·</span>
                <Link
                  href={`/productions/${item.productionSlug}`}
                  className={styles.productionRef}
                >
                  {item.productionTitle}
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
