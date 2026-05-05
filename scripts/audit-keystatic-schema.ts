/**
 * audit-keystatic-schema.ts — pre-flight check for Keystatic schema changes.
 *
 * Surfaces the data shapes that bite when promoting a free-text field to
 * fields.select / fields.multiselect / similar enum-shaped fields. Specifically:
 *
 *   1. Fields with LITERAL null in YAML — these crash the Keystatic client
 *      under fields.select (it has no null-safe option). Same null-mismatch
 *      class that already caught us on press[].language.
 *   2. Fields with low-cardinality non-null values — candidates for select
 *      promotion (only safe AFTER the null entries are backfilled).
 *   3. Fields with empty-string ("") values — Keystatic select also can't
 *      represent these without an explicit option, so they need normalising
 *      to null or backfilled to a real value.
 *
 * Usage:
 *   npm run audit-keystatic         # report; exits 0 always
 *   npm run audit-keystatic -- --strict   # exits 1 if any nulls/empties found
 *
 * Run this BEFORE editing keystatic.config.ts to promote a field. If you skip
 * it and a select rejects null, the editor SPA crashes on the affected entry.
 */

import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

import { parse as parseYaml } from 'yaml'

const PROD_DIR = join(process.cwd(), 'content', 'productions')
const ABOUT_DIR = join(process.cwd(), 'content', 'about')

const STRICT = process.argv.includes('--strict')

// Fields to audit — dotted paths into the production YAML or about frontmatter.
// Array fields use [].field notation. Add entries here whenever a new field
// is a candidate for select / multiselect promotion.
const PRODUCTION_FIELDS = [
  'status',
  'ageRating',
  'theatre.country',
  'role',
  'form',
  'lineage',
  'tags',
  'videos[].provider',
  'press[].language',
  'press[].outlet',
  'bookingCta'
] as const

const CARDINALITY_THRESHOLD = 12 // ≤ this many distinct values → enum candidate

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Bucket = {
  values: Map<string, number> // value (stringified) → count
  nulls: string[] // slugs with literal null
  empties: string[] // slugs with empty-string ""
  missing: number // entries where the key isn't present at all
  total: number
}

function emptyBucket(): Bucket {
  return { values: new Map(), nulls: [], empties: [], missing: 0, total: 0 }
}

/** Walk a dotted path with `[]` for array iteration. Yields each terminal
 *  value (or undefined / null) with the originating slug. */
function* walk(
  data: unknown,
  parts: string[]
): Generator<unknown, void, undefined> {
  if (parts.length === 0) {
    yield data
    return
  }
  const [head, ...rest] = parts
  if (head === '[]') {
    if (Array.isArray(data)) {
      for (const item of data) yield* walk(item, rest)
    } else if (data == null) {
      // array field absent — count once at the leaf
      yield* walk(undefined, rest)
    }
    return
  }
  if (data == null || typeof data !== 'object') {
    yield* walk(undefined, rest)
    return
  }
  const next = (data as Record<string, unknown>)[head]
  if (!(head in (data as object))) {
    // key absent — distinct from explicit null
    yield* walk('___MISSING___' as unknown, rest)
    return
  }
  yield* walk(next, rest)
}

function pathParts(path: string): string[] {
  return path
    .replace(/\[\]/g, '.[]')
    .split('.')
    .filter(Boolean)
}

function record(bucket: Bucket, slug: string, value: unknown) {
  bucket.total++
  if (value === '___MISSING___') {
    bucket.missing++
    return
  }
  if (value === null) {
    bucket.nulls.push(slug)
    return
  }
  if (value === '') {
    bucket.empties.push(slug)
    return
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      bucket.values.set('[]', (bucket.values.get('[]') ?? 0) + 1)
      return
    }
    for (const v of value) {
      const k = JSON.stringify(v)
      bucket.values.set(k, (bucket.values.get(k) ?? 0) + 1)
    }
    return
  }
  if (typeof value === 'object') {
    bucket.values.set('<object>', (bucket.values.get('<object>') ?? 0) + 1)
    return
  }
  const k = JSON.stringify(value)
  bucket.values.set(k, (bucket.values.get(k) ?? 0) + 1)
}

// ---------------------------------------------------------------------------
// Audit pass
// ---------------------------------------------------------------------------

function auditProductions(): { buckets: Map<string, Bucket>; total: number } {
  const buckets = new Map<string, Bucket>()
  for (const field of PRODUCTION_FIELDS) buckets.set(field, emptyBucket())

  const slugs = readdirSync(PROD_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  for (const slug of slugs) {
    const file = join(PROD_DIR, slug, 'index.yaml')
    let data: unknown
    try {
      data = parseYaml(readFileSync(file, 'utf8'))
    } catch (err) {
      console.error(`✗ failed to parse ${file}: ${(err as Error).message}`)
      continue
    }
    for (const field of PRODUCTION_FIELDS) {
      const bucket = buckets.get(field)!
      // For array-leaf paths (e.g. `role`), walking a non-array yields the
      // raw value; for `videos[].provider` the walk iterates each video.
      const parts = pathParts(field)
      let yielded = 0
      for (const v of walk(data, parts)) {
        record(bucket, slug, v)
        yielded++
      }
      if (yielded === 0) {
        // Field is absent at this entry's path entirely.
        bucket.total++
        bucket.missing++
      }
    }
  }
  return { buckets, total: slugs.length }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function reportField(field: string, b: Bucket): { dangerous: boolean } {
  const distinct = b.values.size
  const danger = b.nulls.length > 0 || b.empties.length > 0

  const verdictParts: string[] = []
  if (danger) verdictParts.push('⚠ NULL/EMPTY')
  if (
    !danger &&
    distinct > 0 &&
    distinct <= CARDINALITY_THRESHOLD &&
    b.values.size > 0
  ) {
    verdictParts.push('✓ select-ready')
  }
  if (distinct > CARDINALITY_THRESHOLD) verdictParts.push('— open taxonomy')
  if (distinct === 0 && b.missing === b.total)
    verdictParts.push('— field unused')

  const verdict = verdictParts.length ? verdictParts.join(' ') : '·'

  console.log(`\n${field}  [${verdict}]`)
  console.log(
    `  set: ${[...b.values.values()].reduce((a, c) => a + c, 0)}, missing: ${b.missing}, null: ${b.nulls.length}, empty: ${b.empties.length}`
  )
  if (b.nulls.length) {
    console.log(
      `  null entries (need backfill before select): ${b.nulls.slice(0, 5).join(', ')}${b.nulls.length > 5 ? ` …+${b.nulls.length - 5}` : ''}`
    )
  }
  if (b.empties.length) {
    console.log(
      `  empty-string entries: ${b.empties.slice(0, 5).join(', ')}${b.empties.length > 5 ? ` …+${b.empties.length - 5}` : ''}`
    )
  }
  if (distinct > 0 && distinct <= CARDINALITY_THRESHOLD) {
    const sorted = [...b.values.entries()].sort((a, b) => b[1] - a[1])
    console.log(
      `  values: ${sorted.map(([v, c]) => `${v} (${c})`).join(', ')}`
    )
  } else if (distinct > 0) {
    console.log(`  ${distinct} distinct values (truncated, taxonomy-style)`)
  }

  return { dangerous: danger }
}

function main() {
  console.log('Keystatic schema audit\n' + '='.repeat(50))
  console.log(
    `Reading from ${PROD_DIR.replace(process.cwd(), '.')} and ${ABOUT_DIR.replace(process.cwd(), '.')}\n`
  )

  const { buckets, total } = auditProductions()
  console.log(`Productions audited: ${total}`)
  console.log(
    `Legend: ⚠ = literal null/empty in YAML; ✓ = low cardinality, ready for select promotion; — = open taxonomy / unused`
  )

  let anyDangerous = false
  for (const [field, bucket] of buckets) {
    const { dangerous } = reportField(field, bucket)
    if (dangerous) anyDangerous = true
  }

  console.log('\n' + '='.repeat(50))
  if (anyDangerous) {
    console.log(
      'One or more fields contain literal null/empty values in YAML.'
    )
    console.log(
      'Backfill or strip those keys before promoting the field to fields.select.'
    )
    if (STRICT) {
      console.log('--strict: exiting 1.')
      process.exit(1)
    }
  } else {
    console.log('No null/empty mismatches detected. Safe to consider select promotion for ✓ fields.')
  }
}

main()
