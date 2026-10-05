import { notFound } from 'next/navigation'

// Unknown paths under a locale render [locale]/not-found.tsx (site chrome,
// theme) instead of Next's bare default 404.
export default function CatchAll() {
  notFound()
}
