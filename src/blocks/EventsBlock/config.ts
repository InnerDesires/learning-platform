import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const EventsBlock: Block = {
  slug: 'eventsBlock',
  interfaceName: 'EventsBlock',
  imageAltText: 'Сітка карток подій',
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
      defaultValue: 'upcoming',
      label: 'Джерело наповнення',
      options: [
        {
          label: 'Найближчі події',
          value: 'upcoming',
        },
        {
          label: 'Вибрані вручну',
          value: 'selection',
        },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'upcoming',
        step: 1,
      },
      defaultValue: 3,
      label: 'Кількість',
    },
    {
      name: 'selectedEvents',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
      },
      hasMany: true,
      label: 'Вибрані події',
      relationTo: 'events',
    },
    {
      name: 'showAllLink',
      type: 'checkbox',
      defaultValue: true,
      label: 'Показувати посилання «Всі події»',
    },
  ],
  labels: {
    plural: 'Події',
    singular: 'Події',
  },
}
