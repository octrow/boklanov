/**
 * Migrates <Locale value="…"> MDX body sections into frontmatter body: {ru, en} fields.
 * Run once: npx tsx scripts/migrate-body-to-frontmatter.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const PRODUCTIONS_DIR = path.resolve(process.cwd(), 'content', 'productions')

// Mirrors lib/clean-body.ts - strips Notion-export noise, keeps narrative text.
function cleanBodyMarkdown(raw: string): string {
  const lines = raw.split('\n')
  const out: string[] = []
  let skipUntilBlank = false

  for (const line of lines) {
    const t = line.trim()
    if (/^#\s+/.test(t)) continue
    if (/^>\s*/.test(t)) continue
    if (/^\*{2,3}[^*].{0,120}\*{2,3}$/.test(t) && !t.includes('\n')) continue
    if (/^!\[.*\]\(%[0-9A-F]{2}/i.test(t)) continue
    if (
      /^\*\*(Билет|Ticket|Премьера|Premiere|Продолжи|Duration|Категори|Age restrict|Возраст|Partymaker|Graffiti|Lighting designer|Dj:|ENG$|DEU$|Режис|Художн|Освещ|Звук|Composi|Choreograph|Помощн|В спект|Perform|Director|Artist|Cast:|Sound|Light|Figures|Staging|Regie|Besetz)/.test(
        t
      )
    ) {
      skipUntilBlank = true
      continue
    }
    if (/^###?\s+(Пресса|Press|Награды|Awards|Номинации)/.test(t)) {
      skipUntilBlank = true
      continue
    }
    if (/^\d+\.\s+\[/.test(t)) continue
    if (/^https?:\/\//.test(t)) continue
    if (/^\[https?:\/\//.test(t)) continue
    if (/^<aside/.test(t) || /^<\/aside/.test(t)) continue
    if (skipUntilBlank) {
      if (t === '') skipUntilBlank = false
      continue
    }
    out.push(line)
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractLocale(body: string, locale: 'ru' | 'en'): string {
  const re = new RegExp(
    `<Locale\\s+value="${locale}">([\\s\\S]*?)</Locale>`,
    'i'
  )
  const m = body.match(re)
  if (!m) return ''
  return m[1].trim()
}

function toYamlLiteralBlock(value: string, contentIndent: number): string {
  if (!value) return '""'
  const prefix = ' '.repeat(contentIndent)
  const lines = value.split('\n').map((l) => (l ? prefix + l : ''))
  return `|-\n${lines.join('\n')}`
}

function buildBodyYaml(ru: string, en: string): string {
  const ruBlock = toYamlLiteralBlock(ru, 4)
  const enBlock = toYamlLiteralBlock(en, 4)
  return `body:\n  ru: ${ruBlock}\n  en: ${enBlock}`
}

function migrate(mdxPath: string): 'skipped' | 'done' {
  const raw = fs.readFileSync(mdxPath, 'utf8')

  // Skip if body field already present in frontmatter
  const { data: fm } = matter(raw)
  if (fm.body !== undefined) return 'skipped'

  // Skip if no Locale sections
  const bodyContent = raw.replace(/^---[\s\S]*?---/, '')
  if (!/<Locale\s+value="(ru|en)">/.test(bodyContent)) return 'skipped'

  // Extract raw locale bodies
  const ruRaw = extractLocale(bodyContent, 'ru')
  const enRaw = extractLocale(bodyContent, 'en')

  // Clean (strip Notion noise, keep narrative)
  const ruClean = cleanBodyMarkdown(ruRaw)
  const enClean = cleanBodyMarkdown(enRaw)

  // Find frontmatter boundaries (line indices)
  const lines = raw.split('\n')
  let fmEnd = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      fmEnd = i
      break
    }
  }
  if (fmEnd === -1) return 'skipped'

  // Build new frontmatter: insert body field before closing ---
  const fmLines = lines.slice(0, fmEnd)
  const bodyYamlLines = buildBodyYaml(ruClean, enClean).split('\n')
  const newFmLines = [...fmLines, ...bodyYamlLines]

  // Strip Locale sections + JSX comments from MDX body
  const mdxBodyLines = lines.slice(fmEnd + 1) // after closing ---
  const mdxBodyStr = mdxBodyLines.join('\n')
  const cleaned = mdxBodyStr
    .replace(/\{\/\* (RU|EN) body \*\/\}\s*/g, '')
    .replace(/\{\/\* prettier-ignore \*\/\}\s*/g, '')
    .replace(/<Locale\s+value="[^"]+">[\s\S]*?<\/Locale>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const newFile =
    newFmLines.join('\n') + '\n---\n' + (cleaned ? '\n' + cleaned + '\n' : '')

  fs.writeFileSync(mdxPath, newFile, 'utf8')
  return 'done'
}

// Run over all production MDX files
const slugs = fs
  .readdirSync(PRODUCTIONS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

let done = 0
let skipped = 0

for (const slug of slugs) {
  const mdxPath = path.join(PRODUCTIONS_DIR, slug, 'index.mdx')
  if (!fs.existsSync(mdxPath)) continue
  const result = migrate(mdxPath)
  if (result === 'done') {
    console.log(`✓  ${slug}`)
    done++
  } else {
    console.log(`-  ${slug} (skipped)`)
    skipped++
  }
}

console.log(`\nDone: ${done}  Skipped: ${skipped}`)
