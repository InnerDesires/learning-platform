import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search" ADD COLUMN "collection_type" varchar;
  ALTER TABLE "search_rels" ADD COLUMN "courses_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "course_categories_id" integer;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_course_categories_fk" FOREIGN KEY ("course_categories_id") REFERENCES "public"."course_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_collection_type_idx" ON "search" USING btree ("collection_type");
  CREATE INDEX "search_rels_courses_id_idx" ON "search_rels" USING btree ("courses_id");
  CREATE INDEX "search_rels_course_categories_id_idx" ON "search_rels" USING btree ("course_categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_courses_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_course_categories_fk";
  
  DROP INDEX "search_collection_type_idx";
  DROP INDEX "search_rels_courses_id_idx";
  DROP INDEX "search_rels_course_categories_id_idx";
  ALTER TABLE "search" DROP COLUMN "collection_type";
  ALTER TABLE "search_rels" DROP COLUMN "courses_id";
  ALTER TABLE "search_rels" DROP COLUMN "course_categories_id";`)
}
