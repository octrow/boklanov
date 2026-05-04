import * as React from 'react'

import styles from './DuotonePoster.module.css'

type DuotoneAccent = 'vermillion' | 'cobalt'

interface DuotonePosterProps {
  slug: string
  children: React.ReactNode
}

function slugHash(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function DuotonePoster({ slug, children }: DuotonePosterProps) {
  const accent: DuotoneAccent =
    slugHash(slug) % 2 === 0 ? 'vermillion' : 'cobalt'
  return (
    <div className={styles.wrapper} data-accent={accent}>
      {children}
    </div>
  )
}
