import bundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'

const withBundleAnalyzer = bundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true'
})

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

export default withNextIntl(withBundleAnalyzer({
  staticPageGenerationTimeout: 300,
  // gray-matter is CommonJS; let Node load it as-is on the server.
  serverExternalPackages: ['gray-matter'],
  images: {
    formats: ['image/avif', 'image/webp']
  }
}))
