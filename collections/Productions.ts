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
import { yearFromPremiereDate } from '../hooks/yearFromPremiereDate'

// Block-shaped Lexical features stripped from inline-only richText
// fields (tagline / synopsis / directorsNote). Removing all of these
// also removes the `+` block-insert gutter glyph and the bottom
// toolbar, giving the fields a clean text-input look.
// See PAYLOAD_ADMIN_UX_PLAN.md §Round-2 R3 + §B.1.
// Russian scale plus the German/Finnish ones the catalogue already uses.
const AGE_RATINGS = [
  '0+',
  '3+',
  '4+',
  '5+',
  '6+',
  '12+',
  '14+',
  '16+',
  '18+'
] as const

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

// Body keeps headings, lists, quotes and links; these formats are not
// styled on the site, so the toolbar doesn't offer them.
export const BODY_DROP_FEATURES = new Set([
  'underline',
  'strikethrough',
  'subscript',
  'superscript',
  'inlineCode',
  'align',
  'indent',
  'checklist',
  'relationship',
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
  // Same order as the catalogue on the site (app/[locale]/productions):
  // explicit listOrder first (Postgres puts NULLs last), then newest year.
  defaultSort: ['settings.listOrder', '-production.year'],
  admin: {
    // useAsTitle can't be a nested field, so `title` mirrors identity.title.
    useAsTitle: 'title',
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
    // Hidden copy of identity.title for the document heading (useAsTitle).
    // Kept in sync on every save; the migration backfills existing rows.
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => siblingData.identity?.title ?? value
        ]
      }
    },
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
            ru: 'Название, подзаголовок, синопсис, полный текст и записка режиссёра — в том порядке, в каком они идут на странице.',
            en: "Title, tagline, synopsis, body, and director's note, in page order."
          },
          fields: [
            {
              name: 'identity',
              type: 'group',
              // The tab already names it.
              label: false,
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
                      ru: '2–3 предложения, до ~300 знаков: показываются под названием, на карточках и в результатах поиска. Длиннее — в «Полный текст». Поддерживается жирный, курсив, ссылки.',
                      en: '2–3 sentences, up to ~300 chars: shown under the title, on cards and in search results. Longer prose goes in the body. Bold, italic, and links supported.'
                    },
                    components: {
                      afterInput: [
                        '/components/admin/SynopsisLength#default',
                        '/components/admin/LocaleHint#default'
                      ]
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
                      ru: 'Полный редакторский текст. Поддерживаются заголовки H2/H3, списки, цитаты, ссылки, выделение.',
                      en: 'Full editorial body. H2/H3 headings, lists, blockquotes, links, and emphasis are supported.'
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
              // The tab already names it.
              label: false,
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
                        className: 'image-path',
                        description: {
                          ru: 'Путь к файлу. Обычно его заполняет кнопка «Загрузить».',
                          en: 'File path. Usually filled by the upload button.'
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
                      ru: 'Необязательно. Своя картинка для карточки в каталоге спектаклей. Если пусто — берётся постер.',
                      en: 'Optional. Own image for the catalogue card; blank uses the poster.'
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
                        className: 'image-path',
                        description: {
                          ru: 'Путь к файлу. Обычно его заполняет кнопка «Загрузить».',
                          en: 'File path. Usually filled by the upload button.'
                        },
                        components: {
                          afterInput: [
                            {
                              path: '/components/admin/ImagePathPreview#ImagePathPreview',
                              clientProps: {
                                fallback: [
                                  { path: 'media.poster.src', label: 'постер' }
                                ]
                              }
                            }
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
                        className: 'image-path',
                        description: {
                          ru: 'Путь к файлу. Обычно его заполняет кнопка «Загрузить».',
                          en: 'File path. Usually filled by the upload button.'
                        },
                        components: {
                          afterInput: [
                            {
                              path: '/components/admin/ImagePathPreview#ImagePathPreview',
                              clientProps: {
                                fallback: [
                                  {
                                    path: 'media.productionsPhoto.src',
                                    label: 'обложка для каталога'
                                  },
                                  { path: 'media.poster.src', label: 'постер' }
                                ]
                              }
                            }
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
                    singular: { ru: 'фото', en: 'Photo' },
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
                        className: 'image-path',
                        description: {
                          ru: 'Путь к файлу. Обычно его заполняет кнопка «Загрузить».',
                          en: 'File path. Usually filled by the upload button.'
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
                    singular: { ru: 'видео', en: 'Video' },
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
              // The tab already names it.
              label: false,
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
                  type: 'row',
                  fields: [
                    {
                      name: 'year',
                      type: 'number',
                      label: { ru: 'Год премьеры', en: 'Premiere year' },
                      min: 1900,
                      max: 2100,
                      index: true,
                      hooks: { beforeChange: [yearFromPremiereDate] },
                      admin: {
                        width: '33%',
                        components: {
                          Cell: '/components/admin/ListCells#YearCell',
                          Label: '/components/admin/ListCells#PlainLabel'
                        },
                        description: {
                          ru: 'Если пусто — берётся из даты премьеры.',
                          en: 'Blank: taken from the premiere date.'
                        }
                      }
                    },
                    {
                      name: 'durationMin',
                      type: 'number',
                      label: { ru: 'Длительность, мин', en: 'Duration, min' },
                      min: 1,
                      admin: {
                        width: '33%',
                        description: {
                          ru: 'С антрактом.',
                          en: 'Including intermission.'
                        }
                      }
                    },
                    {
                      name: 'ageRating',
                      type: 'select',
                      label: { ru: 'Возраст', en: 'Age rating' },
                      options: AGE_RATINGS.map((v) => ({ label: v, value: v })),
                      admin: { width: '33%' }
                    }
                  ]
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
                  name: 'theatre',
                  type: 'group',
                  label: { ru: 'Театр', en: 'Theatre' },
                  admin: {
                    description: {
                      ru: 'Театр-производитель премьеры. Не путать с площадками гастролей (вкладка «Показы»).',
                      en: 'Producing theatre for the premiere. Not the touring venues (Shows tab).'
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
                      label: { ru: 'Год основания', en: 'Year founded' },
                      admin: {
                        description: {
                          ru: 'Год основания театра. Необязательно.',
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
          label: { ru: 'Роли и жанр', en: 'Roles & genre' },
          description: {
            ru: 'Роли Романа, жанр и традиция.',
            en: "Roman's roles, form/genre, and lineage."
          },
          fields: [
            {
              name: 'taxonomy',
              type: 'group',
              // The tab already names it.
              label: false,
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
                  // Slugs the site filters by and translates
                  // (messages/*.json productions.formLabels).
                  name: 'form',
                  type: 'select',
                  hasMany: true,
                  label: { ru: 'Форма', en: 'Form' },
                  options: [
                    { value: 'theater', label: { ru: 'Театр', en: 'Theatre' } },
                    {
                      value: 'ensemble',
                      label: { ru: 'Ансамбль', en: 'Ensemble' }
                    },
                    { value: 'solo', label: { ru: 'Соло', en: 'Solo' } },
                    { value: 'puppet', label: { ru: 'Куклы', en: 'Puppets' } },
                    {
                      value: 'family',
                      label: { ru: 'Семейный', en: 'Family' }
                    },
                    { value: 'reading', label: { ru: 'Читка', en: 'Reading' } },
                    {
                      value: 'collage',
                      label: { ru: 'Коллаж', en: 'Collage' }
                    },
                    {
                      value: 'festival',
                      label: { ru: 'фестиваль', en: 'Festival' }
                    }
                  ],
                  admin: {
                    description: {
                      ru: 'Жанр / форма спектакля. По ней работает фильтр в каталоге. Нужной формы нет — напишите Даниилу.',
                      en: 'Form / genre; the catalogue filter uses it. Missing one? Ask Daniil.'
                    }
                  }
                },
                {
                  name: 'lineage',
                  type: 'select',
                  hasMany: true,
                  label: { ru: 'Школа', en: 'Lineage' },
                  options: [
                    { value: 'btk', label: { ru: 'БТК', en: 'BTK' } },
                    {
                      value: 'kudashov',
                      label: { ru: 'Кудашов', en: 'Kudashov' }
                    },
                    { value: 'rgisi', label: { ru: 'РГИСИ', en: 'RGISI' } }
                  ],
                  admin: {
                    description: {
                      ru: 'Традиция или школа, к которой восходит спектакль. Нужной нет — напишите Даниилу.',
                      en: 'Tradition or school the production traces back to. Missing one? Ask Daniil.'
                    }
                  }
                },
                {
                  name: 'tags',
                  type: 'text',
                  hasMany: true,
                  label: { ru: 'Теги', en: 'Tags' },
                  admin: {
                    // ponytail: hidden, not dropped — nothing on the site
                    // reads tags (review №3, п. 3). Drop the column in a
                    // migration once nobody misses it.
                    hidden: true,
                    description: {
                      ru: 'Ключевые слова для поиска. Введите слово и нажмите Enter. Отличается от формы (жанр) и школы (традиция).',
                      en: 'Search keywords. Type one and press Enter. Distinct from form (genre) and lineage (tradition).'
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
            ru: 'Команда и состав. У каждого языка свой список: показан тот, что выбран вверху страницы.',
            en: 'Cast & crew. Each language has its own list; the one picked at the top is shown.'
          },
          fields: [
            {
              name: 'team',
              type: 'group',
              // The tab already names it.
              label: false,
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
                    singular: { ru: 'человека', en: 'Person' },
                    plural: { ru: 'Команда (RU)', en: 'Team (RU)' }
                  },
                  admin: {
                    className: 'team-credits-locale team-credits-locale--ru',
                    initCollapsed: true,
                    components: {
                      RowLabel: '/components/admin/CreditRowLabel#default'
                    }
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'role',
                          type: 'text',
                          label: { ru: 'Роль', en: 'Role' },
                          admin: { width: '40%' }
                        },
                        {
                          name: 'name',
                          type: 'text',
                          label: { ru: 'Имя', en: 'Name' },
                          admin: { width: '30%' }
                        },
                        {
                          name: 'url',
                          type: 'text',
                          label: { ru: 'Ссылка', en: 'URL' },
                          admin: { width: '30%' }
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'creditsEn',
                  type: 'array',
                  label: { ru: 'Команда (EN)', en: 'Team (EN)' },
                  labels: {
                    singular: { ru: 'человека', en: 'Person' },
                    plural: { ru: 'Команда (EN)', en: 'Team (EN)' }
                  },
                  admin: {
                    className: 'team-credits-locale team-credits-locale--en',
                    initCollapsed: true,
                    components: {
                      RowLabel: '/components/admin/CreditRowLabel#default'
                    }
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'role',
                          type: 'text',
                          label: { ru: 'Роль', en: 'Role' },
                          admin: { width: '40%' }
                        },
                        {
                          name: 'name',
                          type: 'text',
                          label: { ru: 'Имя', en: 'Name' },
                          admin: { width: '30%' }
                        },
                        {
                          name: 'url',
                          type: 'text',
                          label: { ru: 'Ссылка', en: 'URL' },
                          admin: { width: '30%' }
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'creditsDe',
                  type: 'array',
                  label: { ru: 'Команда (DE)', en: 'Team (DE)' },
                  labels: {
                    singular: { ru: 'человека', en: 'Person' },
                    plural: { ru: 'Команда (DE)', en: 'Team (DE)' }
                  },
                  admin: {
                    className: 'team-credits-locale team-credits-locale--de',
                    initCollapsed: true,
                    components: {
                      RowLabel: '/components/admin/CreditRowLabel#default'
                    }
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'role',
                          type: 'text',
                          label: { ru: 'Роль', en: 'Role' },
                          admin: { width: '40%' }
                        },
                        {
                          name: 'name',
                          type: 'text',
                          label: { ru: 'Имя', en: 'Name' },
                          admin: { width: '30%' }
                        },
                        {
                          name: 'url',
                          type: 'text',
                          label: { ru: 'Ссылка', en: 'URL' },
                          admin: { width: '30%' }
                        }
                      ]
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
              // The tab already names it.
              label: false,
              fields: [
                {
                  name: 'awards',
                  type: 'array',
                  label: { ru: 'Награды', en: 'Awards' },
                  labels: {
                    singular: { ru: 'награду', en: 'Award' },
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
                    singular: { ru: 'фестиваль', en: 'Festival' },
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
                    singular: { ru: 'публикацию', en: 'Press item' },
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
                      type: 'select',
                      label: { ru: 'Язык статьи', en: 'Article language' },
                      options: [
                        {
                          value: 'ru',
                          label: { ru: 'Русский', en: 'Russian' }
                        },
                        {
                          value: 'en',
                          label: { ru: 'Английский', en: 'English' }
                        },
                        {
                          value: 'de',
                          label: { ru: 'Немецкий', en: 'German' }
                        },
                        {
                          value: 'fi',
                          label: { ru: 'Финский', en: 'Finnish' }
                        },
                        {
                          value: 'et',
                          label: { ru: 'Эстонский', en: 'Estonian' }
                        },
                        {
                          value: 'lv',
                          label: { ru: 'Латышский', en: 'Latvian' }
                        },
                        {
                          value: 'lt',
                          label: { ru: 'Литовский', en: 'Lithuanian' }
                        },
                        {
                          value: 'pl',
                          label: { ru: 'Польский', en: 'Polish' }
                        },
                        { value: 'cs', label: { ru: 'Чешский', en: 'Czech' } },
                        {
                          value: 'fr',
                          label: { ru: 'Французский', en: 'French' }
                        },
                        {
                          value: 'it',
                          label: { ru: 'Итальянский', en: 'Italian' }
                        },
                        {
                          value: 'es',
                          label: { ru: 'Испанский', en: 'Spanish' }
                        },
                        {
                          value: 'uk',
                          label: { ru: 'Украинский', en: 'Ukrainian' }
                        },
                        {
                          value: 'kk',
                          label: { ru: 'Казахский', en: 'Kazakh' }
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'externalLinks',
                  type: 'array',
                  label: { ru: 'Внешние ссылки', en: 'External links' },
                  labels: {
                    singular: { ru: 'ссылку', en: 'Link' },
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
              // The tab already names it.
              label: false,
              fields: [
                {
                  // Tour cities — l10n strings. Same as keystatic's array of l10n.
                  name: 'tour',
                  type: 'array',
                  label: { ru: 'Гастроли', en: 'Tour' },
                  labels: {
                    singular: { ru: 'город', en: 'City' },
                    plural: { ru: 'Гастроли', en: 'Tour' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/CityRowLabel#default'
                    },
                    description: {
                      ru: 'Города, где спектакль был на гастролях. Не путать с городом премьеры (вкладка «О постановке» → «Театр»).',
                      en: 'Cities where this production has toured. Not the premiere venue (About tab → Theatre).'
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
                    singular: { ru: 'площадку', en: 'Venue' },
                    plural: { ru: 'История площадок', en: 'Venue history' }
                  },
                  admin: {
                    components: {
                      RowLabel: '/components/admin/RunRowLabel#default'
                    },
                    description: {
                      ru: 'Где шёл спектакль и сколько раз, если известно.',
                      en: 'Where the production has been performed and how many times, if known.'
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
                isClearable: false,
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
              // The tab already names it.
              label: false,
              fields: [
                {
                  name: 'bookingCta',
                  type: 'checkbox',
                  label: {
                    ru: 'Показывать кнопку «Заказать»',
                    en: 'Show the Book button'
                  },
                  defaultValue: true,
                  admin: {
                    description: {
                      ru: 'Кнопка на странице спектакля. Выключите, если спектакль сейчас нельзя заказать.',
                      en: 'Button on the production page. Turn off when the production cannot be booked.'
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
