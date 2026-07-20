import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds `pages` to the search plugin's indexable collections:
// search_rels gains a pages_id relation column.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "search_rels" ADD COLUMN IF NOT EXISTS "pages_id" integer;
    DO $$ BEGIN
      ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_pages_fk"
        FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "search_rels_pages_id_idx" ON "search_rels" USING btree ("pages_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "search_rels_pages_id_idx";
    ALTER TABLE "search_rels" DROP CONSTRAINT IF EXISTS "search_rels_pages_fk";
    ALTER TABLE "search_rels" DROP COLUMN IF EXISTS "pages_id";
  `)
}
