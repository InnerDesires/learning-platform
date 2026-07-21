import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the optional `duration` (minutes) field to all course step blocks,
// on both the live block tables and their draft-version counterparts.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses_blocks_rich_text_step" ADD COLUMN IF NOT EXISTS "duration" numeric;
    ALTER TABLE "courses_blocks_youtube_video_step" ADD COLUMN IF NOT EXISTS "duration" numeric;
    ALTER TABLE "courses_blocks_file_step" ADD COLUMN IF NOT EXISTS "duration" numeric;
    ALTER TABLE "_courses_v_blocks_rich_text_step" ADD COLUMN IF NOT EXISTS "duration" numeric;
    ALTER TABLE "_courses_v_blocks_youtube_video_step" ADD COLUMN IF NOT EXISTS "duration" numeric;
    ALTER TABLE "_courses_v_blocks_file_step" ADD COLUMN IF NOT EXISTS "duration" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses_blocks_rich_text_step" DROP COLUMN IF EXISTS "duration";
    ALTER TABLE "courses_blocks_youtube_video_step" DROP COLUMN IF EXISTS "duration";
    ALTER TABLE "courses_blocks_file_step" DROP COLUMN IF EXISTS "duration";
    ALTER TABLE "_courses_v_blocks_rich_text_step" DROP COLUMN IF EXISTS "duration";
    ALTER TABLE "_courses_v_blocks_youtube_video_step" DROP COLUMN IF EXISTS "duration";
    ALTER TABLE "_courses_v_blocks_file_step" DROP COLUMN IF EXISTS "duration";
  `)
}
