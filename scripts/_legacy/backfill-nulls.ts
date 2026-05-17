/**
 * scripts/backfill-nulls.ts
 *
 * One-shot data hygiene before Tier 3.1 promotes
 * `production.theatre.country` from a free-text input to a select. Rows
 * whose country is NULL need a value first — otherwise the select can't
 * resolve them and Payload renders an empty option.
 *
 * Strategy: city → country lookup built from the canonical (city, country)
 * pairs already present in the dataset (see PAYLOAD_POLISH_PLAN.md §5.3).
 * Any locale of `production.theatre.city` is enough to derive country —
 * the script walks RU first, then EN, then DE.
 *
 * Idempotent. Re-runs only touch rows still NULL.
 *
 * Run with:
 *   npx tsx scripts/backfill-nulls.ts --dry-run
 *   npx tsx scripts/backfill-nulls.ts
 *
 * Per PAYLOAD_POLISH_PLAN.md §5.3 (revised 2026-05-14): ageRating is NOT
 * auto-defaulted — Roman backfills missing values manually in /admin.
 */

import 'dotenv/config'
import pg from 'pg'

const dryRun = process.argv.includes('--dry-run')

/** city (any locale, case-insensitive) → ISO-2 country.
 *  Built from every (city, country) pair that already exists in the
 *  Productions dataset. Extend here when Roman adds a new venue. */
const CITY_TO_COUNTRY: Record<string, string> = {
  // RU
  архангельск: 'RU',
  arkhangelsk: 'RU',
  барнаул: 'RU',
  barnaul: 'RU',
  калининград: 'RU',
  kaliningrad: 'RU',
  москва: 'RU',
  moscow: 'RU',
  moskau: 'RU',
  'нижний тагил': 'RU',
  'nizhny tagil': 'RU',
  новосибирск: 'RU',
  novosibirsk: 'RU',
  няган: 'RU',
  nyagan: 'RU',
  'санкт-петербург': 'RU',
  'saint petersburg': 'RU',
  'st. petersburg': 'RU',
  'sankt petersburg': 'RU',
  'ханты-мансийск': 'RU',
  'khanty-mansiysk': 'RU',
  // KZ
  актобе: 'KZ',
  aktobe: 'KZ',
  алматы: 'KZ',
  almaty: 'KZ',
  // DE
  берлин: 'DE',
  berlin: 'DE',
  бремен: 'DE',
  bremen: 'DE',
  гестензет: 'DE',
  гестенсет: 'DE',
  geestenseth: 'DE',
  // AT
  вена: 'AT',
  vienna: 'AT',
  vienne: 'AT',
  wien: 'AT',
  // ES
  аликанте: 'ES',
  alicante: 'ES',
  торревьеха: 'ES',
  torrevieja: 'ES',
  // BY
  минск: 'BY',
  minsk: 'BY',
  // GB
  лондон: 'GB',
  london: 'GB',
  эдинбург: 'GB',
  edinburgh: 'GB',
  // IT
  рим: 'IT',
  rome: 'IT',
  roma: 'IT',
  милан: 'IT',
  milan: 'IT',
  милано: 'IT',
  // KG
  бишкек: 'KG',
  bishkek: 'KG',
  // LV
  рига: 'LV',
  riga: 'LV',
  // LT
  вильнюс: 'LT',
  vilnius: 'LT',
  // LU
  люксембург: 'LU',
  luxembourg: 'LU',
  // NL
  амстердам: 'NL',
  amsterdam: 'NL',
  // PL
  варшава: 'PL',
  warsaw: 'PL',
  warszawa: 'PL',
  краков: 'PL',
  krakow: 'PL',
  kraków: 'PL',
  // PT
  лиссабон: 'PT',
  lisbon: 'PT',
  lisboa: 'PT',
  // UZ
  ташкент: 'UZ',
  tashkent: 'UZ',
  // UA
  киев: 'UA',
  київ: 'UA',
  kyiv: 'UA',
  kiev: 'UA',
  // FI
  хельсинки: 'FI',
  helsinki: 'FI',
  // FR
  париж: 'FR',
  paris: 'FR',
  // CZ
  прага: 'CZ',
  prague: 'CZ',
  praha: 'CZ',
  // CH
  цюрих: 'CH',
  zurich: 'CH',
  zürich: 'CH',
  женева: 'CH',
  geneva: 'CH',
  genève: 'CH',
  // EE
  таллин: 'EE',
  таллинн: 'EE',
  tallinn: 'EE'
}

function deriveCountry(
  ...cities: Array<string | null | undefined>
): string | null {
  for (const c of cities) {
    if (!c) continue
    const key = c.trim().toLowerCase()
    if (CITY_TO_COUNTRY[key]) return CITY_TO_COUNTRY[key]
  }
  return null
}

/** Second-pass fallbacks for rows where city is empty but the theatre's
 *  name or URL pins down the country. Lowercase substring match on either
 *  any-locale name or url. Order matters — first match wins. */
const THEATRE_HINTS: Array<{ match: RegExp; country: string }> = [
  { match: /artishok|artишок|артишок/i, country: 'KZ' },
  {
    match: /baltic[\s-]?house|балтийский дом|baltic-house\.ru/i,
    country: 'RU'
  },
  { match: /theater\s?8\+|театр\s?8\+/i, country: 'AT' }
]

function deriveFromTheatre(
  ...hints: Array<string | null | undefined>
): string | null {
  const haystack = hints.filter(Boolean).join(' | ')
  if (!haystack) return null
  for (const { match, country } of THEATRE_HINTS) {
    if (match.test(haystack)) return country
  }
  return null
}

type Row = {
  id: number
  theatre_url: string | null
  city_ru: string | null
  city_en: string | null
  city_de: string | null
  name_ru: string | null
  name_en: string | null
  name_de: string | null
}

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  console.log(`Connected. ${dryRun ? '(dry-run)' : ''}`)

  // Pivot the localized rows so we get one row per production with all
  // three city locales side-by-side. The non-localized country column
  // lives on `productions` itself.
  const { rows } = await client.query<Row>(`
    SELECT
      p.id,
      p.production_theatre_url AS theatre_url,
      MAX(CASE WHEN pl._locale = 'ru' THEN pl.production_theatre_city END) AS city_ru,
      MAX(CASE WHEN pl._locale = 'en' THEN pl.production_theatre_city END) AS city_en,
      MAX(CASE WHEN pl._locale = 'de' THEN pl.production_theatre_city END) AS city_de,
      MAX(CASE WHEN pl._locale = 'ru' THEN pl.production_theatre_name END) AS name_ru,
      MAX(CASE WHEN pl._locale = 'en' THEN pl.production_theatre_name END) AS name_en,
      MAX(CASE WHEN pl._locale = 'de' THEN pl.production_theatre_name END) AS name_de
    FROM productions p
    LEFT JOIN productions_locales pl ON pl._parent_id = p.id
    WHERE p.production_theatre_country IS NULL
    GROUP BY p.id
    ORDER BY p.id
  `)

  console.log(`Found ${rows.length} productions with NULL theatre.country.`)

  let resolved = 0
  const unresolved: Array<{
    id: number
    cities: string[]
    names: string[]
    url: string | null
  }> = []

  for (const row of rows) {
    let country = deriveCountry(row.city_ru, row.city_en, row.city_de)
    let source = 'city'
    if (!country) {
      country = deriveFromTheatre(
        row.name_ru,
        row.name_en,
        row.name_de,
        row.theatre_url
      )
      if (country) source = 'theatre'
    }
    if (!country) {
      unresolved.push({
        id: row.id,
        cities: [row.city_ru, row.city_en, row.city_de].filter(
          (x): x is string => Boolean(x)
        ),
        names: [row.name_ru, row.name_en, row.name_de].filter(
          (x): x is string => Boolean(x)
        ),
        url: row.theatre_url
      })
      continue
    }

    const label =
      source === 'city'
        ? `city=${row.city_ru ?? row.city_en ?? row.city_de}`
        : `theatre=${row.name_ru ?? row.name_en ?? row.name_de ?? row.theatre_url}`

    if (dryRun) {
      console.log(`  [dry] id=${row.id} ${label} → country=${country}`)
    } else {
      await client.query(
        `UPDATE productions SET production_theatre_country = $1 WHERE id = $2`,
        [country, row.id]
      )
      console.log(`  ✓   id=${row.id} ${label} → country=${country}`)
    }
    resolved += 1
  }

  if (unresolved.length > 0) {
    console.log('\nUnresolved rows (backfill in /admin):')
    for (const u of unresolved) {
      console.log(
        `  - id=${u.id} cities=${JSON.stringify(u.cities)} names=${JSON.stringify(u.names)} url=${u.url ?? '∅'}`
      )
    }
  }

  console.log(
    `\nDone. resolved=${resolved} unresolved=${unresolved.length} total=${rows.length}`
  )
  await client.end()
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
