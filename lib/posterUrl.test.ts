/**
 * Poster URL for OG image and JSON-LD (logic-map finding #8).
 * Run: node --import tsx --test lib/posterUrl.test.ts
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.NEXT_PUBLIC_CDN_BASE = 'https://cdn.example.com'
const { absolutePosterUrl, satoriCanDraw } = await import('./posterUrl')

test('relative src goes to the CDN, not the site origin', () => {
  assert.equal(
    absolutePosterUrl('/uploads/p.jpg', 'https://site.example'),
    'https://cdn.example.com/uploads/p.jpg'
  )
})

test('absolute src is kept', () => {
  assert.equal(
    absolutePosterUrl('https://x.test/p.jpg', 'https://site.example'),
    'https://x.test/p.jpg'
  )
})

test('satori skips webp and avif', () => {
  assert.equal(satoriCanDraw('/a.jpg'), true)
  assert.equal(satoriCanDraw('/a.png'), true)
  assert.equal(satoriCanDraw('/a.webp'), false)
  assert.equal(satoriCanDraw('/a.avif'), false)
})
