/**
 * Auth guard for /api/r2-asset (logic-map finding #1).
 *
 * Run: node --import tsx --experimental-test-module-mocks --test app/api/r2-asset/route.test.ts
 *
 * Payload and its config are mocked, so no DB, R2 or disk write happens:
 * every request below stops before the handler touches storage.
 */

import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let sessionUser: { id: number } | null = null

mock.module('payload', {
  namedExports: {
    getPayload: async () => ({
      auth: async () => ({ user: sessionUser })
    })
  }
})
mock.module('@payload-config', { defaultExport: {} })

const { POST, DELETE } = await import('./route')

function uploadRequest(): Request {
  const fd = new FormData()
  fd.append('file', new File(['x'], 'a.png', { type: 'image/png' }))
  fd.append('directory', 'uploads')
  return new Request('http://localhost/api/r2-asset', {
    method: 'POST',
    body: fd
  })
}

function deleteRequest(body: unknown): Request {
  return new Request('http://localhost/api/r2-asset', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
}

test('POST without a session returns 401', async () => {
  sessionUser = null
  const res = await POST(uploadRequest())
  assert.equal(res.status, 401)
})

test('DELETE without a session returns 401', async () => {
  sessionUser = null
  const res = await DELETE(deleteRequest({ src: '/uploads/a.png' }))
  assert.equal(res.status, 401)
})

test('POST with a session passes the guard', async () => {
  sessionUser = { id: 1 }
  const res = await POST(
    new Request('http://localhost/api/r2-asset', {
      method: 'POST',
      body: 'not multipart'
    })
  )
  assert.equal(res.status, 400)
})

test('DELETE with a session passes the guard', async () => {
  sessionUser = { id: 1 }
  const res = await DELETE(deleteRequest({}))
  assert.equal(res.status, 400)
})
