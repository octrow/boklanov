// Run: npx tsx scripts/check-year-from-premiere-date.mts
import assert from 'node:assert/strict'
import type { FieldHook } from 'payload'
import { yearOf, yearFromPremiereDate } from '../hooks/yearFromPremiereDate'

assert.equal(yearOf('6–7 февраля 2021 г.'), 2021)
assert.equal(yearOf('Spring 2019'), 2019)
assert.equal(yearOf('весна'), null)
assert.equal(yearOf(null), null)

const run = (value: unknown, premiereDate: unknown) =>
  yearFromPremiereDate({
    value,
    siblingData: { premiereDate }
  } as Parameters<FieldHook>[0])
assert.equal(run(2018, '2021'), 2018)
assert.equal(run(null, '30 ноября 2023'), 2023)
assert.equal(run(undefined, undefined), undefined)
console.log('yearFromPremiereDate ok')
