import type { CollectionConfig, Access } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

const adminOrAuthor: Access = ({ req: { user } }) => {
  if (!user) return false
  if ('role' in user && user.role?.includes('admin')) return true
  return {
    author: { equals: user.id },
  }
}

export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: { singular: 'Коментар', plural: 'Коментарі' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'author', 'targetCollection', 'createdAt'],
    group: 'Взаємодія',
  },
  access: {
    create: authenticated,
    read: anyone,
    update: ({ req: { user } }) => {
      if (!user) return false
      return 'role' in user && Boolean(user.role?.includes('admin'))
    },
    delete: adminOrAuthor,
  },
  hooks: {
    beforeChange: [
      // Non-admin API requests always comment as themselves — a client-supplied
      // author would allow impersonation. Local API calls without a user
      // (server actions) pass the author explicitly.
      ({ data, operation, req }) => {
        if (
          operation === 'create' &&
          req.user &&
          !('role' in req.user && req.user.role?.includes('admin'))
        ) {
          data.author = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 2000,
      label: 'Текст коментаря',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Автор',
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'targetCollection',
      type: 'select',
      required: true,
      label: 'Колекція',
      options: [
        { label: 'Публікації', value: 'posts' },
        { label: 'Курси', value: 'courses' },
      ],
      index: true,
    },
    {
      name: 'targetId',
      type: 'number',
      required: true,
      label: 'ID цілі',
      index: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      label: 'Батьківський коментар',
      index: true,
    },
  ],
  timestamps: true,
}
