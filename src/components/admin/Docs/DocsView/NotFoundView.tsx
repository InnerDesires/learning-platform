import Link from 'next/link'
import React from 'react'

export const NotFoundView: React.FC = () => (
  <div className="admin-docs__not-found">
    <h1>Сторінку не знайдено</h1>
    <p>Такої статті документації не існує. Можливо, її перейменували.</p>
    <p>
      <Link href="/admin/docs">← До розділів документації</Link>
    </p>
  </div>
)
