import '../globals.css'

import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import * as React from 'react'
import type { ReactNode } from 'react'

import { Analytics } from '@/components/Analytics'
import { CommandPaletteProvider } from '@/components/CommandPaletteProvider'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { routing, type Locale } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'
import { buildSearchIndex } from '@/lib/search'

// Runs synchronously before paint: reads localStorage and sets data-theme to
// prevent a flash of wrong theme on first load.
const themeScript = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
`

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
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
        <link rel='preload' as='font' type='font/woff2' href='/fonts/Lora-VF.woff2' crossOrigin='anonymous' />
        {locale === 'ru' ? (
          <>
            <link rel='preload' as='font' type='font/woff2' href='/fonts/inter-cyrillic-400.woff2' crossOrigin='anonymous' />
            {/* v3 9v3.1: Unbounded VF Cyrillic for ALL CAPS wordmark in header + footer */}
            <link rel='preload' as='font' type='font/woff2' href='/fonts/unbounded-cyrillic-vf.woff2' crossOrigin='anonymous' />
          </>
        ) : (
          <>
            <link rel='preload' as='font' type='font/woff2' href='/fonts/inter-latin-400.woff2' crossOrigin='anonymous' />
            <link rel='preload' as='font' type='font/woff2' href='/fonts/unbounded-latin-vf.woff2' crossOrigin='anonymous' />
          </>
        )}
      </head>
      <body>
        <NextIntlClientProvider>
          <CommandPaletteProvider items={searchItems} locale={locale}>
            <SiteHeader productions={productions.map((p) => ({ slug: p.slug }))} />
            {children}
            <SiteFooter locale={locale} />
          </CommandPaletteProvider>
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
