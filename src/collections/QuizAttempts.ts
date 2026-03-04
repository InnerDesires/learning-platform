import type { CollectionConfig, Access } from 'payload'

import { admin } from '../access/admin'
import { authenticated } from '../access/authenticated'

const adminOrOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ('role' in user && user.role?.includes('admin')) return true
  return {
    user: { equals: user.id },
  }
}

export const QuizAttempts: CollectionConfig = {
  slug: 'quiz-attempts',
  labels: { singular: 'Спроба тесту', plural: 'Спроби тестів' },
  lockDocuments: false,
  admin: {
    group: 'Курси',
    defaultColumns: ['user', 'course', 'score', 'passed', 'createdAt'],
  },
  access: {
    create: authenticated,
    read: adminOrOwn,
    update: admin,
    delete: admin,
  },
  timestamps: true,
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'Користувач',
      admin: { readOnly: true },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      index: true,
      label: 'Курс',
      admin: { readOnly: true },
    },
    {
      name: 'score',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      label: 'Результат (%)',
      admin: { readOnly: true },
    },
    {
      name: 'passed',
      type: 'checkbox',
      label: 'Складено',
      admin: { readOnly: true },
    },
    {
      name: 'totalQuestions',
      type: 'number',
      required: true,
      label: 'Загальна кількість питань',
      admin: { readOnly: true },
    },
    {
      name: 'correctAnswers',
      type: 'number',
      required: true,
      label: 'Правильних відповідей',
      admin: { readOnly: true },
    },
    {
      name: 'answers',
      type: 'json',
      label: 'Відповіді',
      admin: { readOnly: true },
    },
    {
      name: 'attemptNumber',
      type: 'number',
      required: true,
      label: 'Номер спроби',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && data?.user && data?.course) {
          const existing = await req.payload.find({
            collection: 'quiz-attempts',
            where: {
              and: [
                { user: { equals: data.user } },
                { course: { equals: data.course } },
              ],
            },
            limit: 0,
            req,
          })
          data.attemptNumber = existing.totalDocs + 1
        }
        return data
      },
    ],
  },
}
