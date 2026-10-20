import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Development uses schema push; deployed environments need the global's table.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "home_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "show_calendar" boolean DEFAULT true,
      "show_news" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "home_settings" CASCADE;`)
}
