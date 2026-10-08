/**
 * Canonical site base URL.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_BASE_URL — explicit override (set in prod env).
 *  2. VERCEL_ENV=production → https://boklanov.com.
 *  3. VERCEL_BRANCH_URL — stable per-branch preview URL on Vercel preview
 *     deployments, so canonical/hreflang/og:url match the host actually
 *     serving the page (avoids the Lighthouse SEO failure where canonical
 *     points to prod while running on a preview host).
 *  4. VERCEL_URL — deployment-specific preview URL fallback.
 *  5. https://boklanov.com — local default.
 *
 * Always returns a string with no trailing slash and an https:// prefix.
 */
function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  // Production deploys also get a VERCEL_BRANCH_URL (…-git-main-…), which
  // must not leak into canonical / hreflang / sitemap.
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV
  if (env === 'production') return 'https://boklanov.com'

  const branch =
    process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ?? process.env.VERCEL_BRANCH_URL
  if (branch) return `https://${branch.replace(/\/$/, '')}`

  const deploy = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL
  if (deploy) return `https://${deploy.replace(/\/$/, '')}`

  return 'https://boklanov.com'
}

export const BASE_URL = resolve()

/** Stable JSON-LD node id for Roman: the /about Person, referenced as the
 *  director of every production and as the home WebSite's author. */
export const PERSON_ID = `${BASE_URL}/#person`

/** Share preview for every page without its own (productions use /api/og).
 *  Listed per page: a child `openGraph` replaces the layout's wholesale. */
export const DEFAULT_OG_IMAGE = {
  url: '/og.jpg',
  width: 1200,
  height: 630,
  alt: 'Roman Boklanov, theatre director'
}
