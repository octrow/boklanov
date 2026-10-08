'use client'

import React from 'react'
import Link from 'next/link'
import type { DefaultCellComponentProps } from 'payload'
import { FieldLabel, useConfig, useTranslation } from '@payloadcms/ui'
import { getTranslation } from '@payloadcms/translations'

/**
 * Productions list cells. The whole row opens the production: the title
 * link stretches over its row (`.row-link::after` in custom.scss), the
 * poster is a second link to the same place, the select checkbox sits
 * above the stretch. Empty values render empty, not «Без метки».
 */

const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE?.replace(/\/$/, '') ?? ''

const useDocHref = ({
  collectionSlug,
  rowData
}: DefaultCellComponentProps): string => {
  const admin = useConfig().config.routes.admin
  return `${admin}/collections/${collectionSlug}/${encodeURIComponent(String(rowData?.id))}`
}

export const PosterCell: React.FC<DefaultCellComponentProps> = (props) => {
  const href = useDocHref(props)
  const { cellData } = props
  const src =
    typeof cellData === 'string' && cellData
      ? cellData.startsWith('http')
        ? cellData
        : `${cdnBase}${cellData.startsWith('/') ? '' : '/'}${cellData}`
      : null
  // Duplicate of the title link: out of the tab order and the a11y tree.
  return (
    <Link href={href} className='list-poster' tabIndex={-1} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt='' loading='lazy' />}
    </Link>
  )
}

export const TitleCell: React.FC<DefaultCellComponentProps> = (props) => {
  const href = useDocHref(props)
  const title = typeof props.cellData === 'string' ? props.cellData.trim() : ''
  const slug = String((props.rowData as { slug?: unknown })?.slug ?? '')
  return (
    <Link href={href} className='row-link'>
      {title || <span className='list-muted'>{slug}</span>}
    </Link>
  )
}

export const YearCell: React.FC<DefaultCellComponentProps> = ({ cellData }) =>
  typeof cellData === 'number' ? <span>{cellData}</span> : null

export const StatusCell: React.FC<DefaultCellComponentProps> = ({
  cellData,
  field
}) => {
  const { i18n } = useTranslation()
  if (typeof cellData !== 'string' || !cellData) return null
  const options =
    'options' in field && Array.isArray(field.options) ? field.options : []
  const option = options.find(
    (o) => typeof o === 'object' && o.value === cellData
  )
  const label =
    option && typeof option === 'object'
      ? getTranslation(option.label, i18n)
      : cellData
  return (
    <span className={`status-badge status-badge--${cellData}`}>{label}</span>
  )
}

export const FeaturedCell: React.FC<DefaultCellComponentProps> = ({
  cellData
}) => {
  const { i18n } = useTranslation()
  if (!cellData) return null
  return (
    <svg
      className='list-star'
      viewBox='0 0 24 24'
      width='16'
      height='16'
      role='img'
      aria-label={i18n.language === 'ru' ? 'На главной' : 'On homepage'}
    >
      <path d='M11.5 2.9a.6.6 0 0 1 1 0l2.6 5.3 5.8.8a.6.6 0 0 1 .3 1l-4.2 4.1 1 5.8a.6.6 0 0 1-.8.6L12 17.8l-5.2 2.7a.6.6 0 0 1-.8-.6l1-5.8-4.2-4.1a.6.6 0 0 1 .3-1l5.8-.8z' />
    </svg>
  )
}

/** Column heading / form label without Payload's group path
 *  («Медиа > Постер > Постер» → «Постер»). The list renders it with only
 *  `field`; the edit form also passes `path`, and gets the stock label. */
export const PlainLabel: React.FC<{
  field?: { label?: unknown; required?: boolean; localized?: boolean }
  path?: string
}> = ({ field, path }) => {
  const { i18n } = useTranslation()
  const label = field?.label
    ? getTranslation(field.label as Parameters<typeof getTranslation>[0], i18n)
    : ''
  if (!path) return <span>{label}</span>
  return (
    <FieldLabel
      label={field?.label as React.ComponentProps<typeof FieldLabel>['label']}
      localized={field?.localized}
      path={path}
      required={field?.required}
    />
  )
}
