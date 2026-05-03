import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

import { CopyEmailButton } from './CopyEmailButton'
import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const EMAIL = 'roman.boklanov@web.de'
// TODO: replace with real handles when confirmed
const TELEGRAM_URL = 'https://t.me/roman7593'
const INSTAGRAM_URL = 'https://instagram.com/boklanovroman'

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')

  const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(
    t('mailtoSubject')
  )}`

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>

      {/* Primary: Telegram + Instagram (DESIGN_BRIEF D8 — reordered
          2026-05-01; Roman responds fastest on these channels). */}
      <section className={styles.primaryRow}>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryButton}
          data-ph-event="booking_cta_click"
          data-ph-locale={locale}
          data-ph-source="contact"
          data-ph-channel="telegram"
        >
          {t('telegramCta')}
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryButton}
          data-ph-event="booking_cta_click"
          data-ph-locale={locale}
          data-ph-source="contact"
          data-ph-channel="instagram"
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
          data-ph-event="booking_cta_click"
          data-ph-locale={locale}
          data-ph-source="contact"
          data-ph-channel="email"
        >
          {t('emailCta')}
        </a>
        <div className={styles.emailSection}>
          <span className={styles.emailAddress}>{EMAIL}</span>
          <CopyEmailButton email={EMAIL} />
        </div>
      </section>
    </main>
  )
}
