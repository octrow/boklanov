const COUNTRY_TO_CODE: Record<string, string> = {
  Россия: 'RU',
  Russia: 'RU',
  Казахстан: 'KZ',
  Kazakhstan: 'KZ',
  Германия: 'DE',
  Germany: 'DE',
  Deutschland: 'DE',
  Испания: 'ES',
  Spain: 'ES',
  España: 'ES',
  Австрия: 'AT',
  Austria: 'AT',
  Österreich: 'AT',
  Беларусь: 'BY',
  Belarus: 'BY'
}

export function countryCode(name?: string): string | null {
  if (!name) return null
  const trimmed = name.trim()
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed
  return COUNTRY_TO_CODE[trimmed] ?? null
}
