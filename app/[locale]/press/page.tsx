import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'

import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
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
  const productions = getAllProductions(locale)

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
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.quoteLink}
                >
                  {item.title}
                </a>
              </blockquote>
              <footer className={styles.cardFooter}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
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
