/**
 * Cross-host revalidate receiver.
 *
 * Called by `hooks/revalidate-peers.ts#fanOutRevalidate` on every host listed
 * in another host's `REVALIDATE_PEERS`. Validates a shared secret, then runs
 * the same `revalidateTag` / `revalidatePath` invalidations that would have
 * run locally if the Payload save had happened on THIS host.
 *
 * POST body:
 *   { "secret": "…", "tags": ["about"], "paths": ["/[locale]/about"] }
 *
 * Auth model: shared symmetric secret. Constant-time compare. Endpoint
 * returns 503 if REVALIDATE_SECRET isn't configured on this host (preferable
 * to silently accepting any request).
 */

import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function POST(req: Request) {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'expected JSON body' }, { status: 400 })
  }

  const { secret, tags, paths } = (body ?? {}) as {
    secret?: unknown
    tags?: unknown
    paths?: unknown
  }

  if (typeof secret !== 'string' || !constantTimeEqual(secret, expected)) {
    return NextResponse.json({ error: 'invalid secret' }, { status: 401 })
  }

  const tagList = Array.isArray(tags)
    ? tags.filter((t): t is string => typeof t === 'string')
    : []
  const pathList = Array.isArray(paths)
    ? paths.filter((p): p is string => typeof p === 'string')
    : []

  for (const t of tagList) revalidateTag(t)
  for (const p of pathList) revalidatePath(p, 'page')

  return NextResponse.json({
    revalidated: { tags: tagList, paths: pathList }
  })
}
