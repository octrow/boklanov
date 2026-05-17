/**
 * scripts/migrate-about-body-to-lexical.ts
 *
 * One-shot migration: convert `about_locales.body` from plain text /
 * markdoc to a Lexical `SerializedEditorState` JSON string, so Payload's
 * auto-migrator can promote the column from `character varying` to `jsonb`
 * and the /admin Lexical editor can mount it.
 *
 * Run with:  npx tsx scripts/migrate-about-body-to-lexical.ts
 *            npx tsx scripts/migrate-about-body-to-lexical.ts --dry-run
 *
 * Same approach as scripts/_legacy/migrate-richtext-data.ts (productions).
 * Idempotent — rows whose value already parses as a Lexical state object
 * are left alone. Safe to re-run.
 */

import 'dotenv/config'
import pg from 'pg'

const dryRun = process.argv.includes('--dry-run')

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

  const { rows } = await client.query<{
    id: number
    _locale: string
    body: string | null
  }>(
    `SELECT id, _locale, body
     FROM about_locales
     WHERE body IS NOT NULL
     ORDER BY id, _locale`
  )

  console.log(`Scanning ${rows.length} locale row(s).`)

  let converted = 0
  let alreadyJson = 0
  let untouched = 0

  for (const row of rows) {
    const value = row.body
    if (!value) {
      untouched += 1
      continue
    }
    if (isLexicalString(value)) {
      alreadyJson += 1
      continue
    }

    const lexical = JSON.stringify(stringToLexical(value))

    if (dryRun) {
      console.log(
        `  [dry] id=${row.id} locale=${row._locale} → ${value.length} chars → ${lexical.length} chars Lexical JSON`
      )
    } else {
      await client.query(
        `UPDATE about_locales SET body = $1 WHERE id = $2 AND _locale = $3`,
        [lexical, row.id, row._locale]
      )
      console.log(`  ✓   id=${row.id} locale=${row._locale}`)
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
