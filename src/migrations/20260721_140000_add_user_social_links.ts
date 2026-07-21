import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the `socialLinks` array field on users (users_social_links table).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_social_links_platform" AS ENUM('instagram', 'facebook', 'telegram', 'youtube', 'tiktok', 'linkedin', 'x', 'website');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "users_social_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "platform" "enum_users_social_links_platform" NOT NULL,
      "url" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "users_social_links" ADD CONSTRAINT "users_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "users_social_links_order_idx" ON "users_social_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_social_links_parent_id_idx" ON "users_social_links" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "users_social_links" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_users_social_links_platform";
  `)
}
