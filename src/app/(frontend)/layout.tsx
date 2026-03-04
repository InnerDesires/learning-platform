import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ subsets: ['latin', 'cyrillic'], variable: '--font-montserrat', display: 'swap' })
import React from 'react'
import NextTopLoader from 'nextjs-toploader'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { defaultLocale } from '@/utilities/locales'

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn(montserrat.variable, GeistMono.variable)}
      lang={defaultLocale}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <link href="/favicon.ico" rel="icon" sizes="48x48" />
        <link href="/favicon-192.png" rel="icon" type="image/png" sizes="192x192" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180" />
      </head>
      <body>
        <NextTopLoader color="var(--primary)" showSpinner={false} height={3} />
        {children}
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@ironsquad',
  },
}
