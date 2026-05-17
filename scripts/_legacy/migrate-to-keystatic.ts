/**
 * scripts/migrate-to-keystatic.ts
 *
 * One-shot migration to Keystatic-compatible on-disk shape:
 *
 *   1. Renames body.{ru,en,de}.md → bodyRu.mdx / bodyEn.mdx / bodyDe.mdx
 *      (Plain Markdown is valid MDX, content unchanged.)
 *   2. Normalises bare-string L10nString fields in index.yaml to the
 *      always-object form { ru, en, de } that the Keystatic schema expects.
 *      Affected fields:
 *        - theatre.{name, shortName, city}
 *        - awards[].{name, category, city}
 *        - festivals[].{name, category, city}
 *        - press[].title
 *        - externalLinks[].label
 *        - runs[].{venue, city, count}
 *        - tour[]
 *   3. Wraps single-string `role:` values in an array.
 *
 * Usage:
 *   npm exec tsx scripts/migrate-to-keystatic.ts -- --dry-run
 *   npm exec tsx scripts/migrate-to-keystatic.ts
 *
 * The script is idempotent: running it twice is a no-op.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { parseDocument, isMap, isScalar, YAMLMap, Scalar } from 'yaml'

const ROOT = path.resolve(process.cwd(), 'content', 'productions')
const DRY = process.argv.includes('--dry-run')

const BODY_RENAMES: Array<[string, string]> = [
  ['body.ru.md', 'bodyRu.mdx'],
  ['body.en.md', 'bodyEn.mdx'],
  ['body.de.md', 'bodyDe.mdx']
]

/** Wrap a bare-string scalar as { ru, en, de } map (with empty en/de). */
function wrapStringAsL10n(node: Scalar): YAMLMap {
  const map = new YAMLMap()
  map.set('ru', node.value)
  map.set('en', '')
  map.set('de', '')
  return map
}

/** Normalise a single field path on a YAMLMap-like node. If the value at that
 *  key is a scalar string, wrap it. Returns true if it changed. */
function normaliseL10n(parent: unknown, key: string): boolean {
  if (!isMap(parent)) return false
  const v = parent.get(key, true) // keep as Node
  if (isScalar(v) && typeof v.value === 'string' && v.value.length > 0) {
    parent.set(key, wrapStringAsL10n(v as Scalar))
    return true
  }
  // null/empty stays as-is — null L10n means "not set", schema accepts it via empty object
  return false
}

/** Walk an array node and normalise specified l10n keys on each element. */
function normaliseArrayItems(
  parent: unknown,
  arrayKey: string,
  itemKeys: string[]
): number {
  if (!isMap(parent)) return 0
  const arr = parent.get(arrayKey, true) as
    | { items?: unknown[] }
    | undefined
    | null
  if (!arr || !('items' in arr) || !Array.isArray(arr.items)) return 0
  let changed = 0
  for (const item of arr.items) {
    for (const k of itemKeys) {
      if (normaliseL10n(item, k)) changed++
    }
  }
  return changed
}

function processYaml(file: string): { changed: boolean; notes: string[] } {
  const raw = fs.readFileSync(file, 'utf8')
  const doc = parseDocument(raw)
  const notes: string[] = []
  let changed = false

  // --- 1. theatre.{name, shortName, city} ---
  const theatre = doc.get('theatre', true)
  for (const k of ['name', 'shortName', 'city']) {
    if (normaliseL10n(theatre, k)) {
      changed = true
      notes.push(`theatre.${k}`)
    }
  }

  // --- 2. arrays: awards / festivals (name, category, city) ---
  for (const arrKey of ['awards', 'festivals']) {
    const n = normaliseArrayItems(doc.contents, arrKey, [
      'name',
      'category',
      'city'
    ])
    if (n) {
      changed = true
      notes.push(`${arrKey} (×${n})`)
    }
  }

  // --- 3. press[].title ---
  {
    const n = normaliseArrayItems(doc.contents, 'press', ['title'])
    if (n) {
      changed = true
      notes.push(`press.title (×${n})`)
    }
  }

  // --- 4. externalLinks[].label ---
  {
    const n = normaliseArrayItems(doc.contents, 'externalLinks', ['label'])
    if (n) {
      changed = true
      notes.push(`externalLinks.label (×${n})`)
    }
  }

  // --- 5. runs[].{venue, city, count} ---
  {
    const n = normaliseArrayItems(doc.contents, 'runs', [
      'venue',
      'city',
      'count'
    ])
    if (n) {
      changed = true
      notes.push(`runs (×${n})`)
    }
  }

  // --- 6. tour[]: array of L10nString. Each item is bare string or map. ---
  {
    const tour = doc.get('tour', true) as { items?: unknown[] } | undefined
    if (tour && Array.isArray(tour.items)) {
      let n = 0
      tour.items = tour.items.map((it) => {
        if (
          isScalar(it) &&
          typeof it.value === 'string' &&
          it.value.length > 0
        ) {
          n++
          return wrapStringAsL10n(it as Scalar)
        }
        return it
      })
      if (n) {
        changed = true
        notes.push(`tour (×${n})`)
      }
    }
  }

  // --- 7. role: 'director' → role: ['director'] ---
  {
    const role = doc.get('role', true)
    if (isScalar(role) && typeof role.value === 'string') {
      doc.set('role', [role.value])
      changed = true
      notes.push('role (string→array)')
    }
  }

  if (changed && !DRY) {
    fs.writeFileSync(file, doc.toString({ lineWidth: 0 }), 'utf8')
  }
  return { changed, notes }
}

function processSlug(slug: string): { renamed: string[]; notes: string[] } {
  const dir = path.join(ROOT, slug)
  const renamed: string[] = []

  for (const [from, to] of BODY_RENAMES) {
    const src = path.join(dir, from)
    const dst = path.join(dir, to)
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      if (!DRY) fs.renameSync(src, dst)
      renamed.push(`${from} → ${to}`)
    }
  }

  const yamlPath = path.join(dir, 'index.yaml')
  let notes: string[] = []
  if (fs.existsSync(yamlPath)) {
    const r = processYaml(yamlPath)
    notes = r.notes
  }

  return { renamed, notes }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`No content dir at ${ROOT}`)
    process.exit(1)
  }

  const slugs = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  console.log(
    `Migrating ${slugs.length} productions${DRY ? ' [DRY RUN]' : ''}\n`
  )

  let totalRenames = 0
  let totalYamlChanges = 0
  for (const slug of slugs) {
    const { renamed, notes } = processSlug(slug)
    if (renamed.length || notes.length) {
      console.log(`  ${slug}`)
      for (const r of renamed) console.log(`    rename: ${r}`)
      for (const n of notes) console.log(`    yaml:   ${n}`)
    }
    totalRenames += renamed.length
    if (notes.length) totalYamlChanges++
  }

  console.log(
    `\nDone. ${totalRenames} files renamed, ${totalYamlChanges} YAML files normalised.`
  )
  if (DRY) console.log('(dry run — no files written)')
}

main()
