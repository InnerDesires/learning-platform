'use client'

import React, { useEffect, useState } from 'react'
import { Check, Facebook, Link2, Send, Share2, Twitter, type LucideIcon } from 'lucide-react'

type Props = {
  url: string
  title: string
  label: string
  copyLabel: string
  copiedLabel: string
}

const networks = (
  url: string,
  title: string,
): { name: string; href: string; icon: LucideIcon }[] => [
  {
    name: 'Telegram',
    href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: Send,
  },
  {
    name: 'Facebook',
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: Facebook,
  },
  {
    name: 'X',
    href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: Twitter,
  },
]

/** Share row for articles: social intents + copy link (+ native share when available). */
export const ShareButtons: React.FC<Props> = ({ url, title, label, copyLabel, copiedLabel }) => {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ url, title })
    } catch {
      /* dismissed */
    }
  }

  const pill =
    'inline-flex items-center gap-1.5 rounded-full border border-line-2 px-4 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-fog transition-colors hover:border-orange hover:text-orange'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
        <Share2 className="h-3.5 w-3.5" />
        {label}
      </span>
      {networks(url, title).map((network) => (
        <a
          key={network.name}
          href={network.href}
          target="_blank"
          rel="noopener noreferrer"
          className={pill}
        >
          <network.icon className="h-3.5 w-3.5" />
          {network.name}
        </a>
      ))}
      <button type="button" onClick={copy} className={pill}>
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? copiedLabel : copyLabel}
      </button>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={`${pill} sm:hidden`}>
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
