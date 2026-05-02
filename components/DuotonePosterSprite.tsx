/* v3 §2.4 — SVG filter sprite. Two duotone filters injected once at root layout.
   Shadows → accent colour, highlights → warm paper. Bauhaus screen-print feel.
   IDs: duotone-v (vermillion #E63946), duotone-c (cobalt #1D3557).

   Contrast boost (added 2026-05-03 after visual review): the mid-tone region of
   a duotone naturally lands halfway between shadow and highlight colours —
   `0.5 * (#E63946 + #F2F0EA) ≈ #BC95A0` (peach), which is read as "neutral"
   rather than "red". Photos with strong dark/light distribution tinted clearly;
   photos with mostly mid-tones looked unfiltered. Added a feComponentTransfer
   pre-step that pushes shadows darker and highlights lighter (S-curve) so the
   duotone end-points dominate. */

import * as React from 'react'

export function DuotonePosterSprite() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Vermillion duotone: dark → #E63946 (0.902,0.224,0.275), light → paper #F2F0EA (0.949,0.941,0.918) */}
        <filter id="duotone-v" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="saturate" values="0" result="gray" />
          {/* S-curve contrast boost: pull mid-tones toward the extremes so the
              duotone end-points read clearly. Tabular transfer flattens the
              middle 30% of the luminance range. */}
          <feComponentTransfer in="gray" result="hicontrast">
            <feFuncR type="table" tableValues="0 0 0.05 0.4 0.9 1 1" />
            <feFuncG type="table" tableValues="0 0 0.05 0.4 0.9 1 1" />
            <feFuncB type="table" tableValues="0 0 0.05 0.4 0.9 1 1" />
          </feComponentTransfer>
          <feColorMatrix
            in="hicontrast"
            type="matrix"
            values="0.047 0 0 0 0.902
                    0.717 0 0 0 0.224
                    0.643 0 0 0 0.275
                    0     0 0 1 0"
          />
        </filter>
        {/* Cobalt duotone: dark → #1D3557 (0.114,0.208,0.341), light → paper #F2F0EA */}
        <filter id="duotone-c" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="saturate" values="0" result="gray" />
          <feComponentTransfer in="gray" result="hicontrast">
            <feFuncR type="table" tableValues="0 0 0.05 0.4 0.9 1 1" />
            <feFuncG type="table" tableValues="0 0 0.05 0.4 0.9 1 1" />
            <feFuncB type="table" tableValues="0 0 0.05 0.4 0.9 1 1" />
          </feComponentTransfer>
          <feColorMatrix
            in="hicontrast"
            type="matrix"
            values="0.835 0 0 0 0.114
                    0.733 0 0 0 0.208
                    0.577 0 0 0 0.341
                    0     0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  )
}
