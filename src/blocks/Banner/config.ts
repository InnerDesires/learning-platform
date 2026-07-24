import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Banner: Block = {
  slug: 'banner',
  imageURL: '/block-thumbs/banner.svg',
  imageAltText: 'Кольорова смуга-сповіщення з текстом',
  labels: {
    singular: 'Банер',
    plural: 'Банери',
  },
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      label: 'Стиль',
      options: [
        { label: 'Інформація', value: 'info' },
        { label: 'Попередження', value: 'warning' },
        { label: 'Помилка', value: 'error' },
        { label: 'Успіх', value: 'success' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: false,
      required: true,
    },
  ],
  interfaceName: 'BannerBlock',
}
