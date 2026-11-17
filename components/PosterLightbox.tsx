'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import styles from './PosterLightbox.module.css'

interface Props {
  src: string
  alt: string
  children: React.ReactNode
}

// Fallback for browsers without `closedby` (Safari): a click that lands on the
// dialog element itself and outside its box is a backdrop click.
function closeOnBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
  if ('closedBy' in HTMLDialogElement.prototype) return
  if (e.target !== e.currentTarget) return
  const r = e.currentTarget.getBoundingClientRect()
  const inside =
    e.clientX >= r.left &&
    e.clientX <= r.right &&
    e.clientY >= r.top &&
    e.clientY <= r.bottom
  if (!inside) e.currentTarget.close()
}

const LIGHT_DISMISS = { closedby: 'any' } as Record<string, string>

export function PosterLightbox({ src, alt, children }: Props) {
  const t = useTranslations('accessibility')
  const [open, setOpen] = React.useState(false)
  const dialogRef = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (open && dialog && !dialog.open) dialog.showModal()
  }, [open])

  return (
    <>
      <button
        type='button'
        className={styles.trigger}
        aria-label={t('viewFullPoster')}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={t('fullPoster')}
        {...LIGHT_DISMISS}
        onClose={() => setOpen(false)}
        onClick={closeOnBackdropClick}
      >
        {open && (
          <>
            <Image
              src={src}
              alt={alt}
              width={0}
              height={0}
              sizes='min(90vw, 1000px)'
              className={styles.img}
              style={{ width: 'auto', height: 'auto' }}
            />
            <button
              type='button'
              className={styles.close}
              aria-label={t('close')}
              autoFocus
              onClick={() => dialogRef.current?.close()}
            >
              ✕
            </button>
          </>
        )}
      </dialog>
    </>
  )
}
