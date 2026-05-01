import * as React from 'react'

import styles from './Cue.module.css'

interface CueProps {
  mark: string
  children: React.ReactNode
  /** Suppress top margin when cue is the first element in a padded section. */
  first?: boolean
}

export function Cue({ mark, children, first = false }: CueProps) {
  return (
    <header className={first ? `${styles.cueHead} ${styles.cueHeadFirst}` : styles.cueHead}>
      <span aria-hidden="true" className={styles.cueMark}>{mark}</span>
      {children}
    </header>
  )
}
