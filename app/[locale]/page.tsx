import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import * as React from 'react'

import { getAllProductions } from '@/lib/content'
import type { Locale } from '@/i18n/routing'

export default async function Page({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('nav')
  const productions = getAllProductions(locale)
  const featured = productions.filter((p) => p.featured)

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-7)',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-family-body)'
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--font-size-meta)',
          letterSpacing: 'var(--letter-spacing-wide)',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-3)'
        }}
      >
        F3 — LOCALE ROUTING · {locale.toUpperCase()}
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: 'var(--font-size-4xl)',
          lineHeight: 'var(--line-height-tight)',
          letterSpacing: 'var(--letter-spacing-tight)',
          margin: 0
        }}
      >
        {locale === 'ru' ? 'роман бокланов' : 'roman boklanov'}
      </h1>
      <nav
        style={{
          marginTop: 'var(--space-6)',
          display: 'flex',
          gap: 'var(--space-5)',
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--font-size-meta)',
          letterSpacing: 'var(--letter-spacing-wide)',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)'
        }}
      >
        <span>{t('productions')}</span>
        <span>{t('about')}</span>
        <span>{t('contact')}</span>
      </nav>
      <p
        style={{
          marginTop: 'var(--space-7)',
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--font-size-meta)',
          color: 'var(--color-text-tertiary)'
        }}
      >
        F6 LOADER · {productions.length} productions · {featured.length} featured
      </p>
    </main>
  )
}
