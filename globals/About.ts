import type { GlobalConfig } from 'payload'
import { revalidateAbout } from '../hooks/revalidate'

/**
 * About — port of keystatic singleton `about`. Four tabs: Bio, Visuals,
 * Timeline, Margins (mapped 1:1 from keystatic.config.ts).
 */
export const About: GlobalConfig = {
  slug: 'about',
  label: { ru: 'Страница «О режиссёре»', en: 'About page' },
  admin: {
    group: { ru: 'Контент', en: 'Content' },
    livePreview: {
      url: ({ locale }) => `/${locale.code}/about`
    }
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user)
  },
  hooks: {
    afterChange: [revalidateAbout]
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { ru: 'Био', en: 'Bio' },
          fields: [
            {
              name: 'body',
              type: 'textarea',
              localized: true,
              admin: {
                description: {
                  ru: 'Биография. Markdown / markdoc. Первый абзац — лид.',
                  en: 'Biography. Markdown / markdoc. First paragraph is the lead.'
                }
              }
            }
          ]
        },
        {
          label: { ru: 'Визуал', en: 'Visuals' },
          fields: [
            {
              name: 'portrait',
              type: 'group',
              fields: [
                { name: 'src', type: 'text' },
                { name: 'credit', type: 'text' }
              ]
            },
            {
              name: 'photos',
              type: 'array',
              fields: [
                { name: 'src', type: 'text' },
                { name: 'credit', type: 'text' }
              ]
            }
          ]
        },
        {
          label: { ru: 'Таймлайн', en: 'Timeline' },
          fields: [
            {
              name: 'milestones',
              type: 'array',
              fields: [
                { name: 'year', type: 'number' },
                { name: 'label', type: 'text', localized: true }
              ]
            },
            {
              name: 'lineage',
              type: 'array',
              fields: [
                { name: 'key', type: 'text' },
                { name: 'name', type: 'text', localized: true },
                { name: 'role', type: 'text', localized: true },
                { name: 'institution', type: 'text', localized: true },
                { name: 'note', type: 'text', localized: true }
              ]
            }
          ]
        },
        {
          label: { ru: 'Маргиналии', en: 'Margins' },
          fields: [
            {
              name: 'marginalia',
              type: 'array',
              fields: [{ name: 'note', type: 'text', localized: true }]
            }
          ]
        }
      ]
    }
  ]
}
