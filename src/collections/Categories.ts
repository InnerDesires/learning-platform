import type { CollectionConfig } from 'payload'

import { admin } from '../access/admin'
import { anyone } from '../access/anyone'
import { slugField } from 'payload'
import { cyrillicSlugify } from '../utilities/cyrillicSlugify'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категорія', plural: 'Категорії' },
  access: {
    create: admin,
    delete: admin,
    read: anyone,
    update: admin,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Заголовок',
    },
    slugField({
      slugify: cyrillicSlugify,
      position: undefined,
    }),
  ],
}
