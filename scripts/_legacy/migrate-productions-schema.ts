#!/usr/bin/env tsx
/**
 * WS-1 YAML migration — nest flat top-level fields into schema groups.
 *
 * Before: content/productions/<slug>/index.yaml has flat keys (title, poster, …)
 * After:  keys are nested under identity / media / production / taxonomy /
 *         team / recognition / history / settings.
 *
 * Usage:
 *   npx tsx scripts/migrate-productions-schema.ts            # live run
 *   npx tsx scripts/migrate-productions-schema.ts --dry-run  # preview one entry
 *   npx tsx scripts/migrate-productions-schema.ts --reverse  # undo migration
 *
 * Idempotent: skips already-migrated entries (detected by presence of
 * top-level `identity:` key). Run-once gate is enforced unless --force is
 * passed.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const CONTENT_DIR = path.resolve(process.cwd(), 'content', 'productions')
const DRY_RUN = process.argv.includes('--dry-run')
const REVERSE = process.argv.includes('--reverse')
const FORCE = process.argv.includes('--force')

// ── Field-group topology ────────────────────────────────────────────────────

const TOPOLOGY: Record<string, string[]> = {
  identity: ['title', 'tagline', 'synopsis', 'directorsNote'],
  // bodyRu / bodyEn / bodyDe are .mdx sidecar files — not in YAML
  media: ['poster', 'productionsPhoto', 'featuredPhoto', 'gallery', 'videos'],
  production: [
    'theatre',
    'year',
    'premiereDate',
    'ticketsUrl',
    'durationMin',
    'ageRating',
    'status'
  ],
  taxonomy: ['role', 'form', 'lineage', 'tags'],
  team: ['credits'],
  recognition: ['awards', 'festivals', 'press', 'externalLinks'],
  history: ['tour', 'runs'],
  settings: [
    'bookingCta',
    'bookingCtaLabel',
    'bookingCtaUrl',
    'featured',
    'featuredOrder',
    'listOrder',
    'techRider',
    'pressKit',
    'notionIds'
  ]
}

// Fields that always stay at the top level (not moved into any group)
const TOP_LEVEL_KEYS = new Set(['slug'])

// ── Migration helpers ───────────────────────────────────────────────────────

function migrateForward(
  flat: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  // Preserve slug at top level
  if ('slug' in flat) out.slug = flat.slug

  for (const [group, keys] of Object.entries(TOPOLOGY)) {
    const groupObj: Record<string, unknown> = {}
    for (const key of keys) {
      if (key in flat) groupObj[key] = flat[key]
    }
    if (Object.keys(groupObj).length > 0) {
      out[group] = groupObj
    }
  }

  // Preserve any keys not covered by the topology (future-proofing)
  const allMapped = new Set([
    ...TOP_LEVEL_KEYS,
    ...Object.values(TOPOLOGY).flat()
  ])
  for (const key of Object.keys(flat)) {
    if (!allMapped.has(key) && !(key in out)) {
      out[key] = flat[key]
    }
  }

  return out
}

function migrateReverse(
  nested: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  if ('slug' in nested) out.slug = nested.slug

  for (const [group, keys] of Object.entries(TOPOLOGY)) {
    const groupVal = nested[group] as Record<string, unknown> | undefined
    if (!groupVal) continue
    for (const key of keys) {
      if (key in groupVal) out[key] = groupVal[key]
    }
  }

  // Preserve any unknown top-level keys
  const knownGroups = new Set(['slug', ...Object.keys(TOPOLOGY)])
  for (const key of Object.keys(nested)) {
    if (!knownGroups.has(key)) out[key] = nested[key]
  }

  return out
}

function isMigrated(fm: Record<string, unknown>): boolean {
  return 'identity' in fm
}

function isReversed(fm: Record<string, unknown>): boolean {
  return (
    !('identity' in fm) && ('title' in fm || 'poster' in fm || 'theatre' in fm)
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

const slugs = fs
  .readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()

let migrated = 0,
  skipped = 0,
  errors = 0

for (const slug of slugs) {
  const yamlPath = path.join(CONTENT_DIR, slug, 'index.yaml')
  if (!fs.existsSync(yamlPath)) continue

  const raw = fs.readFileSync(yamlPath, 'utf-8')
  const fm = (parseYaml(raw) ?? {}) as Record<string, unknown>

  if (REVERSE) {
    if (isReversed(fm) && !FORCE) {
      console.log(`  SKIP  ${slug}  (already flat)`)
      skipped++
      continue
    }
    const flat = migrateReverse(fm)
    const yaml = stringifyYaml(flat, { lineWidth: 120 })
    if (DRY_RUN) {
      console.log(`\n── DRY RUN reverse: ${slug} ──`)
      console.log(yaml.slice(0, 600))
      break
    }
    fs.writeFileSync(yamlPath, yaml, 'utf-8')
    console.log(`  REVERSED  ${slug}`)
    migrated++
  } else {
    if (isMigrated(fm) && !FORCE) {
      console.log(`  SKIP  ${slug}  (already migrated)`)
      skipped++
      continue
    }
    const nested = migrateForward(fm)
    const yaml = stringifyYaml(nested, { lineWidth: 120 })
    if (DRY_RUN) {
      console.log(`\n── DRY RUN forward: ${slug} ──`)
      console.log(yaml.slice(0, 800))
      break
    }
    fs.writeFileSync(yamlPath, yaml, 'utf-8')
    console.log(`  MIGRATED  ${slug}`)
    migrated++
  }
}

console.log(
  `\nDone — ${migrated} migrated, ${skipped} skipped, ${errors} errors.`
)
if (DRY_RUN) console.log('(dry run — no files written)')
