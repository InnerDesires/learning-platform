---
title: Ролі та контроль доступу
description: Баг hasMany-select ролі та його фікс, усі access-функції з застереженнями, свідома неповнота users.access і критичні правила Local API
---

## Модель ролей

`users.role` — **hasMany select** (масив рядків), який будує payload-auth. Конфіг — `src/lib/auth/options.ts`:

| Параметр | Значення | Ефект |
| --- | --- | --- |
| `roles` | `['learner', 'admin']` | допустимі опції select |
| `defaultRole` | `'learner'` | роль нових користувачів |
| `adminRoles` | `['admin']` | хто входить в адмін-панель |
| `defaultAdminRole` | `'admin'` | роль для інвайтнутих адміністраторів |
| `allowedFields` | `['name']` | що не-адмін може міняти в собі через API |

Українські лейбли («Адміністратор» / «Учасник») додає `src/plugins/ukrainianAdmin.ts`. Перевірки скрізь через `includes('admin')` — користувач може мати обидві ролі одночасно.

## Баг: bare-string default → мовчки порожні ролі

payload-auth будує `role` як hasMany select, але копіює `defaultRole` всередину як **голий рядок** `'learner'`. Payload застосовує цей default, а далі Drizzle-шар запису (`@payloadcms/drizzle` `transform/write/traverseFields.js`) пише рядки в select-hasMany-таблицю **лише коли значення — масив**; не-масив він **мовчки дропає**. Результат: кожен користувач, створений через Better Auth (email-реєстрація, Google, інвайти), отримував **порожній** `role` — без помилок, без логів.

Фікс — `collectionOverrides` у `betterAuthPluginOptions`:

```ts
collectionOverrides: ({ collection }) => ({
  ...collection,
  fields: collection.fields.map((field) =>
    field.type === 'select' && field.name === 'role'
      ? { ...field, defaultValue: [DEFAULT_USER_ROLE] }   // масив, не рядок
      : field,
  ),
}),
```

Плюс міграція `src/migrations/20260729_100000_backfill_user_roles.ts`, що бекфілить `['learner']` уже постраждалим користувачам. Урок загальніший: **дефолт hasMany-поля завжди мусить бути масивом** — інакше Drizzle тихо його з'їсть.

## Access-функції — `src/access/`

Еталонна `admin` (`src/access/admin.ts`):

```ts
export const admin: IsAdmin = ({ req: { user } }) => {
  if (!user || !('role' in user)) return false
  return Boolean(user.role?.includes('admin'))
}
```

`'role' in user` — не параноя: `req.user` може бути й користувачем іншої auth-колекції (наприклад, ключем `payload-mcp-api-keys`), у якого поля `role` немає взагалі.

| Export | Логіка | Застереження |
| --- | --- | --- |
| `admin` | `user.role?.includes('admin')` (див. вище) | єдина «адмінська» перевірка в проєкті |
| `anyone` | `() => true` | повністю публічно, включно з анонімами |
| `authenticated` | `Boolean(user)` | role-agnostic — будь-який залогінений |
| `authenticatedOrPublished` | залогінений → `true`; анонім → `{ _status: { equals: 'published' } }` | див. попередження нижче |

:::warning `authenticatedOrPublished`: learner читає чернетки
Для **залогіненого** користувача функція повертає `true` без фільтра по `_status` — тобто звичайний learner може читати **чернетки** pages/posts/courses через REST/GraphQL API (не через сайт: фронтові фетчі йдуть з `overrideAccess: false` + `draft: false`). Це свідомий трейд-оф простоти; якщо чернетки колись міститимуть чутливе — фільтр доведеться повернути й авторизованим.
:::

Інлайнові хелпери в колекціях (admin-байпас + ownership-фільтр):

```ts
const adminOrOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ('role' in user && user.role?.includes('admin')) return true
  return { user: { equals: user.id } }
}
```

- `adminOrOwn` — `Enrollments.ts`, `Likes.ts`, `QuizAttempts.ts` (адмін бачить усе, інші — лише свої записи, анонім — нічого);
- `adminOrAuthor` — `Comments.ts`, те саме з фільтром `{ author: { equals: user.id } }`.

Обидва повертають **query-фільтр**, а не boolean — Payload вшиває його в запит, тож «чужі» документи для власника просто не існують (у списках, лічильниках і по прямому id).

## Чому в `users` немає власних read/update

`src/collections/Users/index.ts` задає **лише** `admin: admin`, `create: admin`, `delete: admin`. `read`/`update` свідомо не перевизначені — діють дефолти payload-auth: admin-or-self, причому self-update для не-адміна обрізаний до `allowedFields: ['name']` (з опцій плагіна).

:::danger Не «доповнюйте» users.access
Наївний власний `update: adminOrSelf` без відтворення `allowedFields` знову відкрив би **ескалацію ролі**: `PATCH /api/users/:id` з `{ "role": ["admin"] }` від самого користувача. Всі інші зміни профілю (аватар, about, соцлінки) йдуть через server actions з валідацією — [Аватари та налаштування профілю](/admin/docs/technical/autentyfikatsiya/avatary-i-profil).
:::

## Критичні правила проєкту (Local API і хуки)

Три правила з CLAUDE.md, які напряму стосуються доступу:

1. **`overrideAccess: false` разом з `user`.** Local API за замовчуванням **обходить** access control; передати `user` без `overrideAccess: false` означає «виконати від імені юзера, але з правами root»:

   ```ts
   await payload.find({ collection: 'posts', user: someUser, overrideAccess: false })
   ```

2. **Передавайте `req` у вкладені операції хуків** — інакше вкладений запис вилітає з транзакції батьківської операції й ламає атомарність:

   ```ts
   async ({ doc, req }) => {
     await req.payload.create({ collection: 'audit-log', data: { docId: doc.id }, req })
   }
   ```

3. **Context-прапорці проти циклів** — `update` усередині `afterChange` тієї ж колекції без guard'а зациклюється:

   ```ts
   async ({ doc, req, context }) => {
     if (context.skipHooks) return
     await req.payload.update({ ..., context: { skipHooks: true }, req })
   }
   ```

## Хто що може: зведена таблиця по колекціях

| Колекція | create | read | update | delete |
| --- | --- | --- | --- | --- |
| `pages`, `posts`, `courses` | admin | authenticatedOrPublished | admin | admin |
| `media`, `course-files`, `categories`, `course-categories` | admin | anyone | admin | admin |
| `users` | admin | *(дефолт: admin-or-self)* | *(дефолт: admin-or-self, self лише `name`)* | admin |
| `enrollments` | authenticated | adminOrOwn | **admin** | admin |
| `quiz-attempts` | **admin** | adminOrOwn | admin | admin |
| `xp-events` | admin | admin | admin | admin |
| `comments` | authenticated | anyone | admin | adminOrAuthor |
| `likes` | authenticated | anyone | **`() => false`** (ніхто) | adminOrOwn |
| Глобали `header`/`footer` | — | public | admin | — |

Ключові рішення: `enrollments.update` — admin-only, бо прогрес пишуть server actions через Local API (відкритий owner-update дозволив би підробити `completedSteps`/`quizPassed`); `quiz-attempts.create` — admin-only, бо оцінювання серверне (відкритий create = підроблені бали); `likes.update` заборонений усім — лайк або існує, або ні. Записи, що їх створює `authenticated`, захищені хуками: колекції примусово ставлять `user`/`author = req.user.id` для не-адмінів.

### Дві додаткові поверхні

- **MCP** (`@payloadcms/plugin-mcp`) — окремий шар дозволів поверх access: повний CRUD на posts/pages/categories/courses/course-categories/comments; media — find + update без create/delete; likes — find/create/delete без update. Автентифікація — ключі колекції `payload-mcp-api-keys`.
- **Глобал `home-calendar`** — задано лише `read: true`; `update` випадає в Payload-дефолт «будь-який автентифікований користувач». Відома шпарина конфігурації: технічно learner може оновити календар через API (див. [Глобали](/admin/docs/technical/model-danykh/hlobaly)).

### Вхід в адмін-панель

Роль впливає і на `/admin`: `adminRoles: ['admin']` у конфігу payload-auth — learner із валідною сесією в панель не потрапляє. Кнопка запрошення адміністраторів (`InviteUserButton`) генерує токен у `admin-invitations`, який на sign-up обходить OTP-гейт (див. [Реєстрація через OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp)).

## Пов'язане

- Схеми колекцій: [Огляд моделі даних](/admin/docs/technical/model-danykh/ohliad)
- Інтеграція payload-auth: [Better Auth: інтеграція](/admin/docs/technical/autentyfikatsiya/better-auth)
- Server actions як єдиний користувацький шлях запису: [Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu), [Коментарі та лайки: server actions](/admin/docs/technical/biznes-logika/komentari-laiky)
