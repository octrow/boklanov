import * as React from 'react'

import styles from './EmptyState.module.css'

interface EmptyStateProps {
  body: string
  action?: React.ReactNode
}

export function EmptyState({ body, action }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      <span aria-hidden="true" className={styles.label}>ERRATA</span>
      <p className={styles.body}>{body}</p>
      {action}
    </div>
  )
}
