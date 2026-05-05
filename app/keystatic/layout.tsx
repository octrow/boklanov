import * as React from 'react'
import { notFound } from 'next/navigation'

import { showAdminUI } from '../../keystatic.config'
import KeystaticApp from './keystatic'
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
      <body style={{ margin: 0 }}>
        <KeystaticApp />
        {children}
      </body>
    </html>
  )
}
