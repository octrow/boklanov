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
  sizes?: string
  /** Overrides production.poster for display. Follows caller-computed fallback chain. */
  coverPhoto?: { src: string | null; credit: string | null } | null
}

const DEFAULT_SIZES =
  '(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw'

export function ProductionCard({
  production,
  priority = false,
  sticker,
  sizes = DEFAULT_SIZES,
  coverPhoto
}: ProductionCardProps) {
  const t = useTranslations('productionDetail')
  const titleMain = production.title

  const theatre = production.theatre.shortName ?? production.theatre.name
  const country = countryCode(production.theatre.country)
  const premMark = production.year
    ? `${t('premPrefix')} ${production.year}`
    : null
  const meta = [theatre, premMark, production.ageRating, country]
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' · ')

  // Alt format from DESIGN §12: {role} {title}, {theatre}, {year} ({photographer})
  const altBase = [
    production.role.join(' / '),
    titleMain ?? production.slug,
    theatre,
    production.year
  ]
    .filter(Boolean)
    .join(', ')
  const effectiveCover =
    (coverPhoto?.src ? coverPhoto : null) ?? production.poster
  const alt = effectiveCover.credit
    ? `${altBase} (${effectiveCover.credit})`
    : altBase
  // `coverPhoto` may be a productionsPhoto/featuredPhoto (which carries
  // variants per content.ts), or a raw `{src, credit}` literal supplied by
  // callers that don't know about variants. The cast keeps that flexibility
  // without forcing every caller upstream.
  const variants =
    (
      effectiveCover as {
        variants?: import('@/lib/content').ImageVariants | null
      }
    ).variants ?? null

  // Only use lqip blur-up when showing the poster (lqip is only computed for poster)
  const coverStyle =
    !coverPhoto?.src && production.poster.src && production.poster.lqip
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
        {effectiveCover.src && variants ? (
          // Pre-baked AVIF variants live alongside the source in R2 — serve
          // them directly via `<img srcset>` so we bypass `/_next/image`
          // entirely. See PAYLOAD_IMAGE_VARIANTS_PLAN.md.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.coverImg}
            src={cdnUrl(variants.w600)!}
            srcSet={`${cdnUrl(variants.w420)} 420w, ${cdnUrl(variants.w600)} 600w, ${cdnUrl(variants.w720)} 720w, ${cdnUrl(variants.w828)} 828w, ${cdnUrl(variants.w1080)} 1080w`}
            sizes={sizes}
            alt={alt}
            decoding='async'
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            style={{ objectFit: 'cover' }}
          />
        ) : effectiveCover.src ? (
          <Image
            className={styles.coverImg}
            src={cdnUrl(effectiveCover.src)!}
            alt={alt}
            fill
            sizes={sizes}
            // Posters are duotone-blended on top of a CSS layer — q=70 with
            // AVIF/WebP is visually indistinguishable from q=75 and saves
            // ~10–20 KiB per card on the LCP path.
            quality={70}
            style={{ objectFit: 'cover' }}
            priority={priority}
            fetchPriority={priority ? 'high' : undefined}
          />
        ) : (
          <TypographicCover
            slug={production.slug}
            title={titleMain ?? production.slug}
            theatre={theatre ?? null}
            countryCode={country}
            year={production.year ?? null}
            synopsis={production.synopsis}
          />
        )}
      </div>

      <div className={styles.titleStack}>
        {titleMain && <h2 className={styles.titleRu}>{titleMain}</h2>}
      </div>

      {meta && (
        <div className={styles.metaWrap}>
          <p className={styles.meta}>{meta}</p>
        </div>
      )}
    </Link>
  )
}
