// Poster alt: title first, then role, theatre, year, then the photo credit.
// Parts are trimmed so a stored title like "Foo " never yields "Foo , …".
export function posterAlt(
  parts: Array<string | number | null | undefined>,
  credit?: string | null
): string {
  const text = parts
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean)
    .join(', ')
  const c = credit?.trim()
  return c ? `${text} (${c})` : text
}
