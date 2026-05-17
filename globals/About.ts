import type { GlobalConfig } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature
} from '@payloadcms/richtext-lexical'
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
          description: {
            ru: 'Биографический текст. Первый абзац — лид (отображается крупным шрифтом).',
            en: 'Biography body. First paragraph is the lead (rendered prominently).'
          },
          fields: [
            {
              name: 'body',
              type: 'richText',
              label: { ru: 'Текст биографии', en: 'Biography text' },
              localized: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature()
                ]
              }),
              admin: {
                description: {
                  ru: 'Биография. Поддерживаются заголовки H2/H3, списки, цитаты, ссылки, выделение. Первый абзац — лид (отображается крупным шрифтом).',
                  en: 'Biography. H2/H3 headings, lists, blockquotes, links, and emphasis are supported. First paragraph is the lead (rendered prominently).'
                }
              }
            }
          ]
        },
        {
          label: { ru: 'Визуал', en: 'Visuals' },
          description: {
            ru: 'Общие изображения для всех локалей: портрет и галерея.',
            en: 'Shared images across all locales: portrait and photo gallery.'
          },
          fields: [
            {
              name: 'portrait',
              type: 'group',
              label: { ru: 'Портрет', en: 'Portrait' },
              admin: {
                description: {
                  ru: 'Большой портрет в начале страницы «О режиссёре».',
                  en: 'Large portrait at the top of the About page.'
                }
              },
              fields: [
                {
                  name: 'src',
                  type: 'text',
                  label: { ru: 'Путь к фото', en: 'Image path' },
                  admin: {
                    description: {
                      ru: 'Главное портретное фото. Можно вписать вручную или нажать «Upload» в превью ниже. Путь в public/about/ или R2.',
                      en: 'Main portrait photo. Type manually or click "Upload" in the preview below. Path under public/about/ or R2.'
                    },
                    components: {
                      afterInput: [
                        '/components/admin/ImagePathPreview#ImagePathPreview'
                      ]
                    }
                  }
                },
                {
                  name: 'credit',
                  type: 'text',
                  label: { ru: 'Автор фото', en: 'Photo credit' },
                  admin: {
                    description: {
                      ru: 'Имя фотографа.',
                      en: 'Photographer name.'
                    }
                  }
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
              admin: {
                components: {
                  RowLabel: '/components/admin/GalleryRowLabel#default'
                },
                description: {
                  ru: 'Доп. фото для блока внизу страницы. Пустые элементы фильтруются на рендере.',
                  en: 'Extra photos for the bottom block. Empty entries are filtered at render time.'
                }
              },
              fields: [
                {
                  name: 'src',
                  type: 'text',
                  label: { ru: 'Путь к фото', en: 'Image path' },
                  admin: {
                    description: {
                      ru: 'Дополнительное фото. Можно вписать вручную или нажать «Upload» в превью ниже. Путь в public/about/ или R2.',
                      en: 'Additional photo. Type manually or click "Upload" in the preview below. Path under public/about/ or R2.'
                    },
                    components: {
                      afterInput: [
                        '/components/admin/ImagePathPreview#ImagePathPreview'
                      ]
                    }
                  }
                },
                {
                  name: 'credit',
                  type: 'text',
                  label: { ru: 'Автор фото', en: 'Photo credit' },
                  admin: {
                    description: {
                      ru: 'Имя фотографа.',
                      en: 'Photographer name.'
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          label: { ru: 'Хронология', en: 'Timeline' },
          description: {
            ru: 'Хронология вех и линия преемственности (учителя/школы).',
            en: 'Milestones timeline and lineage (teachers / schools).'
          },
          fields: [
            {
              name: 'milestones',
              type: 'array',
              label: { ru: 'Хронология', en: 'Timeline' },
              labels: {
                singular: { ru: 'Веха', en: 'Milestone' },
                plural: { ru: 'Хронология', en: 'Timeline' }
              },
              admin: {
                components: {
                  RowLabel: '/components/admin/MilestoneRowLabel#default'
                },
                description: {
                  ru: 'Биографическая таймлайн. Год + краткое описание на трёх языках.',
                  en: 'Biographical timeline. Year + short label per locale.'
                }
              },
              fields: [
                {
                  name: 'year',
                  type: 'number',
                  label: { ru: 'Год', en: 'Year' },
                  admin: {
                    description: {
                      ru: 'Год вехи. Опционально (для нечётких дат — пустой год, описание в подписи).',
                      en: 'Milestone year. Optional — leave blank and describe in label for fuzzy dates.'
                    }
                  }
                },
                {
                  name: 'label',
                  type: 'text',
                  label: { ru: 'Подпись', en: 'Label' },
                  localized: true,
                  admin: {
                    description: {
                      ru: 'Описание вехи в трёх локалях.',
                      en: 'Milestone description in all three locales.'
                    }
                  }
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
              admin: {
                components: {
                  RowLabel: '/components/admin/LineageRowLabel#default'
                },
                description: {
                  ru: 'Учителя и школы, к которым восходит работа Романа.',
                  en: "Teachers and schools Roman's work traces back to."
                }
              },
              fields: [
                {
                  name: 'key',
                  type: 'text',
                  label: { ru: 'Ключ', en: 'Key' },
                  admin: {
                    description: {
                      ru: 'Стабильный slug-ключ (например, kudashov, btk). Общий для всех локалей.',
                      en: 'Stable slug key (e.g. kudashov, btk). Shared across locales.'
                    }
                  }
                },
                {
                  name: 'name',
                  type: 'text',
                  label: { ru: 'Имя', en: 'Name' },
                  localized: true,
                  admin: {
                    description: {
                      ru: 'Имя учителя / организации в трёх локалях.',
                      en: 'Teacher / institution name in all three locales.'
                    }
                  }
                },
                {
                  name: 'role',
                  type: 'text',
                  label: { ru: 'Роль', en: 'Role' },
                  localized: true,
                  admin: {
                    description: {
                      ru: 'Роль / отношение (мастер, ректор и т. п.).',
                      en: 'Role / relationship (master, rector, etc.).'
                    }
                  }
                },
                {
                  name: 'institution',
                  type: 'text',
                  label: { ru: 'Учреждение', en: 'Institution' },
                  localized: true,
                  admin: {
                    description: {
                      ru: 'Название института / театра, если применимо.',
                      en: 'Institution / theatre, if applicable.'
                    }
                  }
                },
                {
                  name: 'note',
                  type: 'text',
                  label: { ru: 'Заметка', en: 'Note' },
                  localized: true,
                  admin: {
                    description: {
                      ru: 'Опциональная пометка о связи / влиянии.',
                      en: 'Optional note about the connection / influence.'
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          label: { ru: 'Заметки', en: 'Notes' },
          description: {
            ru: 'Короткие пометки на полях рядом с абзацами биографии.',
            en: 'Short notes alongside body paragraphs.'
          },
          fields: [
            {
              name: 'marginalia',
              type: 'array',
              label: { ru: 'Заметки', en: 'Notes' },
              labels: {
                singular: { ru: 'Заметка', en: 'Note' },
                plural: { ru: 'Заметки', en: 'Notes' }
              },
              admin: {
                components: {
                  RowLabel: '/components/admin/NoteRowLabel#default'
                },
                description: {
                  ru: 'Маленькие текстовые врезки в полях страницы «О режиссёре».',
                  en: 'Small textual notes in the margin of the About page.'
                }
              },
              fields: [
                {
                  name: 'note',
                  type: 'text',
                  label: { ru: 'Текст', en: 'Note text' },
                  localized: true,
                  admin: {
                    description: {
                      ru: 'Короткая пометка в трёх локалях.',
                      en: 'Short marginal note across three locales.'
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
