import type { CollectionConfig } from 'payload'

/**
 * Media — Payload upload collection backed by R2 via s3Storage plugin.
 *
 * Used only for new uploads coming through the admin (drag-and-drop on the
 * `about.visuals.portrait` field, etc). The bulk of existing production
 * imagery stays referenced by plain path strings on Productions.media.*.src
 * — those keys already live in R2 and are served via NEXT_PUBLIC_CDN_BASE.
 * See PAYLOAD_MIGRATION_PLAN §P2.5 Q2 default.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { ru: 'Изображение', en: 'Image' },
    plural: { ru: 'Изображения', en: 'Images' }
  },
  admin: {
    group: { ru: 'Медиатека', en: 'Media library' }
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user)
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    crop: true,
    // Pre-bake AVIF variants on upload so new admin uploads serve the same
    // breakpoints as the legacy R2 backfill (PAYLOAD_IMAGE_VARIANTS_PLAN.md
    // Track 1). Widths match the FeaturedStrip + detail-page `sizes`.
    imageSizes: [
      {
        name: 'w420',
        width: 420,
        position: 'centre',
        formatOptions: { format: 'avif', options: { quality: 55 } }
      },
      {
        name: 'w600',
        width: 600,
        position: 'centre',
        formatOptions: { format: 'avif', options: { quality: 58 } }
      },
      {
        name: 'w720',
        width: 720,
        position: 'centre',
        formatOptions: { format: 'avif', options: { quality: 55 } }
      },
      {
        name: 'w828',
        width: 828,
        position: 'centre',
        formatOptions: { format: 'avif', options: { quality: 55 } }
      },
      {
        name: 'w1080',
        width: 1080,
        position: 'centre',
        formatOptions: { format: 'avif', options: { quality: 52 } }
      }
    ],
    adminThumbnail: 'w420'
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: {
        description: {
          ru: 'Alt-текст для доступности и SEO. По локалям.',
          en: 'Accessibility / SEO alt text, per locale.'
        }
      }
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: { ru: 'Имя фотографа.', en: 'Photographer credit.' }
      }
    }
  ]
}
