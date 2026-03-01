import type { CollectionConfig } from 'payload'

import { admin } from '../access/admin'
import { anyone } from '../access/anyone'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const CourseFiles: CollectionConfig = {
  slug: 'course-files',
  labels: { singular: 'Файл курсу', plural: 'Файли курсів' },
  admin: {
    group: 'Курси',
  },
  access: {
    create: admin,
    delete: admin,
    read: anyone,
    update: admin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Назва файлу',
      localized: true,
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/course-files'),
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ],
  },
}
