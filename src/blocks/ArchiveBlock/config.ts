import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Archive: Block = {
  slug: 'archive',
  interfaceName: 'ArchiveBlock',
  imageURL: '/block-thumbs/archive.svg',
  imageAltText: 'Сітка карток із матеріалами колекції',
  fields: [
    {
      name: 'introContent',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: 'Вступний текст',
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      label: 'Джерело наповнення',
      options: [
        {
          label: 'Колекція',
          value: 'collection',
        },
        {
          label: 'Вибрані вручну',
          value: 'selection',
        },
      ],
    },
    {
      name: 'relationTo',
      type: 'select',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
      defaultValue: 'posts',
      label: 'Колекція для показу',
      options: [
        {
          label: 'Публікації',
          value: 'posts',
        },
        {
          label: 'Курси',
          value: 'courses',
        },
        {
          label: 'Категорії курсів',
          value: 'course-categories',
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) =>
          siblingData.populateBy === 'collection' && siblingData.relationTo === 'posts',
      },
      hasMany: true,
      label: 'Категорії для показу',
      relationTo: 'categories',
    },
    {
      name: 'courseCategories',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) =>
          siblingData.populateBy === 'collection' && siblingData.relationTo === 'courses',
      },
      hasMany: true,
      label: 'Категорії курсів для показу',
      relationTo: 'course-categories',
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
        step: 1,
      },
      defaultValue: 10,
      label: 'Кількість',
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
      },
      hasMany: true,
      label: 'Вибрані документи',
      relationTo: ['posts', 'courses', 'course-categories'],
    },
  ],
  labels: {
    plural: 'Архіви',
    singular: 'Архів',
  },
}
