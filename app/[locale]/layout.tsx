import '../globals.css'

import * as React from 'react'
import type { ReactNode } from 'react'

const locales = ['ru', 'en', 'de'] as const
type Locale = (typeof locales)[number]

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  )
}
