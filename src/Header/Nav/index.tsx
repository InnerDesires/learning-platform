'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-1 items-center bg-secondary/80 backdrop-blur-sm rounded-full px-2 py-1.5">
      {navItems.map(({ link }, i) => {
        return (
          <CMSLink
            key={i}
            {...link}
            appearance="link"
            className="text-foreground no-underline hover:no-underline px-4 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
          />
        )
      })}
      <Link
        href="/search"
        className="ml-1 p-2 rounded-full transition-colors hover:bg-primary/10"
      >
        <span className="sr-only">Search</span>
        <SearchIcon className="w-4 h-4 text-foreground" />
      </Link>
    </nav>
  )
}
