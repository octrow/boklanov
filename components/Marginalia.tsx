import * as React from 'react'

import styles from './Marginalia.module.css'

type MarginaliaKind = 'note' | 'pull' | 'run'

interface MarginaliaProps {
  /**
   * Register variant. Defaults to 'note' for back-compat with DA-7.6.A
   * usage (`<Marginalia note="...">{prose}</Marginalia>`).
   *  - 'note' - DA-7.6.A: prose left, mono note right column at ≥1280px
   *  - 'pull' - Phase 9.4 pull-quote: italic Lora at body size, --ink
   *  - 'run'  - Phase 9.4 run row: mono caps register
   */
  kind?: MarginaliaKind
  /** DA-7.6.A note prop - only consumed when `kind === 'note'`. */
  note?: React.ReactNode
  /** Optional language tag for source-language fallback (pull variant). */
  lang?: string
  children: React.ReactNode
}

export function Marginalia({
  kind = 'note',
  note,
  lang,
  children
}: MarginaliaProps) {
  if (kind === 'pull') {
    return (
      <p className={styles.pull} {...(lang ? { lang } : {})}>
        {children}
      </p>
    )
  }

  if (kind === 'run') {
    return <div className={styles.run}>{children}</div>
  }

  // kind === 'note' (default)
  if (!note) {
    return <div className={styles.rowSingle}>{children}</div>
  }
  return (
    <div className={styles.row}>
      <div className={styles.prose}>{children}</div>
      <aside className={styles.note} aria-hidden='true'>
        {note}
      </aside>
    </div>
  )
}
