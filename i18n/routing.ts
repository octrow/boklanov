import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // EN is the default chrome locale; DE is the secondary chrome locale; RU is
  // the canonical content locale but renders behind a prefix.
  // (See DESIGN.md §8 Routes.)
  locales: ['en', 'de', 'ru'] as const,
  defaultLocale: 'en',
  // EN renders at `/` with no prefix. DE/RU always carry a prefix.
  localePrefix: 'as-needed',
  // URL is the source of truth — do not Accept-Language-redirect fresh
  // visitors. Avoids a ~1.2 s set-cookie 307 on cold paths where Vercel's
  // cache (keyed by RSC headers) misses and middleware runs.
  localeDetection: false
})

export type Locale = (typeof routing.locales)[number]
