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
          localized: true,
          required: true,
          admin: {
            description: {
              ru: 'Название спектакля. Локализуется.',
              en: 'Production title. Localized.'
            }
          }
        },
        { name: 'tagline', type: 'text', localized: true },
        { name: 'synopsis', type: 'textarea', localized: true },
        {
          name: 'directorsNote',
          type: 'textarea',
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
          fields: [
            {
              name: 'src',
              type: 'text',
              admin: {
                components: {
                  afterInput: [
                    '/components/admin/ImagePathPreview#ImagePathPreview'
                  ]
                }
              }
            },
            { name: 'credit', type: 'text' }
          ]
        },
        {
          name: 'productionsPhoto',
          type: 'group',
          fields: [
            {
              name: 'src',
              type: 'text',
              admin: {
                components: {
                  afterInput: [
                    '/components/admin/ImagePathPreview#ImagePathPreview'
                  ]
                }
              }
            },
            { name: 'credit', type: 'text' }
          ]
        },
        {
          name: 'featuredPhoto',
          type: 'group',
          fields: [
            {
              name: 'src',
              type: 'text',
              admin: {
                components: {
                  afterInput: [
                    '/components/admin/ImagePathPreview#ImagePathPreview'
                  ]
                }
              }
            },
            { name: 'credit', type: 'text' }
          ]
        },
        {
          name: 'gallery',
          type: 'array',
          labels: {
            singular: { ru: 'Фото', en: 'Photo' },
            plural: { ru: 'Галерея', en: 'Gallery' }
          },
          fields: [
            {
              name: 'src',
              type: 'text',
              admin: {
                components: {
                  afterInput: [
                    '/components/admin/ImagePathPreview#ImagePathPreview'
                  ]
                }
              }
            },
            { name: 'credit', type: 'text' },
            { name: 'caption', type: 'text', localized: true }
          ]
        },
        {
          name: 'videos',
          type: 'array',
          fields: [
            {
              name: 'provider',
              type: 'select',
              defaultValue: 'youtube',
              options: [
                { label: 'YouTube', value: 'youtube' },
                { label: 'Vimeo', value: 'vimeo' }
              ]
            },
            { name: 'id', type: 'text' }
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
          fields: [
            { name: 'name', type: 'text', localized: true },
            { name: 'shortName', type: 'text', localized: true },
            { name: 'city', type: 'text', localized: true },
            {
              name: 'country',
              type: 'text',
              admin: {
                description: {
                  ru: 'ISO-2 код: RU / KZ / DE / AT / ES.',
                  en: 'ISO-2 code: RU / KZ / DE / AT / ES.'
                }
              }
            },
            { name: 'url', type: 'text' },
            { name: 'year', type: 'number' }
          ]
        },
        { name: 'premiereDate', type: 'text', localized: true },
        { name: 'ticketsUrl', type: 'text' },
        {
          name: 'ageRating',
          type: 'text',
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
          fields: [{ name: 'value', type: 'text' }],
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
          fields: [{ name: 'value', type: 'text' }],
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
          fields: [{ name: 'value', type: 'text' }]
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
          fields: [
            { name: 'role', type: 'text' },
            { name: 'name', type: 'text' },
            { name: 'url', type: 'text' }
          ]
        },
        {
          name: 'creditsEn',
          type: 'array',
          fields: [
            { name: 'role', type: 'text' },
            { name: 'name', type: 'text' },
            { name: 'url', type: 'text' }
          ]
        },
        {
          name: 'creditsDe',
          type: 'array',
          fields: [
            { name: 'role', type: 'text' },
            { name: 'name', type: 'text' },
            { name: 'url', type: 'text' }
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
          fields: [
            { name: 'name', type: 'text', localized: true },
            { name: 'year', type: 'number' },
            { name: 'category', type: 'text', localized: true },
            { name: 'city', type: 'text', localized: true },
            { name: 'url', type: 'text' }
          ]
        },
        {
          name: 'festivals',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', localized: true },
            { name: 'year', type: 'number' },
            { name: 'category', type: 'text', localized: true },
            { name: 'city', type: 'text', localized: true }
          ]
        },
        {
          name: 'press',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'url', type: 'text' },
            { name: 'outlet', type: 'text' },
            {
              name: 'language',
              type: 'text',
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
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'url', type: 'text' }
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
          fields: [{ name: 'city', type: 'text', localized: true }]
        },
        {
          name: 'runs',
          type: 'array',
          fields: [
            { name: 'venue', type: 'text', localized: true },
            { name: 'city', type: 'text', localized: true },
            { name: 'yearFrom', type: 'number' },
            { name: 'yearTo', type: 'number' },
            { name: 'count', type: 'text', localized: true }
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
          defaultValue: true,
          admin: {
            description: {
              ru: 'Выключено — на странице нет кнопки «забронировать».',
              en: 'When off, the production page hides the booking CTA.'
            }
          }
        },
        { name: 'bookingCtaLabel', type: 'text', localized: true },
        { name: 'bookingCtaUrl', type: 'text' },
        {
          name: 'featured',
          type: 'checkbox',
          admin: {
            description: {
              ru: 'Показывать на главной в featured-стрипе.',
              en: 'Surface this production on the home featured strip.'
            }
          }
        },
        { name: 'featuredOrder', type: 'number' },
        { name: 'listOrder', type: 'number' },
        { name: 'techRider', type: 'text' },
        { name: 'pressKit', type: 'text' },
        {
          // Legacy Notion IDs — kept so YAML round-trips. Not edited by hand.
          name: 'notionIds',
          type: 'group',
          admin: {
            description: {
              ru: 'Из старой Notion-CMS. Read-only по духу.',
              en: 'Legacy Notion CMS IDs. Read-only in spirit.'
            }
          },
          fields: [
            { name: 'ru', type: 'text' },
            { name: 'en', type: 'text' }
          ]
        }
      ]
    }
  ]
}
