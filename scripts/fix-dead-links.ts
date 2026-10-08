/**
 * scripts/fix-dead-links.ts — swap dead external links for their Wayback
 * Machine snapshots in every column that stores a URL.
 *
 *   npx tsx scripts/fix-dead-links.ts <map.tsv> [--apply]
 *
 * map.tsv: `<dead url>\t<replacement>[\t<table.column>]` per line,
 * exact-match on the stored value. Replacement is a Wayback snapshot, any
 * https URL (e.g. the theatre's home page), or `-` to clear the link (the
 * site then shows the name as text). The optional third column limits the
 * line to one column. Dry run by default: prints per-column hit counts and any
 * map line that matches nothing. --apply writes all of it in one
 * transaction. Revalidation is skipped: revalidate the `productions` tag
 * after --apply.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import pg from 'pg'

const URL_COLUMNS = [
  ['productions', 'production_theatre_url'],
  ['productions', 'production_tickets_url'],
  ['productions', 'settings_booking_cta_url'],
  ['productions_recognition_awards', 'url'],
  ['productions_recognition_external_links', 'url'],
  ['productions_recognition_press', 'url'],
  ['productions_team_credits_en', 'url'],
  ['productions_team_credits_de', 'url'],
  ['productions_team_credits_ru', 'url']
] as const

const [mapPath, flag] = process.argv.slice(2)
if (!mapPath) throw new Error('usage: fix-dead-links.ts <map.tsv> [--apply]')
const apply = flag === '--apply'

const dbUrl = process.env.DATABASE_URL ?? ''
// Same guard as payload.config.ts: prod only on purpose.
if (dbUrl.includes('neon.tech') && process.env.ALLOW_PROD_DB !== '1') {
  throw new Error('DATABASE_URL is production Neon; set ALLOW_PROD_DB=1')
}

const pairs = readFileSync(mapPath, 'utf8')
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => {
    const [from, to, only] = l.split('\t')
    if (!from || !(to === '-' || to?.startsWith('https://'))) {
      throw new Error(`bad map line: ${l}`)
    }
    if (only && !URL_COLUMNS.some(([t, c]) => `${t}.${c}` === only)) {
      throw new Error(`unknown column in map line: ${l}`)
    }
    return { from, to: to === '-' ? null : to, only }
  })

const client = new pg.Client({ connectionString: dbUrl })
await client.connect()
try {
  await client.query('BEGIN')
  const hitsByLine = new Map(pairs.map((p) => [p, 0]))
  let total = 0
  for (const [table, col] of URL_COLUMNS) {
    let colHits = 0
    for (const p of pairs) {
      if (p.only && p.only !== `${table}.${col}`) continue
      // Identifiers come from the fixed list above, values are parameters.
      const { rowCount } = await client.query(
        `UPDATE "${table}" SET "${col}" = $2 WHERE "${col}" = $1`,
        [p.from, p.to]
      )
      colHits += rowCount ?? 0
      hitsByLine.set(p, (hitsByLine.get(p) ?? 0) + (rowCount ?? 0))
    }
    if (colHits) console.log(`${table}.${col}: ${colHits}`)
    total += colHits
  }
  for (const [p, n] of hitsByLine) {
    if (!n)
      console.log(`  ! no match: ${p.from}${p.only ? ` (${p.only})` : ''}`)
  }
  await client.query(apply ? 'COMMIT' : 'ROLLBACK')
  console.log(`${total} change(s)${apply ? ' written' : ' (dry run)'}`)
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  await client.end()
}
