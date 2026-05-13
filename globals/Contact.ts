import type { GlobalConfig } from 'payload'
import { revalidateContact } from '../hooks/revalidate'

/**
 * Contact — port of keystatic singleton `contact`. Three channels
 * surfaced on /contact: email, Telegram, Instagram. Labels stay in
 * messages/*.json; only destinations live here.
 */
export const Contact: GlobalConfig = {
  slug: 'contact',
  label: { ru: 'Контакты', en: 'Contact' },
  admin: {
    group: { ru: 'Контент', en: 'Content' }
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user)
  },
  hooks: {
    afterChange: [revalidateContact]
  },
  fields: [
    {
      name: 'intro',
      type: 'textarea',
      label: { ru: 'Вступительный текст', en: 'Intro' },
      localized: true,
      admin: {
        description: {
          ru: 'Необязательный вступительный абзац над кнопками связи.',
          en: 'Optional intro paragraph above the contact buttons.'
        }
      }
    },
    {
      name: 'email',
      type: 'text',
      label: { ru: 'Эл. почта', en: 'Email' },
      required: true,
      admin: {
        description: {
          ru: 'Публичный email Романа. Используется в mailto-ссылке и подписи.',
          en: "Roman's public email. Used in the mailto link and copy block."
        }
      }
    },
    {
      name: 'telegramUrl',
      type: 'text',
      label: { ru: 'Telegram', en: 'Telegram URL' },
      admin: {
        description: {
          ru: 'Полный URL Telegram-аккаунта. Обязательно с https://. Пример: https://t.me/roman7593',
          en: 'Full Telegram account URL. Must include https://. e.g. https://t.me/roman7593'
        }
      }
    },
    {
      name: 'instagramUrl',
      type: 'text',
      label: { ru: 'Instagram', en: 'Instagram URL' },
      admin: {
        description: {
          ru: 'Полный URL Instagram-аккаунта. Обязательно с https://. Пример: https://instagram.com/boklanovroman',
          en: 'Full Instagram account URL. Must include https://. e.g. https://instagram.com/boklanovroman'
        }
      }
    }
  ]
}
