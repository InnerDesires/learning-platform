import Link from 'next/link'
import React from 'react'

import { getAllArticles } from '@/lib/admin-docs/loader'
import { TRACKS, type DocsTrack } from '@/lib/admin-docs/types'

const TRACK_ORDER: DocsTrack[] = ['manager', 'technical']

export const DocsHome: React.FC = () => (
  <div className="admin-docs__home">
    <header className="admin-docs__home-header">
      <h1>Документація платформи</h1>
      <p>
        Оберіть розділ документації. Посібник менеджера описує щоденну роботу з
        контентом, технічна документація — внутрішню будову платформи.
      </p>
    </header>
    <div className="admin-docs__home-cards">
      {TRACK_ORDER.map((track) => {
        const meta = TRACKS[track]
        const count = getAllArticles(track).length
        return (
          <Link className="admin-docs__home-card" href={`/admin/docs/${track}`} key={track}>
            <span className="admin-docs__home-card-kicker">
              {track === 'manager' ? 'Для менеджерів сайту' : 'Для технічних спеціалістів'}
            </span>
            <h2>{meta.label}</h2>
            <p>{meta.description}</p>
            <span className="admin-docs__home-card-count">
              {count} {countLabel(count)}
            </span>
          </Link>
        )
      })}
    </div>
  </div>
)

const countLabel = (count: number): string => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'стаття'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'статті'
  return 'статей'
}
