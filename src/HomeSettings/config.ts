import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

import { admin } from '@/access/admin'

export const HomeSettings: GlobalConfig = {
  slug: 'home-settings',
  label: 'Головна сторінка',
  lockDocuments: false,
  admin: {
    description:
      'Видимість секцій головної сторінки. Налаштування діють для обох мов. Вимкнення секції не видаляє її вміст.',
  },
  access: {
    read: () => true,
    update: admin,
  },
  fields: [
    {
      name: 'showCalendar',
      type: 'checkbox',
      label: 'Показувати календар змін',
      defaultValue: true,
      admin: { description: 'Секція «Найближчі зміни» на головній сторінці.' },
    },
    {
      name: 'showNews',
      type: 'checkbox',
      label: 'Показувати новини',
      defaultValue: true,
      admin: { description: 'Секція останніх новин на головній сторінці.' },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req }) => {
        if (!req.context.disableRevalidate) {
          revalidateTag('global_home-settings')
        }
        return doc
      },
    ],
  },
}
