import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__courses_v_published_locale" AS ENUM('uk', 'en');
    CREATE TYPE "public"."enum_enrollments_status" AS ENUM('enrolled', 'in_progress', 'completed');

    CREATE TABLE "course_categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "image_id" integer,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "course_categories_locales" (
      "title" varchar NOT NULL,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "course_files" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    );

    CREATE TABLE "course_files_locales" (
      "title" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "courses_blocks_rich_text_step" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE "courses_blocks_rich_text_step_locales" (
      "title" varchar,
      "content" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "courses_blocks_youtube_video_step" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "youtube_url" varchar,
      "block_name" varchar
    );

    CREATE TABLE "courses_blocks_youtube_video_step_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "courses_blocks_file_step" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "file_id" integer,
      "block_name" varchar
    );

    CREATE TABLE "courses_blocks_file_step_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "courses" (
      "id" serial PRIMARY KEY NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar,
      "hero_image_id" integer,
      "category_id" integer,
      "published_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_courses_status" DEFAULT 'draft'
    );

    CREATE TABLE "courses_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_courses_v_blocks_rich_text_step" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_courses_v_blocks_rich_text_step_locales" (
      "title" varchar,
      "content" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_courses_v_blocks_youtube_video_step" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "youtube_url" varchar,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_courses_v_blocks_youtube_video_step_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_courses_v_blocks_file_step" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "file_id" integer,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_courses_v_blocks_file_step_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_courses_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_generate_slug" boolean DEFAULT true,
      "version_slug" varchar,
      "version_hero_image_id" integer,
      "version_category_id" integer,
      "version_published_at" timestamp(3) with time zone,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__courses_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "snapshot" boolean,
      "published_locale" "enum__courses_v_published_locale",
      "latest" boolean,
      "autosave" boolean
    );

    CREATE TABLE "_courses_v_locales" (
      "version_title" varchar,
      "version_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "enrollments" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "course_id" integer NOT NULL,
      "completed_steps" jsonb DEFAULT '[]'::jsonb,
      "status" "enum_enrollments_status" DEFAULT 'enrolled',
      "enrolled_at" timestamp(3) with time zone,
      "completed_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "course_categories_locales" ADD CONSTRAINT "course_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "course_files_locales" ADD CONSTRAINT "course_files_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_files"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "courses_blocks_rich_text_step" ADD CONSTRAINT "courses_blocks_rich_text_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "courses_blocks_rich_text_step_locales" ADD CONSTRAINT "courses_blocks_rich_text_step_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_rich_text_step"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "courses_blocks_youtube_video_step" ADD CONSTRAINT "courses_blocks_youtube_video_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "courses_blocks_youtube_video_step_locales" ADD CONSTRAINT "courses_blocks_youtube_video_step_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_youtube_video_step"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "courses_blocks_file_step" ADD CONSTRAINT "courses_blocks_file_step_file_id_course_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."course_files"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "courses_blocks_file_step" ADD CONSTRAINT "courses_blocks_file_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "courses_blocks_file_step_locales" ADD CONSTRAINT "courses_blocks_file_step_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_file_step"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "courses" ADD CONSTRAINT "courses_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_course_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_courses_v_blocks_rich_text_step" ADD CONSTRAINT "_courses_v_blocks_rich_text_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_courses_v_blocks_rich_text_step_locales" ADD CONSTRAINT "_courses_v_blocks_rich_text_step_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_rich_text_step"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_courses_v_blocks_youtube_video_step" ADD CONSTRAINT "_courses_v_blocks_youtube_video_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_courses_v_blocks_youtube_video_step_locales" ADD CONSTRAINT "_courses_v_blocks_youtube_video_step_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_youtube_video_step"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_courses_v_blocks_file_step" ADD CONSTRAINT "_courses_v_blocks_file_step_file_id_course_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."course_files"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_courses_v_blocks_file_step" ADD CONSTRAINT "_courses_v_blocks_file_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_courses_v_blocks_file_step_locales" ADD CONSTRAINT "_courses_v_blocks_file_step_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_file_step"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_category_id_course_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."course_categories"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_courses_v_locales" ADD CONSTRAINT "_courses_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX "course_categories_image_idx" ON "course_categories" USING btree ("image_id");
    CREATE UNIQUE INDEX "course_categories_slug_idx" ON "course_categories" USING btree ("slug");
    CREATE INDEX "course_categories_updated_at_idx" ON "course_categories" USING btree ("updated_at");
    CREATE INDEX "course_categories_created_at_idx" ON "course_categories" USING btree ("created_at");
    CREATE UNIQUE INDEX "course_categories_locales_locale_parent_id_unique" ON "course_categories_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "course_files_updated_at_idx" ON "course_files" USING btree ("updated_at");
    CREATE INDEX "course_files_created_at_idx" ON "course_files" USING btree ("created_at");
    CREATE UNIQUE INDEX "course_files_filename_idx" ON "course_files" USING btree ("filename");
    CREATE UNIQUE INDEX "course_files_locales_locale_parent_id_unique" ON "course_files_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "courses_blocks_rich_text_step_order_idx" ON "courses_blocks_rich_text_step" USING btree ("_order");
    CREATE INDEX "courses_blocks_rich_text_step_parent_id_idx" ON "courses_blocks_rich_text_step" USING btree ("_parent_id");
    CREATE INDEX "courses_blocks_rich_text_step_path_idx" ON "courses_blocks_rich_text_step" USING btree ("_path");
    CREATE UNIQUE INDEX "courses_blocks_rich_text_step_locales_locale_parent_id_uniqu" ON "courses_blocks_rich_text_step_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "courses_blocks_youtube_video_step_order_idx" ON "courses_blocks_youtube_video_step" USING btree ("_order");
    CREATE INDEX "courses_blocks_youtube_video_step_parent_id_idx" ON "courses_blocks_youtube_video_step" USING btree ("_parent_id");
    CREATE INDEX "courses_blocks_youtube_video_step_path_idx" ON "courses_blocks_youtube_video_step" USING btree ("_path");
    CREATE UNIQUE INDEX "courses_blocks_youtube_video_step_locales_locale_parent_id_u" ON "courses_blocks_youtube_video_step_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "courses_blocks_file_step_order_idx" ON "courses_blocks_file_step" USING btree ("_order");
    CREATE INDEX "courses_blocks_file_step_parent_id_idx" ON "courses_blocks_file_step" USING btree ("_parent_id");
    CREATE INDEX "courses_blocks_file_step_path_idx" ON "courses_blocks_file_step" USING btree ("_path");
    CREATE INDEX "courses_blocks_file_step_file_idx" ON "courses_blocks_file_step" USING btree ("file_id");
    CREATE UNIQUE INDEX "courses_blocks_file_step_locales_locale_parent_id_unique" ON "courses_blocks_file_step_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
    CREATE INDEX "courses_hero_image_idx" ON "courses" USING btree ("hero_image_id");
    CREATE INDEX "courses_category_idx" ON "courses" USING btree ("category_id");
    CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
    CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
    CREATE INDEX "courses__status_idx" ON "courses" USING btree ("_status");
    CREATE UNIQUE INDEX "courses_locales_locale_parent_id_unique" ON "courses_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "_courses_v_blocks_rich_text_step_order_idx" ON "_courses_v_blocks_rich_text_step" USING btree ("_order");
    CREATE INDEX "_courses_v_blocks_rich_text_step_parent_id_idx" ON "_courses_v_blocks_rich_text_step" USING btree ("_parent_id");
    CREATE INDEX "_courses_v_blocks_rich_text_step_path_idx" ON "_courses_v_blocks_rich_text_step" USING btree ("_path");
    CREATE UNIQUE INDEX "_courses_v_blocks_rich_text_step_locales_locale_parent_id_un" ON "_courses_v_blocks_rich_text_step_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "_courses_v_blocks_youtube_video_step_order_idx" ON "_courses_v_blocks_youtube_video_step" USING btree ("_order");
    CREATE INDEX "_courses_v_blocks_youtube_video_step_parent_id_idx" ON "_courses_v_blocks_youtube_video_step" USING btree ("_parent_id");
    CREATE INDEX "_courses_v_blocks_youtube_video_step_path_idx" ON "_courses_v_blocks_youtube_video_step" USING btree ("_path");
    CREATE UNIQUE INDEX "_courses_v_blocks_youtube_video_step_locales_locale_parent_i" ON "_courses_v_blocks_youtube_video_step_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "_courses_v_blocks_file_step_order_idx" ON "_courses_v_blocks_file_step" USING btree ("_order");
    CREATE INDEX "_courses_v_blocks_file_step_parent_id_idx" ON "_courses_v_blocks_file_step" USING btree ("_parent_id");
    CREATE INDEX "_courses_v_blocks_file_step_path_idx" ON "_courses_v_blocks_file_step" USING btree ("_path");
    CREATE INDEX "_courses_v_blocks_file_step_file_idx" ON "_courses_v_blocks_file_step" USING btree ("file_id");
    CREATE UNIQUE INDEX "_courses_v_blocks_file_step_locales_locale_parent_id_unique" ON "_courses_v_blocks_file_step_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
    CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v" USING btree ("version_slug");
    CREATE INDEX "_courses_v_version_version_hero_image_idx" ON "_courses_v" USING btree ("version_hero_image_id");
    CREATE INDEX "_courses_v_version_version_category_idx" ON "_courses_v" USING btree ("version_category_id");
    CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
    CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
    CREATE INDEX "_courses_v_version_version__status_idx" ON "_courses_v" USING btree ("version__status");
    CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
    CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
    CREATE INDEX "_courses_v_snapshot_idx" ON "_courses_v" USING btree ("snapshot");
    CREATE INDEX "_courses_v_published_locale_idx" ON "_courses_v" USING btree ("published_locale");
    CREATE INDEX "_courses_v_latest_idx" ON "_courses_v" USING btree ("latest");
    CREATE INDEX "_courses_v_autosave_idx" ON "_courses_v" USING btree ("autosave");
    CREATE UNIQUE INDEX "_courses_v_locales_locale_parent_id_unique" ON "_courses_v_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "enrollments_user_idx" ON "enrollments" USING btree ("user_id");
    CREATE INDEX "enrollments_course_idx" ON "enrollments" USING btree ("course_id");
    CREATE INDEX "enrollments_updated_at_idx" ON "enrollments" USING btree ("updated_at");
    CREATE INDEX "enrollments_created_at_idx" ON "enrollments" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "course_categories_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "course_files_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "courses_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "enrollments_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_categories_fk" FOREIGN KEY ("course_categories_id") REFERENCES "public"."course_categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_files_fk" FOREIGN KEY ("course_files_id") REFERENCES "public"."course_files"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enrollments_fk" FOREIGN KEY ("enrollments_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_course_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("course_categories_id");
    CREATE INDEX "payload_locked_documents_rels_course_files_id_idx" ON "payload_locked_documents_rels" USING btree ("course_files_id");
    CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
    CREATE INDEX "payload_locked_documents_rels_enrollments_id_idx" ON "payload_locked_documents_rels" USING btree ("enrollments_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_course_categories_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_course_files_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_courses_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_enrollments_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_course_categories_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_course_files_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_courses_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_enrollments_id_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "course_categories_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "course_files_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "courses_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "enrollments_id";

    DROP TABLE IF EXISTS "_courses_v_locales" CASCADE;
    DROP TABLE IF EXISTS "_courses_v" CASCADE;
    DROP TABLE IF EXISTS "_courses_v_blocks_file_step_locales" CASCADE;
    DROP TABLE IF EXISTS "_courses_v_blocks_file_step" CASCADE;
    DROP TABLE IF EXISTS "_courses_v_blocks_youtube_video_step_locales" CASCADE;
    DROP TABLE IF EXISTS "_courses_v_blocks_youtube_video_step" CASCADE;
    DROP TABLE IF EXISTS "_courses_v_blocks_rich_text_step_locales" CASCADE;
    DROP TABLE IF EXISTS "_courses_v_blocks_rich_text_step" CASCADE;
    DROP TABLE IF EXISTS "enrollments" CASCADE;
    DROP TABLE IF EXISTS "courses_locales" CASCADE;
    DROP TABLE IF EXISTS "courses_blocks_file_step_locales" CASCADE;
    DROP TABLE IF EXISTS "courses_blocks_file_step" CASCADE;
    DROP TABLE IF EXISTS "courses_blocks_youtube_video_step_locales" CASCADE;
    DROP TABLE IF EXISTS "courses_blocks_youtube_video_step" CASCADE;
    DROP TABLE IF EXISTS "courses_blocks_rich_text_step_locales" CASCADE;
    DROP TABLE IF EXISTS "courses_blocks_rich_text_step" CASCADE;
    DROP TABLE IF EXISTS "courses" CASCADE;
    DROP TABLE IF EXISTS "course_files_locales" CASCADE;
    DROP TABLE IF EXISTS "course_files" CASCADE;
    DROP TABLE IF EXISTS "course_categories_locales" CASCADE;
    DROP TABLE IF EXISTS "course_categories" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_enrollments_status";
    DROP TYPE IF EXISTS "public"."enum__courses_v_published_locale";
    DROP TYPE IF EXISTS "public"."enum__courses_v_version_status";
    DROP TYPE IF EXISTS "public"."enum_courses_status";
  `)
}
