// Run: npx tsx scripts/check-booking-kind.mts
import assert from 'node:assert/strict'
import { bookingKind } from '../lib/bookingKind'

assert.equal(bookingKind('on-tour', 'RU'), 'tour')
assert.equal(bookingKind('on-tour', 'DE'), 'tour')
assert.equal(bookingKind('in-development', 'KZ'), 'premiere')
assert.equal(bookingKind('in-development', 'RU'), 'premiere')
assert.equal(bookingKind('archived', 'DE'), 'new')
assert.equal(bookingKind('live', 'RU'), 'new')
assert.equal(bookingKind('live', 'DE'), 'tour')
assert.equal(bookingKind('live', null), 'tour')
assert.equal(bookingKind(undefined, 'RU'), 'new')
console.log('bookingKind ok')
