import type { CollectionConfig, Access } from 'payload'
import { APIError } from 'payload'

import { admin } from '../access/admin'
import { authenticated } from '../access/authenticated'

const adminOrOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ('role' in user && user.role?.includes('admin')) return true
  return {
    user: { equals: user.id },
  }
}

export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  labels: { singular: 'Запис на курс', plural: 'Записи на курси' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'course', 'status', 'enrolledAt'],
    group: 'Курси',
  },
  access: {
    create: authenticated,
    delete: admin,
    read: adminOrOwn,
    update: adminOrOwn,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Користувач',
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      label: 'Курс',
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'completedSteps',
      type: 'json',
      label: 'Завершені кроки',
      defaultValue: [],
      admin: {
        readOnly: true,
        description: 'Масив ID завершених блоків кроків',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'enrolled',
      options: [
        { label: 'Записаний', value: 'enrolled' },
        { label: 'В процесі', value: 'in_progress' },
        { label: 'Завершено', value: 'completed' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'enrolledAt',
      type: 'date',
      label: 'Дата запису',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Дата завершення',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.status === 'completed',
      },
    },
    {
      name: 'quizPassed',
      type: 'checkbox',
      defaultValue: false,
      label: 'Тест складено',
      admin: { readOnly: true },
    },
    {
      name: 'bestQuizScore',
      type: 'number',
      min: 0,
      max: 100,
      label: 'Найкращий результат тесту',
      admin: { readOnly: true },
    },
    {
      name: 'quizAttempts',
      type: 'number',
      defaultValue: 0,
      label: 'Кількість спроб',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && data?.user && data?.course) {
          const existing = await req.payload.find({
            collection: 'enrollments',
            where: {
              and: [
                { user: { equals: data.user } },
                { course: { equals: data.course } },
              ],
            },
            limit: 1,
            req,
          })
          if (existing.totalDocs > 0) {
            throw new APIError('Ви вже записані на цей курс', 409)
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.enrolledAt = new Date().toISOString()
          data.completedSteps = []
          data.status = 'enrolled'
        }
        return data
      },
    ],
  },
}
