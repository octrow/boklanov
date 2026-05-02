import * as React from 'react'

import styles from './TheatreSlate.module.css'

type TheatreInput = {
  name?: string | null
  shortName?: string | null
  city?: string | null
  country?: string | null
  url?: string | null
} | null | undefined

type TheatreSlateProps = {
  titleRu?: string | null
  titleEn?: string | null
  titleDe?: string | null
  theatre?: TheatreInput
  roleLabel?: string | null
  premiereDate?: string | null
  as?: 'h1' | 'h2'
}

function buildTheatreLine(theatre: TheatreInput): string | null {
  if (!theatre) return null
  return [theatre.name ?? theatre.shortName, theatre.city]
    .filter(Boolean)
    .join(' · ') || null
}

export function TheatreSlate({
  titleRu,
  titleEn,
  titleDe,
  theatre,
  roleLabel,
  premiereDate,
  as = 'h1',
}: TheatreSlateProps) {
  const showEn = !!titleEn && titleEn !== titleRu
  const showDe = !!titleDe && titleDe !== titleRu && titleDe !== titleEn
  const theatreLine = buildTheatreLine(theatre)
  const theatreUrl = theatre?.url ?? null

  const Heading = as

  return (
    <header className={styles.slate}>
      {titleRu && <Heading className={styles.title}>{titleRu}</Heading>}
      {showEn && <p className={styles.titleEn}>{titleEn}</p>}
      {showDe && <p className={styles.titleDe}>{titleDe}</p>}
      {theatreLine && (
        <p className={styles.theatre}>
          {theatreUrl ? (
            <a
              className={styles.theatreLink}
              href={theatreUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {theatreLine}
            </a>
          ) : (
            theatreLine
          )}
        </p>
      )}
      {roleLabel && <p className={styles.role}>{roleLabel}</p>}
      {premiereDate && <p className={styles.premiereDate}>{premiereDate}</p>}
    </header>
  )
}
