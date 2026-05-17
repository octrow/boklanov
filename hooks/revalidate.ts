import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook
} from 'payload'

import { fanOutRevalidate } from './revalidate-peers'

/**
 * Revalidation hooks — Payload runs in the same Node process as the Next.js
 * site, so calling revalidateTag / revalidatePath here flushes the RSC cache
 * synchronously. No webhook hop. See PAYLOAD_MIGRATION_PLAN §P3.2.
 *
 * Convention: every fetch in lib/content.ts wraps in unstable_cache with two
 * tags — a collection-wide tag (`productions`) and a slug-specific tag
 * (`production:<slug>`). Hooks bust both.
 *
 * Cross-host fan-out: after the local bust, fire `/api/revalidate` POSTs to
 * every host listed in REVALIDATE_PEERS. This is what makes a save on
 * localhost also invalidate the Vercel preview's RSC cache (and vice versa).
 * See `hooks/revalidate-peers.ts` for the contract.
 *
 * Set `context.disableRevalidate = true` on the request to skip this hook —
 * used by scripts/seed-payload.ts during bulk seeds. The flag also skips
 * the peer fan-out (we don't want a 5000-row seed to issue 5000 pings).
 */

type WithSlug = { slug?: string | null }

export const revalidateProduction: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req: { payload, context }
}) => {
  if (context?.disableRevalidate) return doc

  const d = doc as WithSlug
  const prev = previousDoc as WithSlug | undefined

  const tags = new Set<string>(['productions'])
  if (d.slug) {
    tags.add(`production:${d.slug}`)
    payload.logger.info(`revalidateTag production:${d.slug}`)
  }
  if (prev?.slug && prev.slug !== d.slug) {
    tags.add(`production:${prev.slug}`)
  }
  // Home featured strip + /productions index are server-rendered; bust the
  // segment caches so the very next request rebuilds.
  const paths = ['/[locale]/productions', '/[locale]']

  for (const t of tags) revalidateTag(t)
  for (const p of paths) revalidatePath(p, 'page')

  await fanOutRevalidate(payload.logger, [...tags], paths)

  return doc
}

export const revalidateProductionDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { payload, context }
}) => {
  if (context?.disableRevalidate) return doc
  const d = doc as WithSlug

  const tags = new Set<string>(['productions'])
  if (d?.slug) tags.add(`production:${d.slug}`)
  const paths = ['/[locale]/productions', '/[locale]']

  for (const t of tags) revalidateTag(t)
  for (const p of paths) revalidatePath(p, 'page')

  await fanOutRevalidate(payload.logger, [...tags], paths)

  return doc
}

export const revalidateAbout: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context }
}) => {
  if (context?.disableRevalidate) return doc
  revalidateTag('about')
  revalidatePath('/[locale]/about', 'page')
  await fanOutRevalidate(payload.logger, ['about'], ['/[locale]/about'])
  return doc
}

export const revalidateContact: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context }
}) => {
  if (context?.disableRevalidate) return doc
  revalidateTag('contact')
  revalidatePath('/[locale]/contact', 'page')
  await fanOutRevalidate(payload.logger, ['contact'], ['/[locale]/contact'])
  return doc
}
