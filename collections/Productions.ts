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
          ru: 'Имя папки в content/productions/ (lower-case, дефисы). После публикации не менять — это публичный URL.',
          en: "Folder name in content/productions/ (lowercase, dashes). Don't change after publish — it's the live URL."
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
          ru: 'Год премьеры. Используется для сортировки и в карточке.',
          en: 'Premiere year. Used for sort and display.'
        }
      }
    },
    {
      name: 'durationMin',
      type: 'number',
      label: { ru: 'Длительность (мин)', en: 'Duration (min)' },
      admin: {
        description: {
          ru: 'Длительность в минутах, с антрактом.',
          en: 'Performance length in minutes, incl. intermission.'
        }
      }
    },
    {
      name: 'status',
      type: 'select',
      label: { ru: 'Статус', en: 'Status' },
      defaultValue: 'live',
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
              ru: 'Название спектакля. Локализуется.',
              en: 'Production title. Localized.'
            }
          }
        },
        {
          name: 'tagline',
          type: 'text',
          label: { ru: 'Подзаголовок', en: 'Tagline' },
          localized: true
        },
        {
          name: 'synopsis',
          type: 'textarea',
          label: { ru: 'Синопсис', en: 'Synopsis' },
          localized: true
        },
        {
          name: 'directorsNote',
          type: 'textarea',
          label: { ru: 'Записка режиссёра', en: "Director's note" },
          localized: true,
          admin: {
            description: {
              ru: 'Цитата Романа — рендерится курсивом. Поддерживается markdoc (курсив, ссылки).',
              en: 'Quote from Roman, rendered italic. Supports markdoc (italic, links).'
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
              ru: 'Полный редакторский текст. Markdown / markdoc.',
              en: 'Full editorial body. Markdown / markdoc.'
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
      fields: [
        {
          name: 'poster',
          type: 'group',
          label: { ru: 'Постер', en: 'Poster' },
          fields: [
            {
              name: 'src',
              type: 'text',
              label: { ru: 'Постер', en: 'Poster image' },
              admin: {
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
              label: { ru: 'Автор фото', en: 'Photo credit' }
            }
          ]
        },
        {
          name: 'productionsPhoto',
          type: 'group',
          label: { ru: 'Обложка для каталога', en: 'Catalogue cover' },
          fields: [
            {
              name: 'src',
              type: 'text',
              label: {
                ru: 'Обложка для каталога',
                en: 'Catalogue cover image'
              },
              admin: {
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
              label: { ru: 'Автор фото', en: 'Photo credit' }
            }
          ]
        },
        {
          name: 'featuredPhoto',
          type: 'group',
          label: { ru: 'Обложка для главной', en: 'Homepage cover' },
          fields: [
            {
              name: 'src',
              type: 'text',
              label: { ru: 'Обложка для главной', en: 'Homepage cover image' },
              admin: {
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
              label: { ru: 'Автор фото', en: 'Photo credit' }
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
          fields: [
            {
              name: 'src',
              type: 'text',
              label: { ru: 'Путь к фото', en: 'Image path' },
              admin: {
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
              label: { ru: 'Автор фото', en: 'Photo credit' }
            },
            {
              name: 'caption',
              type: 'text',
              label: { ru: 'Подпись', en: 'Caption' },
              localized: true
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
          fields: [
            {
              name: 'provider',
              type: 'select',
              label: { ru: 'Платформа', en: 'Platform' },
              defaultValue: 'youtube',
              options: [
                { label: 'YouTube', value: 'youtube' },
                { label: 'Vimeo', value: 'vimeo' }
              ]
            },
            {
              name: 'id',
              type: 'text',
              label: { ru: 'ID видео', en: 'Video ID' }
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
      fields: [
        {
          name: 'theatre',
          type: 'group',
          label: { ru: 'Театр', en: 'Theatre' },
          fields: [
            {
              name: 'name',
              type: 'text',
              label: { ru: 'Театр', en: 'Theatre name' },
              localized: true
            },
            {
              name: 'shortName',
              type: 'text',
              label: { ru: 'Кратко', en: 'Short name' },
              localized: true
            },
            {
              name: 'city',
              type: 'text',
              label: { ru: 'Город', en: 'City' },
              localized: true
            },
            {
              name: 'country',
              type: 'text',
              label: { ru: 'Страна (ISO-2)', en: 'Country (ISO-2)' },
              admin: {
                description: {
                  ru: 'ISO-2 код: RU / KZ / DE / AT / ES.',
                  en: 'ISO-2 code: RU / KZ / DE / AT / ES.'
                }
              }
            },
            {
              name: 'url',
              type: 'text',
              label: { ru: 'Сайт театра', en: 'Theatre website' }
            },
            { name: 'year', type: 'number', label: { ru: 'Год', en: 'Year' } }
          ]
        },
        {
          name: 'premiereDate',
          type: 'text',
          label: { ru: 'Дата премьеры', en: 'Premiere date' },
          localized: true
        },
        {
          name: 'ticketsUrl',
          type: 'text',
          label: { ru: 'Билеты', en: 'Tickets URL' }
        },
        {
          name: 'ageRating',
          type: 'text',
          label: { ru: 'Возраст', en: 'Age rating' },
          admin: {
            description: {
              ru: 'Возрастной рейтинг: 0+, 6+, 12+, 16+, 18+.',
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
      fields: [
        {
          name: 'role',
          type: 'select',
          label: { ru: 'Роли Романа', en: "Roman's roles" },
          hasMany: true,
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
              ru: 'Жанр / форма. Свободный текст: solo, puppet, family, festival.',
              en: 'Genre / form. Free-form: solo, puppet, family, festival.'
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
              ru: 'Школа / традиция. Свободный текст: btk, kudashov, rgisi.',
              en: 'School / tradition. Free-form: btk, kudashov, rgisi.'
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
          ]
        }
      ]
    },

    // ── Team group ───────────────────────────────────────────────────────
    {
      name: 'team',
      type: 'group',
      label: { ru: 'Команда', en: 'Team' },
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
      fields: [
        {
          name: 'awards',
          type: 'array',
          label: { ru: 'Награды', en: 'Awards' },
          labels: {
            singular: { ru: 'Награда', en: 'Award' },
            plural: { ru: 'Награды', en: 'Awards' }
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              label: { ru: 'Название', en: 'Name' },
              localized: true
            },
            { name: 'year', type: 'number', label: { ru: 'Год', en: 'Year' } },
            {
              name: 'category',
              type: 'text',
              label: { ru: 'Номинация', en: 'Category' },
              localized: true
            },
            {
              name: 'city',
              type: 'text',
              label: { ru: 'Город', en: 'City' },
              localized: true
            },
            { name: 'url', type: 'text', label: { ru: 'Ссылка', en: 'URL' } }
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
          fields: [
            {
              name: 'name',
              type: 'text',
              label: { ru: 'Название', en: 'Name' },
              localized: true
            },
            { name: 'year', type: 'number', label: { ru: 'Год', en: 'Year' } },
            {
              name: 'category',
              type: 'text',
              label: { ru: 'Номинация', en: 'Category' },
              localized: true
            },
            {
              name: 'city',
              type: 'text',
              label: { ru: 'Город', en: 'City' },
              localized: true
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
          fields: [
            {
              name: 'title',
              type: 'text',
              label: { ru: 'Заголовок', en: 'Title' },
              localized: true
            },
            { name: 'url', type: 'text', label: { ru: 'Ссылка', en: 'URL' } },
            {
              name: 'outlet',
              type: 'text',
              label: { ru: 'Издание', en: 'Outlet' }
            },
            {
              name: 'language',
              type: 'text',
              label: { ru: 'Язык', en: 'Language' },
              admin: {
                description: {
                  ru: 'Код языка: ru / en / de.',
                  en: 'Language code: ru / en / de.'
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
          fields: [
            {
              name: 'label',
              type: 'text',
              label: { ru: 'Текст', en: 'Label' },
              localized: true
            },
            { name: 'url', type: 'text', label: { ru: 'URL', en: 'URL' } }
          ]
        }
      ]
    },

    // ── History group ────────────────────────────────────────────────────
    {
      name: 'history',
      type: 'group',
      label: { ru: 'История показов', en: 'Performance History' },
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
          fields: [
            {
              name: 'city',
              type: 'text',
              label: { ru: 'Город', en: 'City' },
              localized: true
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
          fields: [
            {
              name: 'venue',
              type: 'text',
              label: { ru: 'Площадка', en: 'Venue' },
              localized: true
            },
            {
              name: 'city',
              type: 'text',
              label: { ru: 'Город', en: 'City' },
              localized: true
            },
            {
              name: 'yearFrom',
              type: 'number',
              label: { ru: 'С года', en: 'From year' }
            },
            {
              name: 'yearTo',
              type: 'number',
              label: { ru: 'По год', en: 'To year' }
            },
            {
              name: 'count',
              type: 'text',
              label: { ru: 'Кол-во показов', en: 'Show count' },
              localized: true
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
      fields: [
        {
          name: 'bookingCta',
          type: 'checkbox',
          label: { ru: 'Кнопка «Заказать»', en: 'Booking CTA' },
          defaultValue: true,
          admin: {
            description: {
              ru: 'Выключено — на странице нет кнопки «забронировать».',
              en: 'When off, the production page hides the booking CTA.'
            }
          }
        },
        {
          name: 'bookingCtaLabel',
          type: 'text',
          label: { ru: 'Текст кнопки', en: 'CTA label' },
          localized: true
        },
        {
          name: 'bookingCtaUrl',
          type: 'text',
          label: { ru: 'URL кнопки', en: 'CTA URL' }
        },
        {
          name: 'featured',
          type: 'checkbox',
          label: { ru: 'На главной', en: 'Featured' },
          admin: {
            description: {
              ru: 'Показывать на главной в featured-стрипе.',
              en: 'Surface this production on the home featured strip.'
            }
          }
        },
        {
          name: 'featuredOrder',
          type: 'number',
          label: { ru: 'Порядок на главной', en: 'Featured order' }
        },
        {
          name: 'listOrder',
          type: 'number',
          label: { ru: 'Порядок в каталоге', en: 'List order' }
        },
        {
          name: 'techRider',
          type: 'text',
          label: { ru: 'Тех-райдер (PDF)', en: 'Technical rider (PDF)' }
        },
        {
          name: 'pressKit',
          type: 'text',
          label: { ru: 'Пресс-кит', en: 'Press kit' }
        },
        {
          // Legacy Notion IDs — kept so YAML round-trips. Not edited by hand.
          name: 'notionIds',
          type: 'group',
          label: { ru: 'Notion IDs (legacy)', en: 'Notion IDs (legacy)' },
          admin: {
            description: {
              ru: 'Из старой Notion-CMS. Read-only по духу.',
              en: 'Legacy Notion CMS IDs. Read-only in spirit.'
            }
          },
          fields: [
            { name: 'ru', type: 'text', label: { ru: 'RU', en: 'RU' } },
            { name: 'en', type: 'text', label: { ru: 'EN', en: 'EN' } }
          ]
        }
      ]
    }
  ]
}
