/**
 * scripts/restore-about-body.ts
 *
 * One-shot data restore: ensure `about_locales` has a row for every
 * locale with the canonical body content from `main`. Sibling of
 * `scripts/restore-production-richtext.ts` — same idea, different
 * table.
 *
 * Why this exists: the original About migration
 * (`scripts/migrate-about-body-to-lexical.ts`) converted whatever was
 * already in `about_locales.body` from varchar to jsonb. But at the
 * time only the EN row existed (the default-locale write); RU + DE
 * locale rows were never created because `payload.updateGlobal({…},
 * locale: 'ru')` with no `body` in the payload skipped the insert.
 *
 * Audit (`SELECT _locale FROM about_locales`) returned only `en`.
 * Result: admin shows About body as empty when switched to RU or DE.
 *
 * Strategy:
 *   - Read `content/about/bio/body{Ru,En,De}.mdx` from the `main`
 *     branch via `git show`.
 *   - Convert to a minimal Lexical SerializedEditorState (matches
 *     `scripts/migrate-about-body-to-lexical.ts §stringToLexical`).
 *   - For each locale: UPDATE if a row exists with NULL body,
 *     otherwise INSERT a fresh row. Idempotent — rows with existing
 *     non-null body are left alone.
 *
 * Run:   npx tsx scripts/restore-about-body.ts --dry-run
 *        npx tsx scripts/restore-about-body.ts
 */

import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import pg from 'pg'

const DRY_RUN = process.argv.includes('--dry-run')
const SOURCE_REF = 'main'
const LOCALES = ['ru', 'en', 'de'] as const

function gitShow(path: string): string | null {
  try {
    return execFileSync('git', ['show', `${SOURCE_REF}:${path}`], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch {
    return null
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

function stringToLexical(raw: string | null | undefined) {
  if (!raw) return null
  const text = raw.trim()
  if (!text) return null
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter((p) => p.length > 0)
  const children =
    paragraphs.length === 0
      ? [paragraphNode('')]
      : paragraphs.map(paragraphNode)
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

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  console.log(`Connected${DRY_RUN ? ' (dry-run)' : ''}.`)

  // There's only one About global, parent id = 1 by Payload's convention.
  // Confirm it.
  const { rows: parent } = await client.query<{ id: number }>(
    `SELECT id FROM about ORDER BY id LIMIT 1`
  )
  if (parent.length === 0) {
    throw new Error('about table has no row — global never created')
  }
  const parentId = parent[0].id

  let converted = 0
  let skipped = 0
  for (const locale of LOCALES) {
    const cap = locale === 'ru' ? 'Ru' : locale === 'en' ? 'En' : 'De'
    const source = gitShow(`content/about/bio/body${cap}.mdx`)
    if (!source) {
      console.warn(`  ! no source content/about/bio/body${cap}.mdx`)
      continue
    }
    const lex = stringToLexical(source)
    if (!lex) {
      console.warn(`  ! body${cap}.mdx parsed to empty Lexical`)
      continue
    }

    const { rows: existing } = await client.query<{
      id: number
      body: unknown
    }>(
      `SELECT id, body FROM about_locales
       WHERE _parent_id = $1 AND _locale = $2::_locales`,
      [parentId, locale]
    )

    const payload = JSON.stringify(lex)
    if (existing.length === 0) {
      if (DRY_RUN) {
        console.log(
          `  [dry] INSERT about_locales (${locale}) → ${payload.length} chars`
        )
      } else {
        await client.query(
          `INSERT INTO about_locales (_parent_id, _locale, body)
           VALUES ($1, $2::_locales, $3::jsonb)`,
          [parentId, locale, payload]
        )
        console.log(`  ✓ INSERT ${locale}`)
      }
      converted += 1
    } else if (existing[0].body == null) {
      if (DRY_RUN) {
        console.log(
          `  [dry] UPDATE about_locales (${locale}) → ${payload.length} chars`
        )
      } else {
        await client.query(
          `UPDATE about_locales SET body = $1::jsonb WHERE id = $2`,
          [payload, existing[0].id]
        )
        console.log(`  ✓ UPDATE ${locale}`)
      }
      converted += 1
    } else {
      skipped += 1
      console.log(`  · ${locale} already has body — skip`)
    }
  }

  console.log(`\nDone. converted=${converted} skipped-existing=${skipped}`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
