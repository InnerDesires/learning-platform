import type { CollectionConfig, Access } from 'payload'
import { APIError } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

const adminOrOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ('role' in user && user.role?.includes('admin')) return true
  return {
    user: { equals: user.id },
  }
}

export const Likes: CollectionConfig = {
  slug: 'likes',
  labels: { singular: 'Лайк', plural: 'Лайки' },
  lockDocuments: false,
  admin: {
    defaultColumns: ['user', 'targetCollection', 'targetId', 'createdAt'],
    group: 'Взаємодія',
  },
  access: {
    create: authenticated,
    read: anyone,
    update: () => false,
    delete: adminOrOwn,
  },
  indexes: [
    {
      fields: ['user', 'targetCollection', 'targetId'],
      unique: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create' || !data) return data

        // Non-admin API requests can only like as themselves; bind before the
        // duplicate check so a spoofed user id can't dodge it. Local API calls
        // without a user (server actions) pass the id explicitly.
        if (req.user && !('role' in req.user && req.user.role?.includes('admin'))) {
          data.user = req.user.id
        }

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
