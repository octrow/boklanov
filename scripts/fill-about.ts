/**
 * scripts/fill-about.ts — fill the empty About sections (timeline, lineage,
 * margin notes) from a sourced JSON file (review №3, п. 4).
 *
 *   npx tsx scripts/fill-about.ts scripts/data/about-2026-10-09.json [--apply]
 *
 * Only empty sections are written; a section that already has rows is left
 * alone. Rows are created with the RU write, then EN/DE are written against
 * the same row ids (writing locales without ids would replace the rows).
 * Dry run by default. Revalidation is skipped: revalidate the `about` tag
 * after --apply.
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../payload.config'

type Locale = 'ru' | 'en' | 'de'
type L10n = Record<Locale, string>
type Row = Record<string, unknown>

type Patch = {
  milestones?: Array<{ year: number; label: L10n }>
  lineage?: Array<{
    key: string
    name: L10n
    role: L10n
    institution?: L10n
    note?: L10n
  }>
  marginalia?: Array<{ note: L10n }>
}
type Section = keyof Patch

const SECTIONS: Section[] = ['milestones', 'lineage', 'marginalia']

/** One locale's view of a row: localized {ru,en,de} objects → that string. */
const inLocale = (row: Row, locale: Locale): Row =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k,
      v && typeof v === 'object' && 'ru' in v ? (v as L10n)[locale] : v
    ])
  )

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('usage: fill-about.ts <patch.json> [--apply]')
  const apply = process.argv.includes('--apply')
  const patch = JSON.parse(readFileSync(file, 'utf8')) as Patch
  const payload = await getPayload({ config })

  const current = (await payload.findGlobal({
    slug: 'about',
    locale: 'ru',
    depth: 0
  })) as unknown as Record<Section, Row[] | undefined>

  const todo = SECTIONS.filter((s) => {
    const rows = patch[s]
    if (!rows?.length) return false
    if (current[s]?.length) {
      console.log(`  kept ${s}: already has ${current[s]?.length} row(s)`)
      return false
    }
    console.log(`■ ${s}: ${rows.length} row(s)`)
    for (const r of rows)
      console.log(`    ${JSON.stringify(inLocale(r, 'ru'))}`)
    return true
  })

  if (!apply || todo.length === 0) {
    console.log(`\n${todo.length} section(s) — dry run, nothing written`)
    process.exit(0)
  }

  const rowsOf = (locale: Locale, ids?: Record<Section, Row[]>) =>
    Object.fromEntries(
      todo.map((s) => [
        s,
        (patch[s] as Row[]).map((r, i) => ({
          ...inLocale(r, locale),
          ...(ids ? { id: ids[s][i].id } : {})
        }))
      ])
    )
  await payload.updateGlobal({
    slug: 'about',
    locale: 'ru',
    data: rowsOf('ru'),
    depth: 0,
    context: { disableRevalidate: true }
  })
  const ids = (await payload.findGlobal({
    slug: 'about',
    locale: 'ru',
    depth: 0
  })) as unknown as Record<Section, Row[]>
  for (const locale of ['en', 'de'] as const) {
    await payload.updateGlobal({
      slug: 'about',
      locale,
      data: rowsOf(locale, ids),
      depth: 0,
      context: { disableRevalidate: true }
    })
  }
  console.log('  wrote ru, en, de')
  console.log(`\n${todo.length} section(s) written`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
