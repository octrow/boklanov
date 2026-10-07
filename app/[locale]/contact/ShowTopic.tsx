'use client'

import { useSearchParams } from 'next/navigation'
import * as React from 'react'

// `?show=<slug>` comes from the booking CTA on a production page. The slug is
// untrusted: it is only used as a key into a server-provided map, and
// unknown slugs fall back to the plain contact page.
function useShowEntry(map: Record<string, string>): string | null {
  const slug = useSearchParams()?.get('show')
  return slug && Object.hasOwn(map, slug) ? map[slug] : null
}

export function ShowTopicLine({
  titles,
  label,
  className
}: {
  titles: Record<string, string>
  label: string
  className?: string
}) {
  const title = useShowEntry(titles)
  if (!title) return null
  return (
    <p className={className}>
      {label} {title}
    </p>
  )
}

export function ShowMailtoLink({
  subjects,
  email,
  subject,
  children,
  ...rest
}: {
  /** Full email subject per show slug (server-built, see lib/bookingKind). */
  subjects: Record<string, string>
  email: string
  subject: string
  children: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const s = useShowEntry(subjects) ?? subject
  return (
    <a href={`mailto:${email}?subject=${encodeURIComponent(s)}`} {...rest}>
      {children}
    </a>
  )
}

// Telegram pre-enters `?text=` only on `t.me/<username>` links
// (core.telegram.org/api/links); other URLs stay as they are.
const TELEGRAM_USER = /^https:\/\/t\.me\/[A-Za-z0-9_]+\/?$/

export function ShowTelegramLink({
  messages,
  href,
  children,
  ...rest
}: {
  /** First message per show slug (server-built, see lib/bookingKind). */
  messages: Record<string, string>
  href: string
  children: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const message = useShowEntry(messages)
  const url =
    message && TELEGRAM_USER.test(href)
      ? `${href.replace(/\/$/, '')}?text=${encodeURIComponent(message)}`
      : href
  return (
    <a href={url} {...rest}>
      {children}
    </a>
  )
}

export function ShowCopyMessage({
  messages,
  label,
  copiedLabel,
  className,
  buttonClassName
}: {
  messages: Record<string, string>
  label: string
  copiedLabel: string
  className?: string
  buttonClassName?: string
}) {
  const message = useShowEntry(messages)
  const [copied, setCopied] = React.useState(false)
  if (!message) return null

  function handleCopy() {
    navigator.clipboard.writeText(message!).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={className}>
      <button type='button' onClick={handleCopy} className={buttonClassName}>
        {copied ? copiedLabel : label}
      </button>
    </div>
  )
}
