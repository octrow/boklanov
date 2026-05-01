import type { MetadataRoute } from 'next'

import { getAllProductions } from '@/lib/content'

// Canonical base — override at build time with NEXT_PUBLIC_BASE_URL.
const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com').replace(/\/$/, '')

const STATIC_PATHS = [
  '/',
  '/productions',
  '/about',
  '/awards',
  '/press',
  '/archive',
  '/contact',
] as const

/** RU is the default locale — no prefix. */
function ruUrl(path: string): string {
  return path === '/' ? BASE : `${BASE}${path}`
}
function enUrl(path: string): string {
  return path === '/' ? `${BASE}/en` : `${BASE}/en${path}`
}
function deUrl(path: string): string {
  return path === '/' ? `${BASE}/de` : `${BASE}/de${path}`
}

/**
 * hreflang alternates for RU↔EN pairs only.
 * DE excluded per IA §URL Strategy — chrome-only locale misleads Google.
 * x-default points to the RU (canonical) URL.
 */
function ruEnAlternates(path: string): MetadataRoute.Sitemap[number]['alternates'] {
  return {
    languages: {
      ru: ruUrl(path),
      en: enUrl(path),
      'x-default': ruUrl(path),
    },
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllProductions('ru').map((p) => p.slug)
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  // ── Static pages ──────────────────────────────────────────────────────────
  for (const path of STATIC_PATHS) {
    entries.push({ url: ruUrl(path), alternates: ruEnAlternates(path), lastModified: now })
    entries.push({ url: enUrl(path), alternates: ruEnAlternates(path), lastModified: now })
    entries.push({ url: deUrl(path), lastModified: now })
  }

  // ── Production detail pages ───────────────────────────────────────────────
  for (const slug of slugs) {
    const path = `/productions/${slug}`
    entries.push({ url: ruUrl(path), alternates: ruEnAlternates(path), lastModified: now })
    entries.push({ url: enUrl(path), alternates: ruEnAlternates(path), lastModified: now })
    entries.push({ url: deUrl(path), lastModified: now })
  }

  return entries
}
