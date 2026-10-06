/** A bare homepage link ("sobaka.ru" → http://sobaka.ru/) points at no
 *  article: hide it on the site, the row stays in the admin. */
export function isArticle(url: string): boolean {
  try {
    const u = new URL(url)
    return u.pathname.replace(/\/+$/, '') !== '' || u.search !== ''
  } catch {
    return false
  }
}

/** Consecutive items sharing a key collapse into one group, order kept
 *  ("Actors: A", "Actors: B" → "Actors: A, B"). */
export function groupRuns<T>(
  items: readonly T[],
  key: (item: T) => string
): { key: string; items: T[] }[] {
  const groups: { key: string; items: T[] }[] = []
  for (const item of items) {
    const k = key(item)
    const last = groups.at(-1)
    if (last && last.key === k) last.items.push(item)
    else groups.push({ key: k, items: [item] })
  }
  return groups
}
