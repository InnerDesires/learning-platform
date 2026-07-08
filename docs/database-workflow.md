# Database & Deployment Workflow

How schema, data, tests, and deployments interact across the two Neon projects, GitHub Actions, and Vercel (Hobby plan). This is the target design; the [implementation plan](#implementation-plan) at the bottom tracks the gap between this document and current reality.

## Principles

1. **Migrations are the schema contract.** `push: true` is a local-iteration convenience only. Every schema change ships a migration in the same PR, and CI rehearses that migration before merge. Production is the *last* place a migration runs, never the first.
2. **Two Neon projects, one direction of trust.** The **dev project** (`ancient-cell-80589995`) holds everything ephemeral: session branches, CI branches, preview data. The **prod project** (separate project, separate credentials) holds exactly one thing: production data. Nothing in the dev project ever points at the prod project, and no automated flow writes to prod except the production deployment itself.
3. **Builds are environment-aware.** `next build` initializes Payload (prerendering), so every build touches a database. Which database, and whether migrations run, is decided explicitly per environment — never by fallback.

## Neon topology

```
Dev project (ancient-cell-80589995)          Prod project
├── dev        shared parent: seed data,     └── main   production DB;
│              schema kept current by                   migrated only by the
│              the post-merge workflow                  production build step
├── ci-base    migration-managed baseline
│              (clean payload_migrations)
│              + seed content; parent for
│              all ci/* branches
├── preview    long-lived branch for Vercel
│              preview deployments (optional)
├── feat/*     one per dev session, named
│              after the git branch,
│              forked from dev
└── ci/*       ephemeral, one per CI run,
               forked from ci-base
```

Why `ci-base` exists (instead of forking CI branches from `dev`): `dev` is push-managed, so its `payload_migrations` table contains a `batch=-1` entry that makes `payload migrate` hang on an interactive prompt. `ci-base` is built *from migrations*, so its migration bookkeeping is clean and `payload migrate` runs non-interactively — which is what lets CI apply a PR's new migration automatically instead of someone psql-ing columns into `dev` by hand.

## Flow 1 — Local dev session

1. `git checkout -b feat/<slug>` from `main`.
2. Create the Neon branch (same name as the git branch — required by `neon-cleanup.yml`):
   ```bash
   pnpm exec neonctl branches create --name feat/<slug> --parent dev \
     --project-id ancient-cell-80589995 --output json
   pnpm exec neonctl connection-string <BRANCH_ID> --pooled \
     --project-id ancient-cell-80589995
   ```
3. Set `DATABASE_URL` in `.env`. **Check that `.env.local` does not define `DATABASE_URL`** — Next.js gives `.env.local` precedence, and a leftover value there silently redirects the dev server *and* Vitest to another branch.
4. `pnpm dev` — `push: true` syncs the schema from code. Integration tests (`pnpm test:int`) hit the same branch.
5. Schema changed? Before opening the PR: `pnpm payload migrate:create <name>` and commit the migration. Hand-edit it down to only your change if the diff picks up unrelated noise, and keep DDL guarded (`IF NOT EXISTS`) so reruns are safe.
6. Open the PR. The Neon branch is deleted automatically when the PR closes.

**Sharp edges:**
- Stop the dev server before switching git branches. If the checked-out code's schema is older than the connected branch's, `push: true` will interactively offer to **drop the newer columns and their data**.
- Dev server runs on port 3000 only, one instance.

## Flow 2 — PR CI (GitHub Actions)

Both `ci.yml` (Vitest integration) and `e2e.yml` (Playwright) follow the same shape:

1. Fork `ci/<run_id>` from **`ci-base`** in the dev project.
2. `pnpm payload migrate` — applies any migrations merged since `ci-base` was last refreshed **plus the PR's own migration**. This is the pre-merge rehearsal: a broken or missing migration fails CI here, not the production deploy.
3. Run the tests (E2E additionally runs `tests/helpers/seedUser.ts` and builds the app — the build's prerender also validates that code and schema agree).
4. Delete the branch (always, on success or failure).

**`ci-base` refresh:** a workflow on push to `main` runs `pnpm payload migrate` against `ci-base` so merged migrations propagate automatically. If `ci-base` ever gets polluted, rebuild it: create a fresh branch, run all migrations + the seed script, then swap names.

## Flow 3 — Preview deployments (Vercel, Hobby plan)

Hobby auto-builds a preview for **every PR push**, with one concurrent build and shared build-minute quota. Two acceptable configurations — pick one and write it down in the Vercel dashboard:

- **Option A — previews off (default recommendation).** Ignored Build Step: `bash -c '[ "$VERCEL_ENV" = "production" ]'`. GitHub Actions already tests every PR; the preview build is redundant CI that queues behind production deploys. Costs nothing to re-enable later.
- **Option B — previews on, sandboxed.** Preview-scoped `DATABASE_URL` (env scoping works on Hobby) pointing at the long-lived `preview` branch in the **dev** project — never the prod project. Previews must **never run migrations** (see Flow 4's gate); a schema-changing PR's preview may render errors against the older preview schema — that's accepted and expected. Periodically reset `preview` from `ci-base`.

Either way, the invariant is the same: **no automatic Vercel behavior can reach the prod Neon project from a PR.**

## Flow 4 — Production deployment

1. Merge to `main` → Vercel builds production.
2. Build command runs migrations **only for production builds**, then builds:
   ```jsonc
   // package.json — Vercel runs vercel-build when present
   "vercel-build": "node scripts/migrate-on-vercel.mjs && pnpm build"
   ```
   where the script is a no-op unless `VERCEL_ENV === 'production'`, and otherwise runs `payload migrate` against the production `DATABASE_URL` (prod project, Production-scoped env var).
3. Migrations run once, at a deterministic time, by a single runner, before the new code serves traffic — not on serverless cold starts (function-timeout and concurrency races) and never from previews.
4. Rollback story: Neon point-in-time restore on the prod project, plus every migration's `down()`. A failed migration fails the build, so the previous deployment keeps serving.

**Do not** wire `prodMigrations` into the Payload adapter: Payload initializes during `next build` prerendering, so startup-managed migrations execute inside every build — including preview builds — against whatever database that environment sees.

## Implementation plan

Ordered; each phase is independently shippable. Phase 0 blocks everything else.

**Phase 0 — Reconcile drift and baseline prod** *(largest, riskiest, already scoped as a task)*
- [ ] Make the checked-in migrations reproduce the real schema: audit prod + `dev` against `src/migrations/`, add a guarded catch-up migration for the gaps (comments/likes tables, document-locking removals, index changes).
- [ ] Baseline prod's `payload_migrations`: mark the existing migration set as applied (prod has never run migrations — a from-scratch run would `CREATE TABLE` things that exist and fail).
- [ ] Verify: fork a branch from prod, run `payload migrate` on it, confirm clean no-op.

**Phase 1 — CI applies migrations**
- [ ] Create `ci-base` in the dev project: fresh branch → run all migrations → run seed (extend the seed script to cover baseline content the E2E suite needs: home/contact pages, a sample course/post).
- [ ] `ci.yml` + `e2e.yml`: parent `ci/*` off `ci-base`; add `pnpm payload migrate` before tests.
- [ ] Add `.github/workflows/refresh-ci-base.yml`: on push to `main`, run `payload migrate` against `ci-base`.

**Phase 2 — Vercel wiring**
- [ ] Add `scripts/migrate-on-vercel.mjs` + `vercel-build` script (production-gated migrate).
- [ ] Dashboard: Production `DATABASE_URL` → prod project (verify it's Production-scoped, not "all environments"); pick preview Option A or B and configure it.

**Phase 3 — Local hygiene & docs**
- [ ] Remove the `DATABASE_URL` override from `.env.local` (one-time, local machines).
- [ ] Log the connected DB endpoint host at startup so the "which database am I actually on?" question is a glance, not an investigation.
- [ ] Update `CLAUDE.md`: fix the incorrect "migrations run automatically on Vercel deploy" claim, document the two-project topology and this file.

**Decisions needed before/while implementing:**
- Prod Neon project ID (for Phase 0 auditing and the baseline script).
- Preview deployments: Option A or B.
- Seed content scope for `ci-base` / E2E.
