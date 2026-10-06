// Run: npx tsx scripts/check-poster-alt.mts
import assert from 'node:assert/strict'
import { posterAlt } from '../lib/posterAlt'

const alt = posterAlt(
  [
    'Vaikenemisen kielioppi (The Grammar of Silence) ',
    'director',
    'Helsinki 98',
    2026
  ],
  ' Pavel Semchen '
)
assert.equal(
  alt,
  'Vaikenemisen kielioppi (The Grammar of Silence), director, Helsinki 98, 2026 (Pavel Semchen)'
)
assert.ok(!/\s[,.;:]/.test(alt))
assert.equal(posterAlt(['Nikita', '', null, undefined, 2019]), 'Nikita, 2019')
console.log('posterAlt ok')
