'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Read-only view of ALL three locale values of the open document, so a
 * field can show the RU source while the editor writes EN/DE, and flag
 * missing translations. Every write goes through Payload's own form and
 * Save button (one save model; the old debounced per-locale PATCH layer
 * is gone, see the 2026-10-08 admin critique).
 *
 * Refetched whenever the page locale changes: switching locale is the
 * only way to edit another locale, so the snapshot is never stale for
 * the locales it shows.
 */

export const LOCALES = ['ru', 'en', 'de'] as const
export type LocaleCode = (typeof LOCALES)[number]

export const isLocaleCode = (s: unknown): s is LocaleCode =>
  (LOCALES as readonly unknown[]).includes(s)

type Doc = Record<string, unknown>

const Ctx = createContext<Doc | null>(null)

const getPath = (obj: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj
    )

/** `/admin/collections/<slug>/<id>` or `/admin/globals/<slug>` → REST
 *  endpoint; null for list views and unsaved (`create`) docs. The provider
 *  sits above Payload's DocumentInfoProvider, so the URL is the source. */
const endpointFor = (pathname: string): string | null => {
  const m = pathname.match(
    /^\/admin\/(collections|globals)\/([^/]+)(?:\/([^/?#]+))?/
  )
  if (!m) return null
  const [, kind, slug, id] = m
  if (kind === 'globals') return `/api/globals/${slug}`
  return id && id !== 'create' ? `/api/${slug}/${id}` : null
}

const LocalizedDocProvider: React.FC<{ children?: React.ReactNode }> = ({
  children
}) => {
  const endpoint = endpointFor(usePathname() ?? '')
  const locale = useSearchParams()?.get('locale') ?? 'ru'
  const key = endpoint ? `${endpoint}|${locale}` : null
  const [state, setState] = useState<{ key: string; doc: Doc } | null>(null)

  useEffect(() => {
    if (!endpoint || !key) return
    let cancelled = false
    fetch(`${endpoint}?locale=all&depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((doc: Doc) => {
        if (!cancelled) setState({ key, doc })
      })
      // Hints only: the form itself still works without them.
      .catch((err) => console.warn('[LocalizedDoc] fetch failed', err))
    return () => {
      cancelled = true
    }
  }, [endpoint, key])

  const doc = state?.key === key ? state.doc : null
  return <Ctx.Provider value={doc}>{children}</Ctx.Provider>
}

export default LocalizedDocProvider

/** `{ ru, en, de }` stored at `path`, or null outside a saved doc / while
 *  loading. Non-localized paths come back with every locale undefined. */
export const useAllLocales = (
  path: string
): Record<LocaleCode, unknown> | null => {
  const doc = useContext(Ctx)
  if (!doc) return null
  const raw = getPath(doc, path)
  const r =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  return { ru: r.ru, en: r.en, de: r.de }
}
