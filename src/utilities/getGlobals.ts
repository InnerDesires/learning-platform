import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { SiteLocale } from './locales'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(slug: T, depth = 0, locale?: SiteLocale) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
    locale,
  })

  return global
}

export const getCachedGlobal = <T extends Global>(slug: T, depth = 0, locale?: SiteLocale) =>
  unstable_cache(async () => getGlobal(slug, depth, locale), [slug, locale ?? ''], {
    tags: [`global_${slug}`],
  })
