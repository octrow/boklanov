// Derives publication-folio metadata from the current pathname.
// Used by SiteHeader to render the running folio band.

export interface FolioMark {
  /** nav key matching messages/[locale].json nav.* — null on home */
  sectionKey: string | null
  /** true when on the home page — renders just the director name without a section arrow */
  isHome?: boolean
  /** '01 / 24' on production detail pages; undefined elsewhere */
  index?: string
}

export function folioFor(
  pathname: string,
  productions: { slug: string }[]
): FolioMark {
  const productionDetailMatch = /^\/productions\/([^/]+)$/.exec(pathname)
  if (productionDetailMatch) {
    const slug = productionDetailMatch[1]
    const idx = productions.findIndex((p) => p.slug === slug)
    const n = idx !== -1 ? String(idx + 1).padStart(2, '0') : '??'
    const total = String(productions.length).padStart(2, '0')
    return { sectionKey: 'productions', index: `${n} / ${total}` }
  }

  if (pathname === '/productions') return { sectionKey: 'productions' }
  if (pathname === '/about')       return { sectionKey: 'about' }
  if (pathname === '/awards')      return { sectionKey: 'awards' }
  if (pathname === '/press')       return { sectionKey: 'press' }
  if (pathname === '/contact')     return { sectionKey: 'contact' }
  if (pathname === '/archive')     return { sectionKey: 'archive' }

  if (pathname === '/') return { sectionKey: null, isHome: true }

  return { sectionKey: null }
}
