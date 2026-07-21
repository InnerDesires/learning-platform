import type { CollectionConfig } from 'payload'

import { admin } from '../../access/admin'
import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Користувач', plural: 'Користувачі' },
  lockDocuments: false,
  access: {
    admin: admin,
    create: admin,
    delete: admin,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'about',
      type: 'textarea',
      label: 'Про мене',
      maxLength: 500,
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Соціальні мережі',
      labels: { singular: 'Посилання', plural: 'Посилання' },
      maxRows: 8,
      fields: [
        {
          name: 'platform',
          type: 'select',
          label: 'Платформа',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Telegram', value: 'telegram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X (Twitter)', value: 'x' },
            { label: 'Вебсайт', value: 'website' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          required: true,
        },
      ],
    },
  ],
  timestamps: true,
}
