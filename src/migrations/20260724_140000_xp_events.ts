import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Timestamped XP log (see src/collections/XpEvents.ts) powering the period
 * leaderboards. DDL mirrors what drizzle push generates in dev.
 *
 * Backfill: quiz passes are recoverable from quiz_attempts (first passing
 * attempt per user+course carries the correct timestamp). Step completions
 * are not — enrollments store which steps are done but not when — so step
 * history before this migration is intentionally absent from period boards.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_xp_events_kind" AS ENUM('step', 'quiz');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "xp_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "course_id" integer NOT NULL,
      "kind" "enum_xp_events_kind" NOT NULL,
      "amount" numeric NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_course_id_courses_id_fk"
        FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "xp_events_user_idx" ON "xp_events" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "xp_events_course_idx" ON "xp_events" USING btree ("course_id");
    CREATE INDEX IF NOT EXISTS "xp_events_updated_at_idx" ON "xp_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "xp_events_created_at_idx" ON "xp_events" USING btree ("created_at");

    INSERT INTO "xp_events" ("user_id", "course_id", "kind", "amount", "created_at", "updated_at")
    SELECT DISTINCT ON (qa.user_id, qa.course_id)
      qa.user_id, qa.course_id, 'quiz'::"enum_xp_events_kind", 100, qa.created_at, qa.created_at
    FROM "quiz_attempts" qa
    WHERE qa.passed = true
      AND qa.user_id IS NOT NULL
      AND qa.course_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "xp_events" x
        WHERE x.user_id = qa.user_id AND x.course_id = qa.course_id AND x.kind = 'quiz'
      )
    ORDER BY qa.user_id, qa.course_id, qa.created_at ASC;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "xp_events" CASCADE;
    DROP TYPE IF EXISTS "enum_xp_events_kind";
  `)
}
