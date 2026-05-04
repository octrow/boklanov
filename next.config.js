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
