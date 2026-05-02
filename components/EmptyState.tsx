import * as React from 'react'

import styles from './EmptyState.module.css'

interface EmptyStateProps {
  body: string
  action?: React.ReactNode
}

/**
 * Editorial empty-state register. Phase 9.5 (DESIGN_v2_PROPOSAL.md §4.6):
 * dropped the ERRATA mono chip in favour of a complete-sentence italic Lora
 * body that reads as prose, not a UI state. Hairline rule top + bottom.
 *
 * `body` must be a complete sentence in the active locale (callers pass via
 * next-intl `t('empty')`). `aria-live="polite"` announces empty results to
 * SR users when filter state changes (ProductionGrid call-site).
 */
export function EmptyState({ body, action }: EmptyStateProps) {
  return (
    <div className={styles.root} role='status' aria-live='polite'>
      <p className={styles.body}>{body}</p>
      {action}
    </div>
  )
}
