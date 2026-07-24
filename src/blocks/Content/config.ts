import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    label: 'Ширина колонки',
    options: [
      {
        label: 'Третина',
        value: 'oneThird',
      },
      {
        label: 'Половина',
        value: 'half',
      },
      {
        label: 'Дві третини',
        value: 'twoThirds',
      },
      {
        label: 'Уся ширина',
        value: 'full',
      },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: false,
  },
  {
    name: 'enableLink',
    type: 'checkbox',
    label: 'Додати посилання',
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: 'content',
  imageURL: '/block-thumbs/content.svg',
  imageAltText: 'Текстові колонки з контентом',
  interfaceName: 'ContentBlock',
  fields: [
    {
      name: 'columns',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
      label: 'Колонки',
      labels: { singular: 'Колонка', plural: 'Колонки' },
    },
  ],
  labels: {
    plural: 'Контент',
    singular: 'Контент',
  },
}
