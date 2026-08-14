import type { Payload, ServerProps } from 'payload'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const quickStats = [
  { slug: 'courses', label: 'Курси' },
  { slug: 'users', label: 'Користувачі' },
  { slug: 'posts', label: 'Публікації' },
  { slug: 'enrollments', label: 'Записи на курси' },
  { slug: 'comments', label: 'Коментарі' },
] as const

const quickActions = [
  { href: '/admin/collections/courses/create', label: 'Новий курс' },
  { href: '/admin/collections/posts/create', label: 'Нова публікація' },
  { href: '/admin/collections/pages/create', label: 'Нова сторінка' },
  { href: '/admin/collections/media', label: 'Медіатека' },
] as const

const countDocs = async (payload: Payload, slug: (typeof quickStats)[number]['slug']) => {
  try {
    const { totalDocs } = await payload.count({ collection: slug })
    return totalDocs
  } catch {
    return null
  }
}

const BeforeDashboard: React.FC<ServerProps> = async ({ payload, user }) => {
  const counts = await Promise.all(quickStats.map(({ slug }) => countDocs(payload, slug)))

  const userName = user && 'name' in user && typeof user.name === 'string' ? user.name : null

  return (
    <div className={baseClass} data-testid="before-dashboard-root">
      <header className={`${baseClass}__header`}>
        <img alt="" aria-hidden="true" src="/logo-iron-squad.svg" />
        <div>
          <h2>
            Залізна <em>Зміна</em>
          </h2>
          <p>{userName ? `Вітаємо, ${userName}! ` : ''}Панель керування навчальною платформою.</p>
        </div>
        <div className={`${baseClass}__actions`}>
          {quickActions.map(({ href, label }) => (
            <a className={`${baseClass}__action`} href={href} key={href}>
              {label}
            </a>
          ))}
        </div>
      </header>
      <ul className={`${baseClass}__stats`}>
        {quickStats.map(({ slug, label }, i) => (
          <li key={slug}>
            <a href={`/admin/collections/${slug}`}>
              <span className={`${baseClass}__stat-count`}>{counts[i] ?? '—'}</span>
              <span className={`${baseClass}__stat-label`}>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BeforeDashboard
