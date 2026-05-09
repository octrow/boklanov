import * as fs from 'node:fs'
import * as path from 'node:path'

import { getTranslations, setRequestLocale } from 'next-intl/server'
import { parse as parseYaml } from 'yaml'
import * as React from 'react'

import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

import { CopyEmailButton } from './CopyEmailButton'
import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

interface ContactConfig {
  intro: string
  email: string
  telegramUrl: string
  instagramUrl: string
}

interface ContactRaw {
  intro?: { ru?: string | null; en?: string | null; de?: string | null } | null
  email?: string | null
  telegramUrl?: string | null
  instagramUrl?: string | null
}

// Defaults match the values that lived inline before the Keystatic singleton
// was introduced. Used when content/contact/index.yaml is missing or partial
// (e.g. early local dev before pulling content) so the page never breaks.
const FALLBACK = {
  email: 'roman.boklanov@web.de',
  telegramUrl: 'https://t.me/roman7593',
  instagramUrl: 'https://instagram.com/boklanovroman'
} as const

function pickIntro(intro: ContactRaw['intro'], locale: Locale): string {
  if (!intro) return ''
  // DE falls back to EN then RU; other locales just use their own value.
  const order =
    locale === 'de'
      ? (['de', 'en', 'ru'] as const)
      : ([locale, 'en', 'ru'] as const)
  for (const l of order) {
    const s = intro[l]
    if (typeof s === 'string' && s.trim()) return s.trim()
  }
  return ''
}

function loadContact(locale: Locale): ContactConfig {
  const p = path.resolve(process.cwd(), 'content', 'contact', 'index.yaml')
  const raw = fs.existsSync(p)
    ? ((parseYaml(fs.readFileSync(p, 'utf8')) ?? {}) as ContactRaw)
    : {}
  return {
    intro: pickIntro(raw.intro, locale),
    email: raw.email?.trim() || FALLBACK.email,
    telegramUrl: raw.telegramUrl?.trim() || FALLBACK.telegramUrl,
    instagramUrl: raw.instagramUrl?.trim() || FALLBACK.instagramUrl
  }
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')
  const { intro, email, telegramUrl, instagramUrl } = loadContact(locale)

  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(
    t('mailtoSubject')
  )}`

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>

      {intro && <p className={styles.intro}>{intro}</p>}

      {/* Primary: Telegram + Instagram (DESIGN_BRIEF D8 — reordered
          2026-05-01; Roman responds fastest on these channels). */}
      <section className={styles.primaryRow}>
        <a
          href={telegramUrl}
          target='_blank'
          rel='noopener noreferrer'
          className={styles.primaryButton}
          data-ph-event='booking_cta_click'
          data-ph-locale={locale}
          data-ph-source='contact'
          data-ph-channel='telegram'
        >
          {t('telegramCta')}
        </a>
        <a
          href={instagramUrl}
          target='_blank'
          rel='noopener noreferrer'
          className={styles.primaryButton}
          data-ph-event='booking_cta_click'
          data-ph-locale={locale}
          data-ph-source='contact'
          data-ph-channel='instagram'
        >
          {t('instagramCta')}
        </a>
      </section>

      {/* Secondary: email — mono caps subhead, hairline-bordered mailto
          button, copy-pasteable address. */}
      <section className={styles.secondarySection}>
        <p className={styles.secondaryLabel}>{t('emailLabel')}</p>
        <a
          href={mailtoHref}
          className={styles.mailtoLink}
          data-ph-event='booking_cta_click'
          data-ph-locale={locale}
          data-ph-source='contact'
          data-ph-channel='email'
        >
          {t('emailCta')}
        </a>
        <div className={styles.emailSection}>
          <span className={styles.emailAddress}>{email}</span>
          <CopyEmailButton email={email} />
        </div>
      </section>
    </main>
  )
}
