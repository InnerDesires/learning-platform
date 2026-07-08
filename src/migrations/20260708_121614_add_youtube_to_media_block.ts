import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_media_block_media_type" AS ENUM('upload', 'youtube');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_blocks_media_block_media_type" AS ENUM('upload', 'youtube');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "pages_blocks_media_block" ADD COLUMN IF NOT EXISTS "media_type" "enum_pages_blocks_media_block_media_type" DEFAULT 'upload';
    ALTER TABLE "pages_blocks_media_block" ADD COLUMN IF NOT EXISTS "youtube_url" varchar;
    ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN IF NOT EXISTS "media_type" "enum__pages_v_blocks_media_block_media_type" DEFAULT 'upload';
    ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN IF NOT EXISTS "youtube_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "media_type";
    ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "youtube_url";
    ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "media_type";
    ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "youtube_url";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_media_block_media_type";
    DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_media_block_media_type";
  `)
}
