/**
 * scripts/fill-content.ts — apply a reviewed content patch to productions:
 * translation fixes for array rows (award names, press titles), whole
 * credits arrays, and per-locale fields researched from sources (year,
 * premiere date, theatre, synopsis).
 *
 *   npx tsx scripts/fill-content.ts <patch.json> [--apply]
 *
 * Patch shape (see scripts/data/content-fill-2026-10-08.json):
 *   rows:    { "recognition.awards": { <rowId>: { en: { name }, de: { name } } } }
 *   credits: { <slug>: { creditsRu?: Row[], creditsEn?: Row[], creditsDe?: Row[] } }
 *   fields:  { <slug>: { "*"|ru|en|de: { "production.year": 2021, ... } } }
 *   globals: { about: { ru: [["old phrase", "new phrase"]] } } — rich-text swaps
 * "*" holds non-localized fields. A field value { paragraphs: string[] } is
 * written as Lexical rich text. Rows match by id; a missing id is reported
 * and skipped. Unchanged values are not written.
 *
 * Dry run by default. Revalidation is skipped: revalidate the `productions`
 * tag after --apply.
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../payload.config'
import type { Production } from '../payload-types'

const LOCALES = ['ru', 'en', 'de'] as const
type Locale = (typeof LOCALES)[number]
type Row = Record<string, unknown>

type Patch = {
  rows?: Record<string, Record<string, Partial<Record<Locale, Row>>>>
  credits?: Record<string, Record<string, Row[]>>
  fields?: Record<string, Partial<Record<Locale | '*', Row>>>
  /** Phrase swaps inside a global's rich text: { about: { ru: [[from, to]] } } */
  globals?: Record<string, Partial<Record<Locale, [string, string][]>>>
}

const file = process.argv[2]
if (!file || file.startsWith('--')) {
  console.error('usage: npx tsx scripts/fill-content.ts <patch.json> [--apply]')
  process.exit(1)
}
const apply = process.argv.includes('--apply')
const patch = JSON.parse(readFileSync(file, 'utf8')) as Patch

const lexical = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      textStyle: '',
      children: [
        {
          type: 'text',
          mode: 'normal',
          text,
          style: '',
          detail: 0,
          format: 0,
          version: 1
        }
      ]
    }))
  }
})

const toValue = (v: unknown): unknown =>
  v && typeof v === 'object' && 'paragraphs' in v
    ? lexical((v as { paragraphs: string[] }).paragraphs)
    : v

const getPath = (o: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((x, k) => (x as Row | null)?.[k], o)

/** Immutable set of a dotted path; `base` supplies untouched siblings. */
const setPath = (data: Row, base: Row, path: string, value: unknown): Row => {
  const [head, ...rest] = path.split('.')
  if (!rest.length) return { ...data, [head]: value }
  const childData = (data[head] as Row | undefined) ?? {}
  const childBase = (base?.[head] as Row | undefined) ?? {}
  return {
    ...data,
    [head]: setPath(
      { ...childBase, ...childData },
      childBase,
      rest.join('.'),
      value
    )
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Paragraph texts of stored Lexical JSON: compare by text, not key order. */
const paragraphsOf = (v: unknown): string[] | null =>
  (
    v as { root?: { children?: { children?: { text?: string }[] }[] } }
  )?.root?.children?.map((p) =>
    (p.children ?? []).map((c) => c.text ?? '').join('')
  ) ?? null
const short = (v: unknown) =>
  (typeof v === 'string' ? v : (JSON.stringify(v) ?? 'null')).slice(0, 70)

const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'productions',
  depth: 0,
  limit: 500,
  pagination: false
})

let writes = 0
let changes = 0
for (const { id, slug } of docs) {
  for (const locale of LOCALES) {
    const doc = (await payload.findByID({
      collection: 'productions',
      id,
      locale,
      fallbackLocale: false,
      depth: 0
    })) as unknown as Row
    let data: Row = {}
    const log: string[] = []

    for (const [path, byId] of Object.entries(patch.rows ?? {})) {
      const rows = (getPath(doc, path) as Row[] | undefined) ?? []
      let changed = false
      const next = rows.map((row) => {
        const fix = byId[row.id as string]?.[locale]
        if (!fix) return row
        const merged = { ...row, ...fix }
        if (same(merged, row)) return row
        changed = true
        for (const k of Object.keys(fix))
          log.push(
            `  ${locale} ${path}#${row.id}.${k}: ${short(row[k])} → ${short(fix[k])}`
          )
        return merged
      })
      if (changed) data = setPath(data, doc, path, next)
    }

    const fields = patch.fields?.[slug as string]
    const scoped = {
      ...(fields?.[locale] ?? {}),
      ...(locale === 'ru' ? fields?.['*'] : {})
    }
    for (const [path, raw] of Object.entries(scoped)) {
      const value = toValue(raw)
      const old = getPath(doc, path)
      const isRich = !!raw && typeof raw === 'object' && 'paragraphs' in raw
      if (
        isRich
          ? same(
              paragraphsOf(old),
              (raw as { paragraphs: string[] }).paragraphs
            )
          : same(old, value)
      )
        continue
      log.push(`  ${locale} ${path}: ${short(old)} → ${short(raw)}`)
      data = setPath(data, doc, path, value)
    }

    const credits =
      locale === 'ru' ? patch.credits?.[slug as string] : undefined
    for (const [key, rows] of Object.entries(credits ?? {})) {
      const old = (getPath(doc, `team.${key}`) as Row[] | undefined) ?? []
      const strip = (r: Row[]) =>
        r.map(({ role, name, url }) => ({ role, name, url: url ?? null }))
      if (same(strip(old), strip(rows))) continue
      log.push(`  team.${key}: ${old.length} rows → ${rows.length} rows`)
      data = setPath(data, doc, `team.${key}`, rows)
    }

    if (!log.length) continue
    console.log(`■ ${slug} (${locale})\n${log.join('\n')}`)
    changes += log.length
    if (apply) {
      await payload.update({
        collection: 'productions',
        id,
        locale,
        data: data as Partial<Production>,
        context: { disableRevalidate: true }
      })
      writes++
    }
  }
}

type TextNode = { type?: string; text?: string; children?: TextNode[] }
const swapText = (node: TextNode, from: string, to: string): TextNode =>
  node.type === 'text' && node.text?.includes(from)
    ? { ...node, text: node.text.replace(from, to) }
    : node.children
      ? { ...node, children: node.children.map((c) => swapText(c, from, to)) }
      : node

for (const [slug, byLocale] of Object.entries(patch.globals ?? {})) {
  for (const locale of LOCALES) {
    const swaps = byLocale[locale]
    if (!swaps?.length) continue
    const doc = (await payload.findGlobal({
      slug: slug as 'about',
      locale,
      fallbackLocale: false,
      depth: 0
    })) as unknown as Row
    const body = doc.body as { root: TextNode } | null
    if (!body) continue
    let root = body.root
    for (const [from, to] of swaps) {
      const text = JSON.stringify(root)
      if (text.includes(JSON.stringify(to).slice(1, -1))) continue
      if (!text.includes(JSON.stringify(from).slice(1, -1))) {
        console.log(
          `  ! ${slug} (${locale}): phrase not found — ${from.slice(0, 50)}`
        )
        continue
      }
      root = swapText(root, from, to)
      console.log(`■ ${slug} (${locale})\n  body: ${from} → ${to}`)
      changes++
    }
    if (apply && root !== body.root) {
      await payload.updateGlobal({
        slug: slug as 'about',
        locale,
        data: { body: { ...body, root } } as never,
        context: { disableRevalidate: true }
      })
      writes++
    }
  }
}

const seen = new Set<string>()
for (const d of docs) {
  const doc = d as unknown as Row
  for (const path of Object.keys(patch.rows ?? {}))
    for (const r of (getPath(doc, path) as Row[] | undefined) ?? [])
      seen.add(String(r.id))
}
for (const byId of Object.values(patch.rows ?? {}))
  for (const rowId of Object.keys(byId))
    if (!seen.has(rowId)) console.log(`  ! row ${rowId} not found — skipped`)
for (const slug of [
  ...Object.keys(patch.fields ?? {}),
  ...Object.keys(patch.credits ?? {})
])
  if (!docs.some((d) => d.slug === slug))
    console.log(`  ! slug ${slug} not found — skipped`)

console.log(
  `\n${changes} change(s)${apply ? `, ${writes} write(s)` : ' — dry run, nothing written'}`
)
process.exit(0)
