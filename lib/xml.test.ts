/**
 * RSS escaping (logic-map finding #3).
 * Run: node --import tsx --test lib/xml.test.ts
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { cdata, xmlEscape } from './xml'

test('cdata keeps & as is (no double escaping)', () => {
  assert.equal(cdata('Tom & Jerry'), '<![CDATA[Tom & Jerry]]>')
})

test('cdata splits a closing ]]> so the block cannot end early', () => {
  assert.equal(cdata('a]]>b'), '<![CDATA[a]]]]><![CDATA[>b]]>')
})

test('xmlEscape escapes the five XML characters', () => {
  assert.equal(
    xmlEscape(`<a href="x">Tom & 'J'</a>`),
    '&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;J&apos;&lt;/a&gt;'
  )
})
