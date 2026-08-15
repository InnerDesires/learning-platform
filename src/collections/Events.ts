import type { CollectionConfig, TextFieldValidation } from 'payload'

import { admin } from '../access/admin'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { slugField } from 'payload'
import { cyrillicSlugify } from '../utilities/cyrillicSlugify'
import { revalidateEvent, revalidateEventDelete } from '../hooks/revalidateEvent'

const HTTP_URL_REGEX = /^https?:\/\/\S+$/

const validateOptionalUrl = (value: string | null | undefined) => {
  if (!value) return true
  return HTTP_URL_REGEX.test(value) || 'Введіть коректне посилання (https://…)'
}

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Подія', plural: 'Події' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'locationType', '_status'],
    group: 'Події',
  },
  access: {
    create: admin,
    delete: admin,
    read: authenticatedOrPublished,
    update: admin,
  },
  hooks: {
    afterChange: [revalidateEvent],
    afterDelete: [revalidateEventDelete],
    beforeDelete: [
      async ({ id, req }) => {
        // event_enrollments.event_id is NOT NULL with an ON DELETE SET NULL FK —
        // the rows must be removed first or the whole delete fails at the DB level.
        await req.payload.delete({
          collection: 'event-enrollments',
          where: { event: { equals: id } },
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
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'Обкладинка',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          label: 'Початок',
          index: true,
          admin: {
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
            width: '50%',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Завершення',
          admin: {
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
            width: '50%',
          },
          validate: (value, { siblingData }) => {
            const start = (siblingData as { startDate?: string })?.startDate
            if (value && start && new Date(value) <= new Date(start)) {
              return 'Завершення має бути пізніше за початок'
            }
            return true
          },
        },
      ],
    },
    {
      name: 'locationType',
      type: 'select',
      required: true,
      defaultValue: 'local',
      label: 'Формат',
      options: [
        { label: 'Офлайн (за адресою)', value: 'local' },
        { label: 'Онлайн (за посиланням)', value: 'virtual' },
      ],
    },
    {
      name: 'address',
      type: 'text',
      localized: true,
      label: 'Адреса',
      admin: {
        condition: (data) => data?.locationType === 'local',
        description: 'Місце проведення, наприклад: Київ, вул. Хрещатик, 1',
      },
      // Drafts save without validation, so this only blocks publishing an
      // offline event with no address.
      validate: ((value, { data }) => {
        const shape = data as { locationType?: string } | undefined
        if (shape?.locationType === 'local' && !value) {
          return 'Вкажіть адресу для офлайн-події'
        }
        return true
      }) as TextFieldValidation,
    },
    {
      name: 'mapLink',
      type: 'text',
      label: 'Посилання на мапу',
      admin: {
        condition: (data) => data?.locationType === 'local',
        description: 'Посилання на Google Maps або інший сервіс мап',
      },
      validate: validateOptionalUrl,
    },
    {
      name: 'meetingLink',
      type: 'text',
      label: 'Посилання на зустріч',
      access: {
        // The join link is for registered participants; keep it out of
        // anonymous REST/API responses. ISR pages fetch with
        // overrideAccess: false and no user, so it never lands in the shared
        // static cache either — enrolled users get it via a server action.
        read: ({ req }) => Boolean(req.user),
      },
      admin: {
        condition: (data) => data?.locationType === 'virtual',
        description: 'Zoom, Google Meet або інша платформа. Бачать лише зареєстровані учасники.',
      },
      validate: ((value, { data }) => {
        const shape = data as { locationType?: string } | undefined
        if (shape?.locationType === 'virtual' && !value) {
          return 'Додайте посилання на онлайн-зустріч'
        }
        return validateOptionalUrl(value)
      }) as TextFieldValidation,
    },
    {
      name: 'capacity',
      type: 'number',
      min: 1,
      label: 'Кількість місць',
      admin: {
        position: 'sidebar',
        description: 'Залиште порожнім, якщо кількість учасників не обмежена',
      },
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
  ],
}
