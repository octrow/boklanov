/** Production theatre.country is an ISO 3166-1 alpha-2 code since
 *  PAYLOAD_POLISH_PLAN.md §5.3 backfill (51/54 rows have ISO codes;
 *  3 are null, pending /admin completion). The Payload field is a
 *  typed select, so new rows can only be ISO too. This wrapper exists
 *  to normalize the null/undefined cases for renderers. */
export function countryCode(name?: string | null): string | null {
  if (!name) return null
  const trimmed = name.trim()
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null
}

/** Localized country name for an ISO code ("FI" → "Finnland" in de).
 *  Falls back to the code if the runtime has no name for it. */
export function countryName(
  code: string | null | undefined,
  locale: string
): string | null {
  if (!code) return null
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/** Localized language name for a code ("fi" → "Finnish" in en, "финский"
 *  in ru). Falls back to the uppercased code. */
export function languageName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: 'language' }).of(code) ??
      code.toUpperCase()
    )
  } catch {
    return code.toUpperCase()
  }
}
