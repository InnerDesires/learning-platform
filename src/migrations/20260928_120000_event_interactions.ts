import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Event comments and likes share the existing polymorphic interaction tables.
// The enum values must be added before those collections can write event rows.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_comments_target_collection" ADD VALUE IF NOT EXISTS 'events'`)
  await db.execute(sql`ALTER TYPE "public"."enum_likes_target_collection" ADD VALUE IF NOT EXISTS 'events'`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Removing an enum value would require replacing the type and deleting any
  // event interactions. Keep the value so rollback preserves user content.
  payload.logger.info('event_interactions: enum values retained to preserve comments and likes')
}
