'use client'

import { useState } from 'react'
import { FadeIn } from './FadeIn'
import { Eyebrow, Rails } from '@/components/brand'
import { MessageCircle } from 'lucide-react'

type FAQItem = {
  question: string
  answer: string
}

type Props = {
  tag: string
  title: string
  items: FAQItem[]
  telegramCta: string
  telegramUrl: string
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E4DFD2] bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-4.5 text-left text-[14.5px] font-bold text-ink"
        aria-expanded={isOpen}
      >
        {item.question}
        <span
          className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-orange/16 font-extrabold not-italic text-ember transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="max-w-[75ch] px-6 pb-5 text-[13.5px] leading-relaxed text-paper-muted">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FAQSection({ tag, title, items, telegramCta, telegramUrl }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div id="faq" className="band on-paper mt-16 scroll-mt-24">
      <div className="container max-w-[880px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <FadeIn>
            <Eyebrow>{tag}</Eyebrow>
            <h2 className="heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)] text-ink">
              {title}
            </h2>
          </FadeIn>
          <Rails className="mx-auto mt-4" />
        </div>

        <div className="grid gap-3">
          {items.map((item, i) => (
            <FadeIn key={i} delay={100 + i * 60}>
              <AccordionItem
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={300}>
          <div className="mt-8 text-center">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#C9C2B2] px-6 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-ember hover:text-ember"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {telegramCta}
            </a>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
