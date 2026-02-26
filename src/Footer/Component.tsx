import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-secondary/50">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between md:items-center">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <nav className="flex flex-col md:flex-row gap-4">
          {navItems.map(({ link }, i) => {
            return (
              <CMSLink
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
                key={i}
                {...link}
              />
            )
          })}
        </nav>
      </div>
    </footer>
  )
}
