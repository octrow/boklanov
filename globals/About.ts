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
              label: { ru: 'Текст биографии', en: 'Biography text' },
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
              label: { ru: 'Портрет', en: 'Portrait' },
              fields: [
                {
                  name: 'src',
                  type: 'text',
                  label: { ru: 'Путь к фото', en: 'Image path' }
                },
                {
                  name: 'credit',
                  type: 'text',
                  label: { ru: 'Автор фото', en: 'Photo credit' }
                }
              ]
            },
            {
              name: 'photos',
              type: 'array',
              label: { ru: 'Фотографии', en: 'Photos' },
              labels: {
                singular: { ru: 'Фото', en: 'Photo' },
                plural: { ru: 'Фотографии', en: 'Photos' }
              },
              fields: [
                {
                  name: 'src',
                  type: 'text',
                  label: { ru: 'Путь к фото', en: 'Image path' }
                },
                {
                  name: 'credit',
                  type: 'text',
                  label: { ru: 'Автор фото', en: 'Photo credit' }
                }
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
              label: { ru: 'Таймлайн', en: 'Timeline' },
              labels: {
                singular: { ru: 'Веха', en: 'Milestone' },
                plural: { ru: 'Таймлайн', en: 'Timeline' }
              },
              fields: [
                {
                  name: 'year',
                  type: 'number',
                  label: { ru: 'Год', en: 'Year' }
                },
                {
                  name: 'label',
                  type: 'text',
                  label: { ru: 'Подпись', en: 'Label' },
                  localized: true
                }
              ]
            },
            {
              name: 'lineage',
              type: 'array',
              label: { ru: 'Преемственность', en: 'Lineage' },
              labels: {
                singular: { ru: 'Учитель', en: 'Mentor' },
                plural: { ru: 'Преемственность', en: 'Lineage' }
              },
              fields: [
                { name: 'key', type: 'text', label: { ru: 'Ключ', en: 'Key' } },
                {
                  name: 'name',
                  type: 'text',
                  label: { ru: 'Имя', en: 'Name' },
                  localized: true
                },
                {
                  name: 'role',
                  type: 'text',
                  label: { ru: 'Роль', en: 'Role' },
                  localized: true
                },
                {
                  name: 'institution',
                  type: 'text',
                  label: { ru: 'Учреждение', en: 'Institution' },
                  localized: true
                },
                {
                  name: 'note',
                  type: 'text',
                  label: { ru: 'Заметка', en: 'Note' },
                  localized: true
                }
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
              label: { ru: 'Маргиналии', en: 'Marginalia' },
              labels: {
                singular: { ru: 'Заметка', en: 'Note' },
                plural: { ru: 'Маргиналии', en: 'Marginalia' }
              },
              fields: [
                {
                  name: 'note',
                  type: 'text',
                  label: { ru: 'Текст', en: 'Note text' },
                  localized: true
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
