/**
 * scripts/migrate-about-to-keystatic.ts
 *
 * Folds legacy content/about/<locale>.yaml data into the inline frontmatter
 * of content/about/<locale>.mdx (Keystatic singleton format), preserving any
 * recently-edited fields already in the .mdx (e.g. `portrait.src`).
 *
 * After this script:
 *   content/about/<locale>.yaml — DELETED (no longer the source of truth)
 *   content/about/<locale>.mdx  — has full YAML frontmatter at top
 *
 * The about page reader (app/[locale]/about/page.tsx) prefers .mdx
 * frontmatter, so this migration aligns disk state with what the reader
 * expects and what Keystatic Cloud writes back.
 *
 * Idempotent: running twice is a no-op.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { parseDocument, parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const ABOUT_DIR = path.resolve(process.cwd(), 'content', 'about')

function splitFrontmatter(raw: string): {
  data: Record<string, unknown> | null
  body: string
} {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: null, body: raw }
  return {
    data: (parseYaml(m[1]) ?? {}) as Record<string, unknown>,
    body: m[2]
  }
}

/** Merge: prefer non-empty inline value over legacy yaml. */
function isMeaningful(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (Array.isArray(v) && v.length === 0) return false
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).some(isMeaningful)
  }
  if (typeof v === 'string' && v.trim() === '') return false
  return true
}

function mergeFrontmatter(
  inline: Record<string, unknown>,
  legacy: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...legacy }
  for (const [k, v] of Object.entries(inline)) {
    if (isMeaningful(v) || !(k in legacy)) out[k] = v
  }
  return out
}

function processLocale(locale: 'ru' | 'en' | 'de'): boolean {
  const mdxPath = path.join(ABOUT_DIR, `${locale}.mdx`)
  const yamlPath = path.join(ABOUT_DIR, `${locale}.yaml`)

  if (!fs.existsSync(mdxPath)) {
    console.log(`  ${locale}: no .mdx, skipping`)
    return false
  }

  const raw = fs.readFileSync(mdxPath, 'utf8')
  const { data: inline, body } = splitFrontmatter(raw)

  // If the .mdx already has frontmatter and the .yaml is gone, we're done.
  if (inline && !fs.existsSync(yamlPath)) {
    console.log(`  ${locale}: already migrated`)
    return false
  }

  const legacy = fs.existsSync(yamlPath)
    ? ((parseYaml(fs.readFileSync(yamlPath, 'utf8')) ?? {}) as Record<
        string,
        unknown
      >)
    : {}

  const merged = mergeFrontmatter(inline ?? {}, legacy)

  // parseDocument round-trips formatting / preserves Unicode quoting better
  // than stringify alone, but stringify is fine here since we're rewriting.
  const fmYaml = stringifyYaml(merged, { lineWidth: 0 })
  const newRaw = `---\n${fmYaml.trimEnd()}\n---\n${body.trimStart()}\n`

  fs.writeFileSync(mdxPath, newRaw, 'utf8')
  if (fs.existsSync(yamlPath)) fs.unlinkSync(yamlPath)
  console.log(`  ${locale}: merged + removed ${locale}.yaml`)
  return true
}

function main() {
  if (!fs.existsSync(ABOUT_DIR)) {
    console.error(`No about dir at ${ABOUT_DIR}`)
    process.exit(1)
  }
  console.log('Migrating content/about/<locale>.{yaml,mdx} → single .mdx with frontmatter\n')
  let n = 0
  for (const loc of ['ru', 'en', 'de'] as const) {
    if (processLocale(loc)) n++
  }
  console.log(`\nDone. ${n} locale(s) migrated.`)
}

main()

// Suppress unused-import warning; parseDocument may be useful for callers.
void parseDocument
