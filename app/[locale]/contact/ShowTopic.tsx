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
