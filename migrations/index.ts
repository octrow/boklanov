import * as migration_20261005_173122_baseline from './20261005_173122_baseline'

export const migrations = [
  {
    up: migration_20261005_173122_baseline.up,
    down: migration_20261005_173122_baseline.down,
    name: '20261005_173122_baseline'
  }
]
