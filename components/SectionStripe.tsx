'use client'

import * as React from 'react'

import { usePathname } from '@/i18n/navigation'
import { sectionAccent } from '@/lib/section-accent'

import styles from './SectionStripe.module.css'

export function SectionStripe() {
  const pathname = usePathname()
  const accent = sectionAccent(pathname)
  return (
    <div className={styles.stripe} data-accent={accent} aria-hidden='true' />
  )
}
