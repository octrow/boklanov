const CDN = process.env.NEXT_PUBLIC_CDN_BASE ?? ''

/** Prepends CDN base URL when set; returns path as-is in local dev. */
export function cdnUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return CDN ? `${CDN}${path}` : path
}
