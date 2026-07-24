import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Indexes from the payload-skill audit:
 * - unique (user, course) on enrollments and (user, target) on likes — the
 *   beforeValidate duplicate checks are check-then-create and race under
 *   concurrency; these constraints make the guarantee real. Existing
 *   duplicates are collapsed to the earliest row first.
 * - comments.author / comments.parent lookup indexes (profile page and
 *   reply-cascade deletes filter on them).
 *
 * Index names mirror what drizzle push generates in dev from the collection
 * configs (compound names carry no table prefix — adapter quirk), so push and
 * this migration converge on identical schemas.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "enrollments" a
      USING "enrollments" b
      WHERE a.id > b.id
        AND a.user_id = b.user_id
        AND a.course_id = b.course_id;

    DELETE FROM "likes" a
      USING "likes" b
      WHERE a.id > b.id
        AND a.user_id = b.user_id
        AND a.target_collection = b.target_collection
        AND a.target_id = b.target_id;

    CREATE UNIQUE INDEX IF NOT EXISTS "user_course_idx"
      ON "enrollments" USING btree ("user_id", "course_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "user_targetCollection_targetId_idx"
      ON "likes" USING btree ("user_id", "target_collection", "target_id");

    CREATE INDEX IF NOT EXISTS "comments_author_idx" ON "comments" USING btree ("author_id");
    CREATE INDEX IF NOT EXISTS "comments_parent_idx" ON "comments" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "user_course_idx";
    DROP INDEX IF EXISTS "user_targetCollection_targetId_idx";
    DROP INDEX IF EXISTS "comments_author_idx";
    DROP INDEX IF EXISTS "comments_parent_idx";
  `)
}
