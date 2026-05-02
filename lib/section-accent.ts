/* v3 §2.8 — Maps next-intl pathname (no locale prefix) to Bauhaus stage accent.
   /productions (index + detail) + /press = cobalt
   /about = mustard
   /archive = ink
   everything else (/, /awards, /contact) = vermillion */

export type SectionAccent = 'vermillion' | 'cobalt' | 'mustard' | 'ink'

export function sectionAccent(pathname: string): SectionAccent {
  if (pathname.startsWith('/productions') || pathname === '/press') return 'cobalt'
  if (pathname === '/about') return 'mustard'
  if (pathname === '/archive') return 'ink'
  return 'vermillion'
}
