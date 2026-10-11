/** SERPs cut titles past ~60 chars. */
export const TITLE_MAX = 60

const STAGING_ROLES = ['director', 'co-director']

export interface ProductionTitleInput {
  title: string
  roles: string[]
  /** Disambiguates two productions sharing a title in this locale. */
  year?: number | null
  /** Another production in this locale has the same title. */
  clash: boolean
  /** "staged by Roman Boklanov" / "with Roman Boklanov" / "Roman Boklanov". */
  suffixStaged: string
  suffixWith: string
  siteName: string
}

/** `<title>` for a production page. The role suffix is localized, so the EN
 *  and DE pages of an untranslated title no longer share one `<title>`; a
 *  title shared by two productions gets its year. Falls back to shorter
 *  suffixes, then the bare title, to stay within TITLE_MAX. */
export function productionTitle(p: ProductionTitleInput): string {
  const base =
    p.clash && p.year ? `${p.title.trim()} (${p.year})` : p.title.trim()
  const suffix = p.roles.some((r) => STAGING_ROLES.includes(r))
    ? p.suffixStaged
    : p.suffixWith
  const candidates = [`${base} — ${suffix}`, `${base} — ${p.siteName}`, base]
  return candidates.find((t) => t.length <= TITLE_MAX) ?? base
}
