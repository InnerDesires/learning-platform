'use client'

import React, { useState } from 'react'
import { Play } from 'lucide-react'

type Props = {
  url: string
  title?: string
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export const YouTubeEmbed: React.FC<Props> = ({ url, title = 'YouTube video' }) => {
  const [activated, setActivated] = useState(false)
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        Invalid YouTube URL
      </div>
    )
  }

  if (!activated) {
    return (
      <button
        type="button"
        onClick={() => setActivated(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-line-2 bg-navy-2"
        aria-label={title}
      >
        {/* hqdefault exists for every video (maxres does not) */}
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
        />
        <span className="absolute inset-0 m-auto grid h-20 w-20 place-items-center rounded-full bg-orange shadow-[0_0_0_12px_rgb(249_140_31/0.18)] transition-transform group-hover:scale-105">
          <Play className="ml-1 h-7 w-7 text-[#1B1204]" fill="currentColor" strokeWidth={0} />
        </span>
      </button>
    )
  }

  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-line-2">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}
