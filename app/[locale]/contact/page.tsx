import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { getContact } from '@/lib/content'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { BASE_URL as BASE } from '@/lib/baseUrl'

import { CopyEmailButton } from './CopyEmailButton'
import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  const tMeta = await getTranslations({ locale, namespace: 'meta' })

  const url = locale === 'en' ? `${BASE}/contact` : `${BASE}/${locale}/contact`
  const title = `${tMeta('siteName')} — ${t('title')}`

  return {
    title,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE}/contact`,
        de: `${BASE}/de/contact`,
        ru: `${BASE}/ru/contact`
      }
    },
    openGraph: { title, url, type: 'website' }
  }
}

const FALLBACK = {
  email: 'roman.boklanov@web.de',
  telegramUrl: 'https://t.me/roman7593',
  instagramUrl: 'https://instagram.com/boklanovroman'
} as const

function pickIntro(
  intro: { ru?: string; en?: string; de?: string },
  locale: Locale
): string {
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

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')
  const c = await getContact()
  const intro = pickIntro(c.intro, locale)
  const email = c.email.trim() || FALLBACK.email
  const telegramUrl = c.telegramUrl?.trim() || FALLBACK.telegramUrl
  const instagramUrl = c.instagramUrl?.trim() || FALLBACK.instagramUrl

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
