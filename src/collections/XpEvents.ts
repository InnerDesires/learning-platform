import type { CollectionConfig } from 'payload'

import { admin } from '../access/admin'

// Append-only log of XP awards. Total XP stays derived from enrollments (src/utilities/xp.ts);
// this log exists only so period leaderboards can be computed — enrollments store which
// steps are done but not when.
export const XpEvents: CollectionConfig = {
  slug: 'xp-events',
  labels: { singular: 'Подія XP', plural: 'Події XP' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'course', 'kind', 'amount', 'createdAt'],
    group: 'Курси',
  },
  access: {
    create: admin,
    delete: admin,
    read: admin,
    update: admin,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Користувач',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      label: 'Курс',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: 'Тип',
      options: [
        { label: 'Крок', value: 'step' },
        { label: 'Тест', value: 'quiz' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'XP',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
