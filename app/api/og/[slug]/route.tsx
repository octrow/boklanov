import * as fs from 'node:fs'
import * as path from 'node:path'

import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import * as React from 'react'

import { getProduction } from '@/lib/content'

// Node runtime — needed for fs-based content + font loading.
export const runtime = 'nodejs'

const W = 1200
const H = 630
const POSTER_W = 380

const PAPER = '#F4F2EC'
const INK = '#161514'
const INK_MUTE = '#605C56'
const INK_FAINT = 'rgba(22, 21, 20, 0.45)'
const ACCENT = '#6B0F0F'
const RULE = 'rgba(22, 21, 20, 0.15)'

const PAD_X = 56 // horizontal padding in text rail
const PAD_Y = 36 // vertical padding top/bottom in text rail

// satori supports .woff (not .woff2). Use @fontsource packages — already installed.
function fontBuf(pkgPath: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), 'node_modules', pkgPath))
}

interface FontCache {
  loraCyrillic: Buffer
  loraLatin: Buffer
  loraLatinExt: Buffer
  monoCyrillic: Buffer
  monoLatin: Buffer
}

// Lazily loaded once per worker lifetime.
let _fonts: FontCache | null = null
async function loadFonts(): Promise<FontCache> {
  if (_fonts) return _fonts
  _fonts = {
    loraCyrillic: fontBuf(
      '@fontsource/lora/files/lora-cyrillic-400-normal.woff'
    ),
    loraLatin: fontBuf('@fontsource/lora/files/lora-latin-400-normal.woff'),
    loraLatinExt: fontBuf(
      '@fontsource/lora/files/lora-latin-ext-400-normal.woff'
    ),
    monoCyrillic: fontBuf(
      '@fontsource/jetbrains-mono/files/jetbrains-mono-cyrillic-400-normal.woff'
    ),
    monoLatin: fontBuf(
      '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'
    )
  }
  return _fonts
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const production = getProduction(slug, 'ru')
  if (!production) return new Response('Not found', { status: 404 })

  const fonts = await loadFonts()

  const titleRu = production.titles.ru ?? production.title
  const titleEn = production.titles.en ?? null
  const showTitleEn = !!titleEn && titleEn !== titleRu

  // Font size: shorter titles get a larger size.
  const titleLen = titleRu?.length ?? 0
  const titleFontSize = titleLen > 36 ? 40 : titleLen > 24 ? 48 : 56

  // Bottom-left meta line: theatre · city · year · age
  const metaLine = [
    production.theatre.shortName ?? production.theatre.name,
    production.theatre.city,
    production.year ? String(production.year) : null,
    production.ageRating ?? null
  ]
    .filter(Boolean)
    .join(' · ')

  // Absolute poster URL — constructed from request origin so preview deploys work.
  // satori only handles JPEG/PNG; webp silently renders blank, so skip those.
  const { origin } = new URL(request.url)
  const posterSrc = production.poster.src
  const posterUrl =
    posterSrc && !posterSrc.endsWith('.webp') ? `${origin}${posterSrc}` : null

  // ── Text rail (right side) ──────────────────────────────────────────────
  const textRail = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: PAPER
      }}
    >
      {/* Section slug — programme folio */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `${PAD_Y}px ${PAD_X}px 18px`
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            color: INK_FAINT,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          ROMAN BOKLANOV · PRODUCTIONS
        </span>
      </div>

      {/* Hairline rule */}
      <div
        style={{
          height: 1,
          background: RULE,
          marginLeft: PAD_X,
          marginRight: PAD_X
        }}
      />

      {/* Title block — vertically centred */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `28px ${PAD_X}px`
        }}
      >
        {/* RU title */}
        <div
          style={{
            fontFamily: 'Lora',
            fontSize: titleFontSize,
            fontWeight: 400,
            color: INK,
            lineHeight: 1.2,
            marginBottom: showTitleEn ? 12 : 0
          }}
        >
          {titleRu}
        </div>

        {/* EN subtitle — italic Lora */}
        {showTitleEn && (
          <div
            style={{
              fontFamily: 'Lora',
              fontSize: Math.round(titleFontSize * 0.52),
              fontStyle: 'italic',
              color: INK_MUTE,
              lineHeight: 1.35
            }}
          >
            {titleEn}
          </div>
        )}
      </div>

      {/* Hairline rule */}
      <div
        style={{
          height: 1,
          background: RULE,
          marginLeft: PAD_X,
          marginRight: PAD_X
        }}
      />

      {/* Bottom: meta left · colophon right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `18px ${PAD_X}px ${PAD_Y}px`
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 12,
            color: INK_MUTE,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
        >
          {metaLine}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            color: ACCENT,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
        >
          2026 EDITION
        </span>
      </div>
    </div>
  )

  // ── No-poster fallback: oxblood block with vertical wordmark ────────────
  const noPosterBlock = (
    <div
      style={{
        width: POSTER_W,
        height: H,
        background: ACCENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <div
        style={{
          fontFamily: 'Lora',
          fontSize: 20,
          color: PAPER,
          opacity: 0.5,
          letterSpacing: '0.08em',
          textTransform: 'lowercase',
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap'
        }}
      >
        роман бокланов
      </div>
    </div>
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        {/* Left: poster or oxblood fallback */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=''
            width={POSTER_W}
            height={H}
            style={{ objectFit: 'cover', flexShrink: 0, display: 'block' }}
          />
        ) : (
          noPosterBlock
        )}

        {/* Right: programme-grammar text rail */}
        {textRail}
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'Lora', data: fonts.loraLatin, style: 'normal', weight: 400 },
        {
          name: 'Lora',
          data: fonts.loraLatinExt,
          style: 'normal',
          weight: 400
        },
        {
          name: 'Lora',
          data: fonts.loraCyrillic,
          style: 'normal',
          weight: 400
        },
        {
          name: 'JetBrains Mono',
          data: fonts.monoLatin,
          style: 'normal',
          weight: 400
        },
        {
          name: 'JetBrains Mono',
          data: fonts.monoCyrillic,
          style: 'normal',
          weight: 400
        }
      ]
    }
  )
}
