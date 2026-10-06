// Run: npx tsx scripts/check-list-rules.mts
import assert from 'node:assert/strict'
import { groupRuns, isArticle } from '../lib/listRules'

assert.equal(isArticle('http://sobaka.ru/'), false)
assert.equal(isArticle('https://www.fontanka.ru'), false)
assert.equal(isArticle('https://fontanka.ru/2021/03/01/123/'), true)
assert.equal(isArticle('https://example.com/?p=42'), true)
assert.equal(isArticle('not a url'), false)

const credits = [
  { role: 'Director', name: 'R' },
  { role: 'Actors', name: 'A' },
  { role: 'Actors', name: 'B' },
  { role: 'Light', name: 'L' },
  { role: 'Actors', name: 'C' }
]
assert.deepEqual(
  groupRuns(credits, (c) => c.role).map((g) => [
    g.key,
    g.items.map((c) => c.name).join(',')
  ]),
  [
    ['Director', 'R'],
    ['Actors', 'A,B'],
    ['Light', 'L'],
    ['Actors', 'C']
  ]
)
assert.deepEqual(groupRuns([], String), [])
console.log('listRules ok')
