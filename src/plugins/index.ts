import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { betterAuthPlugin } from 'payload-auth/better-auth'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'
import { betterAuthPluginOptions } from '@/lib/auth/options'

import { Page, Post } from '@/payload-types'
import { Media } from '@/collections/Media'
import { CourseFiles } from '@/collections/CourseFiles'
import { getServerSideURL } from '@/utilities/getURL'

const vercelBlobPlugin = process.env.BLOB_READ_WRITE_TOKEN
  ? vercelBlobStorage({
      collections: { [Media.slug]: true, [CourseFiles.slug]: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
  : null

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Залізна Зміна` : 'Залізна Зміна'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  betterAuthPlugin(betterAuthPluginOptions),
  ...(vercelBlobPlugin ? [vercelBlobPlugin] : []),
  mcpPlugin({
    collections: {
      posts: {
        enabled: true,
        description:
          'Blog posts and articles about learning, education, and related topics. Posts have a title, hero image, rich text content, categories, authors, SEO metadata, and support drafts/publishing. Content is localized in Ukrainian (uk) and English (en).',
      },
      pages: {
        enabled: true,
        description:
          'Static pages like the homepage, contact page, etc. Pages have a title, hero section, layout blocks (content, CTA, media, archive, form), and SEO metadata. Content is localized in Ukrainian (uk) and English (en).',
      },
      categories: {
        enabled: true,
        description:
          'Categories used to organize and tag posts. Each category has a localized title and a slug. Content is localized in Ukrainian (uk) and English (en).',
      },
      media: {
        enabled: {
          find: true,
          create: false,
          update: true,
          delete: false,
        },
        description:
          'Media files including images. Each media item has alt text and an optional caption. Used as hero images, post images, and page media.',
      },
    },
    globals: {
      header: {
        enabled: true,
        description:
          'Site header with navigation items. Contains a navItems array with links (label, type, reference/url). Content is localized in Ukrainian (uk) and English (en).',
      },
      footer: {
        enabled: true,
        description:
          'Site footer with navigation items. Contains a navItems array with links (label, type, reference/url). Content is localized in Ukrainian (uk) and English (en).',
      },
    },
  }),
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
