import React from 'react'

type Props = {
  url: string
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

export const YouTubeEmbed: React.FC<Props> = ({ url }) => {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return (
      <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
        Invalid YouTube URL
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden max-w-3xl mx-auto">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}
