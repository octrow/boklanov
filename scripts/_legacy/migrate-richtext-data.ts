/**
 * scripts/migrate-richtext-data.ts
 *
 * One-shot migration: convert plain-string values in
 *   productions_locales.identity_tagline
 *   productions_locales.identity_synopsis
 *   productions_locales.identity_directors_note
 *   productions_locales.identity_body
 * into Lexical `SerializedEditorState` JSON, so Payload's auto-migrator
 * can promote the columns from `character varying` to `jsonb` and the
 * /admin Lexical editor can mount them.
 *
 * Run with:  npx tsx scripts/migrate-richtext-data.ts
 *            npx tsx scripts/migrate-richtext-data.ts --dry-run
 *
 * Why raw SQL (not Payload Local API): the column-type change blocks
 * `payload init` itself — `pushDevSchema` aborts with "could not convert
 * character varying to jsonb" before any Payload code can run. We have
 * to seed valid JSON into the existing varchar columns FIRST, then let
 * Payload re-apply the schema (which becomes a no-op cast).
 *
 * Idempotent — rows whose value already parses as a Lexical state object
 * are left alone. Safe to re-run after partial completion.
 */

import 'dotenv/config'
import pg from 'pg'

const dryRun = process.argv.includes('--dry-run')

/** Minimal Lexical SerializedEditorState wrapping plain text. Splits on
 *  blank lines so a multi-paragraph markdoc string becomes multiple
 *  paragraph nodes. */
function stringToLexical(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter((p) => p.length > 0)

  const children =
    paragraphs.length === 0
      ? [paragraphNode('')]
      : paragraphs.map((p) => paragraphNode(p))

  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children
    }
  }
}

function paragraphNode(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children: text
      ? [
          {
            type: 'text',
            version: 1,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text
          }
        ]
      : []
  }
}

/** Already a serialized Lexical state? Detect by attempting JSON.parse
 *  and probing for `root.children`. */
function isLexicalString(s: string): boolean {
  if (!s.startsWith('{')) return false
  try {
    const v = JSON.parse(s) as { root?: { children?: unknown } }
    return Array.isArray(v?.root?.children)
  } catch {
    return false
  }
}

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  console.log(`Connected. ${dryRun ? '(dry-run)' : ''}`)

  const FIELDS = [
    'identity_tagline',
    'identity_synopsis',
    'identity_directors_note',
    'identity_body'
  ] as const

  const { rows } = await client.query<
    Record<(typeof FIELDS)[number], string | null> & {
      id: number
      _locale: string
    }
  >(
    `SELECT id, _locale, ${FIELDS.join(', ')}
     FROM productions_locales
     WHERE ${FIELDS.map((f) => `${f} IS NOT NULL`).join(' OR ')}
     ORDER BY id, _locale`
  )

  console.log(`Scanning ${rows.length} locale rows.`)

  let converted = 0
  let alreadyJson = 0
  let untouched = 0

  for (const row of rows) {
    const patch: Record<string, string> = {}

    for (const field of FIELDS) {
      const value = row[field]
      if (!value) continue
      if (isLexicalString(value)) {
        alreadyJson += 1
      } else {
        patch[field] = JSON.stringify(stringToLexical(value))
      }
    }

    if (Object.keys(patch).length === 0) {
      untouched += 1
      continue
    }

    if (dryRun) {
      console.log(
        `  [dry] id=${row.id} locale=${row._locale} → ${Object.keys(patch).join(', ')}`
      )
    } else {
      const cols = Object.keys(patch)
      const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ')
      const values = cols.map((c) => patch[c])
      await client.query(
        `UPDATE productions_locales SET ${setClause} WHERE id = $${cols.length + 1} AND _locale = $${cols.length + 2}`,
        [...values, row.id, row._locale]
      )
      console.log(
        `  ✓   id=${row.id} locale=${row._locale} → ${cols.join(', ')}`
      )
    }
    converted += 1
  }

  console.log(
    `\nDone. converted=${converted} already-json=${alreadyJson} no-op=${untouched}`
  )
  await client.end()
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
