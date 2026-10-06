// Run: npx tsx scripts/check-country-name.mts
import assert from 'node:assert/strict'
import { countryName } from '../lib/countryCode'

assert.equal(countryName('FI', 'en'), 'Finland')
assert.equal(countryName('KZ', 'de'), 'Kasachstan')
assert.equal(countryName('RU', 'ru'), 'Россия')
assert.equal(countryName('FI', 'de'), 'Finnland')
assert.equal(countryName(null, 'en'), null)
console.log('countryName ok')
