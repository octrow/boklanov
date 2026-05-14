/**
 * Canonical site base URL.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_BASE_URL — explicit override (set in prod env).
 *  2. VERCEL_BRANCH_URL — stable per-branch preview URL on Vercel preview
 *     deployments, so canonical/hreflang/og:url match the host actually
 *     serving the page (avoids the Lighthouse SEO failure where canonical
 *     points to prod while running on a preview host).
 *  3. VERCEL_URL — deployment-specific preview URL fallback.
 *  4. https://boklanov.com — production default.
 *
 * Always returns a string with no trailing slash and an https:// prefix.
 */
function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const branch =
    process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ?? process.env.VERCEL_BRANCH_URL
  if (branch) return `https://${branch.replace(/\/$/, '')}`

  const deploy = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL
  if (deploy) return `https://${deploy.replace(/\/$/, '')}`

  return 'https://boklanov.com'
}

export const BASE_URL = resolve()
