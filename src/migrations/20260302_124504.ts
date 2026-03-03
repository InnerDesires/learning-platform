import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_comments_target_collection" AS ENUM('posts', 'courses');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_likes_target_collection" AS ENUM('posts', 'courses', 'comments');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "comments" (
      "id" serial PRIMARY KEY NOT NULL,
      "body" varchar NOT NULL,
      "author_id" integer NOT NULL,
      "target_collection" "enum_comments_target_collection" NOT NULL,
      "target_id" numeric NOT NULL,
      "parent_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "likes" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "target_collection" "enum_likes_target_collection" NOT NULL,
      "target_id" numeric NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "comments_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "likes_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk"
        FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "comments_author_idx" ON "comments" USING btree ("author_id");
    CREATE INDEX IF NOT EXISTS "comments_target_collection_idx" ON "comments" USING btree ("target_collection");
    CREATE INDEX IF NOT EXISTS "comments_target_id_idx" ON "comments" USING btree ("target_id");
    CREATE INDEX IF NOT EXISTS "comments_parent_idx" ON "comments" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "comments_updated_at_idx" ON "comments" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "likes_user_idx" ON "likes" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "likes_target_collection_idx" ON "likes" USING btree ("target_collection");
    CREATE INDEX IF NOT EXISTS "likes_target_id_idx" ON "likes" USING btree ("target_id");
    CREATE INDEX IF NOT EXISTS "likes_updated_at_idx" ON "likes" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "likes_created_at_idx" ON "likes" USING btree ("created_at");
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk"
        FOREIGN KEY ("comments_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_likes_fk"
        FOREIGN KEY ("likes_id") REFERENCES "public"."likes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_comments_id_idx"
      ON "payload_locked_documents_rels" USING btree ("comments_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_likes_id_idx"
      ON "payload_locked_documents_rels" USING btree ("likes_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "comments" CASCADE;
    DROP TABLE IF EXISTS "likes" CASCADE;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_comments_fk";
    EXCEPTION WHEN undefined_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_likes_fk";
    EXCEPTION WHEN undefined_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_comments_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_likes_id_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "comments_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "likes_id";
  `)

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_comments_target_collection";
    DROP TYPE IF EXISTS "public"."enum_likes_target_collection";
  `)
}
