import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rewrites pre-Blob-CDN `/api/<collection>/file/<name>` URLs to their Vercel
 * Blob equivalents.
 *
 * Until e353834 (2026-07-22) media was served through Payload's own file route.
 * That commit set `disablePayloadAccessControl: true` (src/plugins/index.ts),
 * which points new uploads straight at the Blob CDN and — because the storage
 * adapter also sets `disableLocalStorage` — leaves `/api/media/file/*` served by
 * Payload's local-disk handler, which logs
 * `File ... is missing on the disk. Expected path: /vercel/path0/public/media/...`
 * for every request.
 *
 * The adapter regenerates `url`/`sizes.*.url` in an afterRead hook, so populated
 * relationships already resolve to Blob. What does *not* get regenerated:
 *
 *   - `media.url` / `media.sizes_*_url` columns still hold the legacy paths, and
 *     Payload's virtual `thumbnailURL` field is built from the raw column
 *     (payload/dist/uploads/getBaseFields.js reads `originalDoc.sizes[...]`), so
 *     every admin list thumbnail for a pre-2026-07-22 upload hits the dead route.
 *   - `users.image` is a snapshot written by `updateAvatar`
 *     (src/actions/accountSettings.ts) at upload time, so avatars uploaded before
 *     the switch stay pinned to the old URL forever.
 *
 * Blob keys are the bare (percent-encoded) filename — the same encoding the
 * legacy paths use, and no prefix is configured — so swapping the prefix is a
 * lossless rewrite. `redirects.js` keeps serving anything that escaped this
 * backfill (browser-cached HTML, external links, shared OG images).
 */

// Matches both the relative form Payload stores and the absolute form
// `getMediaUrl` produced when snapshotting into `users.image`.
const LEGACY_URL_PATTERN = '^(https?://[^/]+)?/api/(media|course-files)/file/'

/** [table, column] pairs holding a file URL that may predate the Blob CDN. */
const URL_COLUMNS: [string, string][] = [
  ['media', 'url'],
  ['media', 'sizes_thumbnail_url'],
  ['media', 'sizes_square_url'],
  ['media', 'sizes_small_url'],
  ['media', 'sizes_medium_url'],
  ['media', 'sizes_large_url'],
  ['media', 'sizes_xlarge_url'],
  ['media', 'sizes_og_url'],
  ['course_files', 'url'],
  ['users', 'image'],
]

/** Mirrors how @payloadcms/storage-vercel-blob derives its base URL. */
function resolveBlobBaseUrl(): null | string {
  const configured = process.env.STORAGE_VERCEL_BLOB_BASE_URL
  if (configured) return configured.replace(/\/+$/, '')

  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(
    /^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i,
  )?.[1]?.toLowerCase()

  return storeId ? `https://${storeId}.public.blob.vercel-storage.com` : null
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const baseUrl = resolveBlobBaseUrl()

  if (!baseUrl) {
    // Blob storage is off (the plugin is skipped without a token), so the legacy
    // paths are still the correct ones — nothing to rewrite.
    payload.logger.warn(
      'backfill_blob_urls: no Vercel Blob token — leaving /api/*/file/ URLs as they are.',
    )
    return
  }

  for (const [table, column] of URL_COLUMNS) {
    const target = sql.raw(`"${table}"."${column}"`)
    const { rowCount } = await db.execute(sql`
      UPDATE ${sql.raw(`"${table}"`)}
      SET ${sql.raw(`"${column}"`)} = regexp_replace(${target}, ${LEGACY_URL_PATTERN}, ${`${baseUrl}/`})
      WHERE ${target} ~ ${LEGACY_URL_PATTERN}
    `)

    if (rowCount) {
      payload.logger.info(`backfill_blob_urls: rewrote ${rowCount} row(s) in ${table}.${column}.`)
    }
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Not reversible: the original rows recorded a server URL this migration has
  // no way to recover, and the files they pointed at were never on disk anyway.
  payload.logger.info('backfill_blob_urls: nothing to undo.')
}
