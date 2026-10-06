import type { ProductionStatus } from './content'

export type BookingKind = 'tour' | 'new' | 'premiere'

// What the booking CTA may promise. Russian work is past repertoire
// (PRODUCT.md), so a "Live" show at a Russian theatre offers a new
// production, like an archived one.
export function bookingKind(
  status: ProductionStatus | undefined,
  country: string | null | undefined
): BookingKind {
  if (status === 'in-development') return 'premiere'
  if (status === 'on-tour') return 'tour'
  if (status === 'archived' || country === 'RU') return 'new'
  return 'tour'
}
