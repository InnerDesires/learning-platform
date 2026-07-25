import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

// All origins the app may serve its own images from. NEXT_PUBLIC_SERVER_URL is
// listed alongside VERCEL_PROJECT_PRODUCTION_URL (not instead of it): Vercel
// resolves the latter to the *shortest* production custom domain, which during
// a domain migration is the old domain — both must stay allowed.
const selfOrigins = [
  ...new Set(
    [
      process.env.NEXT_PUBLIC_SERVER_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL &&
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
      process.env.__NEXT_PRIVATE_ORIGIN,
    ].filter(Boolean),
  ),
]
if (selfOrigins.length === 0) selfOrigins.push('http://localhost:3000')

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.DOCKER_BUILD === '1' && { output: 'standalone' }),
  experimental: {
    // Avatar uploads go through a server action and the UI allows 5 MB, but the
    // default cap is 1 MB — every phone photo silently rejected the request.
    // AvatarForm re-encodes before uploading, so this is only the ceiling for
    // files that pass through untouched (GIFs). Vercel's own request body limit
    // is 4.5 MB, which is the real cap in production.
    serverActions: { bodySizeLimit: '5mb' },
  },
  images: {
    remotePatterns: [
      ...selfOrigins.map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
      // Media is served directly from the Vercel Blob CDN (see src/plugins/index.ts).
      {
        hostname: '*.public.blob.vercel-storage.com',
        protocol: 'https',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
