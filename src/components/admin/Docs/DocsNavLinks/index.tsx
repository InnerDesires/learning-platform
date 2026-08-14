import Link from 'next/link'
import React from 'react'

import './index.scss'

/**
 * Two documentation entry points rendered below the collection links in the
 * admin nav (admin.components.afterNavLinks).
 */
const DocsNavLinks: React.FC = () => (
  <div className="admin-docs-nav-links">
    <p className="admin-docs-nav-links__label">Документація</p>
    <Link className="admin-docs-nav-links__link" href="/admin/docs/manager">
      <BookIcon />
      Посібник менеджера
    </Link>
    <Link className="admin-docs-nav-links__link" href="/admin/docs/technical">
      <CodeIcon />
      Технічна документація
    </Link>
  </div>
)

const BookIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const CodeIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

export default DocsNavLinks
