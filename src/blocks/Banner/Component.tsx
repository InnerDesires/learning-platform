import type { BannerBlock as BannerBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

type Props = {
  className?: string
} & BannerBlockProps

export const BannerBlock: React.FC<Props> = ({ className, content, style }) => {
  return (
    <div className={cn('mx-auto my-8 w-full', className)}>
      <div
        className={cn('py-4 px-6 flex items-center rounded-xl', {
          'bg-secondary text-foreground': style === 'info',
          'border-error bg-error/15 text-error': style === 'error',
          'border-success bg-success/15 text-success': style === 'success',
          'border-warning bg-warning/15 text-warning': style === 'warning',
        })}
      >
        <RichText data={content} enableGutter={false} enableProse={false} />
      </div>
    </div>
  )
}
