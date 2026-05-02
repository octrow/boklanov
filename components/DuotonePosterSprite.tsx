/* v3 §2.4 — SVG filter sprite. Two duotone filters injected once at root layout.
   Shadows → accent colour, highlights → warm paper. Bauhaus screen-print feel.
   IDs: duotone-v (vermillion #E63946), duotone-c (cobalt #1D3557).

   Softened 2026-05-03: removed the S-curve feComponentTransfer pre-step (it
   pushed mid-tones to extremes for dramatic effect, but read as too punchy).
   Restored linear luminance → duotone mapping. Mid-tones now land midway
   between accent and paper — gentler, slightly less saturated tint, closer
   to traditional screen-print register. Photos with strong dark/light
   distribution still tint clearly; mid-tone-dominant photos read as a
   washed pastel rather than a punched signal. */

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
          <feColorMatrix
            in="gray"
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
          <feColorMatrix
            in="gray"
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
