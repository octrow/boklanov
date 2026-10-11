import type { MetadataRoute } from 'next'

import { BASE_URL as BASE } from '@/lib/baseUrl'

export default function robots(): MetadataRoute.Robots {
  // No `host:` — it's a Yandex extension, not part of the robots.txt RFC, and
  // Lighthouse's `robots-txt` audit fails the file when it's present.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // `/contact?show=<slug>` is the booking CTA on every production page:
      // same content as /contact (canonical points there), but crawlers
      // indexed ~100 copies of it as duplicate pages.
      disallow: '/*?show='
    },
    sitemap: `${BASE}/sitemap.xml`
  }
}
