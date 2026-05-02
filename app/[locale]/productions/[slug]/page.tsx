import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { compileMDX } from 'next-mdx-remote/rsc'
import * as React from 'react'

import { Cue } from '@/components/Cue'
import { PosterLightbox } from '@/components/PosterLightbox'
import { countryCode } from '@/components/ProductionCard'
import { SpecimenPlate } from '@/components/SpecimenPlate'
import { TheatreSlate } from '@/components/TheatreSlate'
import { TourRider } from '@/components/TourRider'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { cdnUrl } from '@/lib/cdn'
import {
  getAllProductions,
  getProduction,
  type ProductionView
} from '@/lib/content'

import styles from './page.module.css'

const BASE = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com'
).replace(/\/$/, '')

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
    '18+': 'Adult, ages 18+'
  }
  return map[ageRating] ?? ageRating
}

function creativeWorkSchema(
  production: ProductionView,
  slug: string,
  locale: Locale
) {
  const pageUrl =
    locale === 'ru'
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
      url: `${BASE}/about`
    }
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
      name: production.theatre.name ?? production.theatre.shortName
    }
    if (production.theatre.city || production.theatre.country) {
      const addr: Record<string, string> = { '@type': 'PostalAddress' }
      if (production.theatre.city)
        addr.addressLocality = production.theatre.city
      if (production.theatre.country)
        addr.addressCountry = production.theatre.country
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

  const base = (
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com'
  ).replace(/\/$/, '')
  const url =
    locale === 'ru'
      ? `${base}/productions/${slug}`
      : `${base}/${locale}/productions/${slug}`
  const ogImage = `${base}/api/og/${slug}`

  return {
    title: production.title,
    description: production.synopsis || undefined,
    alternates: {
      canonical: url,
      languages: {
        ru: `${base}/productions/${slug}`,
        en: `${base}/en/productions/${slug}`
      }
    },
    openGraph: {
      title: production.titles.ru ?? production.title,
      description: production.synopsis || undefined,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: production.titles.ru ?? production.title
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: production.titles.ru ?? production.title,
      description: production.synopsis || undefined,
      images: [ogImage]
    }
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
  const tProductions = await getTranslations('productions')

  const allProductions = getAllProductions(locale)
  const productionIndex = allProductions.findIndex((p) => p.slug === slug)
  const productionLabel =
    productionIndex !== -1
      ? `${String(productionIndex + 1).padStart(2, '0')} / ${String(allProductions.length).padStart(2, '0')}`
      : null

  const titleRu = production.titles.ru
  const titleEn = production.titles.en
  const titleDe = production.titles.de

  const country = countryCode(production.theatre.country)
  const chips: string[] = []
  if (production.ageRating) chips.push(production.ageRating)
  if (production.year) chips.push(String(production.year))
  if (production.durationMin) chips.push(`${production.durationMin} MIN`)
  if (country) chips.push(country)

  const roleLabelMap: Record<string, string> = {
    director: tProductions('roleDirector'),
    'co-director': tProductions('roleCoDirector'),
    performer: tProductions('rolePerformer'),
    reader: tProductions('roleReader'),
    sketch: tProductions('roleSketch')
  }
  const roleLabel = production.role
    ? (roleLabelMap[production.role] ?? null)
    : null

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

  const compiledBody = production.body
    ? await compileMDX({
        source: production.body,
        options: { mdxOptions: {} },
        components: {
          // suppress any lingering broken images
          img: () => null
        }
      })
        .then((r) => r.content)
        .catch(() => null)
    : null

  return (
    <main className={styles.page}>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* 1. Cover — natural aspect, capped at 65vh. Click to view full poster. */}
      {production.poster.src &&
        (() => {
          const posterAlt =
            [
              production.role,
              titleRu ?? titleEn ?? slug,
              production.theatre.name ?? production.theatre.shortName,
              production.year
            ]
              .filter(Boolean)
              .join(', ') +
            (production.poster.credit ? ` (${production.poster.credit})` : '')
          const posterSrc = cdnUrl(production.poster.src)!
          return (
            <PosterLightbox src={posterSrc} alt={posterAlt}>
              <figure className={styles.cover}>
                {production.poster.width && production.poster.height ? (
                  <Image
                    src={posterSrc}
                    alt={posterAlt}
                    width={production.poster.width}
                    height={production.poster.height}
                    priority
                    sizes='(min-width: 1024px) 60vw, 100vw'
                    style={{
                      maxWidth: '100%',
                      maxHeight: '65vh',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                ) : (
                  <img
                    src={posterSrc}
                    alt={posterAlt}
                    loading='eager'
                    decoding='async'
                    style={{
                      maxWidth: '100%',
                      maxHeight: '65vh',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                )}
                {production.poster.credit && (
                  <figcaption className={styles.coverCredit}>
                    {production.poster.credit}
                  </figcaption>
                )}
              </figure>
            </PosterLightbox>
          )
        })()}

      {/* .layout: on desktop becomes a CSS grid [720px content | 1fr rail].
          .stickyCta lives in the rail column so it's visible from landing. */}
      <div className={styles.layout}>
        <div className={styles.column}>
          {/* DA-7.6.D — Run-of-show row, mono line above the title */}
          {production.runs.length > 0 && (
            <ul className={styles.runsRow}>
              {production.runs.map((run, i) => {
                const parts: string[] = []
                if (run.venue) parts.push(run.venue)
                if (run.city) parts.push(run.city)
                if (run.yearFrom) {
                  parts.push(
                    run.yearTo && run.yearTo !== run.yearFrom
                      ? `${run.yearFrom}–${run.yearTo}`
                      : String(run.yearFrom)
                  )
                }
                if (run.count) parts.push(run.count)
                return (
                  <li key={i} className={styles.runLine}>
                    <span className={styles.runMark}>RUN</span>
                    {parts.length > 0 && (
                      <>&thinsp;·&thinsp;{parts.join(' · ')}</>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {/* 2. Title block — TheatreSlate component (Phase 9.3, DESIGN_v2_PROPOSAL.md §4.1) */}
          <TheatreSlate
            as='h1'
            titleRu={titleRu}
            titleEn={titleEn}
            titleDe={titleDe}
            theatre={production.theatre}
            roleLabel={roleLabel}
            premiereDate={production.premiereDate}
          />

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

          {/* 4b. Tagline — subgenre / format label */}
          {production.tagline && (
            <p className={styles.tagline}>{production.tagline}</p>
          )}

          {/* DA-7.6.C — Director's note, gated by directorsNote field */}
          {production.directorsNote && (
            <blockquote className={styles.directorsNote}>
              <p className={styles.directorsNoteText}>
                {production.directorsNote}
              </p>
              <footer className={styles.directorsNoteAttr}>
                {t('directorsNoteAttr')}
              </footer>
            </blockquote>
          )}

          {/* 4c. Compiled MDX body */}
          {compiledBody && (
            <div className={styles.bodyProse}>{compiledBody}</div>
          )}

          {/* 5. Credits — DA-2.A: leader-dot <dl> table with CREDITS cue. */}
          {production.credits.length > 0 && (
            <section className={styles.creditsBlock}>
              <Cue mark={t('credits')} first>
                <h2 className={styles.sectionLabel}>{t('credits')}</h2>
              </Cue>
              <dl className={styles.creditsDl}>
                {production.credits.map((c, i) => (
                  <div key={`${c.role}-${i}`} className={styles.creditsRow}>
                    <dt className={styles.creditsRole}>{c.role}</dt>
                    <dd className={styles.creditsName}>
                      {c.url ? (
                        <a
                          href={c.url}
                          target='_blank'
                          rel='noreferrer noopener'
                          className={styles.creditsLink}
                        >
                          {c.name}
                        </a>
                      ) : (
                        c.name
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* 6. Action bar — hide buttons whose assets are missing. */}
          {(videoUrl ||
            production.ticketsUrl ||
            production.techRider ||
            production.pressKit) && (
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
              {production.ticketsUrl && (
                <a
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  href={production.ticketsUrl}
                  target='_blank'
                  rel='noreferrer noopener'
                >
                  {t('tickets')}
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

          {/* 6b. Plinth tour band — DA-2.D (§3.G.2) */}
          {production.tour && production.tour.length > 0 && (
            <section className={styles.tourBand}>
              <p className={styles.tourLabel}>{t('onTour')}</p>
              <p className={styles.tourCities}>{production.tour.join(' · ')}</p>
            </section>
          )}

          {/* 7. Photos */}
          {production.gallery.length > 0 && (
            <section className={styles.section}>
              <Cue mark='CUE I' first>
                <h2 className={styles.sectionLabel}>{t('photos')}</h2>
              </Cue>
              <div className={styles.gallery}>
                {production.gallery.map((g, i) => {
                  const imgSrc = cdnUrl(g.src)!
                  const imgAlt =
                    g.caption?.[locale] ?? g.caption?.ru ?? g.caption?.en ?? ''
                  return (
                    <PosterLightbox
                      key={`${g.src}-${i}`}
                      src={imgSrc}
                      alt={imgAlt}
                    >
                      <SpecimenPlate
                        src={imgSrc}
                        alt={imgAlt}
                        credit={g.credit}
                        plateNumber={i + 1}
                        total={production.gallery.length}
                      />
                    </PosterLightbox>
                  )
                })}
              </div>
            </section>
          )}

          {/* 8. Critic quotes — when press has a `quote` we'd render it; the
            current data only has links, so render press as a list. */}
          {production.press.length > 0 && (
            <section className={styles.section}>
              <Cue mark='CUE II' first>
                <h2 className={styles.sectionLabel}>{t('press')}</h2>
              </Cue>
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
              <Cue mark='CUE III' first>
                <h2 className={styles.sectionLabel}>{t('awards')}</h2>
              </Cue>
              <ul className={styles.awardList}>
                {production.awards.map((a, i) => (
                  <li key={`${a.name}-${i}`} className={styles.awardItem}>
                    {a.year && (
                      <span className={styles.awardYear}>{a.year}</span>
                    )}
                    <span className={styles.awardName}>{a.name}</span>
                    {a.city && (
                      <span className={styles.awardCity}>{a.city}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 10. External theatre links */}
          {(production.theatre.url || production.externalLinks.length > 0) && (
            <section className={styles.section}>
              <Cue mark='CUE IV' first>
                <h2 className={styles.sectionLabel}>{t('links')}</h2>
              </Cue>
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

        {/* Rail: TourRider (desktop only) + sticky CTA */}
        <div className={styles.rail}>
          <TourRider
            productionLabel={productionLabel}
            year={production.year}
            durationMin={production.durationMin}
            ageRating={production.ageRating}
            country={country}
            language={
              country ? productionLanguage(production.theatre.country) : null
            }
            form={production.form}
            lineage={production.lineage}
            tourSolo={Boolean(production.tour && production.tour.length > 0)}
            techRider={production.techRider}
            pressKit={production.pressKit}
          />
          {/* 11. Sticky CTA — fixed bottom on mobile, static in sticky rail on desktop */}
          <a
            className={styles.stickyCta}
            href={mailto}
            data-ph-event='booking_cta_click'
            data-ph-slug={slug}
            data-ph-locale={locale}
          >
            {t('bookingCta')}
          </a>
        </div>
      </div>
      {/* end .layout */}
    </main>
  )
}
