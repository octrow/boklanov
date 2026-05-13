import type { CollectionConfig } from 'payload'

/**
 * Users — Roman (admin) + Daniil (admin). Two-person team, password auth
 * only (no email infra). Disable public signup by gating `create` to admins.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' }
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name']
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user)
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        description: {
          ru: 'Имя для отображения в шапке админки.',
          en: 'Display name shown in the admin header.'
        }
      }
    }
  ]
}
