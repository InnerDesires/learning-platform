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
   pnpm exec neonctl connection-string <BRANCH_ID> \
     --project-id ancient-cell-80589995
   ```
   Use the **direct** (unpooled) connection string — no `--pooled` flag, no `-pooler` suffix in the host. Pooled URLs break under `push: true` (see sharp edges below); a single dev server doesn't need pooling. Production and previews keep pooled URLs — they never run drizzle push.
3. Set `DATABASE_URL` in `.env`. **Check that `.env.local` does not define `DATABASE_URL`** — Next.js gives `.env.local` precedence, and a leftover value there silently redirects the dev server *and* Vitest to another branch.
4. `pnpm dev` — `push: true` syncs the schema from code. Integration tests (`pnpm test:int`) hit the same branch.
5. Schema changed? Before opening the PR: `pnpm payload migrate:create <name>` and commit the migration. Hand-edit it down to only your change if the diff picks up unrelated noise, and keep DDL guarded (`IF NOT EXISTS`) so reruns are safe.
6. Open the PR. The Neon branch is deleted automatically when the PR closes.

**Sharp edges:**
- Stop the dev server before switching git branches. If the checked-out code's schema is older than the connected branch's, `push: true` will interactively offer to **drop the newer columns and their data**.
- Dev server runs on port 3000 only, one instance.
- A **pooled** `DATABASE_URL` (host contains `-pooler`) causes intermittent `42P01 relation "..." does not exist` errors in dev: drizzle push introspection (dev-server startup/HMR) leaks `SET search_path` onto pgbouncer transaction-mode connections, other clients reuse those poisoned connections, and unqualified table names randomly stop resolving (observed 2026-07-24 as Better Auth sign-in failing while the frontend worked, then random pages 500ing). If a dev server throws "relation does not exist" on tables that exist, check for a `-pooler` host in `DATABASE_URL`, switch to the direct connection string, and restart the server.

## Flow 2 — PR CI (GitHub Actions)

Both `ci.yml` (Vitest integration) and `e2e.yml` (Playwright) follow the same shape:

1. Fork `ci/<run_id>` from **`ci-base`** in the dev project.
2. `pnpm payload migrate` — applies any migrations merged since `ci-base` was last refreshed **plus the PR's own migration**. This is the pre-merge rehearsal: a broken or missing migration fails CI here, not the production deploy.
3. Run the tests (E2E additionally runs `tests/helpers/seedUser.ts` and builds the app — the build's prerender also validates that code and schema agree).
4. Delete the branch (always, on success or failure).

**`ci-base` refresh:** a workflow on push to `main` runs `pnpm payload migrate` against `ci-base` so merged migrations propagate automatically. If `ci-base` ever gets polluted, rebuild it: create a fresh branch, run all migrations + the seed script, then swap names.

## Flow 3 — Preview deployments (Vercel, Hobby plan)

Hobby auto-builds a preview for **every PR push**, with one concurrent build and shared build-minute quota. GitHub Actions already tests every PR, so automatic previews are redundant CI — instead previews are **on-demand** (implemented 2026-07-22):

- **Default: skipped.** `ignoreCommand` in `vercel.json` exits 0 (= skip; exit 1 = build — note an earlier draft of this doc had the test inverted) for every non-production build without an opt-in.
- **Opt-in per push:** include `[preview]` anywhere in the commit message and that push gets a preview deployment. For a preview without code changes: `git commit --allow-empty -m "chore: preview [preview]" && git push`.
- **Ad-hoc from a machine:** `vercel deploy` builds a preview of the current checkout any time (CLI deploys don't consult `ignoreCommand`).
- **Database:** Preview-scoped `DATABASE_URL` points at the long-lived `preview` branch in the **dev** project (forked from `dev`, so it carries seed content) — never the prod project. Previews **never run migrations** (Flow 4's gate is production-only); a schema-changing PR's preview may render errors against the older preview schema — accepted and expected. If the preview schema falls behind or the data gets messy, reset it: delete the `preview` branch and re-fork it from `dev` (then update the Preview `DATABASE_URL` if the endpoint changed).

The invariant is unchanged: **no automatic Vercel behavior can reach the prod Neon project from a PR.**

> **Resolved 2026-07-22:** this invariant used to be violated — a Neon↔Vercel integration on the prod project created `preview/<git-branch>` branches there (forked from production data) on every PR push, even for builds canceled by the ignored-build-step. The integration has been disconnected; the prod project now holds only the `production` branch. Production env vars survived the disconnect.

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
Status as of 2026-07-21: all phases implemented except the Vercel dashboard
configuration (blocked on `vercel login`); findings that corrected this
document's assumptions are noted inline.

**Phase 0 — Reconcile drift and baseline prod** *(done)*
- [x] Make the checked-in migrations reproduce the real schema. A three-way audit (from-scratch migration run vs push-managed `dev` vs prod) found far less drift than feared — comments/likes were already covered by the chain. The gaps: stale `DEFAULT 'uk'` on 19 `_locale` columns, a UNIQUE that should be a plain index on `admin_invitations.token`, and `payload_locked_documents_rels` columns for `lockDocuments: false` collections. All fixed in `src/migrations/20260721_233000_reconcile_schema_drift.ts`.
- [x] Baseline prod's `payload_migrations` — **not needed**: the assumption that prod never ran migrations was wrong. Prod's `payload_migrations` already contains the full migration set in proper batches. Mechanism (discovered during Phase 2): the Vercel dashboard's Build Command was overridden to `payload migrate && pnpm build`, so every production deploy ran migrations — the guarded migrations were applied over prod's originally push-created schema (which is exactly why the three cosmetic drifts above existed).
- [x] Verify on a prod fork: catch-up migration applies cleanly, a rerun is a clean no-op, `migrate:down` round-trips, and the resulting schema is byte-identical to the code-truth schema.

**Phase 1 — CI applies migrations** *(done)*
- [x] `ci-base` created in the dev project (`br-calm-cherry-agtarah4`): forked from `dev`, `public` schema wiped, rebuilt purely from migrations. Seed decision: **no baseline content needed** — the full integration suite (60 tests) and E2E suite (14 tests) pass against an empty `ci-base` fork; tests create their own fixtures and the per-run `tests/helpers/seedUser.ts` covers users.
- [x] `ci.yml` + `e2e.yml`: parent `ci/*` off `ci-base`; `pnpm payload migrate` runs before tests.
- [x] `.github/workflows/refresh-ci-base.yml`: on push to `main`, applies merged migrations to `ci-base`.

**Phase 2 — Vercel wiring** *(done, one dashboard-only step remains)*
- [x] `scripts/migrate-on-vercel.mjs` + `vercel-build` script (production-gated migrate; fails the build on migration failure).
- [x] Production `DATABASE_URL` verified: Production-scoped (not "all environments"), points at the prod project's `production` branch endpoint.
- [x] Preview **Option A** implemented via `ignoreCommand` in `vercel.json` (in-repo, overrides the dashboard setting) — non-production builds are skipped. Verified live on PR #58: the preview deployment shows "Canceled by Ignored Build Step".
- [x] Dashboard Build Command override (`payload migrate && pnpm build`) **cleared** via API — it ran migrations ungated on every environment that built, and it would have silently shadowed the `vercel-build` script. Build behavior is now fully repo-controlled.
- [x] Neon↔Vercel integration **disconnected** (2026-07-22). The integration had no setting to disable preview branching alone (branching is its whole feature — it even forked a `preview/*` branch for PR #58's *canceled* preview build), so it was removed via its Disconnect tab after snapshotting env values. Outcome: Production `DATABASE_URL`/`DATABASE_URL_UNPOOLED` survived intact; the per-branch Preview env rows were removed; all `preview/*` branches deleted — the prod project now contains only `production`.

**Phase 3 — Local hygiene & docs** *(done)*
- [x] `DATABASE_URL` override removed from `.env.local` (this machine; backup at `.env.local.bak-ci-flow`). Root cause documented: `vitest.setup.ts` loads `.env.local` with `override: true`, so a value there beats even explicitly passed env vars.
- [x] `payload.config.ts` logs the `DATABASE_URL` host at config load.
- [x] `CLAUDE.md` updated: migration flow corrected, `.env.local` rule added, this file linked.

**Decisions:**
- Prod Neon project ID: `sweet-night-33633526` (name `production-1`; default branch `production`).
- Preview deployments: **pending** — Option A (previews off) remains the recommendation; either option requires dealing with the Neon↔Vercel integration noted in Phase 2.
- Seed content scope for `ci-base` / E2E: **none** (see Phase 1).
