'use client'

import { useState } from 'react'
import { FadeIn } from './FadeIn'

type FAQItem = {
  question: string
  answer: string
}

type Props = {
  tag: string
  title: string
  items: FAQItem[]
}

function AccordionItem({ item, index, isOpen, onToggle }: {
  item: FAQItem
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left group"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-4">
          <span className="shrink-0 w-8 h-8 rounded-lg bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold flex items-center justify-center group-hover:bg-[#F99E2D]/20 transition-colors duration-300">
            {index + 1}
          </span>
          <span className="text-base md:text-lg font-medium text-foreground group-hover:text-[#1e3b8a] transition-colors duration-300">
            {item.question}
          </span>
        </span>
        <span
          className={`shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:border-[#F99E2D]/30 group-hover:text-[#F99E2D] transition-all duration-300 ${isOpen ? 'rotate-45' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="pb-6 pl-12 text-muted-foreground leading-relaxed max-w-3xl">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FAQSection({ tag, title, items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-32 bg-gradient-to-b from-background to-secondary/20">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <FadeIn className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
              {tag}
            </FadeIn>
            <FadeIn delay={100} className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {title}
            </FadeIn>
          </div>

          <FadeIn delay={200} className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 md:p-4">
            {items.map((item, i) => (
              <AccordionItem
                key={i}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
