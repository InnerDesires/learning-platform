import type { CollectionConfig, Access } from 'payload'
import { APIError } from 'payload'

import { admin } from '../access/admin'
import { authenticated } from '../access/authenticated'
import { rateLimitCreate } from '../hooks/rateLimitCreate'
import type { Event } from '@/payload-types'

const adminOrOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ('role' in user && user.role?.includes('admin')) return true
  return {
    user: { equals: user.id },
  }
}

export const EventEnrollments: CollectionConfig = {
  slug: 'event-enrollments',
  labels: { singular: 'Реєстрація на подію', plural: 'Реєстрації на події' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'event', 'enrolledAt'],
    group: 'Події',
  },
  access: {
    create: authenticated,
    // Unlike course enrollments there is no forgeable progress here, so owners
    // may cancel their own registration directly (mirrors Likes).
    delete: adminOrOwn,
    read: adminOrOwn,
    update: admin,
  },
  indexes: [
    {
      fields: ['user', 'event'],
      unique: true,
    },
  ],
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
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      label: 'Подія',
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'enrolledAt',
      type: 'date',
      label: 'Дата реєстрації',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      // One row per user×event is enforced below, but each attempt still does
      // lookups and page revalidation — cap scripted registration loops.
      rateLimitCreate({ prefix: 'event-enroll-create', windowSeconds: 600, max: 30 }),
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data

        const isAdminReq = Boolean(
          req.user && 'role' in req.user && req.user.role?.includes('admin'),
        )

        // Non-admin API requests can only register themselves; bind before the
        // duplicate check so a spoofed user id can't dodge it. Local API calls
        // without a user (server actions) pass the id explicitly.
        if (req.user && !isAdminReq) {
          data.user = req.user.id
        }

        if (data.user && data.event) {
          const existing = await req.payload.find({
            collection: 'event-enrollments',
            where: {
              and: [{ user: { equals: data.user } }, { event: { equals: data.event } }],
            },
            limit: 1,
            req,
          })
          if (existing.totalDocs > 0) {
            throw new APIError('Ви вже зареєстровані на цю подію', 409)
          }
        }

        // Business rules apply to users and server actions alike; admins may
        // register anyone manually from the panel (e.g. offline sign-ups).
        if (data.event && !isAdminReq) {
          const event = (await req.payload.findByID({
            collection: 'events',
            id: data.event,
            depth: 0,
            req,
          })) as Event | null

          if (!event || event._status !== 'published') {
            throw new APIError('Подію не знайдено', 404)
          }

          const ends = event.endDate ?? event.startDate
          if (ends && new Date(ends) < new Date()) {
            throw new APIError('Подія вже завершилась', 400)
          }

          if (typeof event.capacity === 'number') {
            const { totalDocs } = await req.payload.count({
              collection: 'event-enrollments',
              where: { event: { equals: data.event } },
              req,
            })
            if (totalDocs >= event.capacity) {
              throw new APIError('Вільних місць більше немає', 409)
            }
          }
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.enrolledAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
}
