'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import { Link } from '@/i18n/navigation'
import { cdnUrl } from '@/lib/cdn'
import { countryCode } from '@/lib/countryCode'
import type { ProductionView } from '@/lib/content'

import styles from './ProductionCard.module.css'
import { TypographicCover } from './TypographicCover'

export { countryCode }

export interface ProductionCardProps {
  production: ProductionView
  priority?: boolean
  sticker?: React.ReactNode
}

export function ProductionCard({
  production,
  priority = false,
  sticker
}: ProductionCardProps) {
  const t = useTranslations('productionDetail')
  const titleRu = production.titles.ru
  const titleEn = production.titles.en
  const showEn = !!titleEn && titleEn !== titleRu

  const theatre = production.theatre.shortName ?? production.theatre.name
  const country = countryCode(production.theatre.country)
  const premMark = production.year ? `${t('premPrefix')} ${production.year}` : null
  const meta = [theatre, premMark, production.ageRating, country]
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' · ')

  // Alt format from DESIGN §12: {role} {title}, {theatre}, {year} ({photographer})
  const altBase = [
    production.role.join(' / '),
    titleRu ?? titleEn ?? production.slug,
    theatre,
    production.year
  ]
    .filter(Boolean)
    .join(', ')
  const alt = production.poster.credit
    ? `${altBase} (${production.poster.credit})`
    : altBase

  const coverStyle =
    production.poster.src && production.poster.lqip
      ? {
          backgroundImage: `url(${production.poster.lqip})`,
          backgroundSize: 'cover' as const,
          backgroundPosition: 'center'
        }
      : undefined

  return (
    <Link href={`/productions/${production.slug}`} className={styles.card}>
      <div className={styles.cover} style={coverStyle}>
        {sticker}
        {production.poster.src ? (
          <Image
            className={styles.coverImg}
            src={cdnUrl(production.poster.src)!}
            alt={alt}
            fill
            sizes='(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
            style={{ objectFit: 'cover' }}
            priority={priority}
          />
        ) : (
          <TypographicCover
            slug={production.slug}
            title={titleRu ?? titleEn ?? production.slug}
            theatre={theatre ?? null}
            countryCode={country}
            year={production.year ?? null}
            synopsis={production.synopsis}
          />
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
