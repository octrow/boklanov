'use client'

import * as React from 'react'

import { SpecimenPlate } from './SpecimenPlate'
import styles from './GalleryLightbox.module.css'

export interface GalleryItem {
  src: string
  alt: string
  credit?: string | null
}

interface Props {
  items: GalleryItem[]
}

export function GalleryLightbox({ items }: Props) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const triggerRefs = React.useRef<Array<HTMLDivElement | null>>([])

  const total = items.length
  const isOpen = activeIndex !== null

  const handleClose = React.useCallback(() => {
    const prev = activeIndex
    setActiveIndex(null)
    requestAnimationFrame(() => {
      if (prev !== null) triggerRefs.current[prev]?.focus()
    })
  }, [activeIndex])

  const goNext = React.useCallback(() => {
    setActiveIndex((i) => (i === null ? 0 : (i + 1) % total))
  }, [total])

  const goPrev = React.useCallback(() => {
    setActiveIndex((i) => (i === null ? total - 1 : (i - 1 + total) % total))
  }, [total])

  React.useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose, goNext, goPrev])

  const current = activeIndex !== null ? items[activeIndex] : null

  return (
    <>
      <div className={styles.grid}>
        {items.map((item, i) => (
          <div
            key={`${item.src}-${i}`}
            ref={(el) => {
              triggerRefs.current[i] = el
            }}
            className={styles.trigger}
            role='button'
            tabIndex={0}
            aria-label={`View photo ${i + 1} of ${total}`}
            onClick={() => setActiveIndex(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setActiveIndex(i)
            }}
          >
            <SpecimenPlate
              src={item.src}
              alt={item.alt}
              credit={item.credit}
              plateNumber={i + 1}
              total={total}
            />
          </div>
        ))}
      </div>

      {isOpen && current && (
        <div
          className={styles.overlay}
          role='dialog'
          aria-modal='true'
          aria-label={`Photo ${(activeIndex ?? 0) + 1} of ${total}`}
          onClick={handleClose}
        >
          <div className={styles.frame} onClick={(e) => e.stopPropagation()}>
            <button
              ref={closeRef}
              type='button'
              className={styles.close}
              aria-label='Close'
              onClick={handleClose}
            >
              ✕
            </button>

            <div className={styles.imgWrap}>
              <img src={current.src} alt={current.alt} className={styles.img} />

              {total > 1 && (
                <>
                  <button
                    type='button'
                    className={`${styles.navBtn} ${styles.navPrev}`}
                    aria-label='Previous photo'
                    onClick={goPrev}
                  >
                    ←
                  </button>
                  <button
                    type='button'
                    className={`${styles.navBtn} ${styles.navNext}`}
                    aria-label='Next photo'
                    onClick={goNext}
                  >
                    →
                  </button>
                </>
              )}
            </div>

            <div className={styles.meta}>
              <span className={styles.counter}>
                {`${String((activeIndex ?? 0) + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
              </span>
              {current.credit && (
                <span className={styles.credit}>{current.credit}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
