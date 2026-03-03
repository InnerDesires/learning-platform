import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "courses_find" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "courses_create" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "courses_update" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "courses_delete" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "course_categories_find" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "course_categories_create" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "course_categories_update" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "course_categories_delete" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "comments_find" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "comments_create" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "comments_update" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "comments_delete" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "likes_find" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "likes_create" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "likes_delete" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "courses_find";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "courses_create";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "courses_update";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "courses_delete";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "course_categories_find";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "course_categories_create";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "course_categories_update";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "course_categories_delete";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "comments_find";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "comments_create";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "comments_update";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "comments_delete";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "likes_find";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "likes_create";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "likes_delete";
  `)
}
