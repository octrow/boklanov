import * as React from 'react'

import styles from './Marginalia.module.css'

interface MarginaliaProps {
  note?: React.ReactNode
  children: React.ReactNode
}

export function Marginalia({ note, children }: MarginaliaProps) {
  if (!note) {
    return <div className={styles.rowSingle}>{children}</div>
  }
  return (
    <div className={styles.row}>
      <div className={styles.prose}>{children}</div>
      <aside className={styles.note} aria-hidden="true">{note}</aside>
    </div>
  )
}
