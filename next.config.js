import { fileURLToPath } from 'node:url'
import path from 'node:path'

import bundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'

const withBundleAnalyzer = bundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true'
})

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default withNextIntl(
  withBundleAnalyzer({
    outputFileTracingRoot: __dirname,
    // `lib/content.ts` does fs.readFileSync(path.join('public/productions',
    // slug, 'lqip.json')) — the dynamic path makes Next's tracer drag the
    // entire public/productions/ tree (~266 MB of stills) into every
    // serverless function, blowing past Vercel's 250 MB limit. Public
    // assets are served by the CDN, not the function, so exclude media
    // while keeping lqip.json reachable for the SSR read.
    outputFileTracingExcludes: {
      '*': [
        'public/productions/**/*.{jpg,jpeg,png,webp,avif,gif,svg,mp4,mov,pdf}'
      ]
    },
    // The OG route reads its satori fonts via fs + a dynamic node_modules
    // path, which the tracer can't follow — without this every /api/og/*
    // call 500s on Vercel with ENOENT.
    outputFileTracingIncludes: {
      '/api/og/**': [
        'node_modules/@fontsource/lora/files/*-400-normal.woff',
        'node_modules/@fontsource/jetbrains-mono/files/*-400-normal.woff'
      ]
    },
    staticPageGenerationTimeout: 300,
    // gray-matter is CommonJS; let Node load it as-is on the server.
    serverExternalPackages: ['gray-matter'],
    images: {
      formats: ['image/avif', 'image/webp'],
      remotePatterns: [
        { protocol: 'https', hostname: 'cdn.boklanov.com' },
        { protocol: 'https', hostname: '*.r2.dev' }
      ]
    }
  })
)
