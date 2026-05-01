'use client'

import * as React from 'react'

import styles from './page.module.css'

export function CopyEmailButton({ email }: { email: string }) {
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
      aria-label={copied ? 'Copied' : 'Copy email address'}
    >
      {copied ? '✓' : 'copy'}
    </button>
  )
}
