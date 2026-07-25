/**
 * Base URL of the Vercel Blob store, derived exactly the way
 * @payloadcms/storage-vercel-blob derives it. Duplicated here (rather than
 * imported) because this file is loaded by next.config.ts before any path
 * aliases resolve. Kept in sync with
 * src/migrations/20260724_200000_backfill_blob_urls.ts.
 */
const blobBaseUrl = (() => {
  const configured = process.env.STORAGE_VERCEL_BLOB_BASE_URL
  if (configured) return configured.replace(/\/+$/, '')

  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(
    /^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i,
  )?.[1]?.toLowerCase()

  return storeId ? `https://${storeId}.public.blob.vercel-storage.com` : null
})()

const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // Media moved to the Blob CDN in e353834, which left `/api/*/file/*` served by
  // Payload's local-disk static handler — it logs "missing on the disk" and
  // returns nothing, because uploads no longer touch the filesystem. The
  // 20260724_200000 migration rewrites the URLs still stored in the database;
  // these redirects cover references it cannot reach (browser-cached HTML, ISR
  // pages from an earlier deploy, external links, already-shared OG images).
  // Blob keys are the bare filename, so the mapping is a straight swap.
  const legacyFileRedirects = blobBaseUrl
    ? ['media', 'course-files'].map((collection) => ({
        source: `/api/${collection}/file/:filename`,
        destination: `${blobBaseUrl}/:filename`,
        permanent: false,
      }))
    : []

  const redirects = [internetExplorerRedirect, ...legacyFileRedirects]

  return redirects
}

export default redirects
