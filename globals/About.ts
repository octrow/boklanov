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
          description: {
            ru: 'Биографический текст. Первый абзац — лид (отображается крупным шрифтом).',
            en: 'Biography body. First paragraph is the lead (rendered prominently).'
          },
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
                      ru: 'Главное портретное фото. Путь в public/about/ или R2.',
                      en: 'Main portrait photo. Path under public/about/ or R2.'
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
                      ru: 'Дополнительное фото. Путь в public/about/ или R2.',
                      en: 'Additional photo. Path under public/about/ or R2.'
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
          label: { ru: 'Таймлайн', en: 'Timeline' },
          description: {
            ru: 'Хронология вех и линия преемственности (учителя/школы).',
            en: 'Milestones timeline and lineage (teachers / schools).'
          },
          fields: [
            {
              name: 'milestones',
              type: 'array',
              label: { ru: 'Таймлайн', en: 'Timeline' },
              labels: {
                singular: { ru: 'Веха', en: 'Milestone' },
                plural: { ru: 'Таймлайн', en: 'Timeline' }
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
          label: { ru: 'Маргиналии', en: 'Margins' },
          description: {
            ru: 'Маргиналии — короткие пометки рядом с абзацами.',
            en: 'Marginalia — short notes alongside body paragraphs.'
          },
          fields: [
            {
              name: 'marginalia',
              type: 'array',
              label: { ru: 'Маргиналии', en: 'Marginalia' },
              labels: {
                singular: { ru: 'Заметка', en: 'Note' },
                plural: { ru: 'Маргиналии', en: 'Marginalia' }
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
