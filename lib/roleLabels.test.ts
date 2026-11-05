/**
 * Role labels (logic-map findings #4, #12).
 * Run: node --import tsx --test lib/roleLabels.test.ts
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatRoles } from './roleLabels'

const label = (key: string) => `<${key}>`

test('joins labels with " / "', () => {
  assert.equal(
    formatRoles(['co-director', 'performer'], label),
    '<roleCoDirector> / <rolePerformer>'
  )
})

test('knows the admin-only roles', () => {
  assert.equal(
    formatRoles(['art-director', 'playwright', 'producer'], label),
    '<roleArtDirector> / <rolePlaywright> / <roleProducer>'
  )
})

test('unknown role prints its raw key; empty list prints nothing', () => {
  assert.equal(formatRoles(['mystery'], label), 'mystery')
  assert.equal(formatRoles([], label), '')
})
