# Data model (high level)

## Currently in Payload config

Defined in `src/payload.config.ts`:

**Collections** (`collections: [Pages, Posts, Media, Categories, Users]`)

| Slug | Config | Main fields / behavior |
|------|--------|-------------------------|
| **pages** | `Pages` | title, slug, hero, layout (blocks: CallToAction, Content, MediaBlock, Archive, FormBlock), SEO meta; versions/drafts; revalidate on change |
| **posts** | `Posts` | title, slug, heroImage, content (Lexical + blocks: Banner, Code, MediaBlock), relatedPosts, **categories** (relation, hasMany), **authors** (relation to users, hasMany), publishedAt, SEO meta; versions/drafts; populateAuthors afterRead; revalidate on change |
| **media** | `Media` | alt, caption; upload (staticDir, focalPoint, imageSizes); folders: true |
| **categories** | `Categories` | title, slug; nested via `nestedDocsPlugin` (parent/children, generateURL) |
| **users** | `Users` | auth; name; admin user for Payload |

**Globals** (`globals: [Header, Footer]`)

| Slug | Config | Fields |
|------|--------|--------|
| **header** | `Header` | navItems (array of link) |
| **footer** | `Footer` | navItems (array of link) |

**Plugins** (in `src/plugins/index.ts`): redirects (pages, posts), nested-docs (categories), SEO (generateTitle, generateURL), form-builder, search (posts), optional Vercel Blob (media).

---

## From initial template (in scope for PRD)

- **Articles (posts)** — title, slug, content (layout blocks), categories, authors; draft/publish; revalidation.
- **Categories** — taxonomy for articles; title, slug; nested (nestedDocsPlugin).
- **Authors** — users linked to articles via `posts.authors` (relation to users, hasMany).
- **Pages** — static/layout pages; layout builder, draft/publish.
- **Media** — uploads; used by pages, posts, and (later) courses.
- **Users** — auth; can be learners and/or authors and/or admins.

## Learning platform (to add)

- **Courses** — title, slug, description, ordered list of **course blocks**, optional quiz, certificate template/settings.
- **Course blocks** (embedded in course): each block is one of (1) **Video** — YouTube link, (2) **Rich text** — text + images, (3) **File** — PDF or presentation upload.
- **Quizzes** — belong to course; questions; correct answers; pass threshold (for optional display on certificate).
- **Progress** — user + course + blocks completed + one quiz attempt per user (answers stored); course completed at (for certificate).
- **Certificates** — generated on completion; store reference or generate on-demand (e.g. PDF from template).

## Tech context

- **Stack** — Payload CMS (admin + API), Next.js frontend (existing template).
- **Existing (from template)** — Users, Posts (articles), Pages, Media, Categories, layout builder, drafts, authors on posts.
- **To add** — Courses (with course blocks), Quizzes, Progress (and certificate generation).
