import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { Marginalia } from '@/components/Marginalia'
import { SpecimenPlate } from '@/components/SpecimenPlate'
import { getAbout, type AboutData, type AboutL10n } from '@/lib/content'
import type { Locale } from '@/i18n/routing'
import { cdnUrl } from '@/lib/cdn'

import styles from './page.module.css'

interface Milestone {
  year: number
  label: string
}

interface LineageItem {
  key: string
  name: string
  role: string
  institution: string
  note?: string
}

interface AboutPhoto {
  src: string
  credit?: string | null
}

interface AboutFrontmatter {
  portrait: { src: string | null; credit: string | null }
  photos: AboutPhoto[]
  milestones: Milestone[]
  lineage: LineageItem[]
  marginalia: Array<string | null>
}

function pickL10n(v: AboutL10n, locale: Locale): string {
  const order =
    locale === 'de'
      ? (['de', 'en', 'ru'] as const)
      : ([locale, 'en', 'ru'] as const)
  for (const l of order) {
    const s = v[l]
    if (typeof s === 'string' && s.trim()) return s
  }
  return ''
}

/** Resolve the bio body string for a locale with DE→EN→RU fallback,
 *  returning both the text and which locale actually supplied it (used to
 *  trigger the "DE forthcoming" Marginalia cue). */
function pickBody(
  body: AboutL10n,
  locale: Locale
): { text: string; resolvedLocale: Locale | null } {
  const order =
    locale === 'de'
      ? (['de', 'en', 'ru'] as const)
      : ([locale, 'en', 'ru'] as const)
  for (const l of order) {
    const s = body[l]
    if (typeof s === 'string' && s.trim()) {
      return { text: s.trim(), resolvedLocale: l }
    }
  }
  return { text: '', resolvedLocale: null }
}

function projectAbout(
  data: AboutData,
  locale: Locale
): {
  frontmatter: AboutFrontmatter
  paragraphs: string[]
  deForthcoming: boolean
} {
  const { text: body, resolvedLocale } = pickBody(data.body, locale)
  const paragraphs = body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    frontmatter: {
      portrait: data.portrait,
      photos: data.photos
        .filter((p) => p.src)
        .map((p) => ({ src: p.src, credit: p.credit })),
      milestones: data.milestones
        .map((m) => ({
          year: typeof m.year === 'number' ? m.year : 0,
          label: pickL10n(m.label, locale)
        }))
        .filter((m) => m.year || m.label),
      lineage: data.lineage.map((l) => ({
        key: l.key,
        name: pickL10n(l.name, locale),
        role: pickL10n(l.role, locale),
        institution: pickL10n(l.institution, locale),
        note: pickL10n(l.note, locale) || undefined
      })),
      marginalia: data.marginalia.map((m) => pickL10n(m.note, locale) || null)
    },
    paragraphs,
    deForthcoming: locale === 'de' && resolvedLocale !== 'de'
  }
}

const BASE = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com'
).replace(/\/$/, '')

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const about = await getAbout()
  const { paragraphs } = projectAbout(about, locale)
  const description = paragraphs[0] ?? undefined

  const url = locale === 'en' ? `${BASE}/about` : `${BASE}/${locale}/about`
  const name =
    locale === 'ru'
      ? 'Роман Бокланов — о режиссёре'
      : locale === 'de'
        ? 'Roman Boklanov — über'
        : 'Roman Boklanov — about'

  return {
    title: name,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${BASE}/about`, ru: `${BASE}/ru/about` }
    },
    openGraph: {
      title: name,
      description,
      url,
      type: 'profile'
    }
  }
}

function personSchema(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Roman Boklanov',
    alternateName: 'Роман Бокланов',
    jobTitle:
      locale === 'ru'
        ? 'Театральный режиссёр'
        : locale === 'de'
          ? 'Theaterregisseur'
          : 'Theatre Director',
    description,
    url: locale === 'en' ? `${BASE}/about` : `${BASE}/${locale}/about`,
    email: 'roman.boklanov@web.de',
    sameAs: ['https://instagram.com/boklanovroman', 'https://t.me/roman7593']
  }
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('nav')
  const tAbout = await getTranslations('about')
  const tHome = await getTranslations('home')

  const about = await getAbout()
  const { frontmatter, paragraphs, deForthcoming } = projectAbout(about, locale)
  const { portrait, milestones, lineage, marginalia, photos } = frontmatter
  const validPhotos = photos.filter((p) => p.src)
  const portraitUrl = cdnUrl(portrait.src)

  const [leadParagraph, ...bodyParagraphs] = paragraphs

  const schema = personSchema(locale, leadParagraph ?? '')

  return (
    <main className={styles.page}>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className={styles.heading}>{t('about')}</h1>

      {portraitUrl && (
        <figure className={styles.portrait}>
          <img
            className={styles.portraitImg}
            src={portraitUrl}
            alt={portrait.credit ?? 'Roman Boklanov'}
            loading='eager'
          />
          {portrait.credit && (
            <figcaption className={styles.portraitCredit}>
              {portrait.credit}
            </figcaption>
          )}
        </figure>
      )}

      {/* Bio prose — DA-7.6.A: Marginalia grid at ≥1024px.
          DE forthcoming: annotate lead paragraph; suppress RU margin notes. */}
      <section className={styles.bio}>
        {leadParagraph && (
          <Marginalia
            note={
              deForthcoming
                ? tAbout('deForthcoming')
                : (marginalia[0] ?? undefined)
            }
          >
            <p className={styles.bioLead}>{leadParagraph}</p>
          </Marginalia>
        )}
        {bodyParagraphs.map((para, i) => (
          <Marginalia
            key={i}
            note={deForthcoming ? undefined : (marginalia[i + 1] ?? undefined)}
          >
            <p className={styles.bioParagraph}>{para}</p>
          </Marginalia>
        ))}
      </section>

      {/* Staging geography — DA-2.C (§3.G.1) */}
      <section className={styles.geographySection}>
        <p className={styles.geographyLabel}>{tAbout('stagedIn')}</p>
        <p className={styles.geographyCities}>
          {(tHome.raw('stagingCities') as string[]).filter(Boolean).join(' · ')}
        </p>
      </section>

      {/* Photos of Roman */}
      {validPhotos.length > 0 && (
        <section className={styles.photosSection}>
          <div className={styles.photosGrid}>
            {validPhotos.map((photo, i) => (
              <SpecimenPlate
                key={i}
                src={cdnUrl(photo.src)!}
                alt={photo.credit ?? 'Roman Boklanov'}
                credit={photo.credit}
                plateNumber={i + 1}
                total={validPhotos.length}
              />
            ))}
          </div>
        </section>
      )}

      {/* Milestones timeline */}
      {milestones.length > 0 && (
        <section className={styles.milestonesSection}>
          <h2 className={styles.lineageHeading}>{tAbout('chronology')}</h2>
          <div className={styles.milestones}>
            {milestones.map((m) => (
              <div key={m.year} className={styles.milestone}>
                <span className={styles.milestoneYear}>{m.year}</span>
                <span className={styles.milestoneLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lineage block */}
      {lineage.length > 0 && (
        <section className={styles.lineageSection}>
          <h2 className={styles.lineageHeading}>{tAbout('lineage')}</h2>
          <div className={styles.lineageGrid}>
            {lineage.map((item) => (
              <div key={item.key} className={styles.lineageCard}>
                <h3 className={styles.lineageName}>{item.name}</h3>
                <span className={styles.lineageRole}>{item.role}</span>
                <span className={styles.lineageInstitution}>
                  {item.institution}
                </span>
                {item.note && <p className={styles.lineageNote}>{item.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
