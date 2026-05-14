/**
 * scripts/bake-image-variants.ts
 *
 * Bulk backfill / re-encode for Pipeline A (PAYLOAD_IMAGE_VARIANTS_PLAN.md).
 * Walks every Production via Payload Local API, derives source R2 keys from
 * `media.*.src` strings, and bakes the four AVIF widths alongside.
 *
 * Encode + naming logic lives in `lib/image-variants.ts`; this script owns
 * CLI parsing, Payload iteration, and the outer pMap concurrency loop.
 *
 * Usage:
 *   npm run bake-variants                       # whole library
 *   npm run bake-variants -- --dry-run          # plan PUTs, no writes
 *   npm run bake-variants -- --slug aibolit     # one production only
 *   npm run bake-variants -- --force            # re-encode every variant
 *   npm run bake-variants -- --concurrency=8    # tune source-level fan-out
 */

import 'dotenv/config'
import os from 'node:os'
import { appendFileSync } from 'node:fs'

import pMap from 'p-map'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../payload.config'

import {
  bakeVariantsFromR2,
  makeR2Client,
  r2Bucket,
  srcToR2Key,
  type VariantFailure
} from '../lib/image-variants'

// Structured per-variant failure log. One JSON object per line so it's
// easy to grep / jq / sort by phase, awsCode, etc.
const ERROR_LOG = '/tmp/bake-errors.log'

function logFailure(f: VariantFailure): void {
  // Console: human-readable single line with the most diagnostic fields.
  const awsBits = [
    f.errorName,
    f.awsCode,
    f.awsStatusCode != null ? `HTTP ${f.awsStatusCode}` : undefined,
    f.awsRequestId ? `req=${f.awsRequestId}` : undefined
  ]
    .filter(Boolean)
    .join(' / ')
  const size =
    f.sourceBytes != null ? ` src=${(f.sourceBytes / 1024).toFixed(0)}KB` : ''
  console.warn(
    `  ⚠ [${f.phase}] ${f.variantKey}${size}  ${
      awsBits ? `[${awsBits}]  ` : ''
    }${f.message}`
  )
  // File: structured JSON for post-run analysis.
  appendFileSync(ERROR_LOG, JSON.stringify(f) + '\n')
}

// -----------------------------------------------------------------------------
// Source walk — Payload Local API
// -----------------------------------------------------------------------------

type AnyMap = Record<string, unknown>

function collectFromProduction(doc: AnyMap): string[] {
  const out = new Set<string>()
  const media = (doc.media as AnyMap) ?? {}
  for (const k of ['poster', 'productionsPhoto', 'featuredPhoto'] as const) {
    const g = (media[k] as AnyMap) ?? {}
    const key = srcToR2Key(g.src)
    if (key) out.add(key)
  }
  const gallery = Array.isArray(media.gallery)
    ? (media.gallery as AnyMap[])
    : []
  for (const g of gallery) {
    const key = srcToR2Key(g.src)
    if (key) out.add(key)
  }
  return Array.from(out)
}

async function collectAllSources(
  payload: Payload,
  onlySlug: string | null
): Promise<Array<{ slug: string; keys: string[] }>> {
  const { docs } = await payload.find({
    collection: 'productions',
    locale: 'all',
    depth: 0,
    limit: 500,
    pagination: false,
    ...(onlySlug ? { where: { slug: { equals: onlySlug } } } : {})
  })
  return (docs as unknown as AnyMap[]).map((d) => ({
    slug: String(d.slug),
    keys: collectFromProduction(d)
  }))
}

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------

const DEFAULT_CONCURRENCY = Math.max(2, os.cpus().length)

function parseConcurrency(args: string[]): number {
  const eqMatch = args.find((a) => a.startsWith('--concurrency='))
  if (eqMatch) {
    const n = Number(eqMatch.split('=')[1])
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  const idx = args.indexOf('--concurrency')
  if (idx !== -1) {
    const n = Number(args[idx + 1])
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  return DEFAULT_CONCURRENCY
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('--dry')
  const force = args.includes('--force')
  const slugIdx = args.indexOf('--slug')
  const onlySlug = slugIdx !== -1 ? (args[slugIdx + 1] ?? null) : null
  const concurrency = parseConcurrency(args)

  // Reset the error log on each run so old failures don't bleed into a
  // fresh diagnosis.
  try {
    require('node:fs').writeFileSync(ERROR_LOG, '')
  } catch {
    // best-effort — log file is diagnostic, not load-bearing
  }

  const bucket = r2Bucket()
  console.log(
    `R2 bucket: "${bucket}"${dryRun ? '  [DRY RUN]' : ''}${
      force ? '  [FORCE]' : ''
    }${onlySlug ? `  (slug=${onlySlug})` : ''}  concurrency=${concurrency}`
  )
  console.log(`Errors will be appended to ${ERROR_LOG}`)

  const client = makeR2Client()
  const payload = await getPayload({ config })

  const groups = await collectAllSources(payload, onlySlug)
  const allKeys = groups.flatMap((g) => g.keys)
  console.log(
    `\nDiscovered ${allKeys.length} source images across ${groups.length} production${
      groups.length === 1 ? '' : 's'
    }.`
  )

  let built = 0
  let skipped = 0
  let missing = 0
  let failureCount = 0
  // Track failure causes for the final summary.
  const phaseTally: Record<string, number> = {}
  const codeTally: Record<string, number> = {}

  await pMap(
    allKeys,
    async (key) => {
      try {
        const res = await bakeVariantsFromR2(key, client, bucket, {
          dryRun,
          force,
          onWrite: (variantKey, bytes) => {
            if (dryRun) {
              console.log(`[dry] PUT ${variantKey}`)
            } else {
              const kb = (bytes / 1024).toFixed(0)
              console.log(`  ✓ ${variantKey}  (${kb} KB)`)
            }
          },
          onFailure: (f) => {
            failureCount += 1
            phaseTally[f.phase] = (phaseTally[f.phase] ?? 0) + 1
            const codeKey =
              f.awsCode ?? f.errorName ?? `http-${f.awsStatusCode ?? 'unknown'}`
            codeTally[codeKey] = (codeTally[codeKey] ?? 0) + 1
            logFailure(f)
          }
        })
        built += res.built
        skipped += res.skipped
        if (res.missingSource) {
          missing += 1
          console.warn(`  ⚠ source missing in R2: ${key}`)
        }
      } catch (err) {
        // Unexpected throw (the per-variant try/catch in lib/image-variants
        // should normally route everything through onFailure; this catches
        // anything that escaped — e.g. payload-collection iteration errors).
        failureCount += 1
        const e = err as Error
        console.warn(
          `  ⚠ UNEXPECTED for ${key}: ${e.name ?? ''} ${e.message ?? String(err)}\n${e.stack ?? ''}`
        )
      }
    },
    { concurrency }
  )

  console.log(
    `\nDone. ${built} variant${built === 1 ? '' : 's'} ${
      dryRun ? 'planned' : 'written'
    }, ${skipped} already present, ${missing} sources missing, ${failureCount} variant failures.`
  )

  if (failureCount > 0) {
    const phaseSummary = Object.entries(phaseTally)
      .sort((a, b) => b[1] - a[1])
      .map(([phase, n]) => `${phase}=${n}`)
      .join(' ')
    const codeSummary = Object.entries(codeTally)
      .sort((a, b) => b[1] - a[1])
      .map(([code, n]) => `${code}=${n}`)
      .join(' ')
    console.log(`Failures by phase: ${phaseSummary}`)
    console.log(`Failures by code:  ${codeSummary}`)
    console.log(
      `Full structured log: ${ERROR_LOG}\n` +
        `Investigate with e.g.  jq -s '.[] | .message' < ${ERROR_LOG} | sort -u`
    )
  }

  // Payload Local API leaves the pg pool open; explicitly exit so the script
  // terminates instead of hanging.
  process.exit(failureCount === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
