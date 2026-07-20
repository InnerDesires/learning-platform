'use client'

import { FadeIn } from './FadeIn'
import { Eyebrow, Rails } from '@/components/brand'
import { Play } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

type Props = {
  tag: string
  title: string
  description: string
}

export function VideoSection({ tag, title, description }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { rootMargin: '-100px', threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <section ref={sectionRef} className="container pt-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <FadeIn>
          <Eyebrow className="justify-center">{tag}</Eyebrow>
          <h2 className="heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)]">{title}</h2>
        </FadeIn>
        <Rails className="mx-auto mt-4" />
        <FadeIn delay={100}>
          <p className="mt-4 max-w-xl text-sm text-fog">{description}</p>
        </FadeIn>
      </div>

      <FadeIn delay={200} className="mx-auto max-w-4xl">
        <div className="group relative aspect-video overflow-hidden rounded-2xl border border-line-2 bg-navy-2">
          {isInView && (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              preload="metadata"
              playsInline
              controls={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              poster="/static/zz/video-poster.jpg"
            >
              <source src="/static/zz/video.mp4" type="video/mp4" />
            </video>
          )}

          {!isPlaying && (
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-void/30 transition-colors duration-300 group-hover:bg-void/20"
              aria-label={title}
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-orange shadow-[0_0_0_12px_rgb(249_140_31/0.18)] transition-all hover:scale-105 hover:bg-amber md:h-[82px] md:w-[82px]">
                <Play className="ml-1 h-8 w-8 text-[#1B1204]" fill="currentColor" strokeWidth={0} />
              </span>
            </button>
          )}
        </div>
      </FadeIn>
    </section>
  )
}
