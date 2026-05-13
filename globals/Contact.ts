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
      required: true
    },
    { name: 'telegramUrl', type: 'text' },
    { name: 'instagramUrl', type: 'text' }
  ]
}
