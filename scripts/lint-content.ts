/**
 * lint-content.ts - fails the build if any content/*.md file contains
 * Obsidian-flavoured ![[wikilink]] syntax. Roman's vault config sets
 * useMarkdownLinks:true to prevent this, but this linter is the CI safety net.
 *
 * Usage: tsx scripts/lint-content.ts  (npm run lint-content)
 */
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const CONTENT_DIR = join(process.cwd(), 'content')
const WIKILINK = /!\[\[.+?\]\]/

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? files(join(dir, e.name))
      : e.name.endsWith('.md')
        ? [join(dir, e.name)]
        : []
  )
}

let errors = 0
const all = files(CONTENT_DIR)
for (const f of all) {
  const text = readFileSync(f, 'utf8')
  if (WIKILINK.test(text)) {
    console.error(
      `[lint-content] Obsidian wikilink found in ${f.replace(process.cwd(), '.')}`
    )
    console.error(
      '  Fix: use standard markdown  ![alt](./image.jpg)  instead of  ![[image.jpg]]'
    )
    errors++
  }
}

if (errors > 0) process.exit(1)
console.log(`[lint-content] OK - ${all.length} files checked, 0 wikilinks`)
