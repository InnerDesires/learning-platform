import type { CollectionConfig } from 'payload'

import { admin } from '../access/admin'
import { anyone } from '../access/anyone'
import { slugField } from 'payload'
import { cyrillicSlugify } from '../utilities/cyrillicSlugify'

export const CourseCategories: CollectionConfig = {
  slug: 'course-categories',
  labels: { singular: 'Категорія курсів', plural: 'Категорії курсів' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'createdAt'],
    group: 'Курси',
  },
  access: {
    create: admin,
    delete: admin,
    read: anyone,
    update: admin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Назва',
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: 'Опис',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Зображення',
    },
    slugField({
      slugify: cyrillicSlugify,
      position: undefined,
    }),
  ],
}
