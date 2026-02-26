'use client'
import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  return (
    <div className="relative flex items-center justify-center overflow-hidden">
      <div className="container mb-8 z-10 relative flex items-center justify-center py-20">
        <div className="max-w-146 md:text-center">
          {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex md:justify-center gap-4">
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="absolute inset-0 -z-10">
        {media && typeof media === 'object' && (
          <Media fill imgClassName="object-cover opacity-20" priority resource={media} />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-background" />
      </div>
    </div>
  )
}
