'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore
} from 'react'

/**
 * Global mode for every <LocalizedField> instance on the admin page.
 *
 *   'switch'   — render a per-field RU/EN/DE tab strip; one locale visible
 *                at a time. Default. Lexical-perf-safe.
 *   'all'      — render all three locales side-by-side (text/textarea
 *                only — LocalizedRichText forces 'switch' unless
 *                opt-ed in per Risk R1 in PAYLOAD_ADMIN_UX_PLAN.md).
 *
 * Mounted from payload.config.ts → admin.components.providers so it sits
 * above the Payload form tree. Choice persists per browser via
 * localStorage; the toggle that mutates it lives in
 * components/admin/LocaleModeToggle.tsx and is wired through
 * admin.components.actions.
 *
 * State source-of-truth is localStorage, read via useSyncExternalStore so
 * the value is always synchronously consistent across the tree (no
 * setState-in-effect cascade). Same-tab writes notify via a module-local
 * listener set; cross-tab changes ride the native `storage` event.
 */

export type LocaleMode = 'switch' | 'all'

const STORAGE_KEY = 'boklanov.admin.localeMode'
const DEFAULT_MODE: LocaleMode = 'switch'

const isLocaleMode = (v: unknown): v is LocaleMode =>
  v === 'switch' || v === 'all'

const sameTabListeners = new Set<() => void>()

const emitSameTab = () => {
  sameTabListeners.forEach((fn) => fn())
}

const subscribe = (cb: () => void) => {
  sameTabListeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    sameTabListeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = (): LocaleMode => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return isLocaleMode(v) ? v : DEFAULT_MODE
  } catch {
    // Private-mode Safari, storage quota, etc.
    return DEFAULT_MODE
  }
}

const getServerSnapshot = (): LocaleMode => DEFAULT_MODE

const writeMode = (next: LocaleMode) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Best-effort persistence only.
  }
  emitSameTab()
}

type LocaleModeContextValue = {
  mode: LocaleMode
  setMode: (next: LocaleMode) => void
  toggle: () => void
}

const LocaleModeContext = createContext<LocaleModeContextValue | null>(null)

const LocaleModeProvider: React.FC<{ children?: React.ReactNode }> = ({
  children
}) => {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setMode = useCallback((next: LocaleMode) => {
    writeMode(next)
  }, [])

  const toggle = useCallback(() => {
    writeMode(mode === 'switch' ? 'all' : 'switch')
  }, [mode])

  // Expose the active mode as a body-level data attribute so future
  // CSS in app/(payload)/custom.scss can branch on it without
  // threading the value through every component. Pure React→DOM sync,
  // not a state cascade.
  useEffect(() => {
    document.body.dataset.localeMode = mode
    return () => {
      delete document.body.dataset.localeMode
    }
  }, [mode])

  const value = useMemo<LocaleModeContextValue>(
    () => ({ mode, setMode, toggle }),
    [mode, setMode, toggle]
  )

  return (
    <LocaleModeContext.Provider value={value}>
      {children}
    </LocaleModeContext.Provider>
  )
}

export default LocaleModeProvider

export const useLocaleMode = (): LocaleModeContextValue => {
  const ctx = useContext(LocaleModeContext)
  if (ctx) return ctx
  // The toggle is mounted via admin.components.actions, which may render
  // in a slot Payload positions outside the providers tree depending on
  // route. Treat a missing provider as a thin shim that still reads the
  // canonical localStorage state — clicks continue to work end-to-end.
  return {
    mode: DEFAULT_MODE,
    setMode: writeMode,
    toggle: () => writeMode(getSnapshot() === 'switch' ? 'all' : 'switch')
  }
}
