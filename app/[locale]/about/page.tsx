import * as fs from 'node:fs'
import * as path from 'node:path'

import matter from 'gray-matter'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

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

// ── Page ────────────────────────────────────────────────────────────────

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('nav')

  const { frontmatter, paragraphs } = loadAbout(locale)
  const { milestones, lineage } = frontmatter

  // First paragraph is the lead (displayed in Lora); the rest are body.
  const [leadParagraph, ...bodyParagraphs] = paragraphs

  const lineageLabel =
    locale === 'ru' ? 'традиция' : locale === 'de' ? 'Tradition' : 'lineage'
  const milestonesLabel =
    locale === 'ru'
      ? 'хронология'
      : locale === 'de'
        ? 'Chronologie'
        : 'chronology'

  return (
    <main className={styles.page}>
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

      {/* Milestones timeline */}
      {milestones.length > 0 && (
        <section className={styles.milestonesSection}>
          <p className={styles.lineageHeading}>{milestonesLabel}</p>
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
          <p className={styles.lineageHeading}>{lineageLabel}</p>
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
