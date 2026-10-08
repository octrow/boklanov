import type { GlobalConfig } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature
} from '@payloadcms/richtext-lexical'
import { revalidateAbout } from '../hooks/revalidate'
import { BODY_DROP_FEATURES } from '../collections/Productions'

/**
 * About — port of keystatic singleton `about`. Four tabs: Bio, Visuals,
 * Timeline, Margins (mapped 1:1 from keystatic.config.ts).
 */
export const About: GlobalConfig = {
  slug: 'about',
  label: { ru: 'Страница «О режиссёре»', en: 'About page' },
  admin: {
    hideAPIURL: true,
    group: { ru: 'Контент', en: 'Content' },
    components: {
      elements: {
        beforeDocumentControls: ['/components/admin/LocaleSwitch#default']
      }
    },
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
            ru: 'Текст биографии на всех трёх языках.',
            en: 'Biography text in all three languages.'
          },
          fields: [
            {
              name: 'body',
              type: 'richText',
              label: { ru: 'Текст биографии', en: 'Biography text' },
              localized: true,
              editor: lexicalEditor({
                // Mirrors Productions §RICHTEXT_ADMIN_CHROME — hides
                // Lexical's `+` gutter, drag handle, slash menu and
                // built-in placeholder so the field reads as a clean
                // text box. See PAYLOAD_ADMIN_UX_PLAN.md §Round-5.
                admin: {
                  hideGutter: true,
                  hideAddBlockButton: true,
                  hideDraggableBlockElement: true,
                  hideInsertParagraphAtEnd: true,
                  placeholder: ''
                },
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures.filter(
                    (f) => !BODY_DROP_FEATURES.has(f.key)
                  ),
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature()
                ]
              }),
              admin: {
                description: {
                  ru: 'Биография. Поддерживаются заголовки H2/H3, списки, цитаты, ссылки, выделение. Первый абзац — лид (отображается крупным шрифтом).',
                  en: 'Biography. H2/H3 headings, lists, blockquotes, links, and emphasis are supported. First paragraph is the lead (rendered prominently).'
                },
                components: {
                  afterInput: ['/components/admin/LocaleHint#default']
                }
              }
            }
          ]
        },
        {
          label: { ru: 'Визуал', en: 'Visuals' },
          description: {
            ru: 'Изображения общие для всех языков: портрет и галерея.',
            en: 'Images shared by all languages: portrait and photo gallery.'
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
                    className: 'image-path',
                    description: {
                      ru: 'Главное портретное фото.',
                      en: 'Main portrait photo.'
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
              name: 'shareImage',
              type: 'text',
              label: { ru: 'Превью для соцсетей', en: 'Share preview' },
              admin: {
                className: 'image-path',
                description: {
                  ru: 'Картинка, которую показывают Telegram, WhatsApp, VK и почта, когда пересылают ссылку на сайт. Подойдёт любое фото: сайт сам обрежет его до 1200×630, оставив самую заметную часть; горизонтальное фото обрежется меньше всего. Пусто — стандартный портрет. У спектаклей превью своё, из постера.',
                  en: 'Image shown by Telegram, WhatsApp, VK and mail clients when a site link is shared. Any photo works: the site crops it to 1200×630 around the most salient area; a landscape photo loses the least. Empty uses the default portrait. Productions keep their own poster-based preview.'
                },
                components: {
                  afterInput: [
                    '/components/admin/ImagePathPreview#ImagePathPreview'
                  ]
                }
              }
            },
            {
              name: 'photos',
              type: 'array',
              label: { ru: 'Фотографии', en: 'Photos' },
              labels: {
                singular: { ru: 'фото', en: 'Photo' },
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
                    className: 'image-path',
                    description: {
                      ru: 'Дополнительное фото.',
                      en: 'Additional photo.'
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
                singular: { ru: 'веху', en: 'Milestone' },
                plural: { ru: 'Хронология', en: 'Timeline' }
              },
              admin: {
                components: {
                  RowLabel: '/components/admin/MilestoneRowLabel#default'
                },
                description: {
                  ru: 'Хронология биографии: год и короткое описание.',
                  en: 'Biography timeline: year and a short description.'
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
                      ru: 'Что произошло в этот год.',
                      en: 'What happened that year.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
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
                singular: { ru: 'учителя', en: 'Mentor' },
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
                      ru: 'Короткий латинский ключ (например, kudashov, btk). Один для всех языков; после создания не менять.',
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
                      ru: 'Имя учителя или название организации.',
                      en: 'Teacher or institution name.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
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
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
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
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
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
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
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
                singular: { ru: 'заметку', en: 'Note' },
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
                      ru: 'Короткая пометка.',
                      en: 'Short note.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
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
