import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

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

/** hreflang alternates for all three locales; x-default is EN. Must match
 *  the per-page `alternates.languages` in generateMetadata. */
function alternates(path: string): MetadataRoute.Sitemap[number]['alternates'] {
  return {
    languages: {
      en: enUrl(path),
      ru: ruUrl(path),
      de: deUrl(path),
      'x-default': enUrl(path)
    }
  }
}

/** slug → updatedAt. Static pages get no lastmod: a build timestamp on every
 *  URL tells Google nothing changed meaningfully. */
async function productionDates(): Promise<Map<string, Date>> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'productions',
    select: { slug: true, updatedAt: true },
    depth: 0,
    pagination: false
  })
  return new Map(docs.map((d) => [d.slug as string, new Date(d.updatedAt)]))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productions, dates] = await Promise.all([
    getAllProductions('en'),
    productionDates()
  ])
  const urls = (path: string) => [enUrl(path), deUrl(path), ruUrl(path)]

  const statics = STATIC_PATHS.flatMap((path) =>
    urls(path).map((url) => ({ url, alternates: alternates(path) }))
  )
  const details = productions.flatMap(({ slug }) => {
    const path = `/productions/${slug}`
    const lastModified = dates.get(slug)
    return urls(path).map((url) => ({
      url,
      alternates: alternates(path),
      lastModified
    }))
  })
  return [...statics, ...details]
}
