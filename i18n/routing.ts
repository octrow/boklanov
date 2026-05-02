import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // RU is the canonical content locale; EN is full parity; DE is chrome-only v1.
  // (See DESIGN.md §8 Routes.)
  locales: ['ru', 'en', 'de'] as const,
  defaultLocale: 'ru',
  // RU renders at `/` with no prefix. EN/DE always carry a prefix.
  localePrefix: 'as-needed'
})

export type Locale = (typeof routing.locales)[number]
