import type { CollectionAfterChangeHook, CollectionSlug, Plugin, TypedLocale } from 'payload'

export const searchIndexedCollections: CollectionSlug[] = [
  'posts',
  'courses',
  'course-categories',
  'pages',
]

// @payloadcms/plugin-search writes localized search fields only for the locale of
// the request that saved the document (req.locale), and Payload never falls back
// from the default locale to another one. A doc published from the EN admin locale
// therefore gets a search row that is invisible to uk-locale search queries. This
// hook runs after the plugin's own sync and backfills `title` for the remaining
// locales from the source document.
const backfillSearchTitleLocales: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  // Drafts and trashed docs are not synced (or get deleted) by the search plugin.
  if (doc?._status === 'draft' || doc?.deletedAt) return doc

  const { localization } = req.payload.config
  if (!localization) return doc

  const syncedLocale = req.locale || localization.defaultLocale
  const missingLocales = localization.localeCodes.filter(
    (code) => code !== syncedLocale,
  ) as TypedLocale[]
  if (missingLocales.length === 0) return doc

  const {
    docs: [searchRow],
  } = await req.payload.find({
    collection: 'search',
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: {
      'doc.relationTo': { equals: collection.slug },
      'doc.value': { equals: doc.id },
    },
  })
  if (!searchRow) return doc

  const sourceDoc = (await req.payload.findByID({
    collection: collection.slug as CollectionSlug,
    id: doc.id,
    depth: 0,
    locale: 'all',
    select: { title: true },
    disableErrors: true,
    req,
  })) as { title?: string | Record<string, string | null> } | null
  const titles = sourceDoc?.title

  for (const locale of missingLocales) {
    // Non-localized source titles come back as a plain string — reuse it for every locale.
    const title = typeof titles === 'object' && titles !== null ? titles[locale] : titles
    if (!title) continue
    await req.payload.update({
      collection: 'search',
      id: searchRow.id,
      data: { title },
      depth: 0,
      locale,
      req,
    })
  }

  return doc
}

/** Must be registered directly after searchPlugin so the backfill runs after the plugin's own sync hook. */
export const searchLocaleSync: Plugin = (config) => ({
  ...config,
  collections: (config.collections ?? []).map((collection) =>
    searchIndexedCollections.includes(collection.slug as CollectionSlug)
      ? {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: [...(collection.hooks?.afterChange ?? []), backfillSearchTitleLocales],
          },
        }
      : collection,
  ),
})
