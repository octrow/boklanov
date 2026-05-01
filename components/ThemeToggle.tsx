'use client'

import * as React from 'react'

import styles from './ThemeToggle.module.css'

type Theme = 'light' | 'dark'

function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem('theme')
    if (v === 'light' || v === 'dark') return v
  } catch {
    // localStorage unavailable (SSR guard)
  }
  return null
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme | null>(null)

  React.useEffect(() => {
    const stored = getStoredTheme()
    const effective = stored ?? getSystemTheme()
    setTheme(effective)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '○' : '●'}
    </button>
  )
}
