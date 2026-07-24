import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  imageURL: '/block-thumbs/media.svg',
  imageAltText: 'Зображення або відео з підписом',
  labels: {
    singular: 'Медіа-блок',
    plural: 'Медіа-блоки',
  },
  fields: [
    {
      name: 'mediaType',
      type: 'radio',
      label: 'Тип медіа',
      defaultValue: 'upload',
      options: [
        { label: 'Файл (зображення / відео)', value: 'upload' },
        { label: 'YouTube відео', value: 'youtube' },
      ],
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        condition: (_, siblingData) => siblingData?.mediaType !== 'youtube',
      },
    },
    {
      name: 'youtubeUrl',
      type: 'text',
      label: 'YouTube URL',
      required: true,
      admin: {
        condition: (_, siblingData) => siblingData?.mediaType === 'youtube',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true
        const ytRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/
        if (!ytRegex.test(value)) {
          return 'Введіть коректне YouTube посилання'
        }
        return true
      },
    },
  ],
}
