'use client'

import { useEffect } from 'react'
import { useLocale } from '@payloadcms/ui'

/**
 * Mirrors Payload's current locale onto
 * `document.body.dataset.activeLocale` so plain SCSS in
 * app/(payload)/custom.scss can show only that locale's Команда array
 * (creditsRu / creditsEn / creditsDe) on the Productions form.
 *
 * Reads useLocale(), the same source as LocaleSwitch: Payload remembers
 * the last locale in user preferences, so a URL without `?locale=` can
 * still be DE, and the URL alone showed the RU list under «Deutsch».
 *
 * Mounted via payload.config.ts → admin.components.providers. The
 * component renders no DOM — children pass through unchanged.
 */
const ActiveLocaleBodyAttr: React.FC<{ children?: React.ReactNode }> = ({
  children
}) => {
  const active = useLocale().code

  useEffect(() => {
    document.body.dataset.activeLocale = active
    return () => {
      delete document.body.dataset.activeLocale
    }
  }, [active])

  return <>{children}</>
}

export default ActiveLocaleBodyAttr
