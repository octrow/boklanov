import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { Cue } from '@/components/Cue'
import { EmptyState } from '@/components/EmptyState'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'

import styles from './page.module.css'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX']

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function AwardsPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('awards')
  const productions = getAllProductions(locale)

  const groups = productions
    .filter((p) => p.awards && p.awards.length > 0)
    .map((p) => ({ slug: p.slug, title: p.title, awards: p.awards }))

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>

      {groups.length === 0 ? (
        <EmptyState body={t('empty')} />
      ) : (
        <div className={styles.groups}>
          {groups.map((group, i) => (
            <section key={group.slug} className={styles.group}>
              <Cue mark={`CUE ${ROMAN[i] ?? String(i + 1)}`} first>
                <h2 className={styles.productionTitle}>
                  <Link
                    href={`/productions/${group.slug}`}
                    className={styles.productionLink}
                  >
                    {group.title}
                  </Link>
                  <span className={styles.awardCount} aria-label={`${group.awards.length} awards`}>
                    ×{group.awards.length}
                  </span>
                </h2>
              </Cue>
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
                        {[award.city, award.category].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
