'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'

import styles from './page.module.css'

export function CopyEmailButton({ email }: { email: string }) {
  const t = useTranslations('contact')
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={styles.copyButton}
      aria-label={copied ? t('copiedAria') : t('copyAria')}
    >
      {copied ? t('copiedButton') : t('copyButton')}
    </button>
  )
}
