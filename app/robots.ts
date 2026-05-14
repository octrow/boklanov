import type { MetadataRoute } from 'next'

import { BASE_URL as BASE } from '@/lib/baseUrl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE
  }
}
