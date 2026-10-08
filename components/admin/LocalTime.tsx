'use client'

import React, { useEffect, useState } from 'react'

/** «сегодня, 14:20» / «3 окт.» in the editor's own time zone. Rendered in
 *  the browser: the server runs in UTC. Until hydration shows the date
 *  only, which never shifts by more than a day. */
const LocalTime: React.FC<{ iso: string; lang: 'ru' | 'en' }> = ({
  iso,
  lang
}) => {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  const d = new Date(iso)
  const date = d.toLocaleDateString(lang, { day: 'numeric', month: 'short' })
  let label = date
  if (now) {
    const sameDay = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString(lang, {
      hour: '2-digit',
      minute: '2-digit'
    })
    label = sameDay
      ? `${lang === 'ru' ? 'сегодня' : 'today'}, ${time}`
      : d.getFullYear() === now.getFullYear()
        ? date
        : d.toLocaleDateString(lang, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
  }
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {label}
    </time>
  )
}

export default LocalTime
