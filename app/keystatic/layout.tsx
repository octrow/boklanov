import * as React from 'react'

import KeystaticApp from './keystatic'

export const metadata = {
  title: 'Keystatic — boklanov.com',
  robots: 'noindex,nofollow'
}

export default function KeystaticLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body style={{ margin: 0 }}>
        <KeystaticApp />
        {children}
      </body>
    </html>
  )
}
