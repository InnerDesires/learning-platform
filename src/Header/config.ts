import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { admin } from '@/access/admin'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Хедер сайту',
  access: {
    read: () => true,
    update: admin,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Пункти навігації',
      localized: true,
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
