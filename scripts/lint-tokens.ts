/**
 * lint-tokens.ts - guards scoped CSS custom properties from leaking
 * outside their owning module. Phase 9.x governance polish per
 * DESIGN_v2_PROPOSAL.md §7 risk register.
 *
 * Currently enforces:
 *   var(--specimen-rule)  → only allowed in components/SpecimenPlate.module.css
 *
 * The token narrows the §11 drop-shadow ban (unfreeze 9.0a) for a single
 * use case (1px inset rule on photographic plates). If the token leaks
 * to another module, we risk drifting back toward the original Tailwind
 * shadow-xl reflex the brief banned.
 *
 * Usage: tsx scripts/lint-tokens.ts
 */
import { readdirSync, readFileSync } from 'fs'
import { join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

const CWD = process.cwd()
const SELF = resolve(fileURLToPath(import.meta.url))

interface ScopedToken {
  token: string
  /** Absolute path of the single file allowed to reference the token. */
  ownerPath: string
  /** Reason logged when violation found. */
  reason: string
}

const SCOPED: ScopedToken[] = [
  {
    token: 'var(--specimen-rule)',
    ownerPath: join(CWD, 'components', 'SpecimenPlate.module.css'),
    reason:
      '--specimen-rule narrows §11 drop-shadow ban (unfreeze 9.0a) for photographic plates only. Adding a second call-site risks drifting back toward outset shadows. If you need an inset rule elsewhere, propose a new scoped token.'
  }
]

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (
      e.name === 'node_modules' ||
      e.name === '.next' ||
      e.name.startsWith('.')
    )
      continue
    const full = join(dir, e.name)
    if (e.isDirectory()) yield* walk(full)
    else if (/\.(css|module\.css|tsx|ts)$/.test(e.name)) yield full
  }
}

let errors = 0
for (const file of walk(CWD)) {
  const text = readFileSync(file, 'utf8')
  for (const { token, ownerPath, reason } of SCOPED) {
    if (file === ownerPath) continue
    if (file === SELF) continue
    if (text.includes(token)) {
      console.error(`[lint-tokens] ${relative(CWD, file)} references ${token}`)
      console.error(`  → ${reason}`)
      console.error(`  → Allowed only in: ${relative(CWD, ownerPath)}`)
      errors++
    }
  }
}

if (errors > 0) process.exit(1)
console.log(
  '[lint-tokens] OK - all scoped tokens stay inside their owning modules'
)
