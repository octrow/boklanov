import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // EN is the default chrome locale; DE is the secondary chrome locale; RU is
  // the canonical content locale but renders behind a prefix.
  // (See DESIGN.md §8 Routes.)
  locales: ['en', 'de', 'ru'] as const,
  defaultLocale: 'en',
  // EN renders at `/` with no prefix. DE/RU always carry a prefix.
  localePrefix: 'as-needed'
})

export type Locale = (typeof routing.locales)[number]
