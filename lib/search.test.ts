/**
 * Cmd-K index vs hidden press rows (logic-map finding #15).
 * Run: node --import tsx --test lib/search.test.ts
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { ProductionView } from './content'
import { buildSearchIndex } from './search'

test('press rows without an article URL stay out of the index', () => {
  const prod = {
    slug: 's',
    title: 'T',
    theatre: {},
    awards: [],
    press: [
      { title: 'Bare', outlet: 'o', url: 'http://sobaka.ru/' },
      { title: 'Real', outlet: 'o', url: 'https://fontanka.ru/2021/1/' }
    ]
  } as unknown as ProductionView
  const press = buildSearchIndex([prod]).filter((i) => i.type === 'press')
  assert.deepEqual(
    press.map((i) => (i as { articleTitle: string }).articleTitle),
    ['Real']
  )
})
