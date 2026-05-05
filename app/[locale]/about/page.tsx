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

// ── Loader ───────────────────────────────────────────────────────────────

/** Split an MDX file with optional `---`-fenced YAML frontmatter into
 *  (frontmatter, body). Keystatic's singleton config
 *  `format: { data: 'yaml', contentField: 'body' }` writes everything
 *  into one .mdx file with frontmatter prepended. */
function splitFrontmatter(raw: string): {
  data: Record<string, unknown>
  body: string
} {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw }
  const data = (parseYaml(m[1]) ?? {}) as Record<string, unknown>
  return { data, body: m[2] }
}

function loadAbout(locale: Locale): {
  frontmatter: AboutFrontmatter
  paragraphs: string[]
  deForthcoming: boolean
} {
  const ABOUT_DIR = path.resolve(process.cwd(), 'content', 'about')
  const candidates = [locale, 'en', 'ru'] as const // DE falls back to EN then RU

  // Source-of-truth precedence per locale: .mdx with inline frontmatter
  // (the Keystatic Cloud format) wins; falls back to the legacy
  // <locale>.yaml + <locale>.md(x) split, which is now dead but kept for
  // graceful migration if someone reverts.
  for (const lang of candidates) {
    const mdxPath = path.join(ABOUT_DIR, `${lang}.mdx`)
    const mdPath = path.join(ABOUT_DIR, `${lang}.md`)
    const yamlPath = path.join(ABOUT_DIR, `${lang}.yaml`)

    if (fs.existsSync(mdxPath)) {
      const raw = fs.readFileSync(mdxPath, 'utf8')
      const { data, body } = splitFrontmatter(raw)
      // If .mdx has no frontmatter (pre-Keystatic state), pull data from
      // the sibling .yaml file.
      const fm =
        Object.keys(data).length === 0 && fs.existsSync(yamlPath)
          ? ((parseYaml(fs.readFileSync(yamlPath, 'utf8')) ?? {}) as Record<
              string,
              unknown
            >)
          : data
      return {
        frontmatter: fm as unknown as AboutFrontmatter,
        paragraphs: body
          .split(/\n{2,}/)
          .map((s) => s.trim())
          .filter(Boolean),
        deForthcoming: false
      }
    }

    if (fs.existsSync(yamlPath)) {
      const data =
        (parseYaml(fs.readFileSync(yamlPath, 'utf8')) ?? {}) as AboutFrontmatter
      const body = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : ''
      return {
        frontmatter: data,
        paragraphs: body
          .split(/\n{2,}/)
          .map((s) => s.trim())
          .filter(Boolean),
        deForthcoming: false
      }
    }
  }

  return {
    frontmatter: {
      portrait: { src: null, credit: null },
      milestones: [],
      lineage: []
    },
    paragraphs: [],
    deForthcoming:
      locale === 'de' && !fs.existsSync(path.join(ABOUT_DIR, 'de.mdx'))
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
  const { milestones, lineage, marginalia, photos } = frontmatter

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
      {photos && photos.length > 0 && (
        <section className={styles.photosSection}>
          <div className={styles.photosGrid}>
            {photos.map((photo, i) => (
              <SpecimenPlate
                key={i}
                src={cdnUrl(photo.src)!}
                alt={photo.credit ?? 'Roman Boklanov'}
                credit={photo.credit}
                plateNumber={i + 1}
                total={photos.length}
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
