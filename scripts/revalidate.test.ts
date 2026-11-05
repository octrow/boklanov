/**
 * Manual revalidate script (logic-map finding #13).
 * Run: node --import tsx --test scripts/revalidate.test.ts
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { postRevalidate } from './revalidate'

test('POSTs the productions tag with the secret to /api/revalidate', async () => {
  const calls: { url: string; init: RequestInit }[] = []
  const fakeFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response('{}', { status: 200 })
  }) as unknown as typeof fetch

  await postRevalidate('https://site.test/', 's3cret', fakeFetch)

  assert.equal(calls[0].url, 'https://site.test/api/revalidate')
  assert.equal(calls[0].init.method, 'POST')
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    secret: 's3cret',
    tags: ['productions']
  })
})

test('throws on a non-2xx answer', async () => {
  const fakeFetch = (async () =>
    new Response('no', { status: 401 })) as unknown as typeof fetch
  await assert.rejects(
    postRevalidate('https://site.test', 'x', fakeFetch),
    /401/
  )
})
