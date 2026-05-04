/**
 * lint-mdx.ts - fails the build if any content file contains Obsidian-flavoured
 * ![[wikilink]] syntax. Roman's vault config sets useMarkdownLinks:true to prevent
 * this, but this linter is the CI safety net.
 *
 * Usage: tsx scripts/lint-mdx.ts
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const CONTENT_DIR = join(process.cwd(), 'content')
const WIKILINK = /!\[\[.+?\]\]/

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? files(join(dir, e.name))
      : e.name.endsWith('.mdx') || e.name.endsWith('.md')
        ? [join(dir, e.name)]
        : []
  )
}

let errors = 0
for (const f of files(CONTENT_DIR)) {
  const text = readFileSync(f, 'utf8')
  if (WIKILINK.test(text)) {
    console.error(
      `[lint-mdx] Obsidian wikilink found in ${f.replace(process.cwd(), '.')}`
    )
    console.error(
      '  Fix: use standard markdown  ![alt](./image.jpg)  instead of  ![[image.jpg]]'
    )
    errors++
  }
}

if (errors > 0) process.exit(1)
console.log(
  `[lint-mdx] OK - ${files(CONTENT_DIR).length} files checked, 0 wikilinks`
)
