import * as fs from 'node:fs'
import * as path from 'node:path'

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { parse as parseYaml } from 'yaml'
import * as React from 'react'

import { Marginalia } from '@/components/Marginalia'
import { SpecimenPlate } from '@/components/SpecimenPlate'
import type { Locale } from '@/i18n/routing'
import { cdnUrl } from '@/lib/cdn'

import styles from './page.module.css'

// ── About content types ──────────────────────────────────────────────────

/** Always-object L10n string written by Keystatic's `l10n()` helper. Each
 *  locale is optional; treat missing/empty as "no value for this locale". */
type L10nString = { ru?: string | null; en?: string | null; de?: string | null }

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
  photos?: AboutPhoto[]
  milestones: Milestone[]
  lineage: LineageItem[]
  marginalia?: Array<string | null>
}

/** Raw shape on disk after the unification (content/about/index.yaml).
 *  Top-level keys mirror the schema's group nesting in keystatic.config.ts:
 *  visuals (portrait + photos), timeline (milestones + lineage), margins
 *  (marginalia). Per-locale fields are stored as l10n objects. */
interface AboutVisuals {
  portrait?: { src?: string | null; credit?: string | null } | null
  photos?: AboutPhoto[] | null
}

interface AboutTimeline {
  milestones?: Array<{
    year?: number | null
    label?: L10nString | string
  }> | null
  lineage?: Array<{
    key?: string
    name?: L10nString | string
    role?: L10nString | string
    institution?: L10nString | string
    note?: L10nString | string
  }> | null
}

interface AboutMargins {
  marginalia?: Array<L10nString | string | null> | null
}

interface AboutRawFrontmatter {
  visuals?: AboutVisuals | null
  timeline?: AboutTimeline | null
  margins?: AboutMargins | null
}

// ── Loader ───────────────────────────────────────────────────────────────

/** Pick the locale's value out of an l10n object, with EN→RU fallback for DE
 *  and EN, mirroring the previous bare-string locale-fallback in this loader.
 *  Bare-string legacy values pass through unchanged. */
function pickL10n(
  v: L10nString | string | null | undefined,
  locale: Locale
): string {
  if (!v) return ''
  if (typeof v === 'string') return v
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

/** Project the raw on-disk frontmatter (with l10n objects) down to the flat
 *  per-locale shape that the page renderer expects. Top-level keys come from
 *  the schema's group nesting (visuals / timeline / margins) — see comment on
 *  AboutRawFrontmatter above. */
function projectFrontmatter(
  raw: AboutRawFrontmatter,
  locale: Locale
): AboutFrontmatter {
  const visuals = raw.visuals ?? {}
  const timeline = raw.timeline ?? {}
  const margins = raw.margins ?? {}
  return {
    portrait: {
      src: visuals.portrait?.src ?? null,
      credit: visuals.portrait?.credit ?? null
    },
    photos: (visuals.photos ?? []).filter((p): p is AboutPhoto => !!p?.src),
    milestones: (timeline.milestones ?? [])
      .map((m) => ({
        year: typeof m.year === 'number' ? m.year : 0,
        label: pickL10n(m.label ?? '', locale)
      }))
      // Drop entries that have neither a year nor a label after locale projection.
      .filter((m) => m.year || m.label),
    lineage: (timeline.lineage ?? []).map((l) => ({
      key: l.key ?? '',
      name: pickL10n(l.name, locale),
      role: pickL10n(l.role, locale),
      institution: pickL10n(l.institution, locale),
      note: pickL10n(l.note, locale) || undefined
    })),
    marginalia: (margins.marginalia ?? []).map((m) => {
      const s = pickL10n(m ?? '', locale)
      return s ? s : null
    })
  }
}

function loadAbout(locale: Locale): {
  frontmatter: AboutFrontmatter
  paragraphs: string[]
  deForthcoming: boolean
} {
  const ABOUT_DIR = path.resolve(process.cwd(), 'content', 'about')
  const indexPath = path.join(ABOUT_DIR, 'index.yaml')

  if (!fs.existsSync(indexPath)) {
    return {
      frontmatter: {
        portrait: { src: null, credit: null },
        milestones: [],
        lineage: []
      },
      paragraphs: [],
      deForthcoming: false
    }
  }

  const raw = (parseYaml(fs.readFileSync(indexPath, 'utf8')) ??
    {}) as AboutRawFrontmatter
  const frontmatter = projectFrontmatter(raw, locale)

  // Body files: bodyRu.mdx / bodyEn.mdx / bodyDe.mdx beside index.yaml.
  // DE falls back to EN then RU when its body file is missing or empty.
  const bodyForLocale: Record<Locale, string> = {
    ru: 'bodyRu.mdx',
    en: 'bodyEn.mdx',
    de: 'bodyDe.mdx'
  } as const
  const candidates: Locale[] =
    locale === 'de' ? ['de', 'en', 'ru'] : [locale, 'en', 'ru']

  let body = ''
  let resolvedLocale: Locale | null = null
  for (const l of candidates) {
    const p = path.join(ABOUT_DIR, bodyForLocale[l])
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, 'utf8').trim()
      if (text) {
        body = text
        resolvedLocale = l
        break
      }
    }
  }

  const paragraphs = body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    frontmatter,
    paragraphs,
    // "DE forthcoming" cue: requested DE but we fell back to a non-DE body.
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
  const { paragraphs } = loadAbout(locale)
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

// ── Page ────────────────────────────────────────────────────────────────

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

  const { frontmatter, paragraphs, deForthcoming } = loadAbout(locale)
  const { portrait, milestones, lineage, marginalia, photos } = frontmatter
  // Keystatic allows saving a photo item without selecting a file, which
  // writes `- {}` to the YAML. Filter these out so no invisible img renders.
  const validPhotos = photos?.filter((p) => p.src) ?? []
  const portraitUrl = cdnUrl(portrait?.src)

  // First paragraph is the lead (displayed in Lora); the rest are body.
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
            alt={portrait?.credit ?? 'Roman Boklanov'}
            loading='eager'
          />
          {portrait?.credit && (
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
                : (marginalia?.[0] ?? undefined)
            }
          >
            <p className={styles.bioLead}>{leadParagraph}</p>
          </Marginalia>
        )}
        {bodyParagraphs.map((para, i) => (
          <Marginalia
            key={i}
            note={
              deForthcoming ? undefined : (marginalia?.[i + 1] ?? undefined)
            }
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
