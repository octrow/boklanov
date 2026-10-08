import type { FieldHook } from 'payload'

const YEAR = /\b(19|20)\d{2}\b/

/** "6–7 февраля 2021 г.", "Spring 2021" → 2021; null when no year. */
export const yearOf = (date: unknown): number | null => {
  const m = typeof date === 'string' ? date.match(YEAR) : null
  return m ? Number(m[0]) : null
}

/** A blank premiere year is taken from the free-text premiere date, so
 *  the two can't disagree and sorting by year covers dated productions. */
export const yearFromPremiereDate: FieldHook = ({ value, siblingData }) =>
  value ?? yearOf(siblingData?.premiereDate) ?? value
