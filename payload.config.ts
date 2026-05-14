/**
 * payload.config.ts — Payload 3 root config for boklanov.com
 *
 * Phase P1 install (see .design/boklanov-rewrite/PAYLOAD_MIGRATION_PLAN.md).
 * Lives at repo root; imported via the `@payload-config` alias added in
 * tsconfig.json so server entry points can `import config from '@payload-config'`.
 *
 * Storage:
 *   - Postgres (Neon) via @payloadcms/db-postgres
 *   - R2 via @payloadcms/storage-s3 (S3-compatible)
 *
 * Locales:
 *   - ru (default), en, de — matches existing i18n/routing.ts
 *
 * Editor: lexicalEditor() is mounted only for the optional `media.alt`
 * rich-text field; all production bodies stay as plain markdoc strings in
 * `textarea` per PAYLOAD_MIGRATION_PLAN §P2.3 Q1 default.
 */

import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Productions } from './collections/Productions'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { About } from './globals/About'
import { Contact } from './globals/Contact'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'CHANGE_ME_IN_ENV',
  serverURL:
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''),

  admin: {
    user: 'users',
    // `theme: 'all'` (default) keeps the light/dark switcher visible in
    // the admin header. Roman + Daniil both pick dark in practice, but
    // the toggle stays available for daylight editing or visual review.
    theme: 'all',
    meta: {
      titleSuffix: ' · boklanov.com'
    },
    livePreview: {
      // Matches DESIGN.md §6 public-site breakpoints — iPhone-15-class
      // 390 width, iPad portrait 768, desktop 1440. Inherited by both
      // Productions and About livePreview URLs.
      breakpoints: [
        { label: 'Mobile', name: 'm', width: 390, height: 800 },
        { label: 'Tablet', name: 't', width: 768, height: 1024 },
        { label: 'Desktop', name: 'd', width: 1440, height: 900 }
      ]
    }
  },

  // RU is the primary editor locale (Roman). The community-maintained pack
  // from @payloadcms/translations covers most chrome strings; missing keys
  // fall through to EN per Payload's standard merge behavior.
  i18n: {
    supportedLanguages: { ru, en },
    fallbackLanguage: 'en'
  },

  collections: [Productions, Media, Users],
  globals: [About, Contact],

  localization: {
    locales: [
      { label: 'Русский', code: 'ru' },
      { label: 'English', code: 'en' },
      { label: 'Deutsch', code: 'de' }
    ],
    defaultLocale: 'ru',
    fallback: true
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || ''
    }
  }),

  plugins: [
    s3Storage({
      collections: {
        media: {
          // Mirror the existing R2 key prefix so previously-uploaded images
          // stay accessible via NEXT_PUBLIC_CDN_BASE without any rewrites.
          prefix: 'productions'
        }
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
        },
        forcePathStyle: true
      }
    })
  ],

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts')
  }
})
