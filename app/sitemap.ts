import type { MetadataRoute } from 'next'

import { BASE_URL as BASE } from '@/lib/baseUrl'
import { getAllProductions } from '@/lib/content'

const STATIC_PATHS = [
  '/',
  '/productions',
  '/about',
  '/awards',
  '/press',
  '/archive',
  '/contact'
] as const

/** EN is the default locale - no prefix. */
function enUrl(path: string): string {
  return path === '/' ? BASE : `${BASE}${path}`
}
function deUrl(path: string): string {
  return path === '/' ? `${BASE}/de` : `${BASE}/de${path}`
}
function ruUrl(path: string): string {
  return path === '/' ? `${BASE}/ru` : `${BASE}/ru${path}`
}

/**
 * hreflang alternates for RU↔EN pairs only.
 * DE excluded per IA §URL Strategy - chrome-only locale misleads Google.
 * x-default points to the EN (default) URL.
 */
function ruEnAlternates(
  path: string
): MetadataRoute.Sitemap[number]['alternates'] {
  return {
    languages: {
      en: enUrl(path),
      ru: ruUrl(path),
      'x-default': enUrl(path)
    }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = (await getAllProductions('en')).map((p) => p.slug)
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  // ── Static pages ──────────────────────────────────────────────────────────
  for (const path of STATIC_PATHS) {
    entries.push({
      url: enUrl(path),
      alternates: ruEnAlternates(path),
      lastModified: now
    })
    entries.push({ url: deUrl(path), lastModified: now })
    entries.push({
      url: ruUrl(path),
      alternates: ruEnAlternates(path),
      lastModified: now
    })
  }

  // ── Production detail pages ───────────────────────────────────────────────
  for (const slug of slugs) {
    const path = `/productions/${slug}`
    entries.push({
      url: enUrl(path),
      alternates: ruEnAlternates(path),
      lastModified: now
    })
    entries.push({ url: deUrl(path), lastModified: now })
    entries.push({
      url: ruUrl(path),
      alternates: ruEnAlternates(path),
      lastModified: now
    })
  }

  return entries
}
