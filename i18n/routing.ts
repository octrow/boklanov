import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // EN is the default chrome locale; DE is the secondary chrome locale; RU is
  // the canonical content locale but renders behind a prefix.
  // (See DESIGN.md §8 Routes.)
  locales: ['en', 'de', 'ru'] as const,
  defaultLocale: 'en',
  // EN renders at `/` with no prefix. DE/RU always carry a prefix.
  localePrefix: 'as-needed',
  // Always default to English. Don't sniff Accept-Language or cookies for
  // unprefixed URLs — first-time visitors see EN regardless of browser
  // locale. Once the user switches to DE/RU via the locale switcher, the
  // prefix in the URL keeps them in that locale: every in-app <Link> from
  // i18n/navigation auto-prefixes with the active locale (read from the
  // pathname), so /de/about → /de/productions, etc. The choice persists for
  // the whole navigation session until the user switches again.
  localeDetection: false
})

export type Locale = (typeof routing.locales)[number]
