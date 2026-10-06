import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { BASE_URL as BASE } from '@/lib/baseUrl'
import { getAllProductions } from '@/lib/content'
import { languageName } from '@/lib/countryCode'

import { isArticle } from '@/lib/listRules'
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

  // One group per production, newest first (undated last), so the
  // production, year and city are said once instead of on every row.
  const groups = productions
    .map((prod) => ({
      prod,
      items: prod.press
        .filter((item) => isArticle(item.url))
        .map((item) => ({
          ...item,
          outlet: item.outlet ?? outletFromUrl(item.url)
        }))
    }))
    .filter((g) => g.items.length > 0)
    .sort(
      (a, b) =>
        (b.prod.year ?? -Infinity) - (a.prod.year ?? -Infinity) ||
        a.prod.title.localeCompare(b.prod.title)
    )

  return (
    <main id='main' className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>
      {locale !== 'ru' && groups.length > 0 && (
        <p className={styles.note}>{t('originalNote')}</p>
      )}

      {groups.length === 0 ? (
        <EmptyState body={t('empty')} />
      ) : (
        groups.map(({ prod, items }) => (
          <section key={prod.slug} className={styles.group}>
            <h2 className={styles.groupHead}>
              <Link
                href={`/productions/${prod.slug}`}
                className={`${styles.groupLink} tap-target`}
              >
                {prod.title}
              </Link>
              <span className={styles.groupMeta}>
                {[prod.year, prod.theatre.city].filter(Boolean).join(' · ')}
              </span>
            </h2>
            <ul className={styles.list}>
              {items.map((item, i) => (
                <li key={i}>
                  <a
                    href={item.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.item}
                  >
                    <span className={styles.headline}>{item.title}</span>
                    <span className={styles.outlet}>
                      {item.outlet}
                      {item.language && item.language !== locale
                        ? ` · ${languageName(item.language, locale)}`
                        : ''}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}
