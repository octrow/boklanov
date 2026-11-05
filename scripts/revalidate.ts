/**
 * scripts/revalidate.ts — bust the `productions` data cache on a running site.
 * The content scripts write with `disableRevalidate`, so run this after them
 * (or after a redeploy: the cache outlives deploys).
 *
 *   REVALIDATE_SECRET=… npx tsx scripts/revalidate.ts [https://boklanov.com]
 *
 * Site defaults to NEXT_PUBLIC_BASE_URL. Posts to /api/revalidate.
 */

import 'dotenv/config'
import { pathToFileURL } from 'node:url'

export async function postRevalidate(
  site: string,
  secret: string,
  fetchFn: typeof fetch = fetch
): Promise<void> {
  const res = await fetchFn(`${site.replace(/\/$/, '')}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, tags: ['productions'] })
  })
  if (!res.ok) throw new Error(`revalidate failed: ${res.status}`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const site = process.argv[2] ?? process.env.NEXT_PUBLIC_BASE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!site || !secret) {
    console.error(
      'need a site URL (arg or NEXT_PUBLIC_BASE_URL) and REVALIDATE_SECRET'
    )
    process.exit(1)
  }
  await postRevalidate(site, secret)
  console.log(`revalidated productions on ${site}`)
}
