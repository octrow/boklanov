/**
 * Build the Cmd-K search index from productions data.
 * Called at Server Component render time; serialised as JSON props.
 */

import type { ProductionView } from './content'

export type SearchItem =
  | {
      type: 'production'
      slug: string
      title: string
      theatre: string
      city: string
      year: string
    }
  | {
      type: 'award'
      slug: string
      name: string
      productionTitle: string
      year: string
    }
  | {
      type: 'press'
      slug: string
      articleTitle: string
      outlet: string
      productionTitle: string
    }
  | { type: 'theatre'; slug: string; name: string; city: string }
  | { type: 'city'; slug: string; name: string }

export function buildSearchIndex(productions: ProductionView[]): SearchItem[] {
  const items: SearchItem[] = []
  const theatresSeen = new Map<string, string>() // name → slug
  const citiesSeen = new Set<string>()

  for (const prod of productions) {
    const theatreName = prod.theatre.name ?? prod.theatre.shortName ?? ''
    const city = prod.theatre.city ?? ''

    // Production
    items.push({
      type: 'production',
      slug: prod.slug,
      title: prod.title,
      theatre: theatreName,
      city,
      year: prod.year ? String(prod.year) : ''
    })

    // Awards
    for (const award of prod.awards) {
      if (!award.name) continue
      items.push({
        type: 'award',
        slug: prod.slug,
        name: award.name,
        productionTitle: prod.title,
        year: award.year && award.year > 1900 ? String(award.year) : ''
      })
    }

    // Press
    for (const item of prod.press) {
      if (!item.title) continue
      items.push({
        type: 'press',
        slug: prod.slug,
        articleTitle: item.title,
        outlet: item.outlet ?? '',
        productionTitle: prod.title
      })
    }

    // Theatre (deduplicated)
    if (theatreName && !theatresSeen.has(theatreName)) {
      theatresSeen.set(theatreName, prod.slug)
      items.push({
        type: 'theatre',
        slug: prod.slug,
        name: theatreName,
        city
      })
    }

    // City (deduplicated)
    if (city && !citiesSeen.has(city)) {
      citiesSeen.add(city)
      items.push({
        type: 'city',
        slug: prod.slug,
        name: city
      })
    }
  }

  return items
}
