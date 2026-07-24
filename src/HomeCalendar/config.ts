import type { GlobalConfig } from 'payload'

import { getHomeContent } from '@/components/Home/content'
import { revalidateHomeCalendar } from './hooks/revalidateHomeCalendar'

// Admin form defaults mirror the hardcoded landing content (content.ts), so the
// first save starts from what the site already shows.
const defaults = (locale: unknown) => getHomeContent(locale === 'en' ? 'en' : 'uk').calendar

export const HomeCalendar: GlobalConfig = {
  slug: 'home-calendar',
  label: 'Календар змін',
  admin: {
    description:
      'Секція «Найближчі зміни» на головній сторінці. Зберігайте обидві локалізації (українську та англійську) — інакше англійська версія показуватиме український текст.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'tag',
      type: 'text',
      label: 'Надзаголовок',
      localized: true,
      defaultValue: ({ locale }) => defaults(locale).tag,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок',
      localized: true,
      defaultValue: ({ locale }) => defaults(locale).title,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Опис',
      localized: true,
      defaultValue: ({ locale }) => defaults(locale).description,
    },
    {
      name: 'events',
      type: 'array',
      label: 'Зміни',
      localized: true,
      defaultValue: ({ locale }) => defaults(locale).events,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/HomeCalendar/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'month',
              type: 'text',
              label: 'Місяць (скорочено)',
              required: true,
              admin: { description: 'Напр. «ВЕР»', width: '50%' },
            },
            {
              name: 'year',
              type: 'text',
              label: 'Рік',
              required: true,
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'range',
          type: 'text',
          label: 'Дати',
          required: true,
          admin: { description: 'Напр. «1–7 вересня 2026»' },
        },
        { name: 'title', type: 'text', label: 'Назва зміни', required: true },
        { name: 'description', type: 'textarea', label: 'Опис' },
        { name: 'formUrl', type: 'text', label: 'Посилання на анкету', required: true },
      ],
    },
    {
      name: 'cta',
      type: 'text',
      label: 'Текст кнопки',
      localized: true,
      defaultValue: ({ locale }) => defaults(locale).cta,
      admin: { description: 'Кнопка веде на анкету першої зміни у списку.' },
    },
  ],
  hooks: {
    afterChange: [revalidateHomeCalendar],
  },
}
