---
title: Огляд архітектури
description: Стек технологій, структура src/ і потік даних — з чого складається платформа і як її частини звʼязані
---

## Стек

| Шар | Технологія | Версія |
| --- | --- | --- |
| Фреймворк | Next.js (App Router, React 19, Turbopack) | 15.4.11 |
| CMS / бекенд | Payload CMS | 3.87.0 |
| Інтеграція auth | `payload-auth` (Better Auth) | ^1.9.4 (better-auth ^1.4.19) |
| База даних | PostgreSQL (Neon serverless), `@payloadcms/db-postgres` (Drizzle) | — |
| Сховище файлів | Vercel Blob (`@payloadcms/storage-vercel-blob`) | — |
| Email | Resend (`@payloadcms/email-resend`) | — |
| UI | Tailwind CSS v4, Radix UI, Lucide | — |
| Пакетний менеджер | pnpm | — |
| Хостинг | Vercel, регіон `fra1` | — |

Next.js і Payload працюють в одному процесі: адмін-панель Payload — це звичайні
маршрути App Router у route group `(payload)`, а фронтенд викликає Payload через
Local API без жодного HTTP.

## Структура `src/`

```
src/
├── app/
│   ├── (frontend)/            # Публічний сайт
│   │   ├── [locale]/          # Усі сторінки: uk (без префікса) / en
│   │   ├── (sitemaps)/        # pages-sitemap.xml, posts-sitemap.xml
│   │   └── next/              # /next/preview, /next/exit-preview (draft mode)
│   ├── (payload)/             # Адмінка (/admin) + REST (/api/[...slug]) + GraphQL
│   └── api/                   # Власні API-маршрути: auth, dev-login,
│                              # reindex-search, courses/[id]/completions, admin-docs
├── collections/               # Конфіги колекцій Payload (13 проєктних)
├── Header/ Footer/ HomeCalendar/  # Глобали (конфіг + RowLabel + revalidate-хук)
├── components/                # React-компоненти (admin/ і фронтенд)
├── hooks/                     # Спільні Payload-хуки (rateLimitCreate,
│                              # syncCourseCompletions, revalidateCourse, …)
├── access/                    # Access-функції: admin, anyone, authenticated,
│                              # authenticatedOrPublished
├── actions/                   # Server actions: commentsAndLikes, xp, accountSettings
├── blocks/ heros/ fields/     # Блоки макета, hero-конфіг, defaultLexical, link
├── search/                    # beforeSync, fieldOverrides, localeSync (плагін)
├── plugins/                   # plugins/index.ts (порядок!), ukrainianAdmin
├── lib/                       # auth/, email/, rate-limit.ts, payload.ts, courses/
├── utilities/                 # courseCompletion, xp, leaderboard, certificateToken,
│                              # cyrillicSlugify, courseJsonImport, i18n, …
├── migrations/                # SQL-міграції для CI та production
├── middleware.ts              # Локалі + захист приватних маршрутів
└── payload.config.ts          # Головний конфіг Payload
```

Детальніше:

- Конфіг і плагіни — [payload.config.ts і плагіни](/admin/docs/technical/arkhitektura/payload-config)
- Маршрути й ISR — [Маршрути та middleware](/admin/docs/technical/arkhitektura/marshruty-i-middleware)
- Колекції — [Огляд моделі даних](/admin/docs/technical/model-danykh/ohliad)

## Потік даних

### Читання: RSC → Local API

Публічні сторінки — серверні компоненти (RSC), які читають дані напряму через
Local API:

```ts
const payload = await getPayload({ config })
const result = await payload.find({
  collection: 'courses',
  where: { _status: { equals: 'published' } },
  draft: false,
})
```

Жодного `fetch` до власного REST API з серверного коду немає — Local API працює
в тому ж процесі й транзакції. Більшість публічних сторінок при цьому
кешуються через ISR (`export const revalidate = 300/600`), тож запит до БД
виконується не на кожен перегляд.

:::warning Local API обходить access control
`payload.find()` без опцій виконується з правами адміністратора. Якщо
передаєте `user`, завжди додавайте `overrideAccess: false` — інакше запит
матиме права адміна, хоч і «від імені» користувача.
:::

### Мутації: клієнт → server actions → Local API

Увесь запис користувацького прогресу йде через server actions:

| Server action | Файл | Що робить |
| --- | --- | --- |
| `enrollInCourse`, `completeStep`, `submitQuizAttempt`, `getEnrollment`, `getQuizAttempts`, `getMyCourseStatuses` | `src/app/(frontend)/[locale]/courses/actions.ts` | Запис на курс, прогрес, оцінювання тесту |
| `addComment`, `deleteComment`, `toggleLike`, `getComments` | `src/actions/commentsAndLikes.ts` | Коментарі та лайки |
| `getMyXp` | `src/actions/xp.ts` | Сумарний XP користувача |
| `updateAvatar`, `removeAvatar`, `updateAbout`, `updateHideProfileComments`, `updateSocialLinks`, `setInitialPassword` | `src/actions/accountSettings.ts` | Налаштування профілю |

Server action сам перевіряє сесію (Better Auth), валідує вхід, застосовує rate
limit і лише потім пише через Local API.

### REST — лише для адмінки та зовнішніх клієнтів

REST (`/api/[...slug]` у route group `(payload)`) і GraphQL використовуються:

- адмін-панеллю Payload (вона працює тільки через REST);
- MCP-клієнтами (`@payloadcms/plugin-mcp` з ключами `payload-mcp-api-keys`);
- кастомними admin-компонентами (наприклад, `CourseDeleteConfirmation` рахує
  повʼязані записи через `/api/enrollments?...&limit=0`).

## Ключовий принцип: прогрес пишеться тільки server actions

Це — головне архітектурне рішення платформи, і на ньому тримається access
control кількох колекцій:

- `enrollments.update` — **тільки адмін**. Користувач не може через REST
  «домалювати» собі `completedSteps`, `status: 'completed'` чи `quizPassed` —
  саме з цих полів виводяться сертифікати та XP.
- `quiz-attempts.create` — **тільки адмін**. Оцінювання тесту відбувається на
  сервері у `submitQuizAttempt`; відкритий REST-create дозволив би підробляти
  результати.
- `xp-events` — усі 4 операції тільки адмін; записи створює сервер.

Server action виконує перевірки самостійно (сесія → власність enrollment →
належність кроку курсу) і пише через Local API, де адмінський дефолт доступу —
це фіча, а не діра: легітимний шлях запису один, і він серверний.

:::danger Не відкривайте update/create цих колекцій
Якщо колись здасться зручним дозволити власнику оновлювати свій enrollment
через REST — це відкриє підробку завершень курсів і сертифікатів. Правильний
шлях — новий server action з перевірками.
:::

Деталі бізнес-правил: [Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu),
[Квізи](/admin/docs/technical/biznes-logika/kvizy), [XP](/admin/docs/technical/biznes-logika/xp).

## Автентифікація

Better Auth (сесійні cookie, Google OAuth, email+OTP) інтегрований у Payload
плагіном `payload-auth`: колекція `users` — спільна для сайту й адмінки, ролі
`admin`/`learner` лежать у полі `users.role` (hasMany select). Вхід в адмінку
дозволено лише ролі `admin` (`adminRoles: ['admin']` у
`src/lib/auth/options.ts`).

Сесію на сервері читають хелпери `getSession` / `requireSession`
(`src/lib/auth/*`), а `src/middleware.ts` перекриває приватні маршрути ще до
рендера. Подробиці: [Better Auth](/admin/docs/technical/autentyfikatsiya/better-auth),
[Ролі і доступ](/admin/docs/technical/autentyfikatsiya/roli-i-dostup).

## Кешування та інвалідація

Три рівні:

1. **ISR** — сторінки з `export const revalidate` (300 с курси/головна/лідерборд,
   600 с пости).
2. **`unstable_cache` з тегами** — лідерборд, лічильники лайків/коментарів,
   глобали, redirects, документи по slug.
3. **Клієнтський кеш XP** — `sessionStorage` (`src/utilities/myXpCache.ts`, TTL 5 хв).

Хуки колекцій (`revalidateCourse`, `revalidatePage`, `revalidatePost`) і server
actions бустять шляхи й теги одразу після мутацій — повна таблиця тегів у
[Маршрути та middleware](/admin/docs/technical/arkhitektura/marshruty-i-middleware).

## База даних і міграції

Dev-сесії працюють через Drizzle push (`push: !process.env.CI`) на власній
Neon-гілці; CI та production застосовують файлові міграції з `src/migrations/`
(23 міграції станом на 2026-07). Кожна зміна схеми їде в PR разом із
міграцією. Деталі: [База даних](/admin/docs/technical/infrastruktura/baza-danykh)
і [Міграції](/admin/docs/technical/infrastruktura/mihratsii).
