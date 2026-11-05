/**
 * Empty localized values must not stop the fallback chain
 * (logic-map findings #2, #11).
 * Run: node --import tsx --experimental-test-module-mocks --test lib/content.l10n.test.ts
 */
import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

mock.module('payload', { namedExports: { getPayload: async () => ({}) } })
mock.module('@payload-config', { defaultExport: {} })

const { asL10n, asLexical, warnIfTruncated } = await import('./content')

test('asL10n drops empty strings so the chain falls through', () => {
  assert.deepEqual(asL10n({ ru: 'x', en: '', de: null }), { ru: 'x' })
})

const empty = { root: { type: 'root', children: [] } }
const para = {
  root: {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', text: 'hi' }] }]
  }
}

test('asLexical maps a state with no nodes to null', () => {
  const out = asLexical({ ru: para, en: empty, de: null })
  assert.equal(out.en, null)
  assert.equal(out.de, null)
  assert.equal(out.ru, para)
})

test('warnIfTruncated flags a result that hit the cap', () => {
  assert.equal(warnIfTruncated(499, 500), false)
  assert.equal(warnIfTruncated(500, 500), true)
})
