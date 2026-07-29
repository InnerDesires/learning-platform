import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Gives the default `learner` role to users who were created without one.
 *
 * payload-auth builds `users.role` as a hasMany select but passed its
 * `defaultRole` through as a bare string. Payload applied that default, then
 * `@payloadcms/drizzle` skipped the write — its select-hasMany branch only runs
 * for arrays — so no `users_role` row was ever inserted and no error surfaced.
 * Every account created through Better Auth (email sign-up, Google, admin
 * invites) therefore ended up with an empty role.
 *
 * The default is now shaped as an array (`collectionOverrides` in
 * src/lib/auth/options.ts), which fixes new sign-ups; this backfills the rows
 * that were already lost.
 *
 * Users who already have a role — the first admin, seeded accounts — are left
 * alone, so this never grants or downgrades anything that was set deliberately.
 */

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const { rowCount } = await db.execute(sql`
    INSERT INTO "users_role" ("order", "parent_id", "value")
    SELECT 1, "users"."id", 'learner'::"enum_users_role"
    FROM "users"
    WHERE NOT EXISTS (
      SELECT 1 FROM "users_role" WHERE "users_role"."parent_id" = "users"."id"
    )
  `)

  if (rowCount) {
    payload.logger.info(`backfill_user_roles: assigned 'learner' to ${rowCount} user(s).`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Not reversible: a backfilled `learner` row is indistinguishable from one a
  // fixed sign-up wrote, and removing them would strip roles from real users.
  payload.logger.info('backfill_user_roles: nothing to undo.')
}
