/**
 * scripts/port-content-delta.ts — port Keystatic edits made on `main` after the
 * Payload fork into the Payload database (Keystatic → Payload cutover).
 *
 *   npx tsx scripts/port-content-delta.ts [--base=4e7497e] [--target=origin/main]
 *                                         [--slug=<slug>] [--fill-missing] [--apply]
 *
 * Reads both YAML revisions straight from git (no checkout), maps each through
 * the same Keystatic → Payload mapping the seed used, and diffs the results
 * per locale. Every changed field is then checked three-way against the
 * current Payload value:
 *   - Payload == target → already ported, skip
 *   - Payload == base   → untouched in Payload, update
 *   - otherwise         → edited on both sides, CONFLICT (never written)
 * Strings are trimmed and richText is compared as plain text, so Keystatic's
 * YAML reformatting produces no updates.
 *
 * --fill-missing also writes fields that did NOT change in Keystatic but are
 * empty in Payload while the YAML has a value (the original seed dropped
 * `year` / `durationMin` for every row). Payload never had a value there, so
 * nothing edited in Payload is overwritten — but an intentional clear in the
 * admin would be undone, hence opt-in and listed separately as `+`.
 *
 * Dry run by default; writes only with --apply. Revalidation hooks are skipped
 * (`disableRevalidate`), so redeploy or revalidate after applying.
 * See openspec/changes/keystatic-to-payload-cutover.
 */

import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { getPayload, type Payload } from 'payload'
import { parse as parseYaml } from 'yaml'
import config from '../payload.config'
import type { Production } from '../payload-types'
import { toPayloadProduction, type AnyMap } from './production-mapping'

const LOCALES = ['ru', 'en', 'de'] as const
type Locale = (typeof LOCALES)[number]
const DIR = 'content/productions'
const FORK_POINT = '4e7497e'

type Tree = Record<string, unknown>
type Status = 'update' | 'already' | 'conflict' | 'fill'
interface FieldPlan {
  locale: Locale
  path: string
  status: Status
  base: unknown
  target: unknown
  current: unknown
}

function arg(name: string, fallback: string | null = null): string | null {
  // Accept `--name=value` and `--name value`.
  const argv = process.argv
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  if (hit) return hit.slice(name.length + 3)
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')
    ? argv[i + 1]
    : fallback
}

function gitShow(ref: string, file: string): string | null {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
  } catch {
    return null
  }
}

function listSlugs(ref: string): string[] {
  return execFileSync('git', ['ls-tree', '--name-only', `${ref}:${DIR}`], {
    encoding: 'utf8'
  })
    .split('\n')
    .filter((n) => n && !n.startsWith('.') && !n.startsWith('_'))
}

/** Keystatic writes bodies under identity/ (the field group's path) but left
 *  0-byte placeholders there for older entries whose real body is still at
 *  the root — so take the first NON-EMPTY of identity/, then root. */
function readBody(ref: string, slug: string, locale: Locale): string | null {
  const file = `body${locale[0].toUpperCase()}${locale.slice(1)}.mdx`
  for (const p of [
    `${DIR}/${slug}/identity/${file}`,
    `${DIR}/${slug}/${file}`
  ]) {
    const text = gitShow(ref, p)?.trim()
    if (text) return text
  }
  return null
}

function mapAt(ref: string, slug: string, locale: Locale): Tree | null {
  const yaml = gitShow(ref, `${DIR}/${slug}/index.yaml`)
  if (!yaml) return null
  return toPayloadProduction(
    parseYaml(yaml) as AnyMap,
    slug,
    locale,
    readBody(ref, slug, locale)
  ) as Tree
}

const isRichText = (v: unknown): v is { root: Tree } =>
  typeof v === 'object' && v !== null && 'root' in v

function richTextToPlain(node: unknown): string {
  const n = node as { text?: string; children?: unknown[]; type?: string }
  if (typeof n.text === 'string') return n.text
  const parts = (n.children ?? []).map(richTextToPlain)
  return parts.join(n.type === 'root' ? '\n\n' : '')
}

/** Canonical form for comparison: no row ids, trimmed strings, richText as
 *  plain text, and '' / [] / {} all collapse to null. */
function normalize(v: unknown): unknown {
  if (v == null) return null
  if (isRichText(v)) return normalize(richTextToPlain(v.root))
  // Collapse space runs too: a formatter-only change is not an editor edit.
  if (typeof v === 'string') return v.replace(/[ \t]+/g, ' ').trim() || null
  if (Array.isArray(v)) {
    const items = v.map(normalize)
    return items.length ? items : null
  }
  if (typeof v === 'object') {
    const out: Tree = {}
    for (const [k, val] of Object.entries(v)) {
      if (k === 'id') continue
      const n = normalize(val)
      if (n !== null) out[k] = n
    }
    return Object.keys(out).length ? out : null
  }
  return v
}

/** Stable JSON (sorted keys) so key order from YAML vs Postgres never matters. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  if (v && typeof v === 'object') {
    const keys = Object.keys(v).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stable((v as Tree)[k])}`).join(',')}}`
  }
  return JSON.stringify(v ?? null)
}
const same = (a: unknown, b: unknown): boolean => stable(a) === stable(b)

/** Leaf paths of a normalized tree. Arrays are leaves: rows are compared and
 *  written whole. */
function leaves(tree: unknown, prefix = '', out = new Map<string, unknown>()) {
  if (tree && typeof tree === 'object' && !Array.isArray(tree)) {
    for (const [k, v] of Object.entries(tree)) {
      leaves(v, prefix ? `${prefix}.${k}` : k, out)
    }
  } else if (prefix) {
    out.set(prefix, tree)
  }
  return out
}

const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o as Tree | null)?.[k], obj)

function setPath(obj: Tree, path: string, value: unknown): void {
  const keys = path.split('.')
  let cur = obj
  for (const k of keys.slice(0, -1)) {
    cur[k] = (cur[k] as Tree) ?? {}
    cur = cur[k] as Tree
  }
  cur[keys[keys.length - 1]] = value
}

/** Reuse row ids from the previous locale's write so localized sub-fields of
 *  array rows (e.g. gallery captions) attach to the same rows instead of
 *  replacing them. */
function attachIds(next: unknown, prev: unknown): unknown {
  if (Array.isArray(next) && Array.isArray(prev)) {
    return next.map((row, i) => attachIds(row, prev[i]))
  }
  if (next && typeof next === 'object' && prev && typeof prev === 'object') {
    const out: Tree = { ...(next as Tree) }
    const p = prev as Tree
    if (p.id != null && out.id == null) out.id = p.id
    for (const k of Object.keys(out)) out[k] = attachIds(out[k], p[k])
    return out
  }
  return next
}

async function findDoc(payload: Payload, slug: string, locale: Locale) {
  const res = await payload.find({
    collection: 'productions',
    where: { slug: { equals: slug } },
    locale,
    fallbackLocale: false,
    depth: 0,
    limit: 1
  })
  return (res.docs[0] as unknown as Tree | undefined) ?? null
}

function changedPaths(base: Tree | null, target: Tree): Map<string, unknown> {
  const b = leaves(normalize(base))
  const t = leaves(normalize(target))
  const out = new Map<string, unknown>()
  for (const p of new Set([...b.keys(), ...t.keys()])) {
    if (!same(b.get(p), t.get(p))) out.set(p, b.get(p) ?? null)
  }
  return out
}

async function planSlug(
  payload: Payload,
  slug: string,
  baseRef: string,
  targetRef: string,
  fillMissing: boolean
): Promise<{ create: boolean; fields: FieldPlan[] }> {
  const fields: FieldPlan[] = []
  let create = false
  for (const locale of LOCALES) {
    const target = mapAt(targetRef, slug, locale)
    if (!target) continue
    const diff = changedPaths(mapAt(baseRef, slug, locale), target)
    if (!diff.size && !fillMissing) continue
    const doc = await findDoc(payload, slug, locale)
    if (!doc) {
      create = true
      continue
    }
    const cur = leaves(normalize(doc))
    const tgt = leaves(normalize(target))
    for (const [path, base] of diff) {
      const current = cur.get(path) ?? null
      const t = tgt.get(path) ?? null
      const status: Status = same(current, t)
        ? 'already'
        : same(current, base)
          ? 'update'
          : 'conflict'
      fields.push({ locale, path, status, base, target: t, current })
    }
    if (!fillMissing) continue
    for (const [path, t] of tgt) {
      if (diff.has(path) || t === null || cur.get(path) != null) continue
      fields.push({
        locale,
        path,
        status: 'fill',
        base: t,
        target: t,
        current: null
      })
    }
  }
  return { create, fields }
}

async function applySlug(
  payload: Payload,
  slug: string,
  targetRef: string,
  plan: { create: boolean; fields: FieldPlan[] }
): Promise<void> {
  const ctx = { disableRevalidate: true }
  let prev: Tree | null = null
  let id: string | number | null = null
  for (const locale of LOCALES) {
    const raw = mapAt(targetRef, slug, locale)
    if (!raw) continue
    let data: Tree
    if (plan.create) {
      data = raw
    } else {
      data = {}
      for (const f of plan.fields) {
        if (
          f.locale === locale &&
          (f.status === 'update' || f.status === 'fill')
        ) {
          setPath(data, f.path, getPath(raw, f.path))
        }
      }
      if (!Object.keys(data).length) continue
    }
    if (prev) data = attachIds(data, prev) as Tree
    id ??= ((await findDoc(payload, slug, locale))?.id as string) ?? null
    prev = (id == null
      ? await payload.create({
          collection: 'productions',
          data: data as unknown as Production,
          locale,
          context: ctx
        })
      : await payload.update({
          collection: 'productions',
          id,
          data: data as Partial<Production>,
          locale,
          context: ctx
        })) as unknown as Tree
    id = prev.id as string | number
  }
}

const short = (v: unknown): string => {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s.length > 70 ? `${s.slice(0, 67)}…` : s
}

async function main(): Promise<void> {
  const baseRef = arg('base', FORK_POINT) as string
  const targetRef = arg('target', 'origin/main') as string
  const only = arg('slug')
  const apply = process.argv.includes('--apply')
  const fillMissing = process.argv.includes('--fill-missing')
  const payload = await getPayload({ config })

  const slugs = listSlugs(targetRef).filter((s) => !only || s === only)
  let conflicts = 0
  let writes = 0
  console.log(
    `Δ ${baseRef} → ${targetRef} (${slugs.length} slugs) ${apply ? 'APPLY' : 'dry run'}`
  )

  for (const slug of slugs) {
    const plan = await planSlug(payload, slug, baseRef, targetRef, fillMissing)
    const todo = plan.fields.filter(
      (f) => f.status === 'update' || f.status === 'fill'
    )
    const bad = plan.fields.filter((f) => f.status === 'conflict')
    if (!plan.create && !todo.length && !bad.length) continue

    console.log(`\n■ ${slug}${plan.create ? '  [CREATE]' : ''}`)
    for (const f of plan.fields) {
      if (f.status === 'already') continue
      const mark = { update: '~', fill: '+', conflict: '!', already: '=' }[
        f.status
      ]
      console.log(`  ${mark} ${f.locale} ${f.path}`)
      if (f.status === 'conflict') {
        console.log(`      base:    ${short(f.base)}`)
        console.log(`      payload: ${short(f.current)}`)
      }
      console.log(`      → ${short(f.target)}`)
    }
    conflicts += bad.length
    writes += todo.length + (plan.create ? 1 : 0)
    if (apply && (plan.create || todo.length)) {
      await applySlug(payload, slug, targetRef, plan)
      console.log('  ✓ written')
    }
  }

  console.log(
    `\n${writes} write(s), ${conflicts} conflict(s)${apply ? '' : ' — dry run, nothing written'}`
  )
  process.exit(conflicts && apply ? 2 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
