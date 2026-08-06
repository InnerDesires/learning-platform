import type { CollectionConfig, Field } from 'payload'

import { admin } from '../access/admin'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { slugField, validations } from 'payload'
import { cyrillicSlugify } from '../utilities/cyrillicSlugify'
import { YOUTUBE_URL_REGEX } from '../utilities/courseJsonImport'
import { syncCourseCompletions } from '../hooks/syncCourseCompletions'
import { revalidateCourse, revalidateCourseDelete } from '../hooks/revalidateCourse'

// Орієнтовна тривалість кроку — показується учням у списках кроків («Відео · 8 хв»).
const stepDurationField: Field = {
  name: 'duration',
  type: 'number',
  min: 1,
  max: 600,
  label: 'Тривалість (хв)',
  admin: {
    description: 'Орієнтовний час проходження кроку в хвилинах.',
  },
}

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Курс', plural: 'Курси' },
  lockDocuments: false,
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
    afterChange: [syncCourseCompletions, revalidateCourse],
    afterDelete: [revalidateCourseDelete],
    beforeDelete: [
      async ({ id, req }) => {
        // xp_events.course_id is NOT NULL with an ON DELETE SET NULL FK — the
        // rows must be removed first or the whole delete fails at the DB level.
        await req.payload.delete({
          collection: 'xp-events',
          where: { course: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'quiz-attempts',
          where: { course: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'enrollments',
          where: { course: { equals: id } },
          req,
        })
        await req.payload.delete({
          collection: 'comments',
          where: {
            and: [
              { targetCollection: { equals: 'courses' } },
              { targetId: { equals: id } },
            ],
          },
          req,
        })
        await req.payload.delete({
          collection: 'likes',
          where: {
            and: [
              { targetCollection: { equals: 'courses' } },
              { targetId: { equals: id } },
            ],
          },
          req,
        })
      },
    ],
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
      name: 'stepsJsonImport',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/components/admin/CourseJsonImport',
            exportName: 'CourseJsonImport',
            clientProps: { target: 'steps' },
          },
        },
      },
    },
    {
      name: 'steps',
      type: 'blocks',
      label: 'Кроки курсу',
      labels: {
        singular: 'Крок',
        plural: 'Кроки',
      },
      // required is what actually blocks publishing a course with zero steps:
      // Payload skips minRows validation entirely when the array is empty and
      // the field is not required. Drafts still save without steps (validation
      // is skipped for draft/autosave saves), so the admin workflow is intact.
      required: true,
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
            stepDurationField,
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
                if (!YOUTUBE_URL_REGEX.test(value)) {
                  return 'Введіть коректне YouTube посилання'
                }
                return true
              },
            },
            stepDurationField,
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
            stepDurationField,
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
          name: 'quizJsonImport',
          type: 'ui',
          admin: {
            components: {
              Field: {
                path: '@/components/admin/CourseJsonImport',
                exportName: 'CourseJsonImport',
                clientProps: { target: 'quiz' },
              },
            },
          },
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
          // Payload skips minRows validation entirely when an array is empty and
          // the field is not required, so an enabled quiz could be published with
          // zero questions. Unconditional `required: true` (the `steps` fix) would
          // break courses without a quiz, so instead re-run the stock array
          // validation with `required` switched on only when the quiz is enabled.
          // Drafts still save without questions — validation is skipped for
          // draft/autosave saves.
          validate: (value, options) => {
            const quizEnabled =
              (options.siblingData as { enabled?: boolean } | null | undefined)?.enabled === true
            return validations.array(value, { ...options, required: quizEnabled })
          },
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
              // Same empty-array loophole as `steps`: minRows is not enforced on
              // an empty optional array. A question always needs answers, so an
              // unconditional `required` is correct here.
              required: true,
              minRows: 2,
              // A question with no correct answer is unanswerable — every attempt
              // scores zero on it and the course can never be completed. Nothing
              // else enforces this, so run the stock length validation first and
              // then check the rows. `value` is the row array both on the server
              // and in admin form state; the check is skipped when the quiz is off
              // so stale questions can't block saving a course without a test.
              validate: (value, options) => {
                const lengthResult = validations.array(value, options)
                if (lengthResult !== true) return lengthResult

                const quizEnabled =
                  (options.data as { quiz?: { enabled?: boolean } } | undefined)?.quiz?.enabled ===
                  true
                if (!quizEnabled || !Array.isArray(value)) return true

                const hasCorrect = value.some(
                  (answer) => (answer as { isCorrect?: boolean } | null)?.isCorrect === true,
                )
                if (!hasCorrect) {
                  return 'Позначте щонайменше одну правильну відповідь.'
                }

                return true
              },
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
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'deleteConfirmation',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/CourseDeleteConfirmation',
        },
      },
    },
  ],
}
