# Learning Platform — AI Context

A learning platform built with Next.js 15 + Payload CMS 3.78. Users can browse courses, enroll, complete lessons, take quizzes, leave comments, and earn certificates.

## Tech Stack

- **Framework**: Next.js 15.4 (React 19, TypeScript, Turbopack)
- **CMS/Backend**: Payload CMS 3.78 (admin at `/admin`)
- **Database**: PostgreSQL via Neon (serverless)
- **Storage**: Vercel Blob (media uploads)
- **Auth**: Better Auth + Google OAuth
- **UI**: Tailwind CSS v4, Radix UI, Lucide icons
- **Package manager**: pnpm

## Project Structure

```
src/
├── app/
│   ├── (frontend)/[locale]/   # Public-facing Next.js pages
│   ├── (payload)/admin/       # Payload admin panel
│   └── api/                   # API routes: auth, reindex-search
├── collections/               # Payload collection configs
├── components/                # React components (admin/ and frontend/)
├── hooks/                     # Payload lifecycle hooks
├── access/                    # Access control functions
├── migrations/                # DB migrations (production)
└── payload.config.ts          # Main Payload config
```

## Collections (Data Model)

| Collection       | Description                                |
| ---------------- | ------------------------------------------ |
| `users`          | Auth collection (Better Auth integration)  |
| `courses`        | Course content with sections and lessons   |
| `course-files`   | File attachments for course content        |
| `course-categories` | Course taxonomy                         |
| `enrollments`    | User ↔ course enrollment records           |
| `quiz-attempts`  | Quiz submissions and scores                |
| `categories`     | Post/content categories                    |
| `posts`          | Blog/news posts (Lexical rich text)        |
| `pages`          | CMS pages (draft/publish)                  |
| `comments`       | Comments on posts/courses                  |
| `likes`          | Like records for content                   |
| `media`          | Uploaded files (Vercel Blob)               |

## Dev Commands

```bash
pnpm dev              # Start dev server (localhost:3000, Turbopack)
pnpm build            # Production build
pnpm start            # Start production server
pnpm generate:types   # Regenerate payload-types.ts after schema changes
pnpm generate:importmap  # Regenerate admin import map after adding components
pnpm test:int         # Run integration tests (Vitest)
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm lint             # ESLint
```

## Dev Server Rules

- **Port 3000 only.** Never use 3001, 3002, etc.
- Never run multiple instances simultaneously.
- If port 3000 is not responding, check the Neon branch in `.env` first.

## Database: Neon Branching

Each dev session needs its own Neon branch to avoid schema/data conflicts.

Name the Neon branch after your **git branch name** — this is required for auto-cleanup on PR close (`.github/workflows/neon-cleanup.yml`).

**Session start:**
```bash
# 1. Create a branch named after your git branch (e.g. feat/my-feature)
pnpm exec neonctl branches create --name <git-branch-name> --parent dev \
  --project-id ancient-cell-80589995 --output json

# 2. Get connection string (use branch.id from above)
pnpm exec neonctl connection-string <BRANCH_ID> --pooled \
  --project-id ancient-cell-80589995

# 3. Set in .env
DATABASE_URL=<connection_string>
```

**Session end** — delete your branch (or let the PR close action handle it):
```bash
pnpm exec neonctl branches delete <BRANCH_ID> --project-id ancient-cell-80589995
```

## Database: Push vs Migrations

- `push: true` in the Postgres adapter **only applies in dev** — auto-syncs schema via Drizzle on startup.
- **Production** schema changes go through migrations in `src/migrations/`.
- Migrations run automatically on Vercel deploy.
- **Never run migrations on dev** — `push: true` handles it.
- After adding collections/fields: create a migration with `payload migrate:create`.

## Critical Security Rules

### 1. Local API access control is bypassed by default

```typescript
// WRONG — passes user but bypasses their permissions
await payload.find({ collection: 'posts', user: someUser })

// CORRECT — enforces the user's permissions
await payload.find({ collection: 'posts', user: someUser, overrideAccess: false })
```

**Rule**: When passing `user` to Local API, always set `overrideAccess: false`.

### 2. Always pass `req` to nested operations in hooks

```typescript
// WRONG — breaks transaction atomicity
async ({ doc, req }) => {
  await req.payload.create({ collection: 'audit-log', data: { docId: doc.id } })
}

// CORRECT — same transaction
async ({ doc, req }) => {
  await req.payload.create({ collection: 'audit-log', data: { docId: doc.id }, req })
}
```

**Rule**: Always pass `req` to nested operations in hooks.

### 3. Prevent infinite hook loops

```typescript
// WRONG — update triggers afterChange again
async ({ doc, req }) => {
  await req.payload.update({ collection: 'posts', id: doc.id, data: { views: doc.views + 1 }, req })
}

// CORRECT — use context flag
async ({ doc, req, context }) => {
  if (context.skipHooks) return
  await req.payload.update({
    collection: 'posts', id: doc.id,
    data: { views: doc.views + 1 },
    context: { skipHooks: true }, req,
  })
}
```

**Rule**: Use `req.context` flags to prevent hook loops.

## Git Workflow

### Branch hygiene

- **Always run `git status` before starting any new work.** If the working tree is dirty or you're on an unrelated branch, stop and sort it out first — do not commit unrelated changes together.
- **Each feature, fix, or task gets its own branch** cut from `main` (or the appropriate base). Never do new work directly on `main` or on a branch that belongs to a different task.
- Branch naming: `feat/<slug>`, `fix/<slug>`, `test/<slug>`, `chore/<slug>`.
- Keep the working tree clean at all times. Stash or commit before switching context.

### Pull requests

When adding commits on top of an existing PR branch, always update the PR description to reflect the full set of changes — not just the latest commit. Run `gh pr view <number>` to read the current description before editing.

### Commits

Do not add Claude as a co-author in commit messages. No `Co-Authored-By: Claude` lines.

## TypeScript

Run `pnpm generate:types` after every schema change. Types are output to `src/payload-types.ts`. Always import Payload types from `payload` (e.g. `CollectionConfig`, `Access`, `FieldHook`).

## Plugins Active

- `@payloadcms/plugin-mcp` — exposes collections via MCP (for AI tools)
- `@payloadcms/plugin-search` — full-text search on posts, courses, categories
- `@payloadcms/plugin-seo` — SEO fields on content collections
- `@payloadcms/plugin-nested-docs` — nested page hierarchy
- `@payloadcms/storage-vercel-blob` — media stored in Vercel Blob

## Detailed Reference Docs

- [Collections & Globals](docs/payload/collections.md)
- [Fields](docs/payload/fields.md)
- [Hooks](docs/payload/hooks.md)
- [Access Control](docs/payload/access-control.md)
- [Advanced Access Control](docs/payload/access-control-advanced.md)
- [Queries & Local API](docs/payload/queries.md)
- [Custom Endpoints](docs/payload/endpoints.md)
- [Custom Components](docs/payload/components.md)
- [Field Type Guards](docs/payload/field-type-guards.md)
- [Adapters & Transactions](docs/payload/adapters.md)
- [Plugin Development](docs/payload/plugin-development.md)
