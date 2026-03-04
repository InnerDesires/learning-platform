'use client'

import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

type StatItem = {
  value: number
  label: string
  suffix?: string
}

function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionValue, value, {
      duration: 2,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return controls.stop
  }, [isInView, motionValue, value])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      setDisplay(v.toLocaleString())
    })
    return unsubscribe
  }, [rounded])

  return (
    <span ref={ref}>
      {display}
      {suffix || ''}
    </span>
  )
}

type Props = {
  items: StatItem[]
}

export function StatsSection({ items }: Props) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="relative py-24 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="text-center group"
            >
              <div className="relative inline-block">
                <span className="block text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground">
                  <Counter value={item.value} suffix={item.suffix} />
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.15 }}
                  className="h-1.5 bg-gradient-to-r from-[#F99E2D] to-[#f7b84d] rounded-full mt-3 origin-left"
                />
              </div>
              <p className="mt-4 text-lg md:text-xl text-muted-foreground font-medium uppercase tracking-widest">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
