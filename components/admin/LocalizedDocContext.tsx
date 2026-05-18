'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { usePathname } from 'next/navigation'

/**
 * Shadow data layer that holds ALL three locale values for the currently
 * open document. Sits parallel to Payload's standard form state, which
 * is single-locale (see PAYLOAD_ADMIN_UX_PLAN.md "Architecture note").
 *
 * On mount, fetches the doc with `?locale=all` so localized fields come
 * back as `{ ru, en, de }` objects. Inactive-locale edits are flushed
 * to REST `PATCH /api/<collection>/<id>?locale=<X>` on a debounced
 * timer (1500 ms idle, plus synchronous flush on tab switch + page
 * unload).
 *
 * The active locale (whatever `?locale=` in the URL is) keeps using
 * Payload's normal form state + Save button + draft system. Our
 * shadow context only writes to the OTHER two locales — never to the
 * active one.
 *
 * Prototype scope: text fields only. RichText is deferred to a later
 * step (Lexical state shape vs flat-string payload requires its own
 * encoder/decoder).
 */

export const LOCALES = ['ru', 'en', 'de'] as const
export type LocaleCode = (typeof LOCALES)[number]

const DEBOUNCE_MS = 1500

type PendingByLocale = Record<LocaleCode, Map<string, unknown>>
const emptyPending = (): PendingByLocale => ({
  ru: new Map(),
  en: new Map(),
  de: new Map()
})

type LocalizedDocCtx = {
  loaded: boolean
  /** Read the value for a path + locale out of the shadow doc. */
  getValue: (path: string) => Record<LocaleCode, string | undefined> | null
  /**
   * Like getValue but doesn't coerce to string — returns whatever the
   * shadow has at that path. Used by richText preview rendering
   * where the value is a SerializedEditorState JSON object rather
   * than a flat string.
   */
  getRawValue: (path: string) => Record<LocaleCode, unknown> | null
  /**
   * Write a locale's value into the shadow doc and schedule a PATCH.
   * Should ONLY be called for inactive locales — the active locale
   * goes through Payload's standard form state.
   */
  setValue: (path: string, locale: LocaleCode, value: string) => void
  /** Force-flush all pending writes immediately (e.g. on tab switch). */
  flush: () => Promise<void>
}

const Ctx = createContext<LocalizedDocCtx | null>(null)

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

const setPath = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void => {
  const keys = path.split('.')
  let cur: Record<string, unknown> = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}
    cur = cur[k] as Record<string, unknown>
  }
  cur[keys[keys.length - 1]] = value
}

/**
 * Walk `value` and replace every leaf `{ru, en, de}` object with its
 * locale-specific value. Used when we need to send an array slice that
 * contains localized children: Payload's REST API expects flat values
 * matching `?locale=X`.
 */
const projectToLocale = (value: unknown, locale: LocaleCode): unknown => {
  if (Array.isArray(value)) {
    return value.map((v) => projectToLocale(v, locale))
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
    // Heuristic: an object whose only keys are locale codes IS a localized leaf.
    const onlyLocaleKeys =
      keys.length > 0 &&
      keys.every((k) => (LOCALES as readonly string[]).includes(k))
    if (onlyLocaleKeys) {
      const v = obj[locale]
      return typeof v === 'undefined' ? null : v
    }
    const out: Record<string, unknown> = {}
    for (const k of keys) out[k] = projectToLocale(obj[k], locale)
    return out
  }
  return value
}

/** Find the closest array-ancestor of a dotted path, e.g.
 *  'media.gallery.0.caption' → 'media.gallery'.
 *  Returns null if no segment is followed by a numeric segment. */
const findArrayAncestor = (path: string): string | null => {
  const segs = path.split('.')
  for (let i = segs.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(segs[i]) && i > 0) {
      return segs.slice(0, i).join('.')
    }
  }
  return null
}

const buildPatchBody = (
  pending: Map<string, unknown>,
  shadowDoc: Record<string, unknown> | null,
  locale: LocaleCode
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  // Track array roots we've already lifted so we don't repeat work for
  // multiple edits in the same array.
  const liftedArrays = new Set<string>()

  for (const [path, value] of pending) {
    const arrayAncestor = findArrayAncestor(path)
    if (arrayAncestor && shadowDoc) {
      if (liftedArrays.has(arrayAncestor)) continue
      liftedArrays.add(arrayAncestor)
      // Send the FULL array at this root, projected to the target locale.
      // The shadow doc already has the user's optimistic edits applied.
      const arr = getPath(shadowDoc, arrayAncestor)
      setPath(out, arrayAncestor, projectToLocale(arr, locale))
    } else {
      // Scalar (top-level or group-nested, no array ancestor): send the
      // single value at its path. Active-locale `value` is already a
      // flat string; inactive comes from setValue which writes flat
      // strings too — but pass through projectToLocale to handle the
      // case where setValue was given an object subtree.
      setPath(out, path, projectToLocale(value, locale))
    }
  }
  return out
}

const LocalizedDocProvider: React.FC<{ children?: React.ReactNode }> = ({
  children
}) => {
  // We sit at admin.components.providers, which mounts ABOVE the per-doc
  // DocumentInfoProvider — so useDocumentInfo() would return defaults
  // (id/slug undefined) and the fetch would never fire. Parse the doc
  // address out of the URL instead. Patterns:
  //   /admin/collections/<slug>/<id>        — existing doc
  //   /admin/collections/<slug>/create      — new, no id yet, skip
  //   /admin/globals/<slug>                 — global, no id needed
  const pathname = usePathname() ?? ''
  const endpoint = useMemo<string | null>(() => {
    const m = pathname.match(
      /^\/admin\/(collections|globals)\/([^/]+)(?:\/([^/?#]+))?/
    )
    if (!m) return null
    const [, kind, slug, idMaybe] = m
    if (kind === 'globals') return `/api/globals/${slug}`
    if (kind === 'collections' && idMaybe && idMaybe !== 'create') {
      return `/api/${slug}/${idMaybe}`
    }
    return null
  }, [pathname])

  // Endpoint + doc live in a single state object so changing the
  // endpoint (e.g. navigating between docs) doesn't require a
  // setState-in-effect reset cascade. Derived `doc` and `loaded` below
  // ignore stale data whenever state.endpoint !== current endpoint.
  type DocState = {
    endpoint: string | null
    doc: Record<string, unknown> | null
  }
  const [state, setState] = useState<DocState>({ endpoint: null, doc: null })
  const doc = state.endpoint === endpoint ? state.doc : null
  const loaded = doc !== null

  const pendingRef = useRef<PendingByLocale>(emptyPending())
  const timersRef = useRef<
    Partial<Record<LocaleCode, ReturnType<typeof setTimeout>>>
  >({})

  // Fetch once per (endpoint) with locale=all so localized fields are
  // returned as { ru, en, de } objects rather than flat strings.
  useEffect(() => {
    if (!endpoint) return
    let cancelled = false
    void (async () => {
      try {
        // No draft=true — Productions/About/Contact don't have versions
        // enabled; sending it on a non-versioned entity is a no-op at
        // best and could shift response shape.
        const res = await fetch(`${endpoint}?locale=all&depth=0`, {
          credentials: 'include'
        })
        if (!res.ok) {
          console.error(
            '[LocalizedDoc] fetch failed',
            res.status,
            await res.text()
          )
          return
        }
        const data = (await res.json()) as Record<string, unknown>
        if (!cancelled) setState({ endpoint, doc: data })
      } catch (err) {
        console.error('[LocalizedDoc] fetch error', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [endpoint])

  // Need a ref to the latest shadow doc so flushLocale (called from
  // setTimeout) sees the up-to-date snapshot for array projection.
  const shadowRef = useRef<Record<string, unknown> | null>(null)
  useEffect(() => {
    shadowRef.current = doc
  }, [doc])

  const flushLocale = useCallback(
    async (locale: LocaleCode) => {
      if (!endpoint) return
      const pending = pendingRef.current[locale]
      if (pending.size === 0) return
      const body = buildPatchBody(pending, shadowRef.current, locale)
      pendingRef.current[locale] = new Map()
      const timer = timersRef.current[locale]
      if (timer) {
        clearTimeout(timer)
        delete timersRef.current[locale]
      }
      try {
        const res = await fetch(`${endpoint}?locale=${locale}&depth=0`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!res.ok) {
          console.error(
            '[LocalizedDoc] PATCH failed',
            locale,
            res.status,
            await res.text()
          )
        }
      } catch (err) {
        console.error('[LocalizedDoc] PATCH error', locale, err)
      }
    },
    [endpoint]
  )

  const flush = useCallback(async () => {
    await Promise.all(LOCALES.map((l) => flushLocale(l)))
  }, [flushLocale])

  // Flush on page unload so a half-debounced edit doesn't get dropped.
  useEffect(() => {
    const onUnload = () => {
      for (const locale of LOCALES) {
        const pending = pendingRef.current[locale]
        if (pending.size === 0) continue
        const body = buildPatchBody(pending, shadowRef.current, locale)
        try {
          if (endpoint) {
            const blob = new Blob([JSON.stringify(body)], {
              type: 'application/json'
            })
            // keepalive=true allows the request to outlive the page.
            void fetch(`${endpoint}?locale=${locale}&depth=0`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: blob,
              keepalive: true
            })
          }
        } catch {
          // best-effort
        }
      }
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [endpoint])

  const getValue = useCallback(
    (path: string): Record<LocaleCode, string | undefined> | null => {
      if (!doc) return null
      const raw = getPath(doc, path)
      // With ?locale=all, a localized text field comes back as
      // { ru, en, de } | null. Non-localized fields come back as scalars.
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const r = raw as Record<string, unknown>
        return {
          ru: typeof r.ru === 'string' ? r.ru : undefined,
          en: typeof r.en === 'string' ? r.en : undefined,
          de: typeof r.de === 'string' ? r.de : undefined
        }
      }
      return { ru: undefined, en: undefined, de: undefined }
    },
    [doc]
  )

  const getRawValue = useCallback(
    (path: string): Record<LocaleCode, unknown> | null => {
      if (!doc) return null
      const raw = getPath(doc, path)
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const r = raw as Record<string, unknown>
        return {
          ru: r.ru,
          en: r.en,
          de: r.de
        }
      }
      return { ru: undefined, en: undefined, de: undefined }
    },
    [doc]
  )

  const setValue = useCallback(
    (path: string, locale: LocaleCode, value: string) => {
      // Optimistic update — the in-memory doc reflects the typed value
      // immediately so consumers see it on the next render.
      setState((prev) => {
        if (!prev.doc) return prev
        const nextDoc: Record<string, unknown> = JSON.parse(
          JSON.stringify(prev.doc)
        )
        const raw = getPath(nextDoc, path)
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          ;(raw as Record<string, unknown>)[locale] = value
        } else {
          setPath(nextDoc, path, { [locale]: value })
        }
        return { endpoint: prev.endpoint, doc: nextDoc }
      })
      // Queue the PATCH.
      pendingRef.current[locale].set(path, value)
      const existing = timersRef.current[locale]
      if (existing) clearTimeout(existing)
      timersRef.current[locale] = setTimeout(() => {
        void flushLocale(locale)
      }, DEBOUNCE_MS)
    },
    [flushLocale]
  )

  const value = useMemo<LocalizedDocCtx>(
    () => ({ loaded, getValue, getRawValue, setValue, flush }),
    [loaded, getValue, getRawValue, setValue, flush]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export default LocalizedDocProvider

/**
 * Returns null when used outside a doc edit page (no id, no globalSlug)
 * so consumers can transparently degrade to single-locale rendering.
 */
export const useLocalizedDoc = (): LocalizedDocCtx | null => useContext(Ctx)
