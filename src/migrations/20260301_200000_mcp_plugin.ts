import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload_mcp_api_keys" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "label" varchar,
      "description" varchar,
      "posts_find" boolean DEFAULT false,
      "posts_create" boolean DEFAULT false,
      "posts_update" boolean DEFAULT false,
      "posts_delete" boolean DEFAULT false,
      "pages_find" boolean DEFAULT false,
      "pages_create" boolean DEFAULT false,
      "pages_update" boolean DEFAULT false,
      "pages_delete" boolean DEFAULT false,
      "categories_find" boolean DEFAULT false,
      "categories_create" boolean DEFAULT false,
      "categories_update" boolean DEFAULT false,
      "categories_delete" boolean DEFAULT false,
      "media_find" boolean DEFAULT false,
      "media_update" boolean DEFAULT false,
      "header_find" boolean DEFAULT false,
      "header_update" boolean DEFAULT false,
      "footer_find" boolean DEFAULT false,
      "footer_update" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "enable_a_p_i_key" boolean,
      "api_key" varchar,
      "api_key_index" varchar
    );

    ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
    CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
    CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");

    ALTER TABLE "payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
    ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_fk";
    ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_payload_mcp_api_keys_fk";
    ALTER TABLE "payload_mcp_api_keys" DROP CONSTRAINT IF EXISTS "payload_mcp_api_keys_user_id_users_id_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
    DROP INDEX IF EXISTS "payload_preferences_rels_payload_mcp_api_keys_id_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
    ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";

    DROP TABLE IF EXISTS "payload_mcp_api_keys" CASCADE;
  `)
}
