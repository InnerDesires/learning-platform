import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The Archive block's `relationTo` select gains 'courses' and
// 'course-categories', its new `courseCategories` relationship and the
// widened polymorphic `selectedDocs` store rows in pages_rels /
// _pages_v_rels, which need courses_id / course_categories_id columns.
// The block inside post content lives in the Lexical JSON — no DDL needed.
//
// All statements are idempotent so reruns (and push-managed dev branches
// that already have the schema) are safe. ALTER TYPE ... ADD VALUE cannot
// run in the same transaction as queries using the new value, but nothing
// here reads the enum afterwards.

const ENUMS = ['enum_pages_blocks_archive_relation_to', 'enum__pages_v_blocks_archive_relation_to']

const REL_TABLES: Array<{ table: string; prefix: string }> = [
  { table: 'pages_rels', prefix: 'pages_rels' },
  { table: '_pages_v_rels', prefix: '_pages_v_rels' },
]

const REL_COLUMNS: Array<{ column: string; refTable: string; fkName: string }> = [
  { column: 'courses_id', refTable: 'courses', fkName: 'courses_fk' },
  { column: 'course_categories_id', refTable: 'course_categories', fkName: 'course_categories_fk' },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const enumName of ENUMS) {
    for (const value of ['courses', 'course-categories']) {
      await db.execute(
        sql.raw(`ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS '${value}';`),
      )
    }
  }

  for (const { table, prefix } of REL_TABLES) {
    for (const { column, refTable, fkName } of REL_COLUMNS) {
      await db.execute(
        sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" integer;`),
      )
      await db.execute(
        sql.raw(`DO $$ BEGIN
          ALTER TABLE "${table}" ADD CONSTRAINT "${prefix}_${fkName}"
            FOREIGN KEY ("${column}") REFERENCES "public"."${refTable}"("id")
            ON DELETE cascade ON UPDATE no action;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;`),
      )
      await db.execute(
        sql.raw(
          `CREATE INDEX IF NOT EXISTS "${prefix}_${column}_idx" ON "${table}" ("${column}");`,
        ),
      )
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres cannot drop enum values; only the added columns are reverted.
  for (const { table, prefix } of REL_TABLES) {
    for (const { column, fkName } of REL_COLUMNS) {
      await db.execute(sql.raw(`DROP INDEX IF EXISTS "${prefix}_${column}_idx";`))
      await db.execute(
        sql.raw(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${prefix}_${fkName}";`),
      )
      await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}";`))
    }
  }
}
