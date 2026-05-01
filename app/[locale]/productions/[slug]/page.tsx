import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import * as React from 'react'

import { countryCode } from '@/components/ProductionCard'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { getAllProductions, getProduction, type ProductionView } from '@/lib/content'

import styles from './page.module.css'

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com').replace(/\/$/, '')

// Map theatre country code to a BCP 47 language tag for inLanguage.
function productionLanguage(country: string | undefined): string {
  if (!country) return 'ru'
  const upper = country.toUpperCase()
  if (upper === 'DE' || upper === 'AT' || upper === 'CH') return 'de'
  if (upper === 'KZ') return 'ru'
  return 'ru'
}

// Map ageRating to a schema.org audienceType description.
function audienceType(ageRating: string | null | undefined): string | null {
  if (!ageRating) return null
  const map: Record<string, string> = {
    '3+': 'Family, ages 3+',
    '6+': 'Family, ages 6+',
    '12+': 'Young adult, ages 12+',
    '18+': 'Adult, ages 18+',
  }
  return map[ageRating] ?? ageRating
}

function creativeWorkSchema(production: ProductionView, slug: string, locale: Locale) {
  const pageUrl = locale === 'ru'
    ? `${BASE}/productions/${slug}`
    : `${BASE}/${locale}/productions/${slug}`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: production.titles.ru ?? production.titles.en ?? slug,
    description: production.synopsis || undefined,
    inLanguage: productionLanguage(production.theatre.country),
    url: pageUrl,
    director: {
      '@type': 'Person',
      name: 'Roman Boklanov',
      url: `${BASE}/about`,
    },
  }

  const altNames = [production.titles.en, production.titles.de].filter(Boolean)
  if (altNames.length) schema.alternateName = altNames

  if (production.year) schema.dateCreated = String(production.year)

  const audience = audienceType(production.ageRating)
  if (audience) {
    schema.audience = { '@type': 'PeopleAudience', audienceType: audience }
  }

  if (production.theatre.name || production.theatre.shortName) {
    const org: Record<string, unknown> = {
      '@type': 'Organization',
      name: production.theatre.name ?? production.theatre.shortName,
    }
    if (production.theatre.city || production.theatre.country) {
      const addr: Record<string, string> = { '@type': 'PostalAddress' }
      if (production.theatre.city) addr.addressLocality = production.theatre.city
      if (production.theatre.country) addr.addressCountry = production.theatre.country
      org.address = addr
    }
    if (production.theatre.url) org.url = production.theatre.url
    schema.productionCompany = org
  }

  if (production.poster.src) {
    schema.image = production.poster.src.startsWith('http')
      ? production.poster.src
      : `${BASE}${production.poster.src}`
  }

  return schema
}

type Props = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const production = getProduction(slug, locale)
  if (!production) return {}

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com').replace(/\/$/, '')
  const url = locale === 'ru' ? `${base}/productions/${slug}` : `${base}/${locale}/productions/${slug}`
  const ogImage = `${base}/api/og/${slug}`

  return {
    title: production.title,
    description: production.synopsis || undefined,
    alternates: {
      canonical: url,
      languages: {
        ru: `${base}/productions/${slug}`,
        en: `${base}/en/productions/${slug}`,
      },
    },
    openGraph: {
      title: production.titles.ru ?? production.title,
      description: production.synopsis || undefined,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: production.titles.ru ?? production.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: production.titles.ru ?? production.title,
      description: production.synopsis || undefined,
      images: [ogImage],
    },
  }
}

export function generateStaticParams() {
  // Cartesian product of locales × slugs so every (locale, slug) pair is SSG.
  const slugs = getAllProductions(routing.defaultLocale).map((p) => p.slug)
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  )
}

export default async function ProductionDetailPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const production = getProduction(slug, locale)
  if (!production) notFound()

  const t = await getTranslations('productionDetail')

  const titleRu = production.titles.ru
  const titleEn = production.titles.en
  const titleDe = production.titles.de
  const showEn = !!titleEn && titleEn !== titleRu
  const showDe = !!titleDe && titleDe !== titleRu && titleDe !== titleEn

  const country = countryCode(production.theatre.country)
  const chips: string[] = []
  if (production.ageRating) chips.push(production.ageRating)
  if (production.year) chips.push(String(production.year))
  if (production.durationMin) chips.push(`${production.durationMin} MIN`)
  if (country) chips.push(country)

  const theatreLine = [
    production.theatre.name ?? production.theatre.shortName,
    production.theatre.city
  ]
    .filter(Boolean)
    .join(' · ')

  // Sticky CTA mailto: pre-filled per brief D7. Subject names the show; body
  // hints what we want from a touring inquiry. EN body — most curators write
  // either RU or EN; EN reads cleanly to both.
  const subject = `Touring inquiry: ${titleRu ?? titleEn ?? slug}`
  const body =
    `Hi Roman,\n\n` +
    `I'm interested in touring ${titleRu ?? titleEn ?? slug} ` +
    `(${production.year ?? ''}${production.role ? `, ${production.role}` : ''}).\n\n` +
    `Tour window:\n` +
    `Venue / festival:\n` +
    `Notes:\n`
  const mailto = `mailto:roman@boklanov.ru?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`

  const primaryVideo = production.videos[0]
  const videoUrl =
    primaryVideo?.provider === 'youtube'
      ? `https://www.youtube.com/watch?v=${primaryVideo.id}`
      : primaryVideo?.provider === 'vimeo'
        ? `https://vimeo.com/${primaryVideo.id}`
        : null

  const schema = creativeWorkSchema(production, slug, locale)

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* 1. Cover — full-bleed, original aspect ratio respected */}
      {production.poster.src && (
        <figure className={styles.cover}>
          {production.poster.width && production.poster.height ? (
            <Image
              src={production.poster.src}
              alt={[
                production.role,
                titleRu ?? titleEn ?? slug,
                production.theatre.name ?? production.theatre.shortName,
                production.year
              ].filter(Boolean).join(', ')
                + (production.poster.credit ? ` (${production.poster.credit})` : '')}
              width={production.poster.width}
              height={production.poster.height}
              priority
              sizes='(min-width: 1024px) 60vw, 100vw'
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          ) : (
            <img
              src={production.poster.src}
              alt={[
                production.role,
                titleRu ?? titleEn ?? slug,
                production.theatre.name ?? production.theatre.shortName,
                production.year
              ].filter(Boolean).join(', ')
                + (production.poster.credit ? ` (${production.poster.credit})` : '')}
              loading='eager'
              decoding='async'
            />
          )}
          {production.poster.credit && (
            <figcaption className={styles.coverCredit}>
              {production.poster.credit}
            </figcaption>
          )}
        </figure>
      )}

      {/* .layout: on desktop becomes a CSS grid [720px content | 1fr rail].
          .stickyCta lives in the rail column so it's visible from landing. */}
      <div className={styles.layout}>
      <div className={styles.column}>
        {/* 2. Title block */}
        <header className={styles.titleBlock}>
          {titleRu && <h1 className={styles.titleRu}>{titleRu}</h1>}
          {showEn && <p className={styles.titleEn}>{titleEn}</p>}
          {showDe && <p className={styles.titleDe}>{titleDe}</p>}
          {theatreLine && <p className={styles.theatre}>{theatreLine}</p>}
        </header>

        {/* 3. Chips row */}
        {chips.length > 0 && (
          <ul className={styles.chips}>
            {chips.map((c) => (
              <li key={c} className={styles.chip}>
                {c}
              </li>
            ))}
          </ul>
        )}

        {/* 4. One-line synopsis */}
        {production.synopsis && (
          <p className={styles.synopsis}>{production.synopsis}</p>
        )}

        {/* 6. Action bar — hide buttons whose assets are missing. */}
        {(videoUrl || production.techRider || production.pressKit) && (
          <div className={styles.actionBar}>
            {videoUrl && (
              <a
                className={`${styles.btn} ${styles.btnPrimary}`}
                href={videoUrl}
                target='_blank'
                rel='noreferrer noopener'
              >
                {t('watchListen')}
              </a>
            )}
            {production.techRider && (
              <a
                className={`${styles.btn} ${styles.btnSecondary}`}
                href={production.techRider}
                target='_blank'
                rel='noreferrer noopener'
              >
                {t('techRider')}
              </a>
            )}
            {production.pressKit && (
              <a
                className={`${styles.btn} ${styles.btnSecondary}`}
                href={production.pressKit}
                target='_blank'
                rel='noreferrer noopener'
              >
                {t('pressKit')}
              </a>
            )}
          </div>
        )}

        {/* 7. Photos */}
        {production.gallery.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>{t('photos')}</h2>
            <div className={styles.gallery}>
              {production.gallery.map((g, i) => (
                <figure key={`${g.src}-${i}`} className={styles.galleryItem}>
                  <img
                    src={g.src}
                    alt={
                      g.caption?.[locale] ??
                      g.caption?.ru ??
                      g.caption?.en ??
                      ''
                    }
                    loading='lazy'
                    decoding='async'
                  />
                  {g.credit && (
                    <figcaption className={styles.galleryCredit}>
                      {g.credit}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* 8. Critic quotes — when press has a `quote` we'd render it; the
            current data only has links, so render press as a list. */}
        {production.press.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>{t('press')}</h2>
            <ul className={styles.pressList}>
              {production.press.map((p) => (
                <li key={p.url} className={styles.pressItem}>
                  <a
                    className={styles.pressLink}
                    href={p.url}
                    target='_blank'
                    rel='noreferrer noopener'
                  >
                    {p.title}
                  </a>
                  {p.outlet && (
                    <span className={styles.pressOutlet}>{p.outlet}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 9. Awards */}
        {production.awards.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>{t('awards')}</h2>
            <ul className={styles.awardList}>
              {production.awards.map((a, i) => (
                <li key={`${a.name}-${i}`} className={styles.awardItem}>
                  {a.year && <span className={styles.awardYear}>{a.year}</span>}
                  <span className={styles.awardName}>{a.name}</span>
                  {a.city && <span className={styles.awardCity}>{a.city}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 10. External theatre links */}
        {(production.theatre.url ||
          production.externalLinks.length > 0) && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>{t('links')}</h2>
            <ul className={styles.linksList}>
              {production.theatre.url && (
                <li className={styles.linksItem}>
                  <a
                    href={production.theatre.url}
                    target='_blank'
                    rel='noreferrer noopener'
                  >
                    {production.theatre.name ?? production.theatre.url}
                  </a>
                </li>
              )}
              {production.externalLinks.map((l) => (
                <li key={l.url} className={styles.linksItem}>
                  <a href={l.url} target='_blank' rel='noreferrer noopener'>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* 11. Sticky CTA — bottom on mobile, right rail on desktop ≥1024 */}
      <a
        className={styles.stickyCta}
        href={mailto}
        data-ph-event="booking_cta_click"
        data-ph-slug={slug}
        data-ph-locale={locale}
      >
        {t('bookingCta')}
      </a>
      </div>{/* end .layout */}
    </main>
  )
}
