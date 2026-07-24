import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rate-limit counters shared across serverless instances. Backs both Better
 * Auth's built-in limiter (rateLimit.storage: 'database' in
 * src/lib/auth/options.ts) and the app-level limiter (src/lib/rate-limit.ts).
 * DDL mirrors what drizzle push generates in dev from the payload-auth
 * `rateLimit` collection; the unique key index also serves the app limiter's
 * ON CONFLICT upsert.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rate_limit" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "count" numeric NOT NULL,
      "last_request" numeric NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_key_idx" ON "rate_limit" USING btree ("key");
    CREATE INDEX IF NOT EXISTS "rate_limit_updated_at_idx" ON "rate_limit" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "rate_limit_created_at_idx" ON "rate_limit" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "rate_limit" CASCADE;
  `)
}
