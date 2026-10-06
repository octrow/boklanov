import type { ProductionStatus } from './content'

// Card availability token from the admin Status. 'live' shows nothing; an
// archived production carries its year when known ("Archive · 2021").
const KEYS = {
  'on-tour': 'availabilityOnTour',
  'in-development': 'availabilityInDevelopment',
  archived: 'availabilityArchive'
} as const

export type AvailabilityKey = (typeof KEYS)[keyof typeof KEYS]

export function availabilityLabel(
  status: ProductionStatus,
  year: number | null | undefined,
  t: (key: AvailabilityKey) => string
): string | null {
  const key = KEYS[status as keyof typeof KEYS]
  if (!key) return null // 'live', or missing from a stale cache entry
  const label = t(key)
  return status === 'archived' && year ? `${label} · ${year}` : label
}
