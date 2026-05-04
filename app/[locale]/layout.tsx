import '../globals.css'

import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import * as React from 'react'
import type { ReactNode } from 'react'

import { Analytics } from '@/components/Analytics'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CommandPaletteProvider } from '@/components/CommandPaletteProvider'
import { DuotonePosterSprite } from '@/components/DuotonePosterSprite'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { routing, type Locale } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'
import { buildSearchIndex } from '@/lib/search'

// Runs synchronously before paint: reads localStorage and sets data-theme to
// prevent a flash of wrong theme on first load.
// Themes: gorky (default, dark plakat register) | paper (opt-in, light editorial).
// Legacy migration: theme=dark -> gorky, theme=light -> paper.
const themeScript = `
try {
  var k = 'boklanov.theme';
  var t = localStorage.getItem(k);
  if (!t) {
    var legacy = localStorage.getItem('theme');
    if (legacy === 'dark') t = 'gorky';
    else if (legacy === 'light') t = 'paper';
    else t = 'gorky';
    localStorage.setItem(k, t);
    if (legacy) localStorage.removeItem('theme');
  }
  if (t !== 'gorky' && t !== 'paper') t = 'gorky';
  document.documentElement.dataset.theme = t;
} catch (e) {
  document.documentElement.dataset.theme = 'gorky';
}
`

const BASE = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com'
).replace(/\/$/, '')

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'meta' })

  const title = t('homeTitle')
  const description = t('homeDescription')
  const siteName = t('siteName')
  const url =
    locale === routing.defaultLocale ? `${BASE}/` : `${BASE}/${locale}`

  return {
    metadataBase: new URL(BASE),
    title: { default: title, template: '%s' },
    description,
    applicationName: siteName,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE}/`,
        ru: `${BASE}/ru`,
        de: `${BASE}/de`
      }
    },
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      url,
      locale
    }
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const productions = getAllProductions(locale)
  const searchItems = buildSearchIndex(productions)

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Preload above-the-fold fonts. Phase 9.2: Lora is one VF file
            (Latin+Cyrillic combined) regardless of locale; Inter still subset-split. */}
        <link
          rel='preload'
          as='font'
          type='font/woff2'
          href='/fonts/Lora-VF.woff2'
          crossOrigin='anonymous'
        />
        {locale === 'ru' ? (
          <>
            <link
              rel='preload'
              as='font'
              type='font/woff2'
              href='/fonts/inter-cyrillic-400.woff2'
              crossOrigin='anonymous'
            />
            {/* v3 9v3.1: Unbounded VF Cyrillic for ALL CAPS wordmark in header + footer */}
            <link
              rel='preload'
              as='font'
              type='font/woff2'
              href='/fonts/unbounded-cyrillic-vf.woff2'
              crossOrigin='anonymous'
            />
          </>
        ) : (
          <>
            <link
              rel='preload'
              as='font'
              type='font/woff2'
              href='/fonts/inter-latin-400.woff2'
              crossOrigin='anonymous'
            />
            <link
              rel='preload'
              as='font'
              type='font/woff2'
              href='/fonts/unbounded-latin-vf.woff2'
              crossOrigin='anonymous'
            />
          </>
        )}
      </head>
      <body>
        <DuotonePosterSprite />
        <NextIntlClientProvider>
          <CommandPaletteProvider items={searchItems} locale={locale}>
            <SiteHeader
              productions={productions.map((p) => ({ slug: p.slug }))}
            />
            {children}
            <SiteFooter />
          </CommandPaletteProvider>
          <Analytics />
        </NextIntlClientProvider>
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
