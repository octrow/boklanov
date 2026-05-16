import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import * as React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { GalleryLightbox } from '@/components/GalleryLightbox'
import { Marginalia } from '@/components/Marginalia'
import { PosterLightbox } from '@/components/PosterLightbox'
import { Sticker } from '@/components/Sticker'
import { TourTicker } from '@/components/TourTicker'
import { YouTubeFacade } from '@/components/YouTubeFacade'
import { countryCode } from '@/lib/countryCode'
import { TheatreSlate } from '@/components/TheatreSlate'
import { TourRider } from '@/components/TourRider'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { BASE_URL as BASE } from '@/lib/baseUrl'
import { cdnUrl } from '@/lib/cdn'
import {
  getAllProductions,
  getProduction,
  type ProductionView
} from '@/lib/content'
import styles from './page.module.css'

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
    locale === 'en'
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
  const production = await getProduction(slug, locale)
  if (!production) return {}

  const base = BASE
  const url =
    locale === 'en'
      ? `${base}/productions/${slug}`
      : `${base}/${locale}/productions/${slug}`
  const ogImage = `${base}/api/og/${slug}?locale=${locale}`

  const descriptionParts = [
    production.title,
    production.theatre.name,
    production.year
  ]
    .filter(Boolean)
    .join(' · ')
  const description = production.synopsis?.trim() || descriptionParts

  return {
    title: production.title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${base}/productions/${slug}`,
        ru: `${base}/ru/productions/${slug}`
      }
    },
    openGraph: {
      title: production.titles.ru ?? production.title,
      description,
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
      description,
      images: [ogImage]
    }
  }
}

export async function generateStaticParams() {
  try {
    // Cartesian product of locales × slugs so every (locale, slug) pair is SSG.
    const slugs = (await getAllProductions(routing.defaultLocale)).map(
      (p) => p.slug
    )
    return routing.locales.flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug }))
    )
  } catch {
    // DB unreachable at build time (e.g. Vercel build without DATABASE_URL).
    // Return [] so pages are rendered on-demand instead of failing the build.
    return []
  }
}

export default async function ProductionDetailPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const production = await getProduction(slug, locale)
  if (!production) notFound()

  const t = await getTranslations('productionDetail')
  const tProductions = await getTranslations('productions')
  const tAccess = await getTranslations('accessibility')

  const allProductions = await getAllProductions(locale)
  const productionIndex = allProductions.findIndex((p) => p.slug === slug)
  const productionLabel =
    productionIndex !== -1
      ? `${String(productionIndex + 1).padStart(2, '0')} / ${String(allProductions.length).padStart(2, '0')}`
      : null

  const titleRu = production.titles.ru
  const titleEn = production.titles.en

  const country = countryCode(production.theatre.country)
  const chips: string[] = []
  if (production.ageRating) chips.push(production.ageRating)
  if (production.year) chips.push(String(production.year))
  if (production.durationMin)
    chips.push(`${production.durationMin} ${t('riderMin')}`)
  if (country) chips.push(country)

  const roleLabelMap: Record<string, string> = {
    director: tProductions('roleDirector'),
    'co-director': tProductions('roleCoDirector'),
    performer: tProductions('rolePerformer'),
    reader: tProductions('roleReader'),
    sketch: tProductions('roleSketch')
  }
  const roleLabel = production.role.length
    ? production.role.map((r) => roleLabelMap[r] ?? r).join(' / ')
    : null

  // Sticky CTA mailto: pre-filled per brief D7. Subject names the show; body
  // hints what we want from a touring inquiry. EN body — most curators write
  // either RU or EN; EN reads cleanly to both.
  const subject = `Touring inquiry: ${titleRu ?? titleEn ?? slug}`
  const body =
    `Hi Roman,\n\n` +
    `I'm interested in touring ${titleRu ?? titleEn ?? slug} ` +
    `(${production.year ?? ''}${production.role.length ? `, ${production.role.join(' / ')}` : ''}).\n\n` +
    `Tour window:\n` +
    `Venue / festival:\n` +
    `Notes:\n`
  const mailto = `mailto:roman.boklanov@web.de?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`

  const primaryVideo = production.videos[0]
  const videoUrl =
    primaryVideo?.provider === 'youtube'
      ? `https://www.youtube.com/watch?v=${primaryVideo.id}`
      : primaryVideo?.provider === 'vimeo'
        ? `https://vimeo.com/${primaryVideo.id}`
        : null
  const trailerEmbedUrl =
    primaryVideo?.provider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${primaryVideo.id}`
      : primaryVideo?.provider === 'vimeo'
        ? `https://player.vimeo.com/video/${primaryVideo.id}`
        : null

  // Per-mdx CTA overrides (frontmatter): bookingCta=false hides; bookingCtaUrl
  // replaces the default mailto; bookingCtaLabel replaces the i18n label.
  const ctaEnabled = production.bookingCta !== false
  const ctaUrl = production.bookingCtaUrl || mailto
  const ctaLabel = production.bookingCtaLabel || t('bookingCta')

  const schema = creativeWorkSchema(production, slug, locale)

  return (
    <main className={styles.page}>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {production.poster.variants && (
        <link
          rel='preload'
          as='image'
          imageSrcSet={`${cdnUrl(production.poster.variants.w420)} 420w, ${cdnUrl(production.poster.variants.w600)} 600w, ${cdnUrl(production.poster.variants.w720)} 720w, ${cdnUrl(production.poster.variants.w828)} 828w, ${cdnUrl(production.poster.variants.w1080)} 1080w`}
          imageSizes='(min-width: 1024px) 640px, 90vw'
          fetchPriority='high'
        />
      )}
      {/* 1. Cover — natural aspect, capped at 65vh. Click to view full poster. */}
      {production.poster.src &&
        (() => {
          const posterAlt =
            [
              production.role.join(' / '),
              titleRu ?? titleEn ?? slug,
              production.theatre.name ?? production.theatre.shortName,
              production.year
            ]
              .filter(Boolean)
              .join(', ') +
            (production.poster.credit ? ` (${production.poster.credit})` : '')
          const posterSrc = cdnUrl(production.poster.src)!
          // 90vw (not 100vw) reflects the actual rendered width on mobile:
          // .cover is flex-centered with max-height: 65vh, so a typical
          // ~0.71-aspect portrait poster lands at ~92% of viewport width.
          // 100vw made the variant picker round up to 828w when 720w fits.
          const posterSizes = '(min-width: 1024px) 640px, 90vw'
          const variants = production.poster.variants
          return (
            <PosterLightbox src={posterSrc} alt={posterAlt}>
              <figure className={styles.cover}>
                {variants ? (
                  // Pre-baked AVIF variants — bypass `/_next/image`. The
                  // detail-page poster is the LCP element on production
                  // pages; head preload happens in generateMetadata via the
                  // `other.preload-image` JSON.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cdnUrl(variants.w600)!}
                    srcSet={`${cdnUrl(variants.w420)} 420w, ${cdnUrl(variants.w600)} 600w, ${cdnUrl(variants.w720)} 720w, ${cdnUrl(variants.w828)} 828w, ${cdnUrl(variants.w1080)} 1080w`}
                    sizes={posterSizes}
                    alt={posterAlt}
                    decoding='async'
                    loading='eager'
                    fetchPriority='high'
                    style={{
                      maxWidth: '100%',
                      maxHeight: '65vh',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                ) : production.poster.width && production.poster.height ? (
                  <Image
                    src={posterSrc}
                    alt={posterAlt}
                    width={production.poster.width}
                    height={production.poster.height}
                    priority
                    fetchPriority='high'
                    sizes={posterSizes}
                    quality={75}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '65vh',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                ) : (
                  <Image
                    src={posterSrc}
                    alt={posterAlt}
                    priority
                    fetchPriority='high'
                    width={0}
                    height={0}
                    sizes={posterSizes}
                    quality={75}
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

      {/* v3 §2.2 — plakat sticker badges above title.
          Award sticker fires when production has any award; tour sticker fires
          when production has a `tour[]` (the Plinth). At most 2 stickers per
          page (cap from proposal §2.2 max-3-per-page; we leave room for a
          third elsewhere). Hidden from screen readers — TourRider + awards
          list are the canonical sources. */}
      {(production.awards.length > 0 || production.tour.length > 0) && (
        <div className={styles.stickerRow} aria-hidden='true'>
          {production.awards.length > 0 && (
            <Sticker
              variant='award'
              accent='vermillion'
              rotate={-3}
              shadow
              layout='inline'
            >
              {production.awards.length === 1
                ? t('stickerAward')
                : `${t('stickerAward')} · ${production.awards.length}`}
            </Sticker>
          )}
          {production.tour.length > 0 && (
            <Sticker variant='tour' accent='cobalt' rotate={3} layout='inline'>
              {t('stickerTour')}
            </Sticker>
          )}
        </div>
      )}

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
                    <span className={styles.runMark}>{t('riderRun')}</span>
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
            titleRu={production.title}
            theatre={production.theatre}
            roleLabel={roleLabel}
            premiereDate={production.premiereDate}
          />

          {/* Mobile-only media block — desktop renders the same trailer + photos inside the rail (see below). */}
          <div className={styles.inlineMedia}>
            {trailerEmbedUrl && primaryVideo?.provider === 'youtube' && (
              <div className={styles.trailer}>
                <YouTubeFacade
                  videoId={primaryVideo.id}
                  title={`${production.title} — ${t('trailer')}`}
                  playLabel={tAccess('playTrailer')}
                />
              </div>
            )}
            {trailerEmbedUrl && primaryVideo?.provider !== 'youtube' && (
              <div className={styles.trailer}>
                <iframe
                  className={styles.trailerFrame}
                  src={trailerEmbedUrl}
                  title={`${production.title} — ${t('trailer')}`}
                  loading='lazy'
                  allow='accelerometer; clipboard-write; encrypted-media; picture-in-picture'
                  allowFullScreen
                  referrerPolicy='strict-origin-when-cross-origin'
                />
              </div>
            )}
            {production.gallery.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionLabel}>{t('photos')}</h2>
                <GalleryLightbox
                  items={production.gallery.map((g) => ({
                    src: cdnUrl(g.src)!,
                    alt:
                      g.caption?.[locale] ??
                      g.caption?.ru ??
                      g.caption?.en ??
                      '',
                    credit: g.credit,
                    variants: g.variants
                      ? {
                          w420: cdnUrl(g.variants.w420)!,
                          w600: cdnUrl(g.variants.w600)!,
                          w720: cdnUrl(g.variants.w720)!,
                          w828: cdnUrl(g.variants.w828)!,
                          w1080: cdnUrl(g.variants.w1080)!
                        }
                      : null
                  }))}
                />
              </section>
            )}
          </div>

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

          {/* 4. One-line synopsis — DE: annotate RU fallback with forthcoming note */}
          {production.synopsis &&
            (locale === 'de' ? (
              <Marginalia note={t('deForthcoming')}>
                <p className={styles.synopsis}>{production.synopsis}</p>
              </Marginalia>
            ) : (
              <p className={styles.synopsis}>{production.synopsis}</p>
            ))}

          {/* 4b. Tagline — subgenre / format label */}
          {production.tagline && (
            <p className={styles.tagline}>{production.tagline}</p>
          )}

          {/* DA-7.6.C — Director's note (Lexical richText, rendered via RichText). */}
          {production.directorsNote && (
            <blockquote className={styles.directorsNote}>
              <div className={styles.directorsNoteText}>
                <RichText data={production.directorsNote} />
              </div>
              <footer className={styles.directorsNoteAttr}>
                {t('directorsNoteAttr')}
              </footer>
            </blockquote>
          )}

          {/* 4c. Body prose */}
          {production.body && (
            <div className={styles.bodyProse}>
              <RichText data={production.body} />
            </div>
          )}

          {/* 5. Credits — DA-2.A: leader-dot <dl> table, collapsed by default
              (same disclosure pattern as TourRider §4.4). */}
          {production.credits.length > 0 && (
            <details className={styles.creditsBlock}>
              <summary className={styles.creditsSummary}>
                <span className={styles.creditsSummaryLabel}>
                  {t('credits')}
                </span>
              </summary>
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
            </details>
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

          {/* 6b. Plinth tour band — DA-2.D (§3.G.2) · v3: TourTicker CSS marquee */}
          {production.tour && production.tour.length > 0 && (
            <TourTicker
              cities={production.tour}
              accent='cobalt'
              label={t('onTour')}
            />
          )}

          {/* 7. Awards & Festivals */}
          {(production.awards.length > 0 ||
            (production.festivals && production.festivals.length > 0)) && (
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>{t('awards')}</h2>
              {production.awards.length > 0 && (
                <>
                  {production.festivals && production.festivals.length > 0 && (
                    <p className={styles.awardsSubLabel}>{t('awardsLabel')}</p>
                  )}
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
                </>
              )}
              {production.festivals && production.festivals.length > 0 && (
                <>
                  {production.awards.length > 0 && (
                    <p className={styles.awardsSubLabel}>
                      {t('festivalsLabel')}
                    </p>
                  )}
                  <ul className={styles.awardList}>
                    {production.festivals.map((f, i) => (
                      <li key={`${f.name}-${i}`} className={styles.awardItem}>
                        {f.year && (
                          <span className={styles.awardYear}>{f.year}</span>
                        )}
                        <span className={styles.awardName}>{f.name}</span>
                        {f.city && (
                          <span className={styles.awardCity}>{f.city}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {/* 9. Press */}
          {production.press.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>{t('press')}</h2>
              <ul className={styles.pressList}>
                {production.press.map((p, i) => (
                  <li key={`${p.url}-${i}`} className={styles.pressItem}>
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

          {/* 10. External theatre links */}
          {(production.theatre.url || production.externalLinks.length > 0) && (
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
          {/* 11. Sticky CTA — fixed bottom on mobile, static in sticky rail on desktop.
              Hide via `bookingCta: false` in frontmatter; override label/url via
              bookingCtaLabel / bookingCtaUrl. */}
          {ctaEnabled && (
            <a
              className={styles.stickyCta}
              href={ctaUrl}
              data-ph-event='booking_cta_click'
              data-ph-slug={slug}
              data-ph-locale={locale}
            >
              {ctaLabel}
            </a>
          )}
          {/* Desktop-only media block — mobile renders the same trailer + photos
              inline right after the title (see .inlineMedia above). */}
          <div className={styles.railMedia}>
            {trailerEmbedUrl && primaryVideo?.provider === 'youtube' && (
              <div className={styles.trailer}>
                <YouTubeFacade
                  videoId={primaryVideo.id}
                  title={`${production.title} — ${t('trailer')}`}
                  playLabel={tAccess('playTrailer')}
                />
              </div>
            )}
            {trailerEmbedUrl && primaryVideo?.provider !== 'youtube' && (
              <div className={styles.trailer}>
                <iframe
                  className={styles.trailerFrame}
                  src={trailerEmbedUrl}
                  title={`${production.title} — ${t('trailer')}`}
                  loading='lazy'
                  allow='accelerometer; clipboard-write; encrypted-media; picture-in-picture'
                  allowFullScreen
                  referrerPolicy='strict-origin-when-cross-origin'
                />
              </div>
            )}
            {production.gallery.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionLabel}>{t('photos')}</h2>
                <GalleryLightbox
                  items={production.gallery.map((g) => ({
                    src: cdnUrl(g.src)!,
                    alt:
                      g.caption?.[locale] ??
                      g.caption?.ru ??
                      g.caption?.en ??
                      '',
                    credit: g.credit,
                    variants: g.variants
                      ? {
                          w420: cdnUrl(g.variants.w420)!,
                          w600: cdnUrl(g.variants.w600)!,
                          w720: cdnUrl(g.variants.w720)!,
                          w828: cdnUrl(g.variants.w828)!,
                          w1080: cdnUrl(g.variants.w1080)!
                        }
                      : null
                  }))}
                />
              </section>
            )}
          </div>
        </div>
      </div>
      {/* end .layout */}
    </main>
  )
}
