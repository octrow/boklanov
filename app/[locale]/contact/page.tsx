import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'

import { bookingKind } from '@/lib/bookingKind'
import { getAllProductions, getContact } from '@/lib/content'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { BASE_URL as BASE } from '@/lib/baseUrl'
import { getShareImage } from '@/lib/shareImage'

import { CopyEmailButton } from './CopyEmailButton'
import {
  ShowCopyMessage,
  ShowMailtoLink,
  ShowTelegramLink,
  ShowTopicLine
} from './ShowTopic'
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
    openGraph: { title, url, type: 'website', images: [await getShareImage()] }
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
  // Lookup table for `?show=<slug>` from a production page's booking CTA.
  // The page stays static; the client island reads the query string.
  const productions = await getAllProductions(locale)
  const showTitles = Object.fromEntries(
    productions.map((p) => [p.slug, p.title ?? p.titles.en ?? p.slug])
  )
  // Email subject per show, matching the CTA it came from (lib/bookingKind).
  const subjectKey = {
    tour: 'mailtoSubjectTour',
    new: 'mailtoSubjectNew',
    premiere: 'mailtoSubjectPremiere'
  } as const
  const showSubjects = Object.fromEntries(
    productions.map((p) => [
      p.slug,
      (
        t.raw(subjectKey[bookingKind(p.status, p.theatre.country)]) as string
      ).replace('{title}', showTitles[p.slug])
    ])
  )
  // First chat message per show, same kind as the subject.
  const messageKey = {
    tour: 'messageTour',
    new: 'messageNew',
    premiere: 'messagePremiere'
  } as const
  const showMessages = Object.fromEntries(
    productions.map((p) => [
      p.slug,
      (t.raw(messageKey[bookingKind(p.status, p.theatre.country)]) as string)
        .replace('{title}', showTitles[p.slug])
        // "…the Dog!." → "…the Dog!" when the title ends a sentence itself.
        .replace(/([.!?])\.$/, '$1')
    ])
  )
  const telegramAttrs = {
    target: '_blank',
    rel: 'noopener noreferrer',
    className: styles.primaryButton,
    'data-ph-event': 'booking_cta_click',
    'data-ph-locale': locale,
    'data-ph-source': 'contact',
    'data-ph-channel': 'telegram'
  }
  const mailtoAttrs = {
    className: styles.mailtoLink,
    'data-ph-event': 'booking_cta_click',
    'data-ph-locale': locale,
    'data-ph-source': 'contact',
    'data-ph-channel': 'email'
  }

  return (
    <main id='main' className={styles.page}>
      <h1 className={styles.heading}>{t('title')}</h1>

      <React.Suspense fallback={null}>
        <ShowTopicLine
          titles={showTitles}
          label={t('showTopic')}
          className={styles.secondaryLabel}
        />
      </React.Suspense>

      {intro && <p className={styles.intro}>{intro}</p>}

      {/* Primary: Telegram + Instagram (DESIGN_BRIEF D8 — reordered
          2026-05-01; Roman responds fastest on these channels). */}
      <section className={styles.primaryRow}>
        <React.Suspense
          fallback={
            <a href={telegramUrl} {...telegramAttrs}>
              {t('telegramCta')}
            </a>
          }
        >
          <ShowTelegramLink
            messages={showMessages}
            href={telegramUrl}
            {...telegramAttrs}
          >
            {t('telegramCta')}
          </ShowTelegramLink>
        </React.Suspense>
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
        <React.Suspense fallback={null}>
          <ShowCopyMessage
            messages={showMessages}
            label={t('copyMessage')}
            copiedLabel={t('messageCopied')}
            className={styles.messageRow}
            buttonClassName={styles.copyButton}
          />
        </React.Suspense>
      </section>

      {/* Secondary: email — mono caps subhead, hairline-bordered mailto
          button, copy-pasteable address. */}
      <section className={styles.secondarySection}>
        <p className={styles.secondaryLabel}>{t('emailLabel')}</p>
        <React.Suspense
          fallback={
            <a href={mailtoHref} {...mailtoAttrs}>
              {t('emailCta')}
            </a>
          }
        >
          <ShowMailtoLink
            subjects={showSubjects}
            email={email}
            subject={t('mailtoSubject')}
            {...mailtoAttrs}
          >
            {t('emailCta')}
          </ShowMailtoLink>
        </React.Suspense>
        <div className={styles.emailSection}>
          <span className={styles.emailAddress}>{email}</span>
          <CopyEmailButton email={email} />
        </div>
      </section>
    </main>
  )
}
