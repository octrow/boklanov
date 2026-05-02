'use client'

import { useLocale, useTranslations } from 'next-intl'
import * as React from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { folioFor } from '@/lib/folio'

import { CommandPaletteContext } from './CommandPaletteProvider'
import { ThemeToggle } from './ThemeToggle'
import styles from './SiteHeader.module.css'

const LOCALES: Locale[] = ['ru', 'en', 'de']

const WORDMARKS: Record<Locale, string> = {
  ru: 'роман бокланов',
  en: 'roman boklanov',
  de: 'roman boklanov'
}

interface SiteHeaderProps {
  productions: { slug: string }[]
}

export function SiteHeader({ productions }: SiteHeaderProps) {
  const locale = useLocale() as Locale
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { toggle: toggleSearch } = React.useContext(CommandPaletteContext)

  const folio = folioFor(pathname, productions)

  const navLinks = [
    { href: '/productions' as const, label: t('productions') },
    { href: '/about' as const, label: t('about') },
    { href: '/awards' as const, label: t('awards') },
    { href: '/press' as const, label: t('press') },
    { href: '/contact' as const, label: t('contact') },
    { href: '/archive' as const, label: t('archive') }
  ]

  return (
    <header className={styles.header}>
      {(folio.sectionKey || folio.isHome) && (
        <div className={styles.folio} aria-hidden="true">
          <span className={styles.folioName}>
            {WORDMARKS[locale].toUpperCase()}
          </span>
          {folio.sectionKey && (
            <>
              <span className={styles.folioSep}>⟶</span>
              <span className={styles.folioSection}>
                {t(folio.sectionKey as Parameters<typeof t>[0]).toUpperCase()}
              </span>
            </>
          )}
          {folio.index && (
            <>
              <span className={styles.folioSep}>⟶</span>
              <span className={styles.folioIndex}>{folio.index}</span>
            </>
          )}
        </div>
      )}
      <div className={styles.inner}>
        {/* Wordmark */}
        <Link href="/" className={styles.wordmark}>
          {WORDMARKS[locale]}
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? `${styles.navLink} ${styles.navLinkActive}`
                  : styles.navLink
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Controls: locale switcher + theme toggle (desktop) */}
        <div className={styles.controls}>
          <nav className={styles.localeSwitcher} aria-label="Language">
            {LOCALES.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={
                  loc === locale
                    ? `${styles.localeLink} ${styles.localeLinkActive}`
                    : styles.localeLink
                }
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>

        {/* Mobile search button — on-screen Cmd-K trigger (no Cmd key on mobile). */}
        <button
          type="button"
          className={styles.searchBtn}
          aria-label={t('search')}
          onClick={toggleSearch}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
            <line x1="11.8" y1="11.8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Mobile hamburger */}
        <button
          type="button"
          className={styles.hamburger}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav
          className={styles.mobileNav}
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.mobileNavLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileLocaleSwitcher}>
            {LOCALES.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={
                  loc === locale
                    ? `${styles.localeLink} ${styles.localeLinkActive}`
                    : styles.localeLink
                }
                onClick={() => setMenuOpen(false)}
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <hr className={styles.rule} />
    </header>
  )
}
