'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from '@payloadcms/ui'

/**
 * The one page-level language switch, in the sticky document header
 * (`admin.components.edit.beforeDocumentControls`). Every field on the
 * page edits the chosen locale; Save writes it to the site.
 *
 * Plain links on purpose: Payload's LeaveWithoutSaving guard intercepts
 * anchor clicks, so switching with unsaved changes asks first. The stock
 * header Localizer uses router.push and skips that guard, so custom.scss
 * hides it.
 */

const LANGS = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' }
] as const

const LocaleSwitch: React.FC = () => {
  const pathname = usePathname() ?? ''
  const params = useSearchParams()
  const active = useLocale().code

  const hrefFor = (code: string) => {
    const next = new URLSearchParams(params?.toString() ?? '')
    next.set('locale', code)
    return `${pathname}?${next.toString()}`
  }

  return (
    <nav className='locale-switch' aria-label='Язык редактирования'>
      {LANGS.map(({ code, label }) =>
        code === active ? (
          <span
            key={code}
            className='locale-switch__item locale-switch__item--active'
            aria-current='page'
          >
            {label}
          </span>
        ) : (
          <Link key={code} href={hrefFor(code)} className='locale-switch__item'>
            {label}
          </Link>
        )
      )}
    </nav>
  )
}

export default LocaleSwitch
