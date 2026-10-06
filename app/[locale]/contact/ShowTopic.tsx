'use client'

import { useSearchParams } from 'next/navigation'
import * as React from 'react'

// `?show=<slug>` comes from the booking CTA on a production page. The slug is
// untrusted: it is only used as a key into the server-provided title map, and
// unknown slugs fall back to the plain contact page.
function useShowTitle(titles: Record<string, string>): string | null {
  const slug = useSearchParams()?.get('show')
  return slug && Object.hasOwn(titles, slug) ? titles[slug] : null
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
  const title = useShowTitle(titles)
  if (!title) return null
  return (
    <p className={className}>
      {label} {title}
    </p>
  )
}

export function ShowMailtoLink({
  titles,
  email,
  subject,
  showSubject,
  children,
  ...rest
}: {
  titles: Record<string, string>
  email: string
  subject: string
  /** Subject with `{title}` placeholder, used when a known show is named. */
  showSubject: string
  children: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const title = useShowTitle(titles)
  const s = title ? showSubject.replace('{title}', title) : subject
  return (
    <a href={`mailto:${email}?subject=${encodeURIComponent(s)}`} {...rest}>
      {children}
    </a>
  )
}
