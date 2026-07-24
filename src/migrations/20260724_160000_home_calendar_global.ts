import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Tables for the `home-calendar` global (src/HomeCalendar/config.ts) — the
 * «Найближчі зміни» section of the landing page. DDL mirrors what drizzle push
 * generates in dev. The "_locales" enum already exists (header/footer globals
 * are localized), so it is not created here.
 *
 * No data backfill: the frontend falls back to the hardcoded content
 * (src/components/Home/content.ts) until an admin saves the global.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "home_calendar" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "home_calendar_locales" (
      "tag" varchar,
      "title" varchar,
      "description" varchar,
      "cta" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "home_calendar_events" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "month" varchar NOT NULL,
      "year" varchar NOT NULL,
      "range" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar,
      "form_url" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "home_calendar_locales" ADD CONSTRAINT "home_calendar_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."home_calendar"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "home_calendar_events" ADD CONSTRAINT "home_calendar_events_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."home_calendar"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "home_calendar_locales_locale_parent_id_unique"
      ON "home_calendar_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX IF NOT EXISTS "home_calendar_events_order_idx" ON "home_calendar_events" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "home_calendar_events_parent_id_idx" ON "home_calendar_events" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "home_calendar_events_locale_idx" ON "home_calendar_events" USING btree ("_locale");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "home_calendar_events" CASCADE;
    DROP TABLE IF EXISTS "home_calendar_locales" CASCADE;
    DROP TABLE IF EXISTS "home_calendar" CASCADE;
  `)
}
