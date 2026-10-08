import type { CollectionConfig } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature
} from '@payloadcms/richtext-lexical'
import {
  revalidateProduction,
  revalidateProductionDelete
} from '../hooks/revalidate'
import { posterDims } from '../hooks/posterDims'

// Block-shaped Lexical features stripped from inline-only richText
// fields (tagline / synopsis / directorsNote). Removing all of these
// also removes the `+` block-insert gutter glyph and the bottom
// toolbar, giving the fields a clean text-input look.
// See PAYLOAD_ADMIN_UX_PLAN.md §Round-2 R3 + §B.1.
const INLINE_ONLY_DROP_FEATURES = new Set([
  'heading',
  'align',
  'indent',
  'unorderedList',
  'orderedList',
  'checklist',
  'relationship',
  'blockquote',
  'upload',
  'horizontalRule'
])

// Shared admin block applied to every richText field on this collection
// — hides Payload Lexical's gutter `+`, drag handle, slash command UI
// and the "Начните печатать…" placeholder. Pillstrip + label + hint
// chrome lives outside the editor body (see Round-5 in
// PAYLOAD_ADMIN_UX_PLAN.md + app/(payload)/custom.scss). Documented
// in node_modules/@payloadcms/richtext-lexical/dist/types.d.ts §LexicalFieldAdminProps.
const RICHTEXT_ADMIN_CHROME = {
  hideGutter: true,
  hideAddBlockButton: true,
  hideDraggableBlockElement: true,
  hideInsertParagraphAtEnd: true,
  placeholder: ''
} as const

/**
 * Productions — direct port of keystatic.config.ts collection `productions`.
 *
 * Mapping rules (PAYLOAD_MIGRATION_PLAN §P2):
 *   - top-level scalars (slug, year, durationMin, status) stay top-level so
 *     admin list view shows them via defaultColumns
 *   - locale-keyed Keystatic fields → `localized: true` text/textarea
 *   - fields.markdoc.inline + fields.mdx → textarea (markdoc string)
 *   - image paths stay as plain text strings — existing R2 keys preserved
 *   - every group from keystatic.config.ts becomes a `type: 'group'` here
 */
export const Productions: CollectionConfig = {
  slug: 'productions',
  labels: {
    singular: { ru: 'Спектакль', en: 'Production' },
    plural: { ru: 'Спектакли', en: 'Productions' }
  },
  admin: {
    // ponytail: the document heading stays the slug: useAsTitle can't be a
    // nested field. A top-level title copy (migration + backfill) fixes it.
    useAsTitle: 'slug',
    listSearchableFields: ['identity.title', 'slug'],
    pagination: { defaultLimit: 50 },
    defaultColumns: [
      'media.poster.src',
      'identity.title',
      'production.year',
      'status',
      'settings.featured'
    ],
    hideAPIURL: true,
    components: {
      edit: {
        beforeDocumentControls: ['/components/admin/LocaleSwitch#default']
      },
      beforeListTable: ['/components/admin/SearchPlaceholder#default']
    },
    group: { ru: 'Контент', en: 'Content' },
    livePreview: {
      url: ({ data, locale }) => {
        const slug = (data as { slug?: string })?.slug ?? ''
        return `/${locale.code}/productions/${slug}`
      }
    },
    description: {
      ru: 'Все спектакли. Нажмите на строку, чтобы открыть спектакль.',
      en: 'All productions. Click a row to open it.'
    }
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user)
  },
  hooks: {
    beforeChange: [posterDims],
    afterChange: [revalidateProduction],
    afterDelete: [revalidateProductionDelete]
  },
  fields: [
    // ── Tabs ─────────────────────────────────────────────────────────────
    // Layout-only `type: 'tabs'` (unnamed) wraps everything below so the
    // form reads as a tab strip, not a 10 000-px scroll. Inner groups keep
    // their `name` keys → Postgres column shape is unchanged and
    // lib/content.ts reads the same doc shape. The four list-view scalars
    // (slug, year, durationMin, status) live INSIDE the tab they
    // semantically belong to but stay top-level keys at storage time
    // because unnamed tabs don't reshape data. defaultColumns +
    // useAsTitle continue to resolve them by their flat names. See
    // PAYLOAD_POLISH_PLAN.md §2.1 + risk note.
    {
      type: 'tabs',
      tabs: [
        {
          label: { ru: 'Основное', en: 'Main' },
          description: {
            ru: 'Название, полный текст, подзаголовок, синопсис и записка режиссёра.',
            en: "Title, body, tagline, synopsis, and director's note."
          },
          fields: [
            {
              name: 'identity',
              type: 'group',
              label: { ru: 'Текст', en: 'Content' },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: { ru: 'Название', en: 'Title' },
                  localized: true,
                  required: true,
                  admin: {
                    description: {
                      ru: 'Название спектакля. Показывается в карточке, на странице и в заголовке вкладки браузера.',
                      en: 'Production title. Shown on cards, the page, and the browser tab title.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default'],
                      Cell: '/components/admin/ListCells#TitleCell',
                      Label: '/components/admin/ListCells#PlainLabel'
                    }
                  }
                },
                {
                  name: 'body',
                  type: 'richText',
                  label: { ru: 'Полный текст', en: 'Body text' },
                  localized: true,
                  editor: lexicalEditor({
                    admin: RICHTEXT_ADMIN_CHROME,
                    features: ({ defaultFeatures }) => [
                      ...defaultFeatures,
                      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                      FixedToolbarFeature(),
                      InlineToolbarFeature()
                    ]
                  }),
                  admin: {
                    description: {
                      ru: 'Полный редакторский текст. Поддерживаются заголовки H2/H3, списки, цитаты, ссылки, выделение.',
                      en: 'Full editorial body. H2/H3 headings, lists, blockquotes, links, and emphasis are supported.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
                    }
                  }
                },
                {
                  name: 'tagline',
                  type: 'richText',
                  label: { ru: 'Подзаголовок', en: 'Tagline' },
                  localized: true,
                  editor: lexicalEditor({
                    // Inline-only: strip every block-shaped feature so
                    // Lexical's BlockInsert plugin has nothing to offer
                    // and the `+` gutter glyph / bottom toolbar
                    // disappear. PAYLOAD_ADMIN_UX_PLAN.md §Round-2 R3 +
                    // §B.1. Feature keys captured from
                    // node_modules/@payloadcms/richtext-lexical default.js.
                    features: ({ defaultFeatures }) =>
                      defaultFeatures.filter(
                        (f) => !INLINE_ONLY_DROP_FEATURES.has(f.key)
                      )
                  }),
                  admin: {
                    description: {
                      ru: 'Короткая строка-крючок (≤80 символов) под заголовком. Поддерживается жирный, курсив, ссылки.',
                      en: 'Short hook line (≤80 chars) under the title. Bold, italic, and links supported.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
                    }
                  }
                },
                {
                  name: 'synopsis',
                  type: 'richText',
                  label: { ru: 'Синопсис', en: 'Synopsis' },
                  localized: true,
                  editor: lexicalEditor({
                    admin: RICHTEXT_ADMIN_CHROME,
                    features: ({ defaultFeatures }) =>
                      defaultFeatures.filter(
                        (f) => !INLINE_ONLY_DROP_FEATURES.has(f.key)
                      )
                  }),
                  admin: {
                    description: {
                      ru: 'Одно-два предложения, показываются на карточках спектаклей и в результатах поиска. 50–200 знаков. Поддерживается жирный, курсив, ссылки.',
                      en: 'One-or-two-sentence pitch shown on production cards and in search results. 50–200 chars. Bold, italic, and links supported.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
                    }
                  }
                },
                {
                  name: 'directorsNote',
                  type: 'richText',
                  label: { ru: 'Записка режиссёра', en: "Director's note" },
                  localized: true,
                  editor: lexicalEditor({
                    admin: RICHTEXT_ADMIN_CHROME,
                    features: ({ defaultFeatures }) =>
                      defaultFeatures.filter(
                        (f) => !INLINE_ONLY_DROP_FEATURES.has(f.key)
                      )
                  }),
                  admin: {
                    description: {
                      ru: 'Слова Романа — на странице показываются как цитата. Поддерживается жирный, курсив, ссылки.',
                      en: "Roman's words — shown as a quote on the page. Bold, italic, and links supported."
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
                    }
                  }
                }
              ]
            },
            {
              name: 'slug',
              type: 'text',
              label: { ru: 'URL-слаг', en: 'URL slug' },
              required: true,
              unique: true,
              index: true,
              admin: {
                description: {
                  ru: 'Адрес страницы: boklanov.com/productions/<слаг>. Только латиница в нижнем регистре и дефисы. После публикации лучше не менять — старые ссылки перестанут работать.',
                  en: "Folder name in content/productions/. Lowercase + dashes only. Avoid changing after publish — it's part of the live URL."
                }
              }
            }
          ]
        },
        {
          label: { ru: 'Медиа', en: 'Media' },
          description: {
            ru: 'Постер, обложки, галерея и видео.',
            en: 'Poster, cover overrides, gallery photos, and embedded videos.'
          },
          fields: [
            {
              name: 'media',
              type: 'group',
              label: { ru: 'Медиа', en: 'Media' },
              fields: [
                {
                  name: 'poster',
                  type: 'group',
                  label: { ru: 'Постер', en: 'Poster' },
                  admin: {
                    description: {
                      ru: 'Главное изображение спектакля — на карточках, на странице и в превью ссылки в мессенджерах.',
                      en: 'Primary image — used on cards, the production page, and the OG preview.'
                    }
                  },
                  fields: [
                    {
                      name: 'src',
                      type: 'text',
                      label: { ru: 'Постер', en: 'Poster image' },
                      admin: {
                        description: {
                          ru: 'Путь к постеру. Нажмите «Загрузить» под полем или впишите путь вручную. Пример: /productions/bury-me-behind-the-baseboard/poster.jpg',
                          en: 'Path to the poster. Click "Загрузить" under the field or type the path. e.g. /productions/bury-me-behind-the-baseboard/poster.jpg'
                        },
                        components: {
                          afterInput: [
                            '/components/admin/ImagePathPreview#ImagePathPreview'
                          ],
                          Cell: '/components/admin/ListCells#PosterCell',
                          Label: '/components/admin/ListCells#PlainLabel'
                        }
                      }
                    },
                    // Pixel size, filled by the posterDims hook when src
                    // changes; the page reserves this box before load.
                    { name: 'width', type: 'number', admin: { hidden: true } },
                    { name: 'height', type: 'number', admin: { hidden: true } },
                    {
                      name: 'credit',
                      type: 'text',
                      label: { ru: 'Автор фото', en: 'Photo credit' },
                      admin: {
                        description: {
                          ru: 'Имя фотографа. Показывается мелким шрифтом под изображением.',
                          en: 'Photographer name. Rendered in small print under the image.'
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'productionsPhoto',
                  type: 'group',
                  label: { ru: 'Обложка для каталога', en: 'Catalogue cover' },
                  admin: {
                    description: {
                      ru: 'Опциональная замена постера специально для карточки на /productions. Если не задана — используется постер.',
                      en: 'Optional override for the /productions card only. Falls back to the poster when blank.'
                    }
                  },
                  fields: [
                    {
                      name: 'src',
                      type: 'text',
                      label: {
                        ru: 'Обложка для каталога',
                        en: 'Catalogue cover image'
                      },
                      admin: {
                        description: {
                          ru: 'Заменяет постер на карточке в каталоге спектаклей. Нажмите «Загрузить» под полем или впишите путь вручную. Пример: /productions/{slug}/cover.webp',
                          en: 'Replaces the poster on the catalogue card. Click "Загрузить" under the field or type the path. e.g. /productions/{slug}/cover.webp'
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
                          ru: 'Имя фотографа для этой обложки.',
                          en: 'Photographer credit for this cover.'
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'featuredPhoto',
                  type: 'group',
                  label: { ru: 'Обложка для главной', en: 'Homepage cover' },
                  admin: {
                    description: {
                      ru: 'Необязательно. Заменяет картинку спектакля на главной. Если пусто — берётся обложка для каталога, а если и её нет — постер.',
                      en: 'Optional. Replaces the production image on the homepage. Falls back to the catalogue cover, then the poster.'
                    }
                  },
                  fields: [
                    {
                      name: 'src',
                      type: 'text',
                      label: {
                        ru: 'Обложка для главной',
                        en: 'Homepage cover image'
                      },
                      admin: {
                        description: {
                          ru: 'Заменяет картинку спектакля на главной. Нажмите «Загрузить» под полем или впишите путь вручную.',
                          en: 'Replaces the production image on the homepage.'
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
                          ru: 'Имя фотографа для этой обложки.',
                          en: 'Photographer credit for this cover.'
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'gallery',
                  type: 'array',
                  label: { ru: 'Галерея', en: 'Gallery' },
                  labels: {
                    singular: { ru: 'Фото', en: 'Photo' },
                    plural: { ru: 'Галерея', en: 'Gallery' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/GalleryRowLabel#default'
                    },
                    description: {
                      ru: 'Фотографии спектакля. Порядок здесь = порядок на странице.',
                      en: 'Extra production photos. Order here = order on the page.'
                    }
                  },
                  fields: [
                    {
                      name: 'src',
                      type: 'text',
                      label: { ru: 'Путь к фото', en: 'Image path' },
                      admin: {
                        description: {
                          ru: 'Путь к изображению. Нажмите «Загрузить» под полем или впишите путь вручную. Пример: /productions/{slug}/01.jpg',
                          en: 'Path to the image. Click "Загрузить" under the field or type the path. e.g. /productions/{slug}/01.jpg'
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
                    },
                    {
                      name: 'caption',
                      type: 'text',
                      label: { ru: 'Подпись', en: 'Caption' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Подпись к изображению. Доступна как alt-текст для скринридеров.',
                          en: 'Per-locale caption. Doubles as alt text for screen readers.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'videos',
                  type: 'array',
                  label: { ru: 'Видео', en: 'Videos' },
                  labels: {
                    singular: { ru: 'Видео', en: 'Video' },
                    plural: { ru: 'Видео', en: 'Videos' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/VideoRowLabel#default'
                    },
                    description: {
                      ru: 'Видео на странице спектакля.',
                      en: 'Embedded videos on the production page.'
                    }
                  },
                  fields: [
                    {
                      name: 'provider',
                      type: 'select',
                      label: { ru: 'Платформа', en: 'Platform' },
                      defaultValue: 'youtube',
                      admin: {
                        description: {
                          ru: 'Платформа видео.',
                          en: 'Video platform.'
                        }
                      },
                      options: [
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'Vimeo', value: 'vimeo' }
                      ]
                    },
                    {
                      name: 'id',
                      type: 'text',
                      label: { ru: 'ID видео', en: 'Video ID' },
                      admin: {
                        description: {
                          ru: 'Только ID, без полного URL. Пример: 1GWFJ0jfPq4 (а не https://youtube.com/watch?v=1GWFJ0jfPq4).',
                          en: 'Just the ID, not the full URL. e.g. 1GWFJ0jfPq4 (not https://youtube.com/watch?v=1GWFJ0jfPq4).'
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: 'О постановке', en: 'About' },
          description: {
            ru: 'Театр-производитель, дата и год премьеры, длительность, возрастной рейтинг и билеты.',
            en: 'Producing theatre, premiere date, year, duration, age rating, and tickets.'
          },
          fields: [
            {
              name: 'production',
              type: 'group',
              label: { ru: 'Постановка', en: 'Production details' },
              fields: [
                {
                  name: 'premiereDate',
                  type: 'text',
                  label: { ru: 'Дата премьеры', en: 'Premiere date' },
                  localized: true,
                  admin: {
                    description: {
                      ru: 'Дата премьеры свободным текстом — допускаются «весна 2021», «Spring 2021», «март 2021».',
                      en: 'Free-form premiere date — fuzzy values like "Spring 2021" or "March 2021" are fine.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
                    }
                  }
                },
                {
                  name: 'ageRating',
                  type: 'text',
                  label: { ru: 'Возраст', en: 'Age rating' },
                  admin: {
                    description: {
                      ru: 'Возрастное ограничение по российскому стандарту: 0+, 6+, 12+, 16+, 18+.',
                      en: 'Russian-standard age rating: 0+, 6+, 12+, 16+, 18+.'
                    }
                  }
                },
                {
                  name: 'ticketsUrl',
                  type: 'text',
                  label: { ru: 'Билеты', en: 'Tickets URL' },
                  admin: {
                    description: {
                      ru: 'Публичная страница покупки билетов (если есть). Обязательно с https://',
                      en: 'Public ticketing page if one exists. Must include https://'
                    }
                  }
                },
                {
                  name: 'year',
                  type: 'number',
                  label: { ru: 'Год премьеры', en: 'Premiere year' },
                  min: 1900,
                  max: 2100,
                  index: true,
                  admin: {
                    components: {
                      Cell: '/components/admin/ListCells#YearCell',
                      Label: '/components/admin/ListCells#PlainLabel'
                    },
                    description: {
                      ru: 'Числовой год — используется для сортировки и в карточках.',
                      en: 'Numeric year used for sort and display on cards.'
                    }
                  }
                },
                {
                  name: 'durationMin',
                  type: 'number',
                  label: { ru: 'Длительность (мин)', en: 'Duration (min)' },
                  admin: {
                    description: {
                      ru: 'Длительность спектакля в минутах, с антрактом. Опционально.',
                      en: 'Performance length in minutes including intermission. Optional.'
                    }
                  }
                },
                {
                  name: 'theatre',
                  type: 'group',
                  label: { ru: 'Театр', en: 'Theatre' },
                  admin: {
                    description: {
                      ru: 'Театр-производитель премьеры. Не путать с площадками гастролей (см. «Гастроли» / «История площадок»).',
                      en: 'Producing theatre for the premiere. Not the touring venues (see Tour cities / Runs).'
                    }
                  },
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      label: { ru: 'Театр', en: 'Theatre name' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Полное название театра.',
                          en: 'Full theatre name.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'shortName',
                      type: 'text',
                      label: { ru: 'Кратко', en: 'Short name' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Сокращённое название (если есть). Используется в плотных списках.',
                          en: 'Shortened name (if any). Used in dense lists.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'city',
                      type: 'text',
                      label: { ru: 'Город', en: 'City' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Город, где находится театр-производитель премьеры.',
                          en: 'City where the producing theatre is based.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'country',
                      type: 'select',
                      label: { ru: 'Страна', en: 'Country' },
                      options: [
                        {
                          value: 'AT',
                          label: { ru: 'Австрия', en: 'Austria' }
                        },
                        {
                          value: 'BY',
                          label: { ru: 'Беларусь', en: 'Belarus' }
                        },
                        {
                          value: 'GB',
                          label: { ru: 'Великобритания', en: 'United Kingdom' }
                        },
                        {
                          value: 'DE',
                          label: { ru: 'Германия', en: 'Germany' }
                        },
                        { value: 'ES', label: { ru: 'Испания', en: 'Spain' } },
                        { value: 'IT', label: { ru: 'Италия', en: 'Italy' } },
                        {
                          value: 'KZ',
                          label: { ru: 'Казахстан', en: 'Kazakhstan' }
                        },
                        {
                          value: 'KG',
                          label: { ru: 'Киргизия', en: 'Kyrgyzstan' }
                        },
                        { value: 'LV', label: { ru: 'Латвия', en: 'Latvia' } },
                        {
                          value: 'LT',
                          label: { ru: 'Литва', en: 'Lithuania' }
                        },
                        {
                          value: 'LU',
                          label: { ru: 'Люксембург', en: 'Luxembourg' }
                        },
                        {
                          value: 'NL',
                          label: { ru: 'Нидерланды', en: 'Netherlands' }
                        },
                        { value: 'PL', label: { ru: 'Польша', en: 'Poland' } },
                        {
                          value: 'PT',
                          label: { ru: 'Португалия', en: 'Portugal' }
                        },
                        { value: 'RU', label: { ru: 'Россия', en: 'Russia' } },
                        {
                          value: 'UZ',
                          label: { ru: 'Узбекистан', en: 'Uzbekistan' }
                        },
                        {
                          value: 'UA',
                          label: { ru: 'Украина', en: 'Ukraine' }
                        },
                        {
                          value: 'FI',
                          label: { ru: 'Финляндия', en: 'Finland' }
                        },
                        { value: 'FR', label: { ru: 'Франция', en: 'France' } },
                        { value: 'CZ', label: { ru: 'Чехия', en: 'Czechia' } },
                        {
                          value: 'CH',
                          label: { ru: 'Швейцария', en: 'Switzerland' }
                        },
                        { value: 'EE', label: { ru: 'Эстония', en: 'Estonia' } }
                      ],
                      admin: {
                        description: {
                          ru: 'Страна театра. Если нужной страны нет в списке, напишите Даниилу.',
                          en: 'Country of the theatre. If it is missing from the list, ask Daniil.'
                        }
                      }
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: { ru: 'Сайт театра', en: 'Theatre website' },
                      admin: {
                        description: {
                          ru: 'Публичный сайт театра. Обязательно с https://',
                          en: 'Public website of the theatre. Must include https://'
                        }
                      }
                    },
                    {
                      name: 'year',
                      type: 'number',
                      label: { ru: 'Год', en: 'Year' },
                      admin: {
                        description: {
                          ru: 'Год основания театра. Опционально.',
                          en: 'Year the theatre was founded. Optional.'
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: 'Жанр и теги', en: 'Genre & tags' },
          description: {
            ru: 'Роли Романа, жанр, традиция и свободные теги.',
            en: "Roman's roles, form/genre, lineage, and free-form tags."
          },
          fields: [
            {
              name: 'taxonomy',
              type: 'group',
              label: { ru: 'Жанр и теги', en: 'Genre & tags' },
              fields: [
                {
                  name: 'role',
                  type: 'select',
                  label: { ru: 'Роли Романа', en: "Roman's roles" },
                  hasMany: true,
                  admin: {
                    description: {
                      ru: 'Роли Романа в этом спектакле. Множественный выбор из закрытого списка.',
                      en: "Roman's roles in this production. Multi-select from a closed list."
                    }
                  },
                  options: [
                    {
                      label: { ru: 'Режиссёр', en: 'Director' },
                      value: 'director'
                    },
                    {
                      label: { ru: 'Со-режиссёр', en: 'Co-director' },
                      value: 'co-director'
                    },
                    {
                      label: { ru: 'Исполнитель', en: 'Performer' },
                      value: 'performer'
                    },
                    {
                      label: { ru: 'Худрук', en: 'Art director' },
                      value: 'art-director'
                    },
                    {
                      label: { ru: 'Драматург', en: 'Playwright' },
                      value: 'playwright'
                    },
                    {
                      label: { ru: 'Продюсер', en: 'Producer' },
                      value: 'producer'
                    }
                  ]
                },
                {
                  name: 'form',
                  type: 'array',
                  label: { ru: 'Форма', en: 'Form' },
                  labels: {
                    singular: { ru: 'Форму', en: 'Form' },
                    plural: { ru: 'Форма', en: 'Form' }
                  },
                  fields: [
                    {
                      name: 'value',
                      type: 'text',
                      label: { ru: 'Значение', en: 'Value' }
                    }
                  ],
                  admin: {
                    components: {
                      RowLabel: '/components/admin/ValueRowLabel#default'
                    },
                    description: {
                      ru: 'Жанр / форма спектакля. Свободный текст — можно вводить любой тег. Устоявшиеся: solo, puppet, theater, family, festival, reading.',
                      en: 'Theatrical form / genre. Free-form — type any tag. Established values: solo, puppet, theater, family, festival, reading.'
                    }
                  }
                },
                {
                  name: 'lineage',
                  type: 'array',
                  label: { ru: 'Школа', en: 'Lineage' },
                  labels: {
                    singular: { ru: 'Школу', en: 'Lineage' },
                    plural: { ru: 'Школа', en: 'Lineage' }
                  },
                  fields: [
                    {
                      name: 'value',
                      type: 'text',
                      label: { ru: 'Значение', en: 'Value' }
                    }
                  ],
                  admin: {
                    components: {
                      RowLabel: '/components/admin/ValueRowLabel#default'
                    },
                    description: {
                      ru: 'Традиция или школа, к которой восходит спектакль. Свободный текст. Устоявшиеся: btk, kudashov, rgisi.',
                      en: 'Tradition or school the production traces back to. Free-form. Established values: btk, kudashov, rgisi.'
                    }
                  }
                },
                {
                  name: 'tags',
                  type: 'array',
                  label: { ru: 'Теги', en: 'Tags' },
                  labels: {
                    singular: { ru: 'Тег', en: 'Tag' },
                    plural: { ru: 'Теги', en: 'Tags' }
                  },
                  fields: [
                    {
                      name: 'value',
                      type: 'text',
                      label: { ru: 'Тег', en: 'Tag' }
                    }
                  ],
                  admin: {
                    components: {
                      RowLabel: '/components/admin/ValueRowLabel#default'
                    },
                    description: {
                      ru: 'Произвольные ключевые слова для поиска и фильтрации. Отличается от формы (жанр) и школы (традиция).',
                      en: 'Free-form keywords surfaced on listing/search. Distinct from form (genre) and lineage (tradition).'
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          label: { ru: 'Команда', en: 'Team' },
          description: {
            ru: 'Команда и состав. Видимый список зависит от языка вверху страницы: RU/EN/DE показывает свой список, ALL — все три сразу.',
            en: 'Cast & crew. Visible list follows the locale pill at the top: RU/EN/DE shows that locale only; ALL shows all three side-by-side.'
          },
          fields: [
            {
              name: 'team',
              type: 'group',
              label: { ru: 'Команда', en: 'Team' },
              fields: [
                {
                  // Three parallel arrays — see keystatic.config.ts §Credits comment
                  // for why we don't unify them: role labels here are free RU phrases.
                  // The `team-credits-locale--*` className + body-level
                  // `data-active-locale` attribute let `app/(payload)/custom.scss`
                  // hide the non-matching arrays in switch mode while still
                  // showing all three in `all` mode. See
                  // PAYLOAD_ADMIN_UX_PLAN.md §Round-2 R4 (Option B).
                  name: 'creditsRu',
                  type: 'array',
                  label: { ru: 'Команда (RU)', en: 'Team (RU)' },
                  labels: {
                    singular: { ru: 'Строку', en: 'Row' },
                    plural: { ru: 'Команда (RU)', en: 'Team (RU)' }
                  },
                  admin: {
                    className: 'team-credits-locale team-credits-locale--ru',
                    components: {
                      RowLabel: '/components/admin/CreditRowLabel#default'
                    }
                  },
                  fields: [
                    {
                      name: 'role',
                      type: 'text',
                      label: { ru: 'Роль', en: 'Role' }
                    },
                    {
                      name: 'name',
                      type: 'text',
                      label: { ru: 'Имя', en: 'Name' }
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: { ru: 'Ссылка', en: 'URL' }
                    }
                  ]
                },
                {
                  name: 'creditsEn',
                  type: 'array',
                  label: { ru: 'Команда (EN)', en: 'Team (EN)' },
                  labels: {
                    singular: { ru: 'Строку', en: 'Row' },
                    plural: { ru: 'Команда (EN)', en: 'Team (EN)' }
                  },
                  admin: {
                    className: 'team-credits-locale team-credits-locale--en',
                    components: {
                      RowLabel: '/components/admin/CreditRowLabel#default'
                    }
                  },
                  fields: [
                    {
                      name: 'role',
                      type: 'text',
                      label: { ru: 'Роль', en: 'Role' }
                    },
                    {
                      name: 'name',
                      type: 'text',
                      label: { ru: 'Имя', en: 'Name' }
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: { ru: 'Ссылка', en: 'URL' }
                    }
                  ]
                },
                {
                  name: 'creditsDe',
                  type: 'array',
                  label: { ru: 'Команда (DE)', en: 'Team (DE)' },
                  labels: {
                    singular: { ru: 'Строку', en: 'Row' },
                    plural: { ru: 'Команда (DE)', en: 'Team (DE)' }
                  },
                  admin: {
                    className: 'team-credits-locale team-credits-locale--de',
                    components: {
                      RowLabel: '/components/admin/CreditRowLabel#default'
                    }
                  },
                  fields: [
                    {
                      name: 'role',
                      type: 'text',
                      label: { ru: 'Роль', en: 'Role' }
                    },
                    {
                      name: 'name',
                      type: 'text',
                      label: { ru: 'Имя', en: 'Name' }
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: { ru: 'Ссылка', en: 'URL' }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: 'Награды и пресса', en: 'Awards & press' },
          description: {
            ru: 'Награды, фестивали, рецензии и внешние ссылки.',
            en: 'Awards, festivals, press coverage, and external links.'
          },
          fields: [
            {
              name: 'recognition',
              type: 'group',
              label: { ru: 'Награды и пресса', en: 'Awards & press' },
              fields: [
                {
                  name: 'awards',
                  type: 'array',
                  label: { ru: 'Награды', en: 'Awards' },
                  labels: {
                    singular: { ru: 'Награду', en: 'Award' },
                    plural: { ru: 'Награды', en: 'Awards' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/NameYearRowLabel#default'
                    },
                    description: {
                      ru: 'Победы и номинации. Для участия без награды — раздел «Фестивали» ниже.',
                      en: 'Wins or nominations. Use Festivals for participation without an award.'
                    }
                  },
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      label: { ru: 'Название', en: 'Name' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Название премии или номинации.',
                          en: 'Name of the award or nomination.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'year',
                      type: 'number',
                      label: { ru: 'Год', en: 'Year' },
                      admin: {
                        description: {
                          ru: 'Год получения премии. Опционально.',
                          en: 'Year the award was received. Optional.'
                        }
                      }
                    },
                    {
                      name: 'category',
                      type: 'text',
                      label: { ru: 'Номинация', en: 'Category' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Номинация / категория. Если конкретный человек — пиши «За лучшую мужскую роль — Максим Морозов».',
                          en: 'Award category. If a specific person — phrase as "Best male performance — Maksim Morozov".'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'city',
                      type: 'text',
                      label: { ru: 'Город', en: 'City' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Город вручения.',
                          en: 'City where the award was given.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: { ru: 'Ссылка', en: 'URL' },
                      admin: {
                        description: {
                          ru: 'Ссылка на страницу премии/анонс.',
                          en: 'Link to the award page or announcement.'
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'festivals',
                  type: 'array',
                  label: { ru: 'Фестивали', en: 'Festivals' },
                  labels: {
                    singular: { ru: 'Фестиваль', en: 'Festival' },
                    plural: { ru: 'Фестивали', en: 'Festivals' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/NameYearRowLabel#default'
                    },
                    description: {
                      ru: 'Участия в фестивалях без награды. Награды — в разделе «Награды» выше.',
                      en: 'Festival selections / programmes without an award. Awards belong above.'
                    }
                  },
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      label: { ru: 'Название', en: 'Name' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Название фестиваля.',
                          en: 'Name of the festival.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'year',
                      type: 'number',
                      label: { ru: 'Год', en: 'Year' },
                      admin: {
                        description: {
                          ru: 'Год участия. Опционально.',
                          en: 'Year of participation. Optional.'
                        }
                      }
                    },
                    {
                      name: 'category',
                      type: 'text',
                      label: { ru: 'Номинация', en: 'Category' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Программа / секция фестиваля.',
                          en: 'Festival programme or section.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'city',
                      type: 'text',
                      label: { ru: 'Город', en: 'City' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Город фестиваля.',
                          en: 'Festival city.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'press',
                  type: 'array',
                  label: { ru: 'Пресса', en: 'Press' },
                  labels: {
                    singular: { ru: 'Публикацию', en: 'Press item' },
                    plural: { ru: 'Пресса', en: 'Press' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/PressRowLabel#default'
                    },
                    description: {
                      ru: 'Рецензии и интервью. Один элемент — одна публикация: издание + заголовок + ссылка.',
                      en: 'Reviews and interviews. Each item is one publication — outlet name + headline + link.'
                    }
                  },
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      label: { ru: 'Заголовок', en: 'Title' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Заголовок публикации.',
                          en: 'Article headline.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: { ru: 'Ссылка', en: 'URL' },
                      admin: {
                        description: {
                          ru: 'Прямая ссылка на статью. Обязательно с https://',
                          en: 'Direct link to the article. Must include https://'
                        }
                      }
                    },
                    {
                      name: 'outlet',
                      type: 'text',
                      label: { ru: 'Издание', en: 'Outlet' },
                      admin: {
                        description: {
                          ru: 'Название издания (например, sobaka.ru, Süddeutsche Zeitung).',
                          en: 'Outlet name (e.g. sobaka.ru, Süddeutsche Zeitung).'
                        }
                      }
                    },
                    {
                      name: 'language',
                      type: 'text',
                      label: { ru: 'Язык', en: 'Language' },
                      admin: {
                        description: {
                          ru: 'Код языка статьи: ru / en / de.',
                          en: 'Article language code: ru / en / de.'
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'externalLinks',
                  type: 'array',
                  label: { ru: 'Внешние ссылки', en: 'External links' },
                  labels: {
                    singular: { ru: 'Ссылку', en: 'Link' },
                    plural: { ru: 'Внешние ссылки', en: 'External links' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/LinkRowLabel#default'
                    },
                    description: {
                      ru: 'Всё, что не подходит под «Прессу» / «Награды» / «Фестивали» — страницы партнёров, бэкстейдж, превью и т. п.',
                      en: "Anything that doesn't fit Press / Awards / Festivals — partner pages, behind-the-scenes posts, etc."
                    }
                  },
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      label: { ru: 'Текст', en: 'Label' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Текст ссылки — что увидит читатель.',
                          en: 'Link text the reader sees.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: { ru: 'URL', en: 'URL' },
                      admin: {
                        description: {
                          ru: 'Целевой URL. Обязательно с https://',
                          en: 'Target URL. Must include https://'
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: 'Показы', en: 'Shows' },
          description: {
            ru: 'Города гастролей и история площадок.',
            en: 'Tour cities and venue run history.'
          },
          fields: [
            {
              name: 'history',
              type: 'group',
              label: { ru: 'Показы', en: 'Shows' },
              fields: [
                {
                  // Tour cities — l10n strings. Same as keystatic's array of l10n.
                  name: 'tour',
                  type: 'array',
                  label: { ru: 'Гастроли', en: 'Tour' },
                  labels: {
                    singular: { ru: 'Город', en: 'City' },
                    plural: { ru: 'Гастроли', en: 'Tour' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/CityRowLabel#default'
                    },
                    description: {
                      ru: 'Города, где спектакль был на гастролях. Не путать с городом премьеры (см. «Театр» выше).',
                      en: 'Cities where this production has toured. Not the premiere venue (see Theatre above).'
                    }
                  },
                  fields: [
                    {
                      name: 'city',
                      type: 'text',
                      label: { ru: 'Город', en: 'City' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Город гастролей.',
                          en: 'Tour city.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    }
                  ]
                },
                {
                  name: 'runs',
                  type: 'array',
                  label: { ru: 'История площадок', en: 'Venue history' },
                  labels: {
                    singular: { ru: 'Серию', en: 'Run' },
                    plural: { ru: 'История площадок', en: 'Venue history' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/RunRowLabel#default'
                    },
                    description: {
                      ru: 'История площадок — где шёл спектакль и сколько примерно раз.',
                      en: 'Venue history — where the production has been performed and roughly how many times.'
                    }
                  },
                  fields: [
                    {
                      name: 'venue',
                      type: 'text',
                      label: { ru: 'Площадка', en: 'Venue' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Название площадки или театра, где шёл спектакль.',
                          en: 'Name of the venue or theatre where the production ran.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'city',
                      type: 'text',
                      label: { ru: 'Город', en: 'City' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Город этой площадки.',
                          en: 'City of this venue.'
                        },
                        components: {
                          afterInput: ['/components/admin/LocaleHint#default']
                        }
                      }
                    },
                    {
                      name: 'yearFrom',
                      type: 'number',
                      label: { ru: 'С года', en: 'From year' },
                      admin: {
                        description: {
                          ru: 'Первый год показов на этой площадке.',
                          en: 'First year of performances at this venue.'
                        }
                      }
                    },
                    {
                      name: 'yearTo',
                      type: 'number',
                      label: { ru: 'По год', en: 'To year' },
                      admin: {
                        description: {
                          ru: 'Последний год показов (или текущий, если идёт).',
                          en: 'Last year of performances (or current, if still running).'
                        }
                      }
                    },
                    {
                      name: 'count',
                      type: 'text',
                      label: { ru: 'Кол-во показов', en: 'Show count' },
                      localized: true,
                      admin: {
                        description: {
                          ru: 'Примерное число показов. Можно «60+», «более 100», «more than 30».',
                          en: 'Approximate count. Free-form — "60+", "more than 100", etc.'
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
        },
        {
          label: { ru: 'Настройки', en: 'Settings' },
          description: {
            ru: 'Статус, бронирование, место на главной, тех-райдер, пресс-кит.',
            en: 'Status, booking button, homepage placement, tech rider, press kit.'
          },
          fields: [
            {
              name: 'status',
              type: 'select',
              label: { ru: 'Статус', en: 'Status' },
              defaultValue: 'live',
              admin: {
                components: {
                  Cell: '/components/admin/ListCells#StatusCell'
                },
                description: {
                  ru: 'Состояние спектакля. По умолчанию — «Идёт» (играется сейчас).',
                  en: 'Lifecycle of this production. Default is "Live" (currently running).'
                }
              },
              options: [
                { label: { ru: 'Идёт', en: 'Live' }, value: 'live' },
                {
                  label: { ru: 'В работе', en: 'In development' },
                  value: 'in-development'
                },
                {
                  label: { ru: 'В архиве', en: 'Archived' },
                  value: 'archived'
                },
                {
                  label: { ru: 'На гастролях', en: 'On tour' },
                  value: 'on-tour'
                }
              ]
            },
            {
              name: 'settings',
              type: 'group',
              label: { ru: 'Настройки', en: 'Settings' },
              fields: [
                {
                  name: 'bookingCta',
                  type: 'checkbox',
                  label: { ru: 'Кнопка «Заказать»', en: 'Booking CTA' },
                  defaultValue: true,
                  admin: {
                    description: {
                      ru: 'Когда выключено — на странице спектакля нет кнопки «Заказать».',
                      en: 'When off, the production page has no "Book" button.'
                    }
                  }
                },
                {
                  name: 'bookingCtaLabel',
                  type: 'text',
                  label: { ru: 'Текст кнопки', en: 'CTA label' },
                  localized: true,
                  admin: {
                    condition: (_, siblingData) =>
                      Boolean(
                        (siblingData as { bookingCta?: boolean })?.bookingCta
                      ),
                    description: {
                      ru: 'Текст кнопки бронирования. Если пусто — стандартная фраза.',
                      en: 'Booking button text. Blank means the standard phrase.'
                    },
                    components: {
                      afterInput: ['/components/admin/LocaleHint#default']
                    }
                  }
                },
                {
                  name: 'bookingCtaUrl',
                  type: 'text',
                  label: { ru: 'URL кнопки', en: 'CTA URL' },
                  admin: {
                    condition: (_, siblingData) =>
                      Boolean(
                        (siblingData as { bookingCta?: boolean })?.bookingCta
                      ),
                    description: {
                      ru: 'Необязательно. Если пусто — кнопка открывает письмо на основной адрес.',
                      en: 'Optional. Blank opens an email to the main address.'
                    }
                  }
                },
                {
                  name: 'featured',
                  type: 'checkbox',
                  label: { ru: 'На главной', en: 'Featured' },
                  admin: {
                    components: {
                      Cell: '/components/admin/ListCells#FeaturedCell',
                      Label: '/components/admin/ListCells#PlainLabel'
                    },
                    description: {
                      ru: 'Показывать спектакль в подборке на главной.',
                      en: 'Show this production in the homepage selection.'
                    }
                  }
                },
                {
                  name: 'featuredOrder',
                  type: 'number',
                  label: { ru: 'Порядок на главной', en: 'Featured order' },
                  admin: {
                    condition: (_, siblingData) =>
                      Boolean(
                        (siblingData as { featured?: boolean })?.featured
                      ),
                    description: {
                      ru: 'Меньшие числа — выше. Используется только если включён чекбокс «На главной».',
                      en: 'Lower numbers appear first. Only used when "Featured" is on.'
                    }
                  }
                },
                {
                  name: 'listOrder',
                  type: 'number',
                  label: { ru: 'Порядок в каталоге', en: 'List order' },
                  admin: {
                    description: {
                      ru: 'Меньшие числа — выше. Если пусто — сортировка по году премьеры (свежие первыми).',
                      en: 'Lower numbers appear first. Leave blank to fall back to premiere year (newest first).'
                    }
                  }
                },
                {
                  name: 'techRider',
                  type: 'text',
                  label: {
                    ru: 'Тех-райдер (PDF)',
                    en: 'Technical rider (PDF)'
                  },
                  admin: {
                    description: {
                      ru: 'Внешний URL на тех-райдер (PDF). Когда задан — на странице появляется ссылка «Тех. райдер» в блоке для организаторов.',
                      en: 'External URL to a tech-rider PDF. When set, a "Tech rider" link appears in the presenters block on the page.'
                    }
                  }
                },
                {
                  name: 'pressKit',
                  type: 'text',
                  label: { ru: 'Пресс-кит', en: 'Press kit' },
                  admin: {
                    description: {
                      ru: 'Внешний URL на пресс-кит (ZIP/PDF). Когда задан — на странице появляется ссылка «Пресс-кит» в блоке для организаторов.',
                      en: 'External URL to a press kit (ZIP/PDF). When set, a "Press kit" link appears in the presenters block on the page.'
                    }
                  }
                },
                {
                  // Legacy Notion IDs — kept so YAML round-trips. Not edited by hand.
                  name: 'notionIds',
                  type: 'group',
                  label: {
                    ru: 'Notion IDs (legacy)',
                    en: 'Notion IDs (legacy)'
                  },
                  admin: {
                    // Legacy cross-reference data; nothing to edit.
                    hidden: true,
                    description: {
                      ru: 'Из старой Notion-CMS. По духу — read-only. Оставь как есть, если только не нужна повторная миграция.',
                      en: 'From the original Notion-based CMS. Read-only in spirit — leave as-is unless re-migrating.'
                    }
                  },
                  fields: [
                    {
                      name: 'ru',
                      type: 'text',
                      label: { ru: 'RU', en: 'RU' },
                      admin: {
                        description: {
                          ru: 'ID из старой русской базы Notion. Не редактируй — нужно для миграционной сверки.',
                          en: 'ID from the legacy Russian Notion DB. Do not edit — needed for migration cross-reference.'
                        }
                      }
                    },
                    {
                      name: 'en',
                      type: 'text',
                      label: { ru: 'EN', en: 'EN' },
                      admin: {
                        description: {
                          ru: 'ID из старой английской базы Notion. Не редактируй.',
                          en: 'ID from the legacy English Notion DB. Do not edit.'
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
  ]
}
