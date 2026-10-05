// Cyrillic → Latin transliteration, shared by search fuzzy-matching and
// admin upload filenames.

const CYR_TO_LAT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'j',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
}

export function transliterate(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .map((c) => CYR_TO_LAT[c] ?? c)
    .join('')
}

// Storage name for an admin upload: readable Latin slug + base36 timestamp.
// Stored objects are cached `immutable`, so every upload needs a fresh key
// (a re-upload under an old name would be served stale for up to a year).
export function uploadFilename(name: string, now: number = Date.now()): string {
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : ''
  const base =
    transliterate(dot > 0 ? name.slice(0, dot) : name)
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '') || 'upload'
  return `${base}-${now.toString(36)}${ext}`
}
