import { cache } from 'react'
import type { Payload } from 'payload'
import { toPlainText } from './plainText'

/** The Main texts (CONTEXT.md): a production is Untranslated into EN or DE
 *  when one of them is filled in RU and empty in that language. Shared by
 *  the dashboard and the productions list column. */
export const MAIN_TEXTS = [
  'title',
  'tagline',
  'synopsis',
  'body',
  'directorsNote'
] as const

export type TargetLang = 'en' | 'de'
type Localized = Partial<Record<'ru' | 'en' | 'de', unknown>>
export type MainTextsRow = {
  identity?: Partial<Record<(typeof MAIN_TEXTS)[number], Localized>>
}

const text = (v: unknown) => toPlainText(v).trim()

export const isUntranslated = (row: MainTextsRow, lang: TargetLang) =>
  MAIN_TEXTS.some((k) => {
    const v = row.identity?.[k]
    return text(v?.ru) !== '' && text(v?.[lang]) === ''
  })

/** id → languages it is Untranslated into. One query per request: every
 *  list cell asks, React's cache answers all but the first. */
export const untranslatedById = cache(
  async (payload: Payload): Promise<Map<string, TargetLang[]>> => {
    const { docs } = await payload.find({
      collection: 'productions',
      locale: 'all',
      depth: 0,
      pagination: false,
      select: {
        identity: Object.fromEntries(MAIN_TEXTS.map((k) => [k, true]))
      }
    })
    return new Map(
      docs.map((d) => [
        String(d.id),
        (['en', 'de'] as const).filter((l) =>
          isUntranslated(d as unknown as MainTextsRow, l)
        )
      ])
    )
  }
)
