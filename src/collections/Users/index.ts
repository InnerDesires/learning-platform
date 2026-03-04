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
  fields: [],
  timestamps: true,
}
