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
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user)
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
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
