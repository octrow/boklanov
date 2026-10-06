// Run: npx tsx scripts/check-availability.mts
import assert from 'node:assert/strict'
import { availabilityLabel } from '../lib/availability'

const t = (k: string) =>
  ({
    availabilityOnTour: 'On tour',
    availabilityInDevelopment: 'In development',
    availabilityArchive: 'Archive'
  })[k]!

assert.equal(availabilityLabel('live', 2021, t), null)
assert.equal(availabilityLabel('archived', 2021, t), 'Archive · 2021')
assert.equal(availabilityLabel('archived', undefined, t), 'Archive')
assert.equal(availabilityLabel('on-tour', 2021, t), 'On tour')
assert.equal(availabilityLabel('in-development', null, t), 'In development')
assert.equal(
  availabilityLabel(undefined as unknown as 'live', 2021, t),
  null
)
console.log('availabilityLabel ok')
