'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

/** Productions list cells: a poster thumbnail and «Да» / «—» under
 *  «На главной» in place of the stock «правда/ложь». */

const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE?.replace(/\/$/, '') ?? ''

export const PosterCell: React.FC<DefaultCellComponentProps> = ({
  cellData
}) => {
  if (typeof cellData !== 'string' || !cellData) return <span>—</span>
  const src = cellData.startsWith('http')
    ? cellData
    : `${cdnBase}${cellData.startsWith('/') ? '' : '/'}${cellData}`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=''
      loading='lazy'
      style={{ display: 'block', height: 48, width: 'auto', maxWidth: 72 }}
    />
  )
}

export const FeaturedCell: React.FC<DefaultCellComponentProps> = ({
  cellData
}) => <span>{cellData ? 'Да' : '—'}</span>
