/**
 * scripts/restore-production-richtext.ts
 *
 * One-shot data restore: populate `productions_locales.identity_body`,
 * `identity_tagline`, `identity_synopsis`, `identity_directors_note`
 * for all 54 productions × 3 locales from the canonical source on the
 * `main` branch.
 *
 * Background — why this exists (PAYLOAD_ADMIN_UX_PLAN.md §Round-5):
 *   - On `feature/payloadcms`, `content/productions/` was retired in
 *     commit eaf5a37 after the original seed was supposed to have
 *     populated Payload's Postgres. But `scripts/seed-payload.ts`
 *     passes raw strings for tagline/synopsis/directorsNote/body to
 *     Payload's create() — those columns are typed `richText` (jsonb
 *     SerializedEditorState) and Payload silently dropped the writes,
 *     leaving all 648 cells NULL.
 *   - The companion fix `fix(seed)…` (commit 3a5e0e1) added a
 *     `bodyToLexical()` helper but only wired it through About; the
 *     four Production fields were missed.
 *
 * Strategy:
 *   - Read each production's YAML + `bodyRu.mdx`/`bodyEn.mdx`/`bodyDe.mdx`
 *     from the `main` branch via `git show main:<path>` (no working-
 *     tree checkout needed — feature/payloadcms keeps `content/`
 *     retired). Idempotent — re-running is safe.
 *   - Convert each plain-text value to a minimal Lexical
 *     SerializedEditorState (paragraphs split on blank lines), matching
 *     `scripts/migrate-about-body-to-lexical.ts`'s `stringToLexical`.
 *   - UPDATE `productions_locales` rows directly via the pg client.
 *     Bypasses the Payload Local API because (a) we don't want
 *     hooks/validators firing on a bulk backfill and (b) the rows
 *     already exist — this is a column-level fill, not a doc create.
 *
 * Run:   npx tsx scripts/restore-production-richtext.ts --dry-run
 *        npx tsx scripts/restore-production-richtext.ts
 */

import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { parse as parseYaml } from 'yaml'
import pg from 'pg'

const DRY_RUN = process.argv.includes('--dry-run')
const SOURCE_REF = 'main'
const LOCALES = ['ru', 'en', 'de'] as const
type Locale = (typeof LOCALES)[number]

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

function listSlugs(): string[] {
  const out = execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', SOURCE_REF, 'content/productions/'],
    { encoding: 'utf-8' }
  )
  const slugs = new Set<string>()
  for (const line of out.split('\n')) {
    const m = line.match(/^content\/productions\/([^/]+)\//)
    if (m) slugs.add(m[1])
  }
  return [...slugs].sort()
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

type IdentityFields = {
  tagline: Record<Locale, string | null>
  synopsis: Record<Locale, string | null>
  directorsNote: Record<Locale, string | null>
  body: Record<Locale, string | null>
}

function emptyByLocale(): Record<Locale, string | null> {
  return { ru: null, en: null, de: null }
}

function pickLocaleString(v: unknown, locale: Locale): string | null {
  if (v == null || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const x = o[locale]
  return typeof x === 'string' ? x : null
}

function readIdentity(slug: string): IdentityFields {
  const yamlText = gitShow(`content/productions/${slug}/index.yaml`)
  const out: IdentityFields = {
    tagline: emptyByLocale(),
    synopsis: emptyByLocale(),
    directorsNote: emptyByLocale(),
    body: emptyByLocale()
  }
  if (yamlText) {
    const parsed = parseYaml(yamlText) as { identity?: Record<string, unknown> }
    const id = parsed?.identity ?? {}
    for (const loc of LOCALES) {
      out.tagline[loc] = pickLocaleString(id.tagline, loc)
      out.synopsis[loc] = pickLocaleString(id.synopsis, loc)
      out.directorsNote[loc] = pickLocaleString(id.directorsNote, loc)
    }
  }
  // bodyRu/En/De.mdx → plain text body per locale. Files may be missing.
  for (const loc of LOCALES) {
    const cap = loc === 'ru' ? 'Ru' : loc === 'en' ? 'En' : 'De'
    out.body[loc] = gitShow(`content/productions/${slug}/body${cap}.mdx`)
  }
  return out
}

type Stats = {
  converted: number
  skippedExisting: number
  missingSource: number
}

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  console.log(`Connected${DRY_RUN ? ' (dry-run)' : ''}.`)

  const slugs = listSlugs()
  console.log(`Found ${slugs.length} production slugs on ${SOURCE_REF}.`)

  // Map slug → DB row id for productions table.
  const { rows: prodRows } = await client.query<{ id: number; slug: string }>(
    `SELECT id, slug FROM productions`
  )
  const idBySlug = new Map(prodRows.map((r) => [r.slug, r.id]))

  const stats: Stats = { converted: 0, skippedExisting: 0, missingSource: 0 }
  const missingSlugs: string[] = []

  for (const slug of slugs) {
    const parentId = idBySlug.get(slug)
    if (parentId == null) {
      console.warn(`  ! ${slug}: no row in productions — skip`)
      missingSlugs.push(slug)
      continue
    }
    const src = readIdentity(slug)

    for (const locale of LOCALES) {
      const patch: Record<string, string | null> = {}
      const fields: Array<
        [
          (
            | 'identity_body'
            | 'identity_tagline'
            | 'identity_synopsis'
            | 'identity_directors_note'
          ),
          keyof IdentityFields
        ]
      > = [
        ['identity_body', 'body'],
        ['identity_tagline', 'tagline'],
        ['identity_synopsis', 'synopsis'],
        ['identity_directors_note', 'directorsNote']
      ]

      // What's already in the DB? Skip non-null cells (idempotent).
      const { rows: existing } = await client.query(
        `SELECT identity_body, identity_tagline, identity_synopsis, identity_directors_note
         FROM productions_locales
         WHERE _parent_id = $1 AND _locale = $2`,
        [parentId, locale]
      )
      if (existing.length === 0) {
        // No locale row yet — Payload's auto-migrator should have created it.
        // Insert a stub so the UPDATE below has somewhere to land.
        console.warn(`  ! ${slug}/${locale}: no _locale row, skipping`)
        continue
      }
      const row = existing[0] as Record<string, unknown>

      for (const [col, key] of fields) {
        if (row[col] != null) {
          stats.skippedExisting += 1
          continue
        }
        const lex = stringToLexical(src[key][locale])
        if (lex === null) {
          stats.missingSource += 1
          continue
        }
        patch[col] = JSON.stringify(lex)
      }

      if (Object.keys(patch).length === 0) continue

      const cols = Object.keys(patch)
      const setClause = cols.map((c, i) => `${c} = $${i + 1}::jsonb`).join(', ')
      const values = cols.map((c) => patch[c])

      if (DRY_RUN) {
        console.log(`  [dry] ${slug}/${locale} → ${cols.join(', ')}`)
      } else {
        await client.query(
          `UPDATE productions_locales SET ${setClause}
           WHERE _parent_id = $${cols.length + 1} AND _locale = $${cols.length + 2}`,
          [...values, parentId, locale]
        )
        console.log(`  ✓  ${slug}/${locale} → ${cols.join(', ')}`)
      }
      stats.converted += cols.length
    }
  }

  console.log(
    `\nDone. converted=${stats.converted} skipped-existing=${stats.skippedExisting} no-source=${stats.missingSource}`
  )
  if (missingSlugs.length) {
    console.log(`Slugs in main but missing in DB: ${missingSlugs.join(', ')}`)
  }
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
