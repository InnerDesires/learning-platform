import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Reconciles three drifts between the migration chain and the schema the
// current code produces (verified against a from-scratch migration run,
// the push-managed dev branch, and production — 2026-07-21):
//
// 1. The initial migration set DEFAULT 'uk' on `_locale` columns of 19
//    array/block tables; the current Drizzle schema defines no default
//    (Payload always writes `_locale` explicitly).
// 2. The better-auth migration created `admin_invitations_token_idx` as
//    UNIQUE; the current schema defines it as a plain index.
// 3. Early migrations created `payload_locked_documents_rels` columns for
//    collections that have since set `lockDocuments: false` — those columns,
//    their FKs, and indexes no longer exist in the code schema.
//
// All statements are idempotent: they no-op on databases that already match
// the code schema (dev) and converge the ones that don't (prod, ci-base).

const LOCALE_DEFAULT_TABLES = [
  '_pages_v_blocks_archive',
  '_pages_v_blocks_content',
  '_pages_v_blocks_content_columns',
  '_pages_v_blocks_cta',
  '_pages_v_blocks_cta_links',
  '_pages_v_blocks_form_block',
  '_pages_v_blocks_media_block',
  '_pages_v_version_hero_links',
  'categories_breadcrumbs',
  'footer_nav_items',
  'header_nav_items',
  'pages_blocks_archive',
  'pages_blocks_content',
  'pages_blocks_content_columns',
  'pages_blocks_cta',
  'pages_blocks_cta_links',
  'pages_blocks_form_block',
  'pages_blocks_media_block',
  'pages_hero_links',
]

const UNLOCKED_REL_COLUMNS = [
  'categories_id',
  'comments_id',
  'course_categories_id',
  'course_files_id',
  'courses_id',
  'enrollments_id',
  'likes_id',
  'media_id',
  'pages_id',
  'posts_id',
  'quiz_attempts_id',
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of LOCALE_DEFAULT_TABLES) {
    await db.execute(
      sql.raw(`ALTER TABLE "${table}" ALTER COLUMN "_locale" DROP DEFAULT;`),
    )
  }

  await db.execute(sql`
    DROP INDEX IF EXISTS "admin_invitations_token_idx";
    CREATE INDEX IF NOT EXISTS "admin_invitations_token_idx" ON "admin_invitations" USING btree ("token");
  `)

  // DROP COLUMN also drops the column's FK constraint and index.
  for (const column of UNLOCKED_REL_COLUMNS) {
    await db.execute(
      sql.raw(`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "${column}";`),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of LOCALE_DEFAULT_TABLES) {
    await db.execute(
      sql.raw(`ALTER TABLE "${table}" ALTER COLUMN "_locale" SET DEFAULT 'uk';`),
    )
  }

  await db.execute(sql`
    DROP INDEX IF EXISTS "admin_invitations_token_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "admin_invitations_token_idx" ON "admin_invitations" USING btree ("token");
  `)

  for (const column of UNLOCKED_REL_COLUMNS) {
    const refTable = column.replace(/_id$/, '')
    await db.execute(
      sql.raw(`
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "${column}" integer;
        DO $$ BEGIN
          ALTER TABLE "payload_locked_documents_rels"
            ADD CONSTRAINT "payload_locked_documents_rels_${refTable}_fk"
            FOREIGN KEY ("${column}") REFERENCES "${refTable}"("id") ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_${column}_idx"
          ON "payload_locked_documents_rels" USING btree ("${column}");
      `),
    )
  }
}
