import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Events feature: the `events` collection (drafts + uk/en locales), the
 * `event_enrollments` join collection (unique user×event), the events block
 * on pages, and the search-plugin relation for indexed events. DDL mirrors
 * what drizzle push generates in dev, including index names (compound index
 * names carry no table prefix — adapter quirk).
 *
 * Posts embed the events block inside Lexical JSON, so only pages need block
 * tables. lockDocuments is false on both collections, so
 * payload_locked_documents_rels needs no new columns.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_location_type" AS ENUM('local', 'virtual');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_version_location_type" AS ENUM('local', 'virtual');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_published_locale" AS ENUM('uk', 'en');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_events_block_populate_by" AS ENUM('upcoming', 'selection');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_blocks_events_block_populate_by" AS ENUM('upcoming', 'selection');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "events" (
      "id" serial PRIMARY KEY NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar,
      "cover_id" integer,
      "start_date" timestamp(3) with time zone,
      "end_date" timestamp(3) with time zone,
      "location_type" "enum_events_location_type" DEFAULT 'local',
      "map_link" varchar,
      "meeting_link" varchar,
      "capacity" numeric,
      "published_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_events_status" DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS "events_locales" (
      "title" varchar,
      "description" varchar,
      "address" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_events_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_generate_slug" boolean DEFAULT true,
      "version_slug" varchar,
      "version_cover_id" integer,
      "version_start_date" timestamp(3) with time zone,
      "version_end_date" timestamp(3) with time zone,
      "version_location_type" "enum__events_v_version_location_type" DEFAULT 'local',
      "version_map_link" varchar,
      "version_meeting_link" varchar,
      "version_capacity" numeric,
      "version_published_at" timestamp(3) with time zone,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__events_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "snapshot" boolean,
      "published_locale" "enum__events_v_published_locale",
      "latest" boolean,
      "autosave" boolean
    );

    CREATE TABLE IF NOT EXISTS "_events_v_locales" (
      "version_title" varchar,
      "version_description" varchar,
      "version_address" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "event_enrollments" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "event_id" integer NOT NULL,
      "enrolled_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_events_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "intro_content" jsonb,
      "populate_by" "enum_pages_blocks_events_block_populate_by" DEFAULT 'upcoming',
      "limit" numeric DEFAULT 3,
      "show_all_link" boolean DEFAULT true,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_events_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "intro_content" jsonb,
      "populate_by" "enum__pages_v_blocks_events_block_populate_by" DEFAULT 'upcoming',
      "limit" numeric DEFAULT 3,
      "show_all_link" boolean DEFAULT true,
      "_uuid" varchar,
      "block_name" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "events" ADD CONSTRAINT "events_cover_id_media_id_fk"
        FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_cover_id_media_id_fk"
        FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "event_enrollments" ADD CONSTRAINT "event_enrollments_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "event_enrollments" ADD CONSTRAINT "event_enrollments_event_id_events_id_fk"
        FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_events_block" ADD CONSTRAINT "pages_blocks_events_block_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_events_block" ADD CONSTRAINT "_pages_v_blocks_events_block_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "events_slug_idx" ON "events" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "events_cover_idx" ON "events" USING btree ("cover_id");
    CREATE INDEX IF NOT EXISTS "events_start_date_idx" ON "events" USING btree ("start_date");
    CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "events__status_idx" ON "events" USING btree ("_status");

    CREATE UNIQUE INDEX IF NOT EXISTS "events_locales_locale_parent_id_unique"
      ON "events_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX IF NOT EXISTS "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_cover_idx" ON "_events_v" USING btree ("version_cover_id");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_start_date_idx" ON "_events_v" USING btree ("version_start_date");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
    CREATE INDEX IF NOT EXISTS "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_events_v_snapshot_idx" ON "_events_v" USING btree ("snapshot");
    CREATE INDEX IF NOT EXISTS "_events_v_published_locale_idx" ON "_events_v" USING btree ("published_locale");
    CREATE INDEX IF NOT EXISTS "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
    CREATE INDEX IF NOT EXISTS "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");

    CREATE UNIQUE INDEX IF NOT EXISTS "_events_v_locales_locale_parent_id_unique"
      ON "_events_v_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX IF NOT EXISTS "event_enrollments_user_idx" ON "event_enrollments" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "event_enrollments_event_idx" ON "event_enrollments" USING btree ("event_id");
    CREATE INDEX IF NOT EXISTS "event_enrollments_updated_at_idx" ON "event_enrollments" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "event_enrollments_created_at_idx" ON "event_enrollments" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "user_event_idx" ON "event_enrollments" USING btree ("user_id", "event_id");

    CREATE INDEX IF NOT EXISTS "pages_blocks_events_block_order_idx" ON "pages_blocks_events_block" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_events_block_parent_id_idx" ON "pages_blocks_events_block" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_events_block_path_idx" ON "pages_blocks_events_block" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_events_block_locale_idx" ON "pages_blocks_events_block" USING btree ("_locale");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_events_block_order_idx" ON "_pages_v_blocks_events_block" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_events_block_parent_id_idx" ON "_pages_v_blocks_events_block" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_events_block_path_idx" ON "_pages_v_blocks_events_block" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_events_block_locale_idx" ON "_pages_v_blocks_events_block" USING btree ("_locale");

    ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "events_id" integer;
    ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "events_id" integer;
    ALTER TABLE "search_rels" ADD COLUMN IF NOT EXISTS "events_id" integer;

    DO $$ BEGIN
      ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_events_fk"
        FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_events_fk"
        FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_events_fk"
        FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_rels_events_id_idx" ON "pages_rels" USING btree ("events_id", "locale");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_events_id_idx" ON "_pages_v_rels" USING btree ("events_id", "locale");
    CREATE INDEX IF NOT EXISTS "search_rels_events_id_idx" ON "search_rels" USING btree ("events_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "events_id";
    ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "events_id";
    ALTER TABLE "search_rels" DROP COLUMN IF EXISTS "events_id";

    DROP TABLE IF EXISTS "pages_blocks_events_block" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_events_block" CASCADE;
    DROP TABLE IF EXISTS "event_enrollments" CASCADE;
    DROP TABLE IF EXISTS "_events_v_locales" CASCADE;
    DROP TABLE IF EXISTS "_events_v" CASCADE;
    DROP TABLE IF EXISTS "events_locales" CASCADE;
    DROP TABLE IF EXISTS "events" CASCADE;

    DROP TYPE IF EXISTS "enum_pages_blocks_events_block_populate_by";
    DROP TYPE IF EXISTS "enum__pages_v_blocks_events_block_populate_by";
    DROP TYPE IF EXISTS "enum__events_v_published_locale";
    DROP TYPE IF EXISTS "enum__events_v_version_status";
    DROP TYPE IF EXISTS "enum__events_v_version_location_type";
    DROP TYPE IF EXISTS "enum_events_status";
    DROP TYPE IF EXISTS "enum_events_location_type";
  `)
}
