import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const Likes: CollectionConfig = {
  slug: 'likes',
  labels: { singular: 'Лайк', plural: 'Лайки' },
  admin: {
    defaultColumns: ['user', 'targetCollection', 'targetId', 'createdAt'],
    group: 'Взаємодія',
  },
  access: {
    create: authenticated,
    read: anyone,
    update: () => false,
    delete: authenticated,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create' || !data) return data

        const existing = await req.payload.find({
          collection: 'likes',
          where: {
            and: [
              { user: { equals: data.user } },
              { targetCollection: { equals: data.targetCollection } },
              { targetId: { equals: data.targetId } },
            ],
          },
          limit: 1,
          req,
        })

        if (existing.totalDocs > 0) {
          const { APIError } = await import('payload')
          throw new APIError('Already liked', 409)
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Користувач',
      index: true,
    },
    {
      name: 'targetCollection',
      type: 'select',
      required: true,
      label: 'Колекція',
      options: [
        { label: 'Публікації', value: 'posts' },
        { label: 'Курси', value: 'courses' },
        { label: 'Коментарі', value: 'comments' },
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
  ],
  timestamps: true,
}
