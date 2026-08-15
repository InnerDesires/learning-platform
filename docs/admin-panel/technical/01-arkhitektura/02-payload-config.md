---
title: payload.config.ts і плагіни
description: Розбір головного конфігу Payload — БД, локалізація, email, jobs — і десяти плагінів, порядок яких критичний
---

Головний конфіг — `src/payload.config.ts`. Він збирає 13 колекцій, 3 глобали,
масив плагінів із `src/plugins/index.ts` і налаштування, описані нижче.

## Секції конфігу

### db: Postgres + push

```ts
db: postgresAdapter({
  pool: {
    connectionString: normalizeDatabaseURL(process.env.DATABASE_URL || ''),
  },
  push: !process.env.CI,
}),
```

- `push: !process.env.CI` — на dev-сервері Drizzle сам синхронізує схему при
  старті; в CI та production схему змінюють лише файлові міграції
  (див. [Міграції](/admin/docs/technical/infrastruktura/mihratsii)).
- `normalizeDatabaseURL` замінює `sslmode=prefer|require|verify-ca` на
  `verify-full`: `pg-connection-string` сьогодні трактує їх як аліаси
  `verify-full`, але попереджає, що pg v9 це змінить — тож значення зафіксовано
  явно. Neon віддає публічно довірений сертифікат, тому `verify-full` працює.
- Перед `buildConfig` конфіг логує hostname із `DATABASE_URL` — швидка перевірка,
  на яку Neon-гілку дивиться сервер.

### localization: контент uk + en

```ts
localization: {
  locales: [
    { label: { uk: 'Українська', en: 'Ukrainian' }, code: 'uk' },
    { label: { uk: 'Англійська', en: 'English' }, code: 'en' },
  ],
  defaultLocale: 'uk',
  fallback: true,
},
```

`fallback: true` — порожнє en-значення на фронтенді підставляється з uk.
Зворотного фолбека немає: документ, збережений лише в en, для uk-запитів
порожній (це корінь проблеми з пошуком, див.
[Пошук і синхронізація](/admin/docs/technical/infrastruktura/poshuk-synkhronizatsiia)).

### i18n: адмінка лише українською

```ts
i18n: {
  fallbackLanguage: 'uk',
  supportedLanguages: { uk },
  translations: { uk: { /* … */ } },
},
```

`supportedLanguages` містить **тільки** `uk` — навмисно. Якщо додати `en`,
Payload ≥3.79 матчить регіональні `Accept-Language` теги (`en-US` → `en`), і
кожен браузер з англійською локаллю отримує англійську адмінку. Кастомні
переклади поверх стандартних:

- `general.creatingNewLabel`, `general.payloadSettings`;
- увесь namespace `plugin-redirects` — плагін redirects не має uk-перекладів,
  і з `fallbackLanguage: 'uk'` без цих рядків в UI протікали сирі ключі
  `plugin-redirects:*`.

### editor: defaultLexical

`editor: defaultLexical` (`src/fields/defaultLexical.ts`) — базовий набір для
всіх richText-полів без власного editor: Paragraph, Bold/Italic/Underline/
Strikethrough, Align, Indent, списки, Blockquote, HR, Upload, обидва тулбари та
`LinkFeature({ enabledCollections: ['pages', 'posts'] })`. Колекції з
розширеними потребами (контент постів, caption медіа) задають власний
`lexicalEditor` поверх.

### email: Resend, умовно

```ts
email: process.env.RESEND_API_KEY
  ? resendAdapter({
      defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      defaultFromName: 'Learning Platform',
      apiKey: process.env.RESEND_API_KEY,
    })
  : undefined,
```

Без `RESEND_API_KEY` адаптер не підключається: `payload.sendEmail` падає у
консольний фолбек — зручно локально, але кнопка «Надіслати запрошення» в
адмінці реального листа не відправить. Перелік усіх листів —
[Email](/admin/docs/technical/infrastruktura/email).

### jobs: доступ через CRON_SECRET

```ts
jobs: {
  access: {
    run: ({ req }) => {
      if (req.user) return true
      const secret = process.env.CRON_SECRET
      if (!secret) return false
      return req.headers.get('authorization') === `Bearer ${secret}`
    },
  },
  tasks: [],
},
```

Черга задач (використовується `schedulePublish` для відкладених публікацій)
запускається або залогіненим користувачем, або зовнішнім кроном з
`Authorization: Bearer $CRON_SECRET`. Власних `tasks` немає.

### cors, serverURL, secret

- `serverURL: getServerSideURL()` (`src/utilities/getURL.ts`);
- `cors`: `getServerSideURL()` + `https://${VERCEL_URL}` (порожні відкидаються);
- `secret: process.env.PAYLOAD_SECRET` — ним же підписуються сертифікатні
  токени (`src/utilities/certificateToken.ts`);
- `sharp` — обробка зображень; `typescript.outputFile` → `src/payload-types.ts`
  (регенерація: `pnpm generate:types`).

Секція `admin` (компоненти, meta, livePreview) розібрана окремо в
[Кастомізаціях адмін-панелі](/admin/docs/technical/arkhitektura/admin-kastomizatsii).

## Плагіни: порядок критичний

`src/plugins/index.ts` експортує масив із 10 плагінів. Payload застосовує їх
послідовно, кожен мутує конфіг, тому позиція має значення: **betterAuth
першим** (створює `users`, на якого посилаються інші), **searchLocaleSync
одразу після searchPlugin** (його хук має бігти після синка плагіна),
**ukrainianAdmin останнім** (перекладає ярлики колекцій, які створили всі
попередні).

### 1. betterAuthPlugin

`payload-auth/better-auth`, опції — `src/lib/auth/options.ts`.
`hidePluginCollections: true`. Розширює `users` (поля `name`, `email`,
`emailVerified`, `image`, `role`) і створює колекції `sessions`, `accounts`,
`verifications`, `rateLimit`, `admin-invitations`. Ключові опції:
`adminRoles: ['admin']`, `allowedFields: ['name']`,
`collectionOverrides` перетворює дефолт ролі на масив `['learner']` (інакше
Drizzle мовчки дропав нон-array дефолт hasMany-select і юзери лишалися без
ролі). `adminInvitations.sendInviteEmail` шле лист через `payload.sendEmail`.
Мусить бути першим — усі relationship на `users` та access-функції залежать від
готової auth-колекції.

### 2. vercelBlobStorage (умовний)

Підключається лише коли задано `BLOB_READ_WRITE_TOKEN`, інакше файли пишуться
на локальний диск. Обслуговує `media` і `course-files`, обидві з
`disablePayloadAccessControl: true` — це безпечно лише тому, що обидві колекції
мають `read: anyone`; віддача йде прямо з Blob CDN без serverless-виклику.
Див. [Медіа і Blob](/admin/docs/technical/infrastruktura/media-blob).

### 3. mcpPlugin

Створює auth-колекцію `payload-mcp-api-keys` і виставляє колекції для
MCP-клієнтів: `posts`/`pages`/`categories`/`courses`/`course-categories`/
`comments` — повний CRUD; `media` — `{find, update}` без create/delete;
`likes` — `{find, create, delete}` без update; глобали `header`/`footer`.
Деталі — [Колекції плагінів](/admin/docs/technical/model-danykh/plahinni-kolektsii).

### 4. redirectsPlugin

Для `pages` і `posts`. Override поля `from` додає опис «Після зміни цього поля
сайт потрібно перебудувати.», afterChange-хук `revalidateRedirects`
(`src/hooks/revalidateRedirects.ts`) бустить тег `redirects`.

### 5. nestedDocsPlugin

**Лише** `collections: ['categories']` — додає їм `parent` і `breadcrumbs`.
Сторінки (`pages`) пласкі, одно-сегментні URL; вкладеності `/parent/child`
немає, це поширена помилка.

### 6. seoPlugin

`generateTitle` → `«{title} | Залізна Зміна»`, `generateURL` →
`${serverURL}/${slug}`. Поля плагіна не додаються автоматично — вони вручну
розкладені по SEO-табах у Pages/Posts (`MetaTitleField`, `MetaImageField`,
`MetaDescriptionField`, `OverviewField`, `PreviewField`).

### 7. formBuilderPlugin

`fields: { payment: false }`. Override `confirmationMessage` дає йому lexical з
`FixedToolbarFeature` + заголовками h1–h4. Створює `forms` і
`form-submissions`.

### 8. searchPlugin

```ts
searchPlugin({
  collections: searchIndexedCollections, // posts, courses, course-categories, pages
  beforeSync: beforeSyncWithSearch,      // src/search/beforeSync.ts
  searchOverrides: { fields: ({ defaultFields }) => [...defaultFields, ...searchFields] },
}),
```

Створює колекцію `search`; `searchFields` (`src/search/fieldOverrides.ts`)
додають `slug`, `collectionType`, групу `meta`, масив `categories`.

### 9. searchLocaleSync

Кастомний плагін `src/search/localeSync.ts`. Додає хук
`backfillSearchTitleLocales` у `afterChange` чотирьох індексованих колекцій:
plugin-search пише локалізовані поля лише для `req.locale`, і документ,
збережений з en-локалі адмінки, був би невидимим для uk-пошуку. Плагін
дописує `title` для решти локалей. **Мусить стояти одразу після
searchPlugin** — хук зареєструється після синк-хука плагіна і побачить уже
створений search-рядок.

### 10. ukrainianAdmin

`src/plugins/ukrainianAdmin.ts`, **завжди останній**. Сторонні плагіни
(payload-auth, form-builder, search, MCP) хардкодять англійські ярлики без
API перекладу, тож цей плагін проходить фінальний конфіг і переписує labels,
descriptions, groups та options перелічених колекцій (redirects, forms з усіма
блоками полів, form-submissions, search, users, sessions, accounts,
verifications, admin-invitations, payload-mcp-api-keys), перекладає MCP-таби
(Tools/Resources/Prompts) і підміняє компонент кнопки запрошення на
`@/components/admin/InviteUserButton`. Якщо поставити його не останнім,
колекції зареєстровані пізнішими плагінами лишаться англійськими.

## Що створює кожен плагін

| Плагін | Колекції/поля |
| --- | --- |
| betterAuthPlugin | `users` (розширення), `sessions`, `accounts`, `verifications`, `rateLimit`, `admin-invitations` |
| vercelBlobStorage | — (стораджі для `media`, `course-files`) |
| mcpPlugin | `payload-mcp-api-keys` |
| redirectsPlugin | `redirects` |
| nestedDocsPlugin | поля `parent`/`breadcrumbs` у `categories` |
| seoPlugin | поля meta (розкладені вручну) |
| formBuilderPlugin | `forms`, `form-submissions` |
| searchPlugin | `search` |
| searchLocaleSync | хук `backfillSearchTitleLocales` |
| ukrainianAdmin | — (лише переклади) |

Плюс службові колекції самого Payload: `payload-kv`, `payload-jobs`,
`payload-folders`, `payload-locked-documents`, `payload-preferences`,
`payload-migrations`.
