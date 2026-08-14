---
title: "Better Auth: інтеграція"
description: payload-auth і getPayloadAuth, resolveBaseURL з його пастками, сесії з cookie-кешем, лінкування акаунтів, умовний Google і сесійні хелпери
---

## Стек

Автентифікація — `better-auth` (^1.4.19), інтегрована в Payload плагіном `payload-auth` (^1.9.4). Плагін першим у списку `src/plugins/index.ts` створює колекції `users` (розширена), `sessions`, `accounts`, `verifications`, `rateLimit`, `admin-invitations` (`hidePluginCollections: true`). Опції — `src/lib/auth/options.ts` (два експорти: `betterAuthOptions` для самого Better Auth і `betterAuthPluginOptions` для плагіна). App Router-обробник — `/api/auth/[...all]`.

## `getPayloadAuth`: використовуйте його, не bare `getPayload`

`src/lib/payload.ts`:

```ts
import configPromise from '@payload-config'
import { getPayloadAuth } from 'payload-auth/better-auth'
import type { ConstructedBetterAuthPluginOptions } from './auth/options'

export const getPayload = () =>
  getPayloadAuth<ConstructedBetterAuthPluginOptions>(configPromise)
```

`getPayloadAuth` повертає інстанс Payload, збагачений типізованим `payload.betterAuth` (API: `getSession`, `signInEmail`, `signUpEmail`, `updateUser`, `setPassword`, `createVerificationOTP`...). Bare `getPayload({ config })` з пакета `payload` цього поля в типах не має — тож у будь-якому коді, якому потрібен `payload.betterAuth`, імпортуйте `getPayload` саме з `@/lib/payload`. (Частина суто контентного коду використовує bare-варіант — це ок, поки auth API не потрібен.)

## `resolveBaseURL`: 5 рівнів пріоритету

```ts
function resolveBaseURL(): string {
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) return process.env.NEXT_PUBLIC_BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_ENV === 'production')
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'http://localhost:3000'
}
```

| # | Джерело | Умова | Типове оточення |
| --- | --- | --- | --- |
| 1 | `NEXT_PUBLIC_BETTER_AUTH_URL` | задано | явний override |
| 2 | `https://VERCEL_PROJECT_PRODUCTION_URL` | лише `VERCEL_ENV === 'production'` | прод (щоб превʼю не підписували куки прод-доменом) |
| 3 | `https://VERCEL_URL` | задано | превʼю-деплої (унікальний URL) |
| 4 | `https://VERCEL_PROJECT_PRODUCTION_URL` | без умови | залишковий fallback |
| 5 | `http://localhost:3000` | — | локальна розробка |

:::warning Пастка домену
`VERCEL_PROJECT_PRODUCTION_URL` — це **найкоротший** прод-домен проєкту у Vercel. Під час міграції домену (старий + новий підключені одночасно) «найкоротшим» може виявитися старий — і auth baseURL мовчки лишиться на ньому. Ліки: виставити `NEXT_PUBLIC_BETTER_AUTH_URL` **лише для production-оточення** у Vercel; якщо задати її для всіх оточень — зламаються превʼю (кука підписана не тим origin).
:::

**`trustedOrigins`** — будується як `Set` (дедуплікація, бо кілька джерел можуть збігатися):

```ts
const trustedOrigins = new Set([baseURL])
if (process.env.VERCEL_URL) trustedOrigins.add(`https://${process.env.VERCEL_URL}`)
if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
  trustedOrigins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL)
  trustedOrigins.add(process.env.NEXT_PUBLIC_BETTER_AUTH_URL)
```

Запити з інших origin Better Auth відкидає — саме тому дев-сервер на нестандартному порті ламає форму логіну та Google OAuth (локально origin буде `localhost:3001`, а в списку — лише `localhost:3000`); обхід — `GET /api/dev-login`, який логінить server-side (див. [Dev-login та сідінг](/admin/docs/technical/autentyfikatsiya/dev-login-i-sid)).

## Сесії

```ts
session: {
  expiresIn: 60 * 60 * 24 * 7,   // 7 днів
  updateAge: 60 * 60 * 24,       // rolling: продовжується раз на добу активності
  cookieCache: { enabled: true, maxAge: 5 * 60 },  // 5 хв
}
```

`cookieCache` кладе знімок user+session прямо в підписану куку: `getSession` протягом 5 хв не ходить у БД.

:::warning Stale cookie cache
Після **server-side** оновлення користувача (наприклад, `payload.update` на `users`, як робить `removeAvatar`) кука ще до 5 хв віддає старі дані — ім'я, аватар, ролі. Шляхи, де це критично, мають примусово освіжити сесію з клієнта (так робить клієнт після `removeAvatar` — див. [Аватари та налаштування профілю](/admin/docs/technical/autentyfikatsiya/avatary-i-profil)). Оновлення через `betterAuth.api.updateUser` перевипускає куку саме тому.
:::

## Акаунти, Google, плагіни

- **Email + пароль**: `enabled: true`, `requireEmailVerification: false` — верифікацію замінює власний OTP-гейт у `databaseHooks.user.create.before` (розібраний у [Реєстрація через OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp)).
- **Account linking**: `enabled: true`, `trustedProviders: ['google', 'email-password']` — вхід через Google з email'ом існуючого акаунта лінкується, а не плодить дубль.
- **Google OAuth** — умовний двічі: провайдер конфігурується лише коли задані `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`; а кнопка в UI показується **лише в production** (`googleEnabled = id && isProduction`) — у дев-оточеннях redirect URI все одно не збігся б.
- **`nextCookies()`** — обов'язково **останній** плагін у списку: перехоплює `Set-Cookie` з server actions і роутів Next.
- **`emailOTP`** — конфіг там само (6 цифр, 300 с, 3 спроби); деталі у статті про реєстрацію.
- **Rate limit**: `enabled: isRateLimitEnabled()`, `window: 60, max: 60`, `storage: 'database'` + customRules per-path — повна таблиця в [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting).
- `appName: 'Залізна Зміна'`.

## Сесійні хелпери

`getSession` (`src/lib/auth/getSession.ts`) — канонічний спосіб читати сесію на сервері:

```ts
import { cache } from 'react'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const getSession = cache(async () => {
  const payload = await getPayload()
  return payload.betterAuth.api.getSession({ headers: await headers() })
})
```

`cache()` з React дедуплікує: скільки б компонентів у дереві не викликали `getSession()` — один реальний виклик на request.

`safeRedirectPath` (`src/utilities/safeRedirect.ts`) — обов'язковий фільтр для будь-якого `?redirect=` з URL:

```ts
if (!value.startsWith('/') || value.startsWith('//') || /[\\]|:\/\//.test(value)) {
  return fallback
}
```

| Хелпер | Файл | Поведінка |
| --- | --- | --- |
| `getSession()` | `src/lib/auth/getSession.ts` | кешований виклик `betterAuth.api.getSession` (див. вище) |
| `requireSession(locale, currentPath)` | `src/lib/auth/requireSession.ts` | немає сесії → `redirect('/login?redirect=<encodeURIComponent(path)>')` з локальним префіксом |
| `getMeUser()` | `src/utilities/getMeUser.ts` | сесія + повний користувацький документ |
| `safeRedirectPath(value, fallback)` | `src/utilities/safeRedirect.ts` | приймає лише same-site відносні шляхи: відкидає абсолютні URL, `//host`, бекслеші та `://` |

:::danger Не викликайте getSession у публічних ISR-сторінках
Інваріант перформансу платформи: компоненти публічних сторінок не читають сесію (це зробило б їх динамічними і вбило ISR). Прогрес юзера на каталозі тягнеться клієнтськи (`useMyCourseStatuses`). Див. [Огляд архітектури](/admin/docs/technical/arkhitektura/ohliad).
:::

## Де в коді використовується `payload.betterAuth.api`

| Метод | Викликач | Навіщо |
| --- | --- | --- |
| `getSession` | `getSession()` хелпер | читання сесії скрізь |
| `signInEmail` | `/api/dev-login`, сід-скрипт | програмний вхід |
| `signUpEmail` | сід-скрипт | створення dev-адміна через штатний потік |
| `createVerificationOTP` | `/api/auth/verify-registration` | код для ще-не-існуючого юзера |
| `updateUser` | `updateAvatar` | запис + перевипуск session-куки |
| `setPassword` | `setInitialPassword` | перший пароль для Google-акаунта |

Це і є практична відповідь, навіщо `getPayloadAuth` замість bare `getPayload`.

## Пов'язане

- Реєстрація і OTP-гейт: [Реєстрація через OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp)
- Ролі, `collectionOverrides` і access: [Ролі та контроль доступу](/admin/docs/technical/autentyfikatsiya/roli-i-dostup)
- Схема users/sessions/accounts/verifications: [users та auth-колекції](/admin/docs/technical/model-danykh/users-i-auth)
- Листи (Resend, OTP, інвайти): [Email — Resend](/admin/docs/technical/infrastruktura/email)
