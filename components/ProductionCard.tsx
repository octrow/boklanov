import * as React from 'react'

import { Link } from '@/i18n/navigation'
import type { ProductionView } from '@/lib/content'

import styles from './ProductionCard.module.css'

// Country full-name → ISO-2 (uppercase). Brief D5/D7 fixes the chip set
// to RU/KZ/DE/ES/AT/BY; anything outside falls back to no chip.
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

function countryCode(name?: string): string | null {
  if (!name) return null
  const trimmed = name.trim()
  return COUNTRY_TO_CODE[trimmed] ?? null
}

export interface ProductionCardProps {
  production: ProductionView
}

export function ProductionCard({ production }: ProductionCardProps) {
  const titleRu = production.titles.ru
  const titleEn = production.titles.en
  const showEn = !!titleEn && titleEn !== titleRu

  const theatre = production.theatre.shortName ?? production.theatre.name
  const country = countryCode(production.theatre.country)
  const meta = [theatre, production.year, production.ageRating, country]
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' · ')

  // Alt format from DESIGN §12: {role} {title}, {theatre}, {year} ({photographer})
  const alt = [
    production.role,
    titleRu ?? titleEn ?? production.slug,
    theatre,
    production.year
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Link href={`/productions/${production.slug}`} className={styles.card}>
      <div className={styles.cover}>
        {production.poster.src ? (
          <img
            className={styles.coverImg}
            src={production.poster.src}
            alt={alt}
            loading='lazy'
            decoding='async'
          />
        ) : (
          <div className={styles.coverFallback} aria-hidden='true'>
            {titleRu ?? titleEn ?? production.slug}
          </div>
        )}
      </div>

      <div className={styles.titleStack}>
        {titleRu && <h3 className={styles.titleRu}>{titleRu}</h3>}
        {showEn && <p className={styles.titleEn}>{titleEn}</p>}
      </div>

      {meta && (
        <div className={styles.metaWrap}>
          <p className={styles.meta}>{meta}</p>
        </div>
      )}
    </Link>
  )
}
