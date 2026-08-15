---
title: users та auth-колекції
description: Гібридна колекція users (проєктні + плагінні поля), критичне рішення щодо access і призначення пʼяти колекцій payload-auth
---

## users

Файл: `src/collections/Users/index.ts`. Це auth-колекція: проєктний конфіг
задає профільні поля й каскади, а плагін `payload-auth` (перший у
`src/plugins/index.ts`) домішує auth-поля, ендпоінти та дефолти доступу.
Ярлики «Користувач»/«Користувачі», `useAsTitle: 'name'`, колонки
`[name, email]`, група «Автентифікація» (проставляє `ukrainianAdmin`),
`lockDocuments: false`.

### Проєктні поля

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `about` | textarea | maxLength **500**, «Про мене» |
| `hideProfileComments` | checkbox | default `false` — ховає коментарі в публічному профілі |
| `socialLinks` | array | maxRows **8**; рядок: `platform` select (required: instagram, facebook, telegram, youtube, tiktok, linkedin, x, website) + `url` text (required) |

Редагуються вони через server actions `updateAbout`,
`updateHideProfileComments`, `updateSocialLinks`
(`src/actions/accountSettings.ts`) — не через REST.

### Плагінні поля

| Поле | Тип | Нюанси |
| --- | --- | --- |
| `name` | text | required |
| `email` | text | required, unique |
| `emailVerified` | boolean | ставиться OTP-гейтом реєстрації |
| `image` | **text (URL-рядок!)** | не upload-relationship: снапшот URL з Blob CDN або googleusercontent. Історичний нюанс: снапшоти зроблені до PR#67 вказували на `/api/media/file/...` і 404-лять після `disablePayloadAccessControl` |
| `role` | select **hasMany** | `['admin' \| 'learner']`; дефолт перешейплений у масив `['learner']` через `collectionOverrides` (Drizzle мовчки дропає нон-array дефолт hasMany-select — без фікса юзери створювались із порожньою роллю; бекфіл: міграція `20260729_100000_backfill_user_roles`) |
| `account`, `session` | join | звʼязки на accounts/sessions |

### КРИТИЧНО: read/update навмисно НЕ задані

```ts
access: {
  admin: admin,
  create: admin,
  delete: admin,
  // read/update are intentionally NOT set. payload-auth spreads this object
  // over its own defaults …
},
```

payload-auth **розгортає проєктний access поверх власних дефолтів**. Його
дефолти для `read`/`update` — admin-or-self, причому self-update не-адміна
обмежений `allowedFields: ['name']` (`src/lib/auth/options.ts`). Якщо задати
тут власний `update` (навіть «еквівалентний» admin-or-self), обмеження
`allowedFields` буде втрачено — і користувач зможе через
`PATCH /api/users/:id` дописати собі `role: ['admin']`. Це вже було знайдено
і виправлено в аудиті; **не додавайте read/update у цю колекцію.**

Ролі й перевірки доступу загалом —
[Ролі і доступ](/admin/docs/technical/autentyfikatsiya/roli-i-dostup).

### beforeDelete: каскад на 5 колекцій

Таблиці прогресу оголошують `user_id`/`author_id` **NOT NULL**, а FK —
`ON DELETE SET NULL`, тож без ручного зачищення delete користувача падає на
рівні БД. Хук видаляє (усе з `req`, одна транзакція):

1. `xp-events` (`user = id`)
2. `quiz-attempts` (`user = id`)
3. `enrollments` (`user = id`)
4. `likes` (`user = id`)
5. `comments` (`author = id`)

Разом із користувачем зникає весь його прогрес, сертифікатна підстава і внесок
у лідерборди.

### Кастомний компонент

`admin.components.Description` колекції підмінено (через `ukrainianAdmin`) на
`@/components/admin/InviteUserButton` — кнопка запрошення з українськими
ролями. Див. [Кастомізації адмін-панелі](/admin/docs/technical/arkhitektura/admin-kastomizatsii).

## Auth-колекції payload-auth

Усі створює `betterAuthPlugin` (`hidePluginCollections: true` — але вони
видимі в групі «Автентифікація» з перекладами від `ukrainianAdmin`).

### sessions

Активні сесії користувачів. Поля: `user`, `token` (унікальний токен сесії),
`expiresAt`, `ipAddress`, `userAgent`, `impersonatedBy`. Параметри життя
сесії — в `src/lib/auth/options.ts`: `expiresIn` 7 днів, rolling `updateAge`
1 день, cookie cache 5 хв (через нього server-side оновлення користувача
стають видимі з запізненням — див.
[Better Auth](/admin/docs/technical/autentyfikatsiya/better-auth)).

### accounts

Облікові записи у провайдерів: для email+пароль — рядок `providerId:
'credential'` з полем `password` (хеш); для Google — токени OAuth
(`accessToken`, `refreshToken`, `idToken`, `scope`). Один користувач може мати
кілька акаунтів (trustedProviders: google, email-password — автолінкування).
Наявність credential-акаунта — умова відмови `setInitialPassword`
(`HAS_PASSWORD`).

### verifications

Верифікаційні записи: OTP підтвердження email
(identifier `email-verification-otp-<email>`, value `"otp:attempts"`),
скидання пароля тощо. OTP: 6 цифр, TTL 300 с, до 3 спроб — увесь флоу в
[Реєстрація і OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp).

### rateLimit

Таблиця fixed-window лічильників. Її ділять **два** споживачі: вбудований rate
limit Better Auth для `/api/auth/*` (window 60 с, max 60, per-path
перевизначення) і власний `src/lib/rate-limit.ts` (атомарний
`INSERT ... ON CONFLICT DO UPDATE`) для enroll/comment/like/quiz/OTP-лімітів.
Таблиця створена міграцією `20260724_190000`. Повна таблиця лімітів —
[Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting).

### admin-invitations

Токени запрошень: `role`, `token`, `url`. Створюються кнопкою InviteUserButton
(ендпоінти `generate-invite-url` / `send-invite` на users). Валідний токен у
`databaseHooks.user.create.before` пропускає реєстрацію повз OTP-гейт і
одразу ставить роль із запрошення. Лист шле `sendInviteEmail` через
`payload.sendEmail` (HTML — `src/lib/email/admin-invite.ts`).

## Звідки береться доступ до адмінки

Ключові опції users у `src/lib/auth/options.ts`:

```ts
users: {
  slug: 'users',
  adminRoles: ['admin'],
  defaultRole: 'learner',
  defaultAdminRole: 'admin',
  roles: ['learner', 'admin'],
  allowedFields: ['name'],
  collectionOverrides: /* дефолт ролі → ['learner'] */,
},
```

`adminRoles: ['admin']` — тільки користувачі з `admin` у `role` проходять в
`/admin` (перевіряє і `access.admin: admin` колекції). `defaultAdminRole`
застосовується при створенні першого адміністратора. Учасники (`learner`) на
`/admin` не потрапляють, але це не скасовує їхніх REST-прав у інших
колекціях — памʼятайте, що `authenticatedOrPublished` показує залогіненим і
чернетки контенту.

Серверні хелпери сесії (`src/lib/auth/*`): `getSession` (React `cache` поверх
`betterAuth.api.getSession`), `requireSession` (redirect на
`/login?redirect=…`), `getMeUser`. У server actions завжди починайте з
перевірки сесії — middleware покриває не всі маршрути.
