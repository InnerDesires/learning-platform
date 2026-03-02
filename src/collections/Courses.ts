import type { CollectionConfig } from 'payload'

import { admin } from '../access/admin'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { slugField } from 'payload'
import { cyrillicSlugify } from '../utilities/cyrillicSlugify'
import { populatePublishedAt } from '../hooks/populatePublishedAt'

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Курс', plural: 'Курси' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'createdAt'],
    group: 'Курси',
  },
  access: {
    create: admin,
    delete: admin,
    read: authenticatedOrPublished,
    update: admin,
  },
  hooks: {
    beforeChange: [populatePublishedAt],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 10000,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Назва',
    },
    slugField({
      slugify: cyrillicSlugify,
      position: undefined,
    }),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: 'Опис',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Обкладинка',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'course-categories',
      label: 'Категорія',
    },
    {
      name: 'steps',
      type: 'blocks',
      label: 'Кроки курсу',
      labels: {
        singular: 'Крок',
        plural: 'Кроки',
      },
      minRows: 1,
      blocks: [
        {
          slug: 'richTextStep',
          labels: { singular: 'Текстовий крок', plural: 'Текстові кроки' },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: 'Заголовок',
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              localized: true,
              label: 'Контент',
            },
          ],
        },
        {
          slug: 'youtubeVideoStep',
          labels: { singular: 'Відео крок', plural: 'Відео кроки' },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: 'Заголовок',
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              label: 'Опис',
            },
            {
              name: 'youtubeUrl',
              type: 'text',
              required: true,
              label: 'YouTube URL',
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
        },
        {
          slug: 'fileStep',
          labels: { singular: 'Файловий крок', plural: 'Файлові кроки' },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: 'Заголовок',
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              label: 'Опис',
            },
            {
              name: 'file',
              type: 'upload',
              relationTo: 'course-files',
              required: true,
              label: 'Файл (PDF або презентація)',
            },
          ],
        },
      ],
    },
    {
      name: 'quiz',
      type: 'group',
      label: 'Фінальний тест',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Увімкнути тест',
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: 'Назва тесту',
          admin: {
            condition: (data) => data?.quiz?.enabled === true,
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: 'Опис тесту',
          admin: {
            condition: (data) => data?.quiz?.enabled === true,
          },
        },
        {
          name: 'passingScore',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 70,
          label: 'Прохідний бал (%)',
          admin: {
            condition: (data) => data?.quiz?.enabled === true,
          },
        },
        {
          name: 'questions',
          type: 'array',
          label: 'Питання',
          labels: {
            singular: 'Питання',
            plural: 'Питання',
          },
          minRows: 1,
          admin: {
            condition: (data) => data?.quiz?.enabled === true,
          },
          fields: [
            {
              name: 'question',
              type: 'text',
              required: true,
              localized: true,
              label: 'Питання',
            },
            {
              name: 'answers',
              type: 'array',
              label: 'Відповіді',
              labels: {
                singular: 'Відповідь',
                plural: 'Відповіді',
              },
              minRows: 2,
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                  localized: true,
                  label: 'Текст відповіді',
                },
                {
                  name: 'isCorrect',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Правильна відповідь',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публікації',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
