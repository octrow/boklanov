'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'

import styles from './SlateStrike.module.css'

export function SlateStrike({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const gestureOff = searchParams?.get('gesture') === 'off'

  const [animate, setAnimate] = React.useState(false)

  React.useEffect(() => {
    if (gestureOff) return
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem('firstPaintDone')) return
    sessionStorage.setItem('firstPaintDone', '1')
    setAnimate(true)
  }, [gestureOff])

  return (
    <div className={animate ? `${styles.slate} ${styles.slateAnimate}` : styles.slate}>
      {children}
    </div>
  )
}
