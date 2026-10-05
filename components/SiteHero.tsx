import * as React from 'react'

import { SiteWordmark } from './SiteWordmark'
import styles from './SiteHero.module.css'

interface SiteHeroProps {
  heroWordmark: string
  statement: string
  children?: React.ReactNode
}

export function SiteHero({ heroWordmark, statement, children }: SiteHeroProps) {
  return (
    <section className={styles.hero}>
      {/* SR reads plain text; visible wordmark is aria-hidden gradient */}
      <h1 className={styles.srOnly}>{heroWordmark}</h1>
      <p className={styles.heroWordmark} aria-hidden='true'>
        <SiteWordmark variant='hero' text={heroWordmark} />
      </p>
      <p className={styles.statement}>{statement}</p>
      {children}
    </section>
  )
}
