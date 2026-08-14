---
title: Колекції плагінів
description: search, redirects, forms, MCP-ключі та службові payload-* колекції — що зберігають і як конфігуруються
---

Українські ярлики й описи всім цим колекціям проставляє плагін `ukrainianAdmin`
(останній у `src/plugins/index.ts`) — самі плагіни перекладу не підтримують.

## search

Створюється `searchPlugin` для чотирьох колекцій
(`searchIndexedCollections` у `src/search/localeSync.ts`): `posts`, `courses`,
`course-categories`, `pages`. Один документ джерела → один search-рядок,
який плагін створює/оновлює в afterChange (тільки published; чернетки
видаляються з індексу).

### Поля

Стандартні поля плагіна: `title`, `priority`, `doc` (поліморфний rel на
джерело). Кастомних `defaultPriorities` проєкт не задає — пріоритет
залишається дефолтним. Додаткові поля з `src/search/fieldOverrides.ts`
(усі readOnly в адмінці):

| Поле | Тип | Призначення |
| --- | --- | --- |
| `slug` | text, index | посилання на сторінку результату |
| `collectionType` | text, index | тип джерела (`posts`/`courses`/…) — фронтенд будує URL і бейдж |
| `meta` | group: `title`, `description`, `image` → media | превʼю результату |
| `categories` | array: `relationTo`, `categoryID`, `title` | категорії джерела |

### Наповнення

`beforeSync` (`src/search/beforeSync.ts`) мапить документ у ці поля:
courses → meta з title/description/heroImage + категорія через `findByID`
(`disableErrors`, select title; відсутня → `console.error` + порожній масив);
pages → `meta.title = meta?.title || title`; posts (default) — spread SEO-meta
+ категорії по одній.

**Проблема локалей** і її обхід (`backfillSearchTitleLocales` — бекфіл лише
`title`; `meta.*` і `categories` лишаються одномовними), read-side хак з
`fallbackLocale` + dedupe і реіндекс через `POST /api/reindex-search`
(`x-reindex-secret === CRON_SECRET`) — окрема стаття:
[Пошук і синхронізація](/admin/docs/technical/infrastruktura/poshuk-synkhronizatsiia).

## redirects

Створюється `redirectsPlugin({ collections: ['pages', 'posts'] })`.

| Поле | Опис |
| --- | --- |
| `from` | стара URL-адреса; override додає опис «Після зміни цього поля сайт потрібно перебудувати.» |
| `to.type` | `reference` \| `custom` |
| `to.reference` | rel → pages \| posts |
| `to.url` | власна адреса |

Хук afterChange `revalidateRedirects` (`src/hooks/revalidateRedirects.ts`) →
`revalidateTag('redirects')`; фронтенд читає всі редіректи через кешований
`getRedirects` і матчить **точним порівнянням рядків** `redirect.from === url`
у компоненті `PayloadRedirects` (без wildcard-ів). i18n-нюанс: namespace
`plugin-redirects` перекладений вручну в `payload.config.ts`, бо плагін не
має uk-рядків.

## forms / form-submissions

Створюються `formBuilderPlugin({ fields: { payment: false } })` — платіжні
поля вимкнені.

### forms

Конструктор форм: `title`, масив блоків `fields` (checkbox, country, email,
message, number, select, state, text, textarea — усі перекладені
`ukrainianAdmin` разом із пропсами name/label/required/width/…),
`submitButtonLabel`, `confirmationType` (message/redirect),
`confirmationMessage` (lexical з FixedToolbar + h1–h4 через override),
`redirect`, масив `emails`.

`emails` — листи після сабміту: emailTo/cc/bcc/replyTo/emailFrom/subject/
message з плейсхолдерами `{{fieldName}}`, `{{*}}` (усі дані) та `{{*:table}}`
(HTML-таблиця). Надсилання йде через `payload.sendEmail` — без Resend-ключа
лише консольний фолбек (див. [Email](/admin/docs/technical/infrastruktura/email)).

### form-submissions

Відповіді: `form` (rel → forms) + `submissionData` (пари field/value).
Створюються block-компонентом `formBlock` на сторінках.

## payload-mcp-api-keys

Створюється `mcpPlugin`. API-ключ = документ колекції: `user`, `label`,
`description`, сам ключ + пер-ключові тогли доступу (таби Tools / Resources /
Prompts, перекладені як Інструменти / Ресурси / Промпти).

Конфіг плагіна (`src/plugins/index.ts`) визначає стелю можливого:

| Колекція | Доступ MCP |
| --- | --- |
| `posts`, `pages`, `categories`, `courses`, `course-categories`, `comments` | повний CRUD (`enabled: true`) |
| `media` | `{find: true, create: false, update: true, delete: false}` — оновити alt/caption можна, залити чи видалити файл — ні |
| `likes` | `{find: true, create: true, update: false, delete: true}` — дзеркалить власний access колекції (update заборонений усім) |
| глобали `header`, `footer` | enabled |

Прогрес-колекції (`enrollments`, `quiz-attempts`, `xp-events`), `users` та
auth-колекції в MCP **не** експоновані — навмисно: MCP-клієнт (AI-інструмент)
може вести контент, але не може торкатися прогресу, сертифікатної підстави чи
акаунтів. Кожна експонована колекція має `description` у конфігу плагіна —
це підказка для LLM, оновлюйте її при зміні схеми.

### Життєвий цикл search-рядка

- publish документа → плагін створює/оновлює рядок (afterChange), потім
  `backfillSearchTitleLocales` дозаповнює title інших локалей;
- unpublish/чернетка → плагін видаляє рядок з індексу;
- delete джерела → рядок видаляється;
- ручне редагування search-рядків в адмінці можливе, але буде перетерте
  наступним збереженням джерела — колекція фактично derived-only.

## Auth-колекції payload-auth

`sessions`, `accounts`, `verifications`, `rateLimit`, `admin-invitations` —
детально в [users та auth-колекціях](/admin/docs/technical/model-danykh/users-i-auth).

## Службові payload-*

| Колекція | Призначення |
| --- | --- |
| `payload-kv` | key-value сховище ядра |
| `payload-jobs` | черга задач — сюди падають відкладені публікації `schedulePublish`; запуск гейтиться `jobs.access.run` (юзер або `Bearer CRON_SECRET`) |
| `payload-folders` | папки медіатеки (`folders: true` у media) |
| `payload-locked-documents` | блокування редагування; фактично порожня — усі проєктні колекції мають `lockDocuments: false` |
| `payload-preferences` | персональні налаштування адмін-UI (колонки, згорнуті секції) |
| `payload-migrations` | бухгалтерія застосованих міграцій. Обережно: на dev-гілках Drizzle push записує сюди `batch=-1`, через що `payload migrate` на такій БД зависає на інтерактивному промпті — **не запускайте міграції на dev-гілках** (див. [Міграції](/admin/docs/technical/infrastruktura/mihratsii)) |

Ці колекції не зʼявляються в навігації адмінки і не потребують супроводу —
але їхні таблиці існують у БД, тож памʼятайте про них при ручних SQL-операціях
і в дампах.
