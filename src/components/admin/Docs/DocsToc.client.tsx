'use client'

import React, { useEffect, useState } from 'react'

import type { DocHeading } from '@/lib/admin-docs/types'

/**
 * "На цій сторінці" table of contents with a scroll-spy highlight and a
 * reading-progress bar. Headings are rendered server-side with stable ids.
 */
export const DocsToc: React.FC<{ headings: DocHeading[] }> = ({ headings }) => {
  const [activeId, setActiveId] = useState<null | string>(headings[0]?.id ?? null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (headings.length === 0) return

    const article = document.getElementById('admin-docs-article')
    if (!article) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    )

    for (const heading of headings) {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    }

    const onScroll = () => {
      const rect = article.getBoundingClientRect()
      const viewport = window.innerHeight
      const total = rect.height - viewport
      const value = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total))
      setProgress(value)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [headings])

  if (headings.length === 0) return null

  return (
    <aside aria-label="Зміст сторінки" className="admin-docs-toc">
      <div className="admin-docs-toc__inner">
        <p className="admin-docs-toc__title">
          На цій сторінці
          <span className="admin-docs-toc__progress" role="presentation">
            <span style={{ transform: `scaleX(${progress})` }} />
          </span>
        </p>
        <ul>
          {headings.map((heading) => (
            <li
              className={`admin-docs-toc__item admin-docs-toc__item--h${heading.depth}${
                heading.id === activeId ? ' is-active' : ''
              }`}
              key={heading.id}
            >
              <a
                href={`#${heading.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  document
                    .getElementById(heading.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  history.replaceState(null, '', `#${heading.id}`)
                  setActiveId(heading.id)
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
