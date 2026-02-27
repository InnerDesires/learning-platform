import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'learner');
    CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('admin', 'learner');

    DELETE FROM "posts";
    DELETE FROM "users";

    ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
    ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
    ALTER TABLE "users" ADD COLUMN "image" varchar;

    ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_token";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_expiration";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "salt";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "hash";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "login_attempts";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "lock_until";

    CREATE TABLE IF NOT EXISTS "users_role" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_users_role",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "token" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "ip_address" varchar,
      "user_agent" varchar,
      "user_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "accounts" (
      "id" serial PRIMARY KEY NOT NULL,
      "account_id" varchar NOT NULL,
      "provider_id" varchar NOT NULL,
      "user_id" integer NOT NULL,
      "access_token" varchar,
      "refresh_token" varchar,
      "id_token" varchar,
      "access_token_expires_at" timestamp(3) with time zone,
      "refresh_token_expires_at" timestamp(3) with time zone,
      "scope" varchar,
      "password" varchar,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "verifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "identifier" varchar NOT NULL,
      "value" varchar NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "admin_invitations" (
      "id" serial PRIMARY KEY NOT NULL,
      "role" "enum_admin_invitations_role" DEFAULT 'admin' NOT NULL,
      "token" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "users_role" ADD CONSTRAINT "users_role_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX "users_role_order_idx" ON "users_role" USING btree ("order");
    CREATE INDEX "users_role_parent_idx" ON "users_role" USING btree ("parent_id");
    CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");
    CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
    CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
    CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
    CREATE INDEX "accounts_account_id_idx" ON "accounts" USING btree ("account_id");
    CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");
    CREATE INDEX "accounts_access_token_expires_at_idx" ON "accounts" USING btree ("access_token_expires_at");
    CREATE INDEX "accounts_refresh_token_expires_at_idx" ON "accounts" USING btree ("refresh_token_expires_at");
    CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
    CREATE INDEX "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
    CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");
    CREATE INDEX "verifications_expires_at_idx" ON "verifications" USING btree ("expires_at");
    CREATE INDEX "verifications_created_at_idx" ON "verifications" USING btree ("created_at");
    CREATE INDEX "verifications_updated_at_idx" ON "verifications" USING btree ("updated_at");
    CREATE UNIQUE INDEX "admin_invitations_token_idx" ON "admin_invitations" USING btree ("token");
    CREATE INDEX "admin_invitations_updated_at_idx" ON "admin_invitations" USING btree ("updated_at");
    CREATE INDEX "admin_invitations_created_at_idx" ON "admin_invitations" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sessions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "accounts_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "verifications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "admin_invitations_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_verifications_fk" FOREIGN KEY ("verifications_id") REFERENCES "public"."verifications"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_invitations_fk" FOREIGN KEY ("admin_invitations_id") REFERENCES "public"."admin_invitations"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");
    CREATE INDEX "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");
    CREATE INDEX "payload_locked_documents_rels_verifications_id_idx" ON "payload_locked_documents_rels" USING btree ("verifications_id");
    CREATE INDEX "payload_locked_documents_rels_admin_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("admin_invitations_id");

    DROP TABLE IF EXISTS "users_sessions" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_sessions_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_accounts_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_verifications_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_admin_invitations_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "sessions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "accounts_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "verifications_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "admin_invitations_id";

    DROP TABLE IF EXISTS "admin_invitations" CASCADE;
    DROP TABLE IF EXISTS "verifications" CASCADE;
    DROP TABLE IF EXISTS "accounts" CASCADE;
    DROP TABLE IF EXISTS "sessions" CASCADE;
    DROP TABLE IF EXISTS "users_role" CASCADE;

    ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
    ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "image";

    ALTER TABLE "users" ADD COLUMN "reset_password_token" varchar;
    ALTER TABLE "users" ADD COLUMN "reset_password_expiration" timestamp(3) with time zone;
    ALTER TABLE "users" ADD COLUMN "salt" varchar;
    ALTER TABLE "users" ADD COLUMN "hash" varchar;
    ALTER TABLE "users" ADD COLUMN "login_attempts" numeric DEFAULT 0;
    ALTER TABLE "users" ADD COLUMN "lock_until" timestamp(3) with time zone;

    DROP TYPE IF EXISTS "public"."enum_admin_invitations_role";
    DROP TYPE IF EXISTS "public"."enum_users_role";
  `)
}
