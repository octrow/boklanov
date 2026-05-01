'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

/**
 * Minimal PostHog integration. Disabled unless NEXT_PUBLIC_POSTHOG_KEY is set.
 *
 * Tracking scope: ONLY booking-CTA clicks per brief Q7.
 * - autocapture, pageview, pageleave, session recording all disabled.
 * - Events fired via data attribute delegation: data-ph-event="..."
 *   Additional data-ph-* props are collected automatically.
 */
export function Analytics() {
  useEffect(() => {
    if (!POSTHOG_KEY) return

    posthog.init(POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      persistence: 'memory', // no localStorage writes — cleaner for privacy
    })

    function handler(e: MouseEvent) {
      const target = e.target as Element | null
      const el = target?.closest('[data-ph-event]')
      if (!el) return

      const event = el.getAttribute('data-ph-event') ?? 'click'
      const props: Record<string, string> = {}
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-ph-') && attr.name !== 'data-ph-event') {
          props[attr.name.slice(8)] = attr.value
        }
      }
      posthog.capture(event, props)
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return null
}
