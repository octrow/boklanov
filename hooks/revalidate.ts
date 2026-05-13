import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook
} from 'payload'

/**
 * Revalidation hooks — Payload runs in the same Node process as the Next.js
 * site, so calling revalidateTag / revalidatePath here flushes the RSC cache
 * synchronously. No webhook hop. See PAYLOAD_MIGRATION_PLAN §P3.2.
 *
 * Convention: every fetch in lib/content.ts wraps in unstable_cache with two
 * tags — a collection-wide tag (`productions`) and a slug-specific tag
 * (`production:<slug>`). Hooks bust both.
 *
 * Set `context.disableRevalidate = true` on the request to skip this hook —
 * used by scripts/seed-payload.ts during bulk seeds.
 */

type WithSlug = { slug?: string | null }

export const revalidateProduction: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload, context }
}) => {
  if (context?.disableRevalidate) return doc

  const d = doc as WithSlug
  const prev = previousDoc as WithSlug | undefined

  revalidateTag('productions')
  if (d.slug) {
    revalidateTag(`production:${d.slug}`)
    payload.logger.info(`revalidateTag production:${d.slug}`)
  }
  if (prev?.slug && prev.slug !== d.slug) {
    revalidateTag(`production:${prev.slug}`)
  }
  // Home featured strip + /productions index are server-rendered; bust the
  // segment caches so the very next request rebuilds.
  revalidatePath('/[locale]/productions', 'page')
  revalidatePath('/[locale]', 'page')

  return doc
}

export const revalidateProductionDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context }
}) => {
  if (context?.disableRevalidate) return doc
  const d = doc as WithSlug
  revalidateTag('productions')
  if (d?.slug) revalidateTag(`production:${d.slug}`)
  revalidatePath('/[locale]/productions', 'page')
  revalidatePath('/[locale]', 'page')
  return doc
}

export const revalidateAbout: GlobalAfterChangeHook = ({
  doc,
  req: { context }
}) => {
  if (context?.disableRevalidate) return doc
  revalidateTag('about')
  revalidatePath('/[locale]/about', 'page')
  return doc
}

export const revalidateContact: GlobalAfterChangeHook = ({
  doc,
  req: { context }
}) => {
  if (context?.disableRevalidate) return doc
  revalidateTag('contact')
  revalidatePath('/[locale]/contact', 'page')
  return doc
}
