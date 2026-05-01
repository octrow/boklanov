'use client'

import dynamic from 'next/dynamic'
import * as React from 'react'

import type { SearchItem } from '@/lib/search'

const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
  { ssr: false }
)

interface Props {
  items: SearchItem[]
  locale: string
  children: React.ReactNode
}

export function CommandPaletteProvider({ items, locale, children }: Props) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      {children}
      {open && (
        <CommandPalette
          items={items}
          onClose={() => setOpen(false)}
          locale={locale}
        />
      )}
    </>
  )
}
