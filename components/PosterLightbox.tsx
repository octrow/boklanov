'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'

import styles from './PosterLightbox.module.css'

interface Props {
  src: string
  alt: string
  children: React.ReactNode
}

export function PosterLightbox({ src, alt, children }: Props) {
  const t = useTranslations('accessibility')
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)

  const handleClose = React.useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  React.useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, handleClose])

  return (
    <>
      <div
        ref={triggerRef}
        className={styles.trigger}
        role='button'
        tabIndex={0}
        aria-label={t('viewFullPoster')}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen(true)
        }}
      >
        {children}
      </div>

      {open && (
        <div
          className={styles.overlay}
          role='dialog'
          aria-modal='true'
          aria-label={t('fullPoster')}
          onClick={handleClose}
        >
          <div className={styles.frame} onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={alt} className={styles.img} />
            <button
              ref={closeRef}
              type='button'
              className={styles.close}
              aria-label={t('close')}
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
