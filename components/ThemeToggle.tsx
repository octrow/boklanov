'use client'

import * as React from 'react'

import styles from './ThemeToggle.module.css'

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5"/>
      <line x1="7" y1="0.5" x2="7" y2="2.5"/>
      <line x1="7" y1="11.5" x2="7" y2="13.5"/>
      <line x1="0.5" y1="7" x2="2.5" y2="7"/>
      <line x1="11.5" y1="7" x2="13.5" y2="7"/>
      <line x1="2.4" y1="2.4" x2="3.8" y2="3.8"/>
      <line x1="10.2" y1="10.2" x2="11.6" y2="11.6"/>
      <line x1="11.6" y1="2.4" x2="10.2" y2="3.8"/>
      <line x1="3.8" y1="10.2" x2="2.4" y2="11.6"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5 8A5 5 0 0 1 6 2.5 4.5 4.5 0 1 0 11.5 8z"/>
    </svg>
  )
}

type Theme = 'gorky' | 'paper'
const STORAGE_KEY = 'boklanov.theme'

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'gorky' || v === 'paper') return v
  } catch {
    // localStorage unavailable
  }
  return 'gorky'
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme | null>(null)

  React.useEffect(() => {
    setTheme(readStoredTheme())
  }, [])

  function toggle() {
    // Treat unhydrated state as gorky (the default), so the first click
    // always lands on paper rather than no-op'ing.
    const current: Theme = theme ?? 'gorky'
    const next: Theme = current === 'gorky' ? 'paper' : 'gorky'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  // SSR-safe: render the default-state glyph until hydration completes.
  const isGorky = theme === null ? true : theme === 'gorky'

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label={isGorky ? 'Switch to paper theme' : 'Switch to gorky theme'}
    >
      {isGorky ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
