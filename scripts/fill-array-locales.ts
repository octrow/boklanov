/**
 * scripts/fill-array-locales.ts — restore localized sub-fields of array rows
 * (press titles, award names, gallery captions, tour cities) that the seed
 * lost: it wrote ru → en → de without row ids, so every write replaced the
 * rows and only DE survived. port-content-delta compares arrays whole, so it
 * never saw these as missing.
 *
 *   npx tsx scripts/fill-array-locales.ts [--ref=cd228b1] [--slug=<slug>] [--apply]
 *
 * Source: the last Keystatic YAML on `main` (cd228b1, frozen at cutover).
 * Rows are matched by index and only when the row counts agree. Only empty
 * localized keys are filled; anything already set in Payload is left alone.
 * Dry run by default. Revalidation is skipped: revalidate the `productions`
 * tag after --apply.
 */

import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { getPayload, type Payload } from 'payload'
import { parse as parseYaml } from 'yaml'
import config from '../payload.config'
import type { Production } from '../payload-types'
import { toPayloadProduction, type AnyMap } from './production-mapping'

const DIR = 'content/productions'
const LOCALES = ['ru', 'en', 'de'] as const
type Locale = (typeof LOCALES)[number]
type Row = Record<string, unknown>

// group.array → localized keys inside each row
const ARRAYS: Record<string, string[]> = {
  'media.gallery': ['caption'],
  'recognition.awards': ['name', 'category', 'city'],
  'recognition.press': ['title'],
  'history.tour': ['city']
}

const argOf = (name: string): string | null =>
  process.argv
    .find((a) => a.startsWith(`--${name}=`))
    ?.slice(name.length + 3) ?? null

const git = (args: string[]): string | null => {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
  } catch {
    return null
  }
}

const empty = (v: unknown): boolean =>
  v == null || (typeof v === 'string' && v.trim() === '')

const getPath = (o: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((x, k) => (x as Row | null)?.[k], o)

async function findDoc(
  payload: Payload,
  slug: string,
  locale: Locale
): Promise<Row | null> {
  const res = await payload.find({
    collection: 'productions',
    where: { slug: { equals: slug } },
    locale,
    fallbackLocale: false,
    depth: 0,
    limit: 1
  })
  return (res.docs[0] as unknown as Row) ?? null
}

/** Per locale: the update payload ({group: {array: rows}}) and a log of fills. */
function plan(doc: Row, source: Row, slug: string, locale: Locale) {
  const data: Row = {}
  const log: string[] = []
  for (const [path, keys] of Object.entries(ARRAYS)) {
    const cur = (getPath(doc, path) as Row[] | undefined) ?? []
    const src = (getPath(source, path) as Row[] | undefined) ?? []
    if (!cur.length || !src.length) continue
    if (cur.length !== src.length) {
      log.push(
        `  ! ${locale} ${path}: ${cur.length} rows in Payload vs ${src.length} in YAML — skipped`
      )
      continue
    }
    let changed = false
    const rows = cur.map((row, i) => {
      const next = { ...row }
      for (const k of keys) {
        if (empty(row[k]) && !empty(src[i][k])) {
          next[k] = src[i][k]
          changed = true
          log.push(
            `  + ${locale} ${path}.${i}.${k} → ${String(src[i][k]).slice(0, 60)}`
          )
        }
      }
      return next
    })
    if (changed) {
      const [group, arr] = path.split('.')
      data[group] = { ...((data[group] as Row) ?? {}), [arr]: rows }
    }
  }
  return { data, log, slug }
}

async function main(): Promise<void> {
  const ref = argOf('ref') ?? 'cd228b1'
  const only = argOf('slug')
  const apply = process.argv.includes('--apply')
  const payload = await getPayload({ config })
  const slugs = (git(['ls-tree', '--name-only', `${ref}:${DIR}`]) ?? '')
    .split('\n')
    .filter(
      (n) =>
        n && !n.startsWith('.') && !n.startsWith('_') && (!only || n === only)
    )

  let fills = 0
  for (const slug of slugs) {
    const yaml = git(['show', `${ref}:${DIR}/${slug}/index.yaml`])
    if (!yaml) continue
    const parsed = parseYaml(yaml) as AnyMap
    for (const locale of LOCALES) {
      const doc = await findDoc(payload, slug, locale)
      if (!doc) continue
      const source = toPayloadProduction(parsed, slug, locale, null) as Row
      const p = plan(doc, source, slug, locale)
      if (!p.log.length) continue
      console.log(`■ ${slug}\n${p.log.join('\n')}`)
      fills += p.log.filter((l) => l.startsWith('  +')).length
      if (apply && Object.keys(p.data).length) {
        await payload.update({
          collection: 'productions',
          id: doc.id as string | number,
          data: p.data as Partial<Production>,
          locale,
          context: { disableRevalidate: true }
        })
      }
    }
  }
  console.log(
    `\n${fills} fill(s)${apply ? ' written' : ' — dry run, nothing written'}`
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
