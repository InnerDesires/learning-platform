'use client'

import { FadeIn } from './FadeIn'

type Member = {
  name: string
  role: string
  initials: string
  image?: string
}

type Props = {
  tag: string
  title: string
  members: Member[]
}

export function TeamSection({ tag, title, members }: Props) {
  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-[#0f1d45] via-[#1e3b8a] to-[#0a1228]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F99E2D]/5 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="text-center mb-16">
          <FadeIn>
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
              {tag}
            </span>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          </FadeIn>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {members.map((member, i) => (
            <FadeIn
              key={i}
              delay={100 + i * 100}
              className="group text-center transition-transform [@media(hover:hover)]:hover:-translate-y-2"
            >
              <div className="relative mx-auto mb-5 w-28 h-28 md:w-32 md:h-32">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 ring-3 ring-white/10 group-hover:ring-[#F99E2D]/40"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <span className="text-2xl md:text-3xl font-bold text-white/90">
                      {member.initials}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-white text-sm md:text-base">{member.name}</h3>
              <p className="text-white/50 text-xs md:text-sm mt-1">{member.role}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
