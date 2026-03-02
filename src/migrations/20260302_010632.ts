import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "courses_quiz_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"is_correct" boolean DEFAULT false
  );
  
  CREATE TABLE "courses_quiz_questions_answers_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_quiz_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_quiz_questions_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_courses_v_version_quiz_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"is_correct" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_quiz_questions_answers_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_version_quiz_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_quiz_questions_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "quiz_attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"course_id" integer NOT NULL,
  	"score" numeric NOT NULL,
  	"passed" boolean,
  	"total_questions" numeric NOT NULL,
  	"correct_answers" numeric NOT NULL,
  	"answers" jsonb,
  	"attempt_number" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "courses" ADD COLUMN "quiz_enabled" boolean DEFAULT false;
  ALTER TABLE "courses" ADD COLUMN "quiz_passing_score" numeric DEFAULT 70;
  ALTER TABLE "courses_locales" ADD COLUMN "quiz_title" varchar;
  ALTER TABLE "courses_locales" ADD COLUMN "quiz_description" varchar;
  ALTER TABLE "_courses_v" ADD COLUMN "version_quiz_enabled" boolean DEFAULT false;
  ALTER TABLE "_courses_v" ADD COLUMN "version_quiz_passing_score" numeric DEFAULT 70;
  ALTER TABLE "_courses_v_locales" ADD COLUMN "version_quiz_title" varchar;
  ALTER TABLE "_courses_v_locales" ADD COLUMN "version_quiz_description" varchar;
  ALTER TABLE "enrollments" ADD COLUMN "quiz_passed" boolean DEFAULT false;
  ALTER TABLE "enrollments" ADD COLUMN "best_quiz_score" numeric;
  ALTER TABLE "enrollments" ADD COLUMN "quiz_attempts" numeric DEFAULT 0;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quiz_attempts_id" integer;
  ALTER TABLE "courses_quiz_questions_answers" ADD CONSTRAINT "courses_quiz_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_quiz_questions_answers_locales" ADD CONSTRAINT "courses_quiz_questions_answers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_quiz_questions_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_quiz_questions" ADD CONSTRAINT "courses_quiz_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_quiz_questions_locales" ADD CONSTRAINT "courses_quiz_questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_quiz_questions_answers" ADD CONSTRAINT "_courses_v_version_quiz_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_quiz_questions_answers_locales" ADD CONSTRAINT "_courses_v_version_quiz_questions_answers_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_quiz_questions_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_quiz_questions" ADD CONSTRAINT "_courses_v_version_quiz_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_quiz_questions_locales" ADD CONSTRAINT "_courses_v_version_quiz_questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "courses_quiz_questions_answers_order_idx" ON "courses_quiz_questions_answers" USING btree ("_order");
  CREATE INDEX "courses_quiz_questions_answers_parent_id_idx" ON "courses_quiz_questions_answers" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_quiz_questions_answers_locales_locale_parent_id_uniq" ON "courses_quiz_questions_answers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_quiz_questions_order_idx" ON "courses_quiz_questions" USING btree ("_order");
  CREATE INDEX "courses_quiz_questions_parent_id_idx" ON "courses_quiz_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_quiz_questions_locales_locale_parent_id_unique" ON "courses_quiz_questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_version_quiz_questions_answers_order_idx" ON "_courses_v_version_quiz_questions_answers" USING btree ("_order");
  CREATE INDEX "_courses_v_version_quiz_questions_answers_parent_id_idx" ON "_courses_v_version_quiz_questions_answers" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_version_quiz_questions_answers_locales_locale_par" ON "_courses_v_version_quiz_questions_answers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_version_quiz_questions_order_idx" ON "_courses_v_version_quiz_questions" USING btree ("_order");
  CREATE INDEX "_courses_v_version_quiz_questions_parent_id_idx" ON "_courses_v_version_quiz_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_version_quiz_questions_locales_locale_parent_id_u" ON "_courses_v_version_quiz_questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "quiz_attempts_user_idx" ON "quiz_attempts" USING btree ("user_id");
  CREATE INDEX "quiz_attempts_course_idx" ON "quiz_attempts" USING btree ("course_id");
  CREATE INDEX "quiz_attempts_updated_at_idx" ON "quiz_attempts" USING btree ("updated_at");
  CREATE INDEX "quiz_attempts_created_at_idx" ON "quiz_attempts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_attempts_fk" FOREIGN KEY ("quiz_attempts_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_quiz_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("quiz_attempts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_quiz_questions_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_quiz_questions_answers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_quiz_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_quiz_questions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_quiz_questions_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_quiz_questions_answers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_quiz_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_quiz_questions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quiz_attempts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "courses_quiz_questions_answers" CASCADE;
  DROP TABLE "courses_quiz_questions_answers_locales" CASCADE;
  DROP TABLE "courses_quiz_questions" CASCADE;
  DROP TABLE "courses_quiz_questions_locales" CASCADE;
  DROP TABLE "_courses_v_version_quiz_questions_answers" CASCADE;
  DROP TABLE "_courses_v_version_quiz_questions_answers_locales" CASCADE;
  DROP TABLE "_courses_v_version_quiz_questions" CASCADE;
  DROP TABLE "_courses_v_version_quiz_questions_locales" CASCADE;
  DROP TABLE "quiz_attempts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quiz_attempts_fk";
  
  DROP INDEX "payload_locked_documents_rels_quiz_attempts_id_idx";
  ALTER TABLE "courses" DROP COLUMN "quiz_enabled";
  ALTER TABLE "courses" DROP COLUMN "quiz_passing_score";
  ALTER TABLE "courses_locales" DROP COLUMN "quiz_title";
  ALTER TABLE "courses_locales" DROP COLUMN "quiz_description";
  ALTER TABLE "_courses_v" DROP COLUMN "version_quiz_enabled";
  ALTER TABLE "_courses_v" DROP COLUMN "version_quiz_passing_score";
  ALTER TABLE "_courses_v_locales" DROP COLUMN "version_quiz_title";
  ALTER TABLE "_courses_v_locales" DROP COLUMN "version_quiz_description";
  ALTER TABLE "enrollments" DROP COLUMN "quiz_passed";
  ALTER TABLE "enrollments" DROP COLUMN "best_quiz_score";
  ALTER TABLE "enrollments" DROP COLUMN "quiz_attempts";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quiz_attempts_id";`)
}
