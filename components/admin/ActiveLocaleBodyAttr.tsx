'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LOCALES, type LocaleCode } from './LocalizedDocContext'

/**
 * Mirrors the URL's `?locale=` search param onto
 * `document.body.dataset.activeLocale` so plain SCSS in
 * app/(payload)/custom.scss can branch on the active locale without
 * threading the value through every component.
 *
 * Used by §Round-2 R4 in PAYLOAD_ADMIN_UX_PLAN.md to gate the parallel
 * Команда credit arrays (creditsRu / creditsEn / creditsDe) on the
 * Productions edit form: in switch mode only the matching array is
 * visible; in all mode every array is visible.
 *
 * Mounted via payload.config.ts → admin.components.providers. The
 * component renders no DOM — children pass through unchanged.
 */

const isLocaleCode = (s: string | null): s is LocaleCode =>
  s !== null && (LOCALES as readonly string[]).includes(s)

const ActiveLocaleBodyAttr: React.FC<{ children?: React.ReactNode }> = ({
  children
}) => {
  const searchParams = useSearchParams()
  const raw = searchParams?.get('locale') ?? null
  const active: LocaleCode = isLocaleCode(raw) ? raw : 'ru'

  useEffect(() => {
    document.body.dataset.activeLocale = active
    return () => {
      delete document.body.dataset.activeLocale
    }
  }, [active])

  return <>{children}</>
}

export default ActiveLocaleBodyAttr
