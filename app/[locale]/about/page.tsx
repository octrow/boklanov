import * as fs from 'node:fs'
import * as path from 'node:path'

import matter from 'gray-matter'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { Cue } from '@/components/Cue'
import type { Locale } from '@/i18n/routing'

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

interface AboutFrontmatter {
  portrait: { src: string | null; credit: string | null }
  milestones: Milestone[]
  lineage: LineageItem[]
}

// ── Loader ───────────────────────────────────────────────────────────────

function loadAbout(locale: Locale): {
  frontmatter: AboutFrontmatter
  paragraphs: string[]
} {
  const ABOUT_DIR = path.resolve(process.cwd(), 'content', 'about')
  const candidates = [locale, 'en', 'ru'] // DE falls back to EN then RU
  for (const lang of candidates) {
    const p = path.join(ABOUT_DIR, `${lang}.mdx`)
    if (fs.existsSync(p)) {
      const { data, content } = matter(fs.readFileSync(p, 'utf8'))
      const paragraphs = content
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean)
      return {
        frontmatter: data as AboutFrontmatter,
        paragraphs
      }
    }
  }
  return {
    frontmatter: {
      portrait: { src: null, credit: null },
      milestones: [],
      lineage: []
    },
    paragraphs: []
  }
}

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const { paragraphs } = loadAbout(locale)
  const description = paragraphs[0] ?? undefined

  const url = locale === 'ru' ? `${BASE}/about` : `${BASE}/${locale}/about`
  const name = locale === 'ru' ? 'Роман Бокланов — о режиссёре' : locale === 'de' ? 'Roman Boklanov — über' : 'Roman Boklanov — about'

  return {
    title: name,
    description,
    alternates: {
      canonical: url,
      languages: { ru: `${BASE}/about`, en: `${BASE}/en/about` },
    },
    openGraph: {
      title: name,
      description,
      url,
      type: 'profile',
    },
  }
}

function personSchema(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Roman Boklanov',
    alternateName: 'Роман Бокланов',
    jobTitle: locale === 'ru' ? 'Театральный режиссёр' : locale === 'de' ? 'Theaterregisseur' : 'Theatre Director',
    description,
    url: locale === 'ru' ? `${BASE}/about` : `${BASE}/${locale}/about`,
    email: 'roman@boklanov.ru',
    sameAs: [
      'https://instagram.com/roman_boklanov',
      'https://t.me/romanboklanov',
    ],
  }
}

// ── Page ────────────────────────────────────────────────────────────────

const STAGING_CITIES = ['СПБ', 'МОСКВА', 'АЛМАТЫ', 'БРЕМЕН', 'ВЕНА', 'БЕРЛИН', 'ТАШКЕНТ']

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('nav')
  const tAbout = await getTranslations('about')

  const { frontmatter, paragraphs } = loadAbout(locale)
  const { milestones, lineage } = frontmatter

  // First paragraph is the lead (displayed in Lora); the rest are body.
  const [leadParagraph, ...bodyParagraphs] = paragraphs

  const schema = personSchema(locale, leadParagraph ?? '')

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className={styles.heading}>{t('about')}</h1>

      {/* Bio prose */}
      <section className={styles.bio}>
        {leadParagraph && (
          <p className={styles.bioLead}>{leadParagraph}</p>
        )}
        {bodyParagraphs.map((para, i) => (
          <p key={i} className={styles.bioParagraph}>
            {para}
          </p>
        ))}
      </section>

      {/* Staging geography — DA-2.C (§3.G.1) */}
      <section className={styles.geographySection}>
        <p className={styles.geographyLabel}>{tAbout('stagedIn')}</p>
        <p className={styles.geographyCities}>
          {STAGING_CITIES.join(' · ')}
        </p>
      </section>

      {/* Milestones timeline */}
      {milestones.length > 0 && (
        <section className={styles.milestonesSection}>
          <Cue mark="CUE I" first>
            <h2 className={styles.lineageHeading}>{tAbout('chronology')}</h2>
          </Cue>
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
          <Cue mark="CUE II" first>
            <h2 className={styles.lineageHeading}>{tAbout('lineage')}</h2>
          </Cue>
          <div className={styles.lineageGrid}>
            {lineage.map((item) => (
              <div key={item.key} className={styles.lineageCard}>
                <h2 className={styles.lineageName}>{item.name}</h2>
                <span className={styles.lineageRole}>{item.role}</span>
                <span className={styles.lineageInstitution}>
                  {item.institution}
                </span>
                {item.note && (
                  <p className={styles.lineageNote}>{item.note}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
