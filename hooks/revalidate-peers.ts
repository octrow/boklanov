/**
 * Cross-host revalidation fan-out.
 *
 * Payload's `revalidateTag` / `revalidatePath` calls only invalidate the
 * Node.js process they run in. With multiple deployed copies of the site
 * sharing one Neon database (local dev + Vercel preview + prod), a save in
 * any one admin leaves the other copies serving stale RSC cache until they
 * happen to be redeployed. This helper POSTs the invalidation to every host
 * listed in `REVALIDATE_PEERS` after the local bust has already run, so a
 * save anywhere fans out everywhere.
 *
 * Env vars (set per-environment in Vercel):
 *   REVALIDATE_SECRET  shared random string; receiver compares constant-time
 *   REVALIDATE_PEERS   comma-separated absolute URLs of OTHER hosts
 *                      e.g. on prod: REVALIDATE_PEERS=https://preview-host…vercel.app
 *                           on preview: REVALIDATE_PEERS=https://boklanov.com
 *                      omit self — `VERCEL_URL` is filtered as a belt-and-braces.
 *
 * Failures never throw: a slow / unreachable peer would otherwise block the
 * Payload save UI. We log + continue.
 */

type Logger = {
  info?: (msg: string) => void
  warn?: (msg: string) => void
}

const PEER_TIMEOUT_MS = 3000

function getPeers(): string[] {
  const raw = process.env.REVALIDATE_PEERS ?? ''
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

function selfUrl(): string | null {
  // Vercel sets VERCEL_URL to the immutable deployment hostname (no protocol).
  const v = process.env.VERCEL_URL
  return v ? `https://${v}` : null
}

export async function fanOutRevalidate(
  logger: Logger,
  tags: string[],
  paths: string[]
): Promise<void> {
  const peers = getPeers()
  const secret = process.env.REVALIDATE_SECRET
  if (peers.length === 0 || !secret) return

  const self = selfUrl()
  const targets = self ? peers.filter((p) => !p.startsWith(self)) : peers

  if (targets.length === 0) return

  const body = JSON.stringify({ secret, tags, paths })

  const results = await Promise.allSettled(
    targets.map(async (peer) => {
      const url = `${peer}/api/revalidate`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(PEER_TIMEOUT_MS),
        cache: 'no-store'
      })
      if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
      return url
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled') {
      logger.info?.(`revalidate peer ok: ${r.value}`)
    } else {
      const msg =
        r.reason instanceof Error ? r.reason.message : String(r.reason)
      logger.warn?.(`revalidate peer failed: ${msg}`)
    }
  }
}
