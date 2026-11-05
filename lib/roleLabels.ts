/** Role value (admin option in collections/Productions.ts) → message key in
 *  the `productions` namespace. One map for the production page and /archive. */
const ROLE_LABEL_KEYS: Record<string, string> = {
  director: 'roleDirector',
  'co-director': 'roleCoDirector',
  performer: 'rolePerformer',
  'art-director': 'roleArtDirector',
  playwright: 'rolePlaywright',
  producer: 'roleProducer',
  reader: 'roleReader',
  sketch: 'roleSketch'
}

/** "co-director / performer" as translated labels; an unknown role prints
 *  its raw key. */
export function formatRoles(
  roles: readonly string[],
  label: (key: string) => string
): string {
  return roles
    .map((r) => (ROLE_LABEL_KEYS[r] ? label(ROLE_LABEL_KEYS[r]) : r))
    .join(' / ')
}
