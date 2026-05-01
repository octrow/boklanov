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
const PAPER = '#F4F2EC'
const INK = '#161514'
const INK_MUTE = '#605C56'
const ACCENT = '#6B0F0F'

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
    loraCyrillic: fontBuf('@fontsource/lora/files/lora-cyrillic-400-normal.woff'),
    loraLatin: fontBuf('@fontsource/lora/files/lora-latin-400-normal.woff'),
    loraLatinExt: fontBuf('@fontsource/lora/files/lora-latin-ext-400-normal.woff'),
    monoCyrillic: fontBuf('@fontsource/jetbrains-mono/files/jetbrains-mono-cyrillic-400-normal.woff'),
    monoLatin: fontBuf('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'),
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

  const theatreName = production.theatre.name ?? production.theatre.shortName ?? null

  const chips = [
    production.ageRating ?? null,
    production.year ? String(production.year) : null,
    production.theatre.country ?? null,
  ]
    .filter(Boolean)
    .join(' · ')

  // Absolute poster URL — constructed from request origin so preview deploys work.
  const { origin } = new URL(request.url)
  const posterUrl = production.poster.src ? `${origin}${production.poster.src}` : null

  // Font size: shorter titles get a larger size.
  const titleFontSize = (titleRu?.length ?? 0) > 30 ? 44 : 54

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Lora',
        }}
      >
        {/* Main content row */}
        <div style={{ flex: 1, display: 'flex', background: PAPER }}>
          {/* Left: poster or oxblood typographic block */}
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              width={400}
              height={H - 8}
              style={{ objectFit: 'cover', flexShrink: 0, display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: 400,
                background: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontFamily: 'Lora',
                  fontSize: 22,
                  color: PAPER,
                  opacity: 0.55,
                  letterSpacing: '0.08em',
                  textTransform: 'lowercase',
                  transform: 'rotate(-90deg)',
                  whiteSpace: 'nowrap',
                }}
              >
                роман бокланов
              </div>
            </div>
          )}

          {/* Right: text block */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '52px 60px 40px 60px',
            }}
          >
            {/* Spacer: push title to vertical center–bottom */}
            <div style={{ flex: 1 }} />

            {/* RU title */}
            <div
              style={{
                fontFamily: 'Lora',
                fontSize: titleFontSize,
                fontWeight: 400,
                color: INK,
                lineHeight: 1.15,
                marginBottom: 14,
              }}
            >
              {titleRu}
            </div>

            {/* EN subtitle */}
            {showTitleEn && (
              <div
                style={{
                  fontFamily: 'Lora',
                  fontSize: 26,
                  fontStyle: 'italic',
                  color: INK_MUTE,
                  lineHeight: 1.3,
                  marginBottom: 20,
                }}
              >
                {titleEn}
              </div>
            )}

            {/* Theatre */}
            {theatreName && (
              <div
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 15,
                  color: INK_MUTE,
                  letterSpacing: '0.02em',
                  marginBottom: 8,
                }}
              >
                {theatreName}
              </div>
            )}

            {/* Chips: age · year · country */}
            {chips && (
              <div
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 14,
                  color: INK_MUTE,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {chips}
              </div>
            )}

            {/* Spacer bottom */}
            <div style={{ flex: 1 }} />

            {/* Signature — low-key */}
            <div
              style={{
                fontFamily: 'Lora',
                fontSize: 14,
                color: INK_MUTE,
                opacity: 0.6,
                letterSpacing: '0.04em',
                textTransform: 'lowercase',
              }}
            >
              boklanov.com
            </div>
          </div>
        </div>

        {/* Oxblood accent bar — bottom */}
        <div style={{ height: 8, background: ACCENT, flexShrink: 0 }} />
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'Lora', data: fonts.loraLatin, style: 'normal', weight: 400 },
        { name: 'Lora', data: fonts.loraLatinExt, style: 'normal', weight: 400 },
        { name: 'Lora', data: fonts.loraCyrillic, style: 'normal', weight: 400 },
        { name: 'JetBrains Mono', data: fonts.monoLatin, style: 'normal', weight: 400 },
        { name: 'JetBrains Mono', data: fonts.monoCyrillic, style: 'normal', weight: 400 },
      ],
    }
  )
}
