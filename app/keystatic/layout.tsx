import * as React from 'react'
import { notFound } from 'next/navigation'

import { showAdminUI } from '../../keystatic.config'
import KeystaticApp from './keystatic'
import { ImagePathPreview } from './ImagePathPreview'
import './keystatic-shim.css'

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
      {/* Seed dark theme before React hydrates so Keystatic reads it from localStorage */}
      <script
        dangerouslySetInnerHTML={{
          __html: `if(!localStorage.getItem('keystatic-color-scheme'))localStorage.setItem('keystatic-color-scheme','dark')`
        }}
      />
      <body style={{ margin: 0 }}>
        <KeystaticApp />
        <ImagePathPreview />
        {children}
      </body>
    </html>
  )
}
