import * as React from 'react'
import { notFound } from 'next/navigation'

import { showAdminUI } from '../../keystatic.config'
import KeystaticApp from './keystatic'
import { ImagePathPreview } from './ImagePathPreview'

export const metadata = {
  title: 'Keystatic — boklanov.com',
  robots: 'noindex,nofollow'
}

export default function KeystaticLayout({
  children
}: {
  children: React.ReactNode
}) {
  if (!showAdminUI) notFound()
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Limit top-level standalone text fields to ~1/3 of form width.
            Object-nested fields are handled via layout props in keystatic.config.ts.
            :has selector targets field-slot divs 3 levels above input[data-adornment];
            :not([role="group"] *) excludes l10n sub-field slots (already narrow). */}
        <style>{`
          @media (min-width: 1024px) {
            #item-edit-form div:has(> div > div > input[data-adornment]):not([role="group"] *) {
              max-width: 33.333%;
            }
          }
        `}</style>
      </head>
      <body style={{ margin: 0 }}>
        <KeystaticApp />
        <ImagePathPreview />
        {children}
      </body>
    </html>
  )
}
