'use client'

import * as React from 'react'

const MOBILE_QUERY = '(max-width: 1023px)'

interface BookingBarProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** Element shown first; the bar appears once it has scrolled above the viewport. */
  startSelector: string
  /** Elements that hide the bar while any of them is on screen. */
  endSelector: string
  children: React.ReactNode
}

/**
 * Mobile fixed booking bar (production pages). Hidden at first paint, shown
 * after the slate scrolls out, hidden again at the closing invite / footer.
 * On desktop the bar sits static in the rail and is always visible: CSS keys
 * the hidden state off `data-visible` only below 1024px, and `inert` is set
 * only while the mobile query matches.
 */
export function BookingBar({
  startSelector,
  endSelector,
  children,
  ...rest
}: BookingBarProps) {
  const [pastStart, setPastStart] = React.useState(false)
  const [atEnd, setAtEnd] = React.useState(false)
  const [mobile, setMobile] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onMq = () => setMobile(mq.matches)
    onMq()
    mq.addEventListener('change', onMq)

    const start = document.querySelector(startSelector)
    const ends = Array.from(document.querySelectorAll(endSelector))
    const onEnd = new Map<Element, boolean>()

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === start) {
          setPastStart(!e.isIntersecting && e.boundingClientRect.top < 0)
        } else {
          onEnd.set(e.target, e.isIntersecting)
        }
      }
      setAtEnd([...onEnd.values()].some(Boolean))
    })
    if (start) io.observe(start)
    else setPastStart(true) // ponytail: no slate on the page, show the bar right away
    ends.forEach((el) => io.observe(el))

    return () => {
      io.disconnect()
      mq.removeEventListener('change', onMq)
    }
  }, [startSelector, endSelector])

  const visible = pastStart && !atEnd
  return (
    <a
      {...rest}
      data-visible={visible || undefined}
      inert={mobile && !visible ? true : undefined}
    >
      {children}
    </a>
  )
}
