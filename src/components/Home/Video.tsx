'use client'

import { FadeIn } from './FadeIn'
import { useRef, useState, useEffect } from 'react'

type Props = {
  locale: string
}

export function VideoSection({ locale }: Props) {
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
      { rootMargin: '-100px', threshold: 0 }
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
    <section ref={sectionRef} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[#1e3b8a]/5 to-background" />

      <div className="container relative">
        <div className="text-center mb-12">
          <FadeIn>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
              {locale === 'uk' ? 'Відео' : 'Video'}
            </span>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {locale === 'uk' ? 'Подивіться на нас в дії' : 'See Us in Action'}
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {locale === 'uk'
                ? 'Пригоди, навчання та незабутні моменти проєкту «Залізна Зміна»'
                : 'Adventures, learning, and unforgettable moments of the Iron Squad project'}
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={300} className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-border/30 bg-black aspect-video group">
            {isInView && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                preload="metadata"
                playsInline
                controls={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                poster="/static/zz/hero.png"
              >
                <source src="/static/zz/video.mp4" type="video/mp4" />
              </video>
            )}

            {!isPlaying && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors duration-300 cursor-pointer"
                aria-label={locale === 'uk' ? 'Відтворити відео' : 'Play video'}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#F99E2D] flex items-center justify-center shadow-lg shadow-[#F99E2D]/30 hover:scale-110 active:scale-95 transition-transform">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
