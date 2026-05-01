import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

import { CopyEmailButton } from './CopyEmailButton'
import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const EMAIL = 'roman@boklanov.ru'
// TODO: replace with real handles when confirmed
const TELEGRAM_URL = 'https://t.me/romanboklanov'
const INSTAGRAM_URL = 'https://instagram.com/roman_boklanov'

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

      {/* Primary: mailto button */}
      <section className={styles.primarySection}>
        <a href={mailtoHref} className={styles.mailtoButton}>
          {t('emailCta')}
        </a>
      </section>

      {/* Email address + copy */}
      <section className={styles.emailSection}>
        <span className={styles.emailAddress}>{EMAIL}</span>
        <CopyEmailButton email={EMAIL} />
      </section>

      {/* Secondary: Telegram + Instagram */}
      <section className={styles.secondarySection}>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryLink}
        >
          Telegram
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryLink}
        >
          Instagram
        </a>
      </section>
    </main>
  )
}
