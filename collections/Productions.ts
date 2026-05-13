import type { CollectionConfig } from 'payload'
import {
  revalidateProduction,
  revalidateProductionDelete
} from '../hooks/revalidate'

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
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'year', 'durationMin', 'status'],
    group: { ru: 'Контент', en: 'Content' },
    livePreview: {
      url: ({ data, locale }) => {
        const slug = (data as { slug?: string })?.slug ?? ''
        return `/${locale.code}/productions/${slug}`
      }
    },
    description: {
      ru: 'Спектакли Романа. Слаг — имя папки в публичном URL.',
      en: "Roman's productions. Slug is the public URL segment."
    }
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user)
  },
  hooks: {
    afterChange: [revalidateProduction],
    afterDelete: [revalidateProductionDelete]
  },
  fields: [
    // ── Top-level list-view columns ──────────────────────────────────────
    {
      name: 'slug',
      type: 'text',
      label: { ru: 'URL-слаг', en: 'URL slug' },
      required: true,
      unique: true,
      index: true,
      admin: {
        description: {
          ru: 'Имя папки в content/productions/. Только нижний регистр и дефисы. После публикации лучше не менять — это часть публичного URL.',
          en: "Folder name in content/productions/. Lowercase + dashes only. Avoid changing after publish — it's part of the live URL."
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
        description: {
          ru: 'Числовой год премьеры — используется для сортировки и в карточках. Отдельно от свободного текста даты в блоке «Продакшен».',
          en: 'Numeric year used for sort and display. Distinct from the per-locale free-text date in the Production group.'
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
      name: 'status',
      type: 'select',
      label: { ru: 'Статус', en: 'Status' },
      defaultValue: 'live',
      admin: {
        description: {
          ru: 'Жизненный цикл продакшена. По умолчанию — «Идёт» (играется сейчас).',
          en: 'Lifecycle of this production. Default is "Live" (currently running).'
        }
      },
      options: [
        { label: { ru: 'Идёт', en: 'Live' }, value: 'live' },
        {
          label: { ru: 'В работе', en: 'In development' },
          value: 'in-development'
        },
        { label: { ru: 'В архиве', en: 'Archived' }, value: 'archived' },
        { label: { ru: 'На гастролях', en: 'On tour' }, value: 'on-tour' }
      ]
    },

    // ── Identity group ───────────────────────────────────────────────────
    {
      name: 'identity',
      type: 'group',
      label: { ru: 'Идентичность', en: 'Identity' },
      admin: {
        description: {
          ru: 'Название, слоган, синопсис, режиссёрская заметка и полный текст.',
          en: "Title, tagline, synopsis, director's note, and full body."
        }
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: { ru: 'Название', en: 'Title' },
          localized: true,
          required: true,
          admin: {
            description: {
              ru: 'Название спектакля во всех трёх локалях. Показывается в карточке, на странице и в SEO-заголовке.',
              en: 'Production title in all three locales. Shown on cards, page, and SEO title.'
            }
          }
        },
        {
          name: 'tagline',
          type: 'text',
          label: { ru: 'Подзаголовок', en: 'Tagline' },
          localized: true,
          admin: {
            description: {
              ru: 'Короткая строка-крючок (≤80 символов) под заголовком. Опционально.',
              en: 'Short hook line (≤80 chars) under the title. Optional.'
            }
          }
        },
        {
          name: 'synopsis',
          type: 'textarea',
          label: { ru: 'Синопсис', en: 'Synopsis' },
          localized: true,
          admin: {
            description: {
              ru: 'Одно-два предложения, показываются на карточках продакшенов и в результатах поиска. 50–200 знаков — комфортно для SEO.',
              en: 'One-or-two-sentence pitch shown on production cards and in search results. 50–200 chars is the SEO sweet spot.'
            }
          }
        },
        {
          name: 'directorsNote',
          type: 'textarea',
          label: { ru: 'Записка режиссёра', en: "Director's note" },
          localized: true,
          admin: {
            description: {
              ru: 'Цитата от Романа — рендерится как blockquote на странице. Поддерживается markdoc (курсив / жирный / ссылки).',
              en: 'Quote from Roman — rendered as a blockquote on the page. Supports markdoc (italic / bold / links).'
            }
          }
        },
        {
          name: 'body',
          type: 'textarea',
          label: { ru: 'Полный текст', en: 'Body text' },
          localized: true,
          admin: {
            description: {
              ru: 'Полный редакторский текст. Markdown / markdoc — заголовки, списки, цитаты, выделение.',
              en: 'Full editorial body. Markdown / markdoc — headings, lists, quotes, emphasis.'
            }
          }
        }
      ]
    },

    // ── Media group ──────────────────────────────────────────────────────
    {
      name: 'media',
      type: 'group',
      label: { ru: 'Медиа', en: 'Media' },
      admin: {
        description: {
          ru: 'Постер, обложки, галерея и видео.',
          en: 'Poster, cover overrides, gallery photos, and embedded videos.'
        }
      },
      fields: [
        {
          name: 'poster',
          type: 'group',
          label: { ru: 'Постер', en: 'Poster' },
          admin: {
            description: {
              ru: 'Главное изображение продакшена — основа карточек, страницы и OG-картинки.',
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
                  ru: 'Путь к постеру. Можно вписать вручную или нажать «Upload» в превью ниже. Пример: /productions/bury-me-behind-the-baseboard/poster.jpg',
                  en: 'Path to the poster. Type manually or click "Upload" in the preview below. e.g. /productions/bury-me-behind-the-baseboard/poster.jpg'
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
                  ru: 'Путь, который переопределяет постер на карточке в /productions. Можно вписать или загрузить через «Upload». Пример: /productions/{slug}/cover.webp',
                  en: 'Path that overrides the poster on the /productions card. Type manually or use Upload below. e.g. /productions/{slug}/cover.webp'
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
              ru: 'Опциональная замена productionsPhoto на ленте «Featured» главной. Каскад: featuredPhoto → productionsPhoto → poster.',
              en: 'Optional override on the home featured strip. Cascade: featuredPhoto → productionsPhoto → poster.'
            }
          },
          fields: [
            {
              name: 'src',
              type: 'text',
              label: { ru: 'Обложка для главной', en: 'Homepage cover image' },
              admin: {
                description: {
                  ru: 'Путь, который переопределяет productionsPhoto на ленте «Featured» главной.',
                  en: 'Path that overrides productionsPhoto on the home featured strip.'
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
            description: {
              ru: 'Доп. фотографии продакшена. Порядок здесь = порядок на странице.',
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
                  ru: 'Путь к изображению. Можно вписать или загрузить через «Upload». Пример: /productions/{slug}/01.jpg',
                  en: 'Path to the image. Type manually or use Upload below. e.g. /productions/{slug}/01.jpg'
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
            description: {
              ru: 'Видеовставки на странице продакшена.',
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
    },

    // ── Production group ─────────────────────────────────────────────────
    {
      name: 'production',
      type: 'group',
      label: { ru: 'Продакшен', en: 'Production' },
      admin: {
        description: {
          ru: 'Театр-производитель, даты премьеры, возрастной рейтинг и билеты. Год, длительность и статус — наверху страницы.',
          en: 'Producing theatre, premiere dates, age rating, and tickets. Year, duration, and status live at the top of the page.'
        }
      },
      fields: [
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
                  ru: 'Полное название театра во всех трёх локалях.',
                  en: 'Full theatre name in all three locales.'
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
                }
              }
            },
            {
              name: 'country',
              type: 'text',
              label: { ru: 'Страна (ISO-2)', en: 'Country (ISO-2)' },
              admin: {
                description: {
                  ru: 'Двухбуквенный ISO-код страны: RU / KZ / DE / AT / ES…',
                  en: 'ISO-2 country code: RU / KZ / DE / AT / ES…'
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
        },
        {
          name: 'premiereDate',
          type: 'text',
          label: { ru: 'Дата премьеры', en: 'Premiere date' },
          localized: true,
          admin: {
            description: {
              ru: 'Дата премьеры свободным текстом — допускаются «весна 2021», «Spring 2021», «март 2021».',
              en: 'Free-form premiere date — fuzzy values like "Spring 2021" or "March 2021" are fine.'
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
          name: 'ageRating',
          type: 'text',
          label: { ru: 'Возраст', en: 'Age rating' },
          admin: {
            description: {
              ru: 'Возрастное ограничение по российскому стандарту: 0+, 6+, 12+, 16+, 18+.',
              en: 'Russian-standard age rating: 0+, 6+, 12+, 16+, 18+.'
            }
          }
        }
      ]
    },

    // ── Taxonomy group ───────────────────────────────────────────────────
    {
      name: 'taxonomy',
      type: 'group',
      label: { ru: 'Таксономия', en: 'Taxonomy' },
      admin: {
        description: {
          ru: 'Роли Романа, жанр/форма, школа и теги.',
          en: "Roman's roles, theatrical form, lineage, and free-form tags."
        }
      },
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
            { label: { ru: 'Режиссёр', en: 'Director' }, value: 'director' },
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
            { label: { ru: 'Продюсер', en: 'Producer' }, value: 'producer' }
          ]
        },
        {
          name: 'form',
          type: 'array',
          label: { ru: 'Форма', en: 'Form' },
          labels: {
            singular: { ru: 'Форма', en: 'Form' },
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
            singular: { ru: 'Школа', en: 'Lineage' },
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
            { name: 'value', type: 'text', label: { ru: 'Тег', en: 'Tag' } }
          ],
          admin: {
            description: {
              ru: 'Произвольные ключевые слова для поиска и фильтрации. Отличается от формы (жанр) и школы (традиция).',
              en: 'Free-form keywords surfaced on listing/search. Distinct from form (genre) and lineage (tradition).'
            }
          }
        }
      ]
    },

    // ── Team group ───────────────────────────────────────────────────────
    {
      name: 'team',
      type: 'group',
      label: { ru: 'Команда', en: 'Team' },
      admin: {
        description: {
          ru: 'Команда и состав по локалям. Локали независимы — переводи роль и имя на месте.',
          en: 'Cast & crew per locale. Each locale is independent — translate role + name in place.'
        }
      },
      fields: [
        {
          // Three parallel arrays — see keystatic.config.ts §Credits comment
          // for why we don't unify them: role labels here are free RU phrases.
          name: 'creditsRu',
          type: 'array',
          label: { ru: 'Команда (RU)', en: 'Team (RU)' },
          labels: {
            singular: { ru: 'Строка', en: 'Row' },
            plural: { ru: 'Команда (RU)', en: 'Team (RU)' }
          },
          fields: [
            { name: 'role', type: 'text', label: { ru: 'Роль', en: 'Role' } },
            { name: 'name', type: 'text', label: { ru: 'Имя', en: 'Name' } },
            { name: 'url', type: 'text', label: { ru: 'Ссылка', en: 'URL' } }
          ]
        },
        {
          name: 'creditsEn',
          type: 'array',
          label: { ru: 'Команда (EN)', en: 'Team (EN)' },
          labels: {
            singular: { ru: 'Строка', en: 'Row' },
            plural: { ru: 'Команда (EN)', en: 'Team (EN)' }
          },
          fields: [
            { name: 'role', type: 'text', label: { ru: 'Роль', en: 'Role' } },
            { name: 'name', type: 'text', label: { ru: 'Имя', en: 'Name' } },
            { name: 'url', type: 'text', label: { ru: 'Ссылка', en: 'URL' } }
          ]
        },
        {
          name: 'creditsDe',
          type: 'array',
          label: { ru: 'Команда (DE)', en: 'Team (DE)' },
          labels: {
            singular: { ru: 'Строка', en: 'Row' },
            plural: { ru: 'Команда (DE)', en: 'Team (DE)' }
          },
          fields: [
            { name: 'role', type: 'text', label: { ru: 'Роль', en: 'Role' } },
            { name: 'name', type: 'text', label: { ru: 'Имя', en: 'Name' } },
            { name: 'url', type: 'text', label: { ru: 'Ссылка', en: 'URL' } }
          ]
        }
      ]
    },

    // ── Recognition group ────────────────────────────────────────────────
    {
      name: 'recognition',
      type: 'group',
      label: { ru: 'Признание', en: 'Recognition' },
      admin: {
        description: {
          ru: 'Премии, фестивали, пресса и внешние ссылки.',
          en: 'Awards, festivals, press coverage, and external links.'
        }
      },
      fields: [
        {
          name: 'awards',
          type: 'array',
          label: { ru: 'Награды', en: 'Awards' },
          labels: {
            singular: { ru: 'Награда', en: 'Award' },
            plural: { ru: 'Награды', en: 'Awards' }
          },
          admin: {
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
            singular: { ru: 'Публикация', en: 'Press item' },
            plural: { ru: 'Пресса', en: 'Press' }
          },
          admin: {
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
                  ru: 'Заголовок публикации в трёх локалях.',
                  en: 'Article headline in all three locales.'
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
            singular: { ru: 'Ссылка', en: 'Link' },
            plural: { ru: 'Внешние ссылки', en: 'External links' }
          },
          admin: {
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
                  ru: 'Что это за ссылка — текст для кнопки/ссылки в трёх локалях.',
                  en: 'What the link represents — anchor text in all three locales.'
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
    },

    // ── History group ────────────────────────────────────────────────────
    {
      name: 'history',
      type: 'group',
      label: { ru: 'История показов', en: 'Performance History' },
      admin: {
        description: {
          ru: 'Города гастролей и история площадок.',
          en: 'Tour cities and venue run history.'
        }
      },
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
            singular: { ru: 'Серия', en: 'Run' },
            plural: { ru: 'История площадок', en: 'Venue history' }
          },
          admin: {
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
                }
              }
            }
          ]
        }
      ]
    },

    // ── Settings group ───────────────────────────────────────────────────
    {
      name: 'settings',
      type: 'group',
      label: { ru: 'Настройки', en: 'Settings' },
      admin: {
        description: {
          ru: 'Бронирование, размещение на главной, тех-райдер, пресс-кит, Notion IDs.',
          en: 'Booking CTA, home placement, tech rider, press kit, and Notion IDs.'
        }
      },
      fields: [
        {
          name: 'bookingCta',
          type: 'checkbox',
          label: { ru: 'Кнопка «Заказать»', en: 'Booking CTA' },
          defaultValue: true,
          admin: {
            description: {
              ru: 'Когда выключено — страница продакшена скрывает кнопку «забронировать». Label и URL ниже игнорируются.',
              en: 'When off, the production page hides the booking call-to-action — label/URL below are ignored.'
            }
          }
        },
        {
          name: 'bookingCtaLabel',
          type: 'text',
          label: { ru: 'Текст кнопки', en: 'CTA label' },
          localized: true,
          admin: {
            description: {
              ru: 'Текст кнопки бронирования в трёх локалях. Если пусто — используется дефолтная фраза для каждой локали.',
              en: 'Booking-button text per locale. Falls back to the default phrase for each locale when blank.'
            }
          }
        },
        {
          name: 'bookingCtaUrl',
          type: 'text',
          label: { ru: 'URL кнопки', en: 'CTA URL' },
          admin: {
            description: {
              ru: 'Необязательно. Если пусто — кнопка ведёт на дефолтный mailto-адрес (см. lib/booking.ts).',
              en: 'Optional. Leave blank to fall back to the default mailto link (see lib/booking.ts).'
            }
          }
        },
        {
          name: 'featured',
          type: 'checkbox',
          label: { ru: 'На главной', en: 'Featured' },
          admin: {
            description: {
              ru: 'Показывать на главной в featured-стрипе.',
              en: 'Surfaces this production on the home featured strip.'
            }
          }
        },
        {
          name: 'featuredOrder',
          type: 'number',
          label: { ru: 'Порядок на главной', en: 'Featured order' },
          admin: {
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
          label: { ru: 'Тех-райдер (PDF)', en: 'Technical rider (PDF)' },
          admin: {
            description: {
              ru: 'Внешний URL на тех-райдер (PDF). Когда задан — на странице появляется ссылка «Тех. райдер» в TourRider.',
              en: 'External URL to a tech-rider PDF. When set, a "Tech rider" link appears in the TourRider sheet on the page.'
            }
          }
        },
        {
          name: 'pressKit',
          type: 'text',
          label: { ru: 'Пресс-кит', en: 'Press kit' },
          admin: {
            description: {
              ru: 'Внешний URL на пресс-кит (ZIP/PDF). Когда задан — на странице появляется ссылка «Пресс-кит» в TourRider.',
              en: 'External URL to a press kit (ZIP/PDF). When set, a "Press kit" link appears in the TourRider sheet on the page.'
            }
          }
        },
        {
          // Legacy Notion IDs — kept so YAML round-trips. Not edited by hand.
          name: 'notionIds',
          type: 'group',
          label: { ru: 'Notion IDs (legacy)', en: 'Notion IDs (legacy)' },
          admin: {
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
