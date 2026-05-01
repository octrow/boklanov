import * as React from 'react'

type Locale = 'ru' | 'en' | 'de'

export default async function Page({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params

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
        F1 — APP ROUTER SHELL · LOCALE {locale.toUpperCase()}
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
    </main>
  )
}
