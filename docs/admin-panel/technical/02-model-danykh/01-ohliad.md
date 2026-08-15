---
title: Огляд моделі даних
description: Усі колекції платформи, схема звʼязків між ними та повна карта ручних каскадів видалення
---

## Проєктні колекції (13)

Оголошені в `src/collections/` і зареєстровані в `src/payload.config.ts`:

| Колекція | Файл | Призначення |
| --- | --- | --- |
| `users` | `Users/index.ts` | Auth-колекція (розширюється payload-auth): профіль, ролі |
| `courses` | `Courses.ts` | Курси: кроки-блоки, квіз, drafts/versions |
| `course-categories` | `CourseCategories.ts` | Таксономія курсів |
| `course-files` | `CourseFiles.ts` | Upload: PDF/PPT(X) для файлових кроків |
| `enrollments` | `Enrollments.ts` | Запис користувача на курс + увесь прогрес |
| `quiz-attempts` | `QuizAttempts.ts` | Спроби фінального тесту (оцінені сервером) |
| `xp-events` | `XpEvents.ts` | Append-only лог нарахувань XP (періодні лідерборди) |
| `posts` | `Posts/index.ts` | Публікації (Lexical, SEO, drafts) |
| `pages` | `Pages/index.ts` | CMS-сторінки (hero + blocks, drafts) |
| `categories` | `Categories.ts` | Категорії постів (nested docs) |
| `media` | `Media.ts` | Зображення (Vercel Blob, focal point, folders) |
| `comments` | `Comments.ts` | Коментарі до постів/курсів (треди) |
| `likes` | `Likes.ts` | Лайки постів/курсів/коментарів |

## Колекції плагінів

| Колекція | Плагін | Призначення |
| --- | --- | --- |
| `sessions` | payload-auth | Активні сесії Better Auth (токен, IP, user agent) |
| `accounts` | payload-auth | Облікові записи провайдерів (credential-хеш пароля, Google) |
| `verifications` | payload-auth | OTP та інші верифікаційні записи |
| `rateLimit` | payload-auth | Спільна таблиця fixed-window rate limit (`src/lib/rate-limit.ts` теж пише сюди) |
| `admin-invitations` | payload-auth | Токени запрошень адміністраторів |
| `redirects` | plugin-redirects | Перенаправлення для pages/posts |
| `forms` | plugin-form-builder | Конструктор форм |
| `form-submissions` | plugin-form-builder | Відповіді форм |
| `search` | plugin-search | Пошуковий індекс (posts, courses, course-categories, pages) |
| `payload-mcp-api-keys` | plugin-mcp | API-ключі MCP-клієнтів |

Службові колекції Payload: `payload-kv`, `payload-jobs` (черга
schedulePublish), `payload-folders` (папки медіа), `payload-locked-documents`,
`payload-preferences`, `payload-migrations`. Деталі плагінних колекцій —
[Колекції плагінів](/admin/docs/technical/model-danykh/plahinni-kolektsii).

## Схема звʼязків

Mermaid рендерер не підтримує, тому — таблиця всіх relations:

| Звідки | Поле | Куди | Тип |
| --- | --- | --- | --- |
| `enrollments` | `user` | `users` | rel, required, unique разом із `course` |
| `enrollments` | `course` | `courses` | rel, required |
| `quiz-attempts` | `user`, `course` | `users`, `courses` | rel, required |
| `xp-events` | `user`, `course` | `users`, `courses` | rel, required |
| `comments` | `author` | `users` | rel, required |
| `comments` | `parent` | `comments` | rel (треди) |
| `comments` | `targetCollection` + `targetId` | `posts` \| `courses` | **поліморфний, без FK** |
| `likes` | `user` | `users` | rel, required |
| `likes` | `targetCollection` + `targetId` | `posts` \| `courses` \| `comments` | **поліморфний, без FK** |
| `courses` | `category` | `course-categories` | rel |
| `courses` | `heroImage` | `media` | upload |
| `courses` | `steps[].file` (fileStep) | `course-files` | upload, required |
| `posts` | `authors` | `users` | rel hasMany |
| `posts` | `categories` | `categories` | rel hasMany |
| `posts` | `heroImage`, `meta.image` | `media` | upload |
| `posts` | `relatedPosts` | `posts` | rel hasMany |
| `pages` | `hero.media`, `meta.image` | `media` | upload |
| `categories` | `parent` | `categories` | rel (nestedDocs) |
| `course-categories` | `image` | `media` | upload |
| `sessions` / `accounts` | `user` | `users` | rel (payload-auth) |
| `search` | `doc` | індексовані колекції | поліморфний rel плагіна |

Словами: **`users` і `courses` — два центри графа.** Навколо users обертаються
прогрес (enrollments, quiz-attempts, xp-events), взаємодія (comments, likes) і
auth-колекції; навколо courses — той самий прогрес плюс таксономія і файли.
`comments`/`likes` цілляться в контент не через relationship, а через пару
`targetCollection` + `targetId` — цілісність цих посилань тримають server
actions, не БД (див.
[comments та likes](/admin/docs/technical/model-danykh/comments-likes)).

## Каскади видалення: чому вручну

Drizzle генерує для relationship-полів FK з `ON DELETE SET NULL`. Але колонки
`user_id` / `course_id` / `author_id` у прогрес-колекціях оголошені
`NOT NULL` — тож при видаленні користувача або курсу Postgres спробував би
поставити NULL у NOT NULL колонку і **впав би на рівні БД**. Тому обидві
«центральні» колекції мають ручні `beforeDelete`-хуки, які спершу зачищають
залежні рядки (кожен `payload.delete` отримує `req` — увесь каскад в одній
транзакції).

### Повна карта каскадів

**`users.beforeDelete`** (`src/collections/Users/index.ts`) — 5 колекцій, у
цьому порядку:

1. `xp-events` де `user = id`
2. `quiz-attempts` де `user = id`
3. `enrollments` де `user = id`
4. `likes` де `user = id`
5. `comments` де `author = id`

**`courses.beforeDelete`** (`src/collections/Courses.ts`) — 5 запитів:

1. `xp-events` де `course = id`
2. `quiz-attempts` де `course = id`
3. `enrollments` де `course = id`
4. `comments` де `targetCollection = 'courses'` і `targetId = id`
5. `likes` де `targetCollection = 'courses'` і `targetId = id`

**`deleteComment`** (server action, не хук) — каскад одного коментаря: лайки
коментаря → прямі відповіді (`parent = commentId`, **один рівень** — «онуки»
осиротіють) → сам коментар.

:::warning Наслідки каскадів
- Видалення курсу або користувача стирає їхні `xp-events` — історичні дані
  періодних лідербордів за цей внесок зникають (сумарний XP і так деривується
  з enrollments, тож теж зникає).
- Видалення поста НЕ каскадить: коментарі/лайки з `targetCollection='posts'`
  лишаються сиротами (клієнтський код це терпить, але рядки висять).
- В адмінці масштаб каскаду курсу показує компонент `CourseDeleteConfirmation`
  (див. [Кастомізації адмін-панелі](/admin/docs/technical/arkhitektura/admin-kastomizatsii)).
:::

## Спільні патерни колекцій

- **Access-функції** з `src/access/`: `admin`, `anyone`, `authenticated`,
  `authenticatedOrPublished` + інлайнові `adminOrOwn` (enrollments, likes,
  quiz-attempts) і `adminOrAuthor` (comments).
- **`lockDocuments: false`** — всюди, де задано: блокування документів
  вимкнено свідомо (сольна адмін-команда).
- **Drafts/versions** лише у контентних колекцій: `pages`, `posts`, `courses`
  (autosave 10000/2000/10000 мс, `schedulePublish`, `maxPerDoc: 50`).
- **Слаги** — core `slugField({ slugify: cyrillicSlugify })`: транслітерація
  кирилиці, `undefined` замість `''` (щоб autosave-чернетки не билися об
  unique-індекс).
- **Rate limit на create** — фабрика `rateLimitCreate`
  (`src/hooks/rateLimitCreate.ts`) у enrollments, comments, likes
  (див. [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting)).

Детальні статті: [courses](/admin/docs/technical/model-danykh/courses),
[enrollments](/admin/docs/technical/model-danykh/enrollments),
[quiz-attempts та xp-events](/admin/docs/technical/model-danykh/quiz-attempts-xp-events),
[users і auth](/admin/docs/technical/model-danykh/users-i-auth),
[posts, pages, media](/admin/docs/technical/model-danykh/posts-pages-media),
[comments та likes](/admin/docs/technical/model-danykh/comments-likes),
[Глобали](/admin/docs/technical/model-danykh/hlobaly).
