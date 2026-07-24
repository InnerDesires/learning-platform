import type { CollectionConfig } from 'payload'

import { admin } from '../../access/admin'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Користувач', plural: 'Користувачі' },
  lockDocuments: false,
  access: {
    admin: admin,
    create: admin,
    delete: admin,
    // read/update are intentionally NOT set. payload-auth spreads this object
    // over its own defaults, so leaving them out keeps the plugin's admin-or-self
    // access with non-admin self-updates limited to allowed fields — a project
    // override here would reopen role escalation via PATCH /api/users/:id.
  },
  hooks: {
    beforeDelete: [
      // These tables declare user_id/author_id NOT NULL while the FKs are
      // ON DELETE SET NULL, so the user's rows must be removed first or the
      // delete fails at the DB level.
      async ({ id, req }) => {
        await req.payload.delete({
          collection: 'xp-events',
          where: { user: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'quiz-attempts',
          where: { user: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'enrollments',
          where: { user: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'likes',
          where: { user: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'comments',
          where: { author: { equals: id } },
          req,
        })
      },
    ],
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
      name: 'hideProfileComments',
      type: 'checkbox',
      label: 'Приховувати коментарі в публічному профілі',
      defaultValue: false,
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
