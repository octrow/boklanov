import type { MetadataRoute } from 'next'

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
