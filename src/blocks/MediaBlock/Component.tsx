import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    mediaType,
    youtubeUrl,
    staticImage,
    disableInnerContainer,
  } = props

  const embedUrl = mediaType === 'youtube' && youtubeUrl ? youtubeUrl : undefined

  let caption
  if (!embedUrl && media && typeof media === 'object') caption = media.caption

  return (
    <div
      className={cn(
        '',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {embedUrl ? (
        <YouTubeEmbed url={embedUrl} />
      ) : (
        (media || staticImage) && (
          <Media
            imgClassName={cn('rounded-2xl', imgClassName)}
            resource={media}
            src={staticImage}
          />
        )
      )}
      {caption && (
        <div
          className={cn(
            'mt-6',
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} />
        </div>
      )}
    </div>
  )
}
