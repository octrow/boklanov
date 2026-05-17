import { fileURLToPath } from 'node:url'
import path from 'node:path'

import bundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'

const withBundleAnalyzer = bundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true'
})

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default withPayload(
  withNextIntl(
    withBundleAnalyzer({
      outputFileTracingRoot: __dirname,
      // `lib/content.ts` does fs.readFileSync(path.join('public/productions',
      // slug, 'lqip.json')) — the dynamic path makes Next's tracer drag the
      // entire public/productions/ tree (~210 MB of stills) into every
      // serverless function, blowing past Vercel's 250 MB limit. Public
      // assets are served by the CDN, not the function, so exclude media
      // while keeping lqip.json reachable for the SSR read.
      outputFileTracingExcludes: {
        '*': [
          'public/productions/**/*.{jpg,jpeg,png,webp,avif,gif,svg,mp4,mov,pdf}'
        ]
      },
      staticPageGenerationTimeout: 300,
      // gray-matter is CommonJS; let Node load it as-is on the server.
      serverExternalPackages: ['gray-matter'],
      images: {
        formats: ['image/avif', 'image/webp'],
        // Intermediate widths so 320px/420px poster cards aren't served from
        // the 640px deviceSize — was wasting ~50–70 KiB per LCP image.
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 320, 384, 420, 480],
        // Drop the 2048w/3840w slots — posters are display-cropped, those
        // tiers only inflate srcset payload without ever being picked.
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        // Allow lower-q variants for ProductionCard cover images.
        qualities: [60, 70, 75, 90],
        remotePatterns: [
          { protocol: 'https', hostname: 'cdn.boklanov.com' },
          { protocol: 'https', hostname: '*.r2.dev' }
        ]
      },
      // Vercel's preview deploys (`*.vercel.app`) ship with an automatic
      // `x-robots-tag: noindex` header — set only when the upstream response
      // doesn't already carry one. This branch's preview URL is the active
      // staging host for boklanov-rewrite, so we emit our own header to
      // override that default. Production (boklanov.com) doesn't get the
      // automatic noindex in the first place, so this is a no-op there.
      //
      // `/admin/*` is excluded via path-to-regexp negative lookahead — Payload
      // emits `<meta name="robots" content="noindex, nofollow">` in its admin
      // HTML, and we don't want the blanket override to contradict it. The
      // pattern below matches everything that doesn't start with `admin`.
      async headers() {
        return [
          {
            source: '/((?!admin(?:/|$)).*)',
            headers: [{ key: 'x-robots-tag', value: 'index, follow' }]
          },
          {
            source: '/admin/:path*',
            headers: [{ key: 'x-robots-tag', value: 'noindex, nofollow' }]
          },
          {
            source: '/admin',
            headers: [{ key: 'x-robots-tag', value: 'noindex, nofollow' }]
          }
        ]
      }
    })
  ),
  { devBundleServerPackages: false }
)
