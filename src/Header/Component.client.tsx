'use client'
import Link from 'next/link'
import React from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  return (
    <header className="container relative z-20">
      <div className="py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Logo loading="eager" priority="high" />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
