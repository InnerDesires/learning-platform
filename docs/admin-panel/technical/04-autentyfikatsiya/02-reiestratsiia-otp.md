---
title: Реєстрація через OTP
description: Власний OTP-гейт замість requireEmailVerification — verify-registration роут, in-memory pre-verified список, databaseHooks-гейт створення юзера і його відома вада
---

## Чому не `requireEmailVerification: true`

Better Auth вміє нативну email-верифікацію, але вона працює за схемою «створити юзера → надіслати лінк → чекати кліку»: у БД з'являються неверифіковані акаунти, а UX побудований на magic-link. Платформа хоче навпаки: **спершу** підтвердити email 6-значним кодом, і лише **потім** дозволити створення користувача. Тому `requireEmailVerification: false`, а гейтом слугує зв'язка: кастомний роут `/api/auth/verify-registration` + in-memory список pre-verified + `databaseHooks.user.create.before`, який відхиляє sign-up без підтвердження.

Потік цілком:

1. Форма реєстрації → `POST /api/auth/verify-registration` `{ action: 'send-otp', email }` — лист з кодом.
2. Юзер вводить код → той самий роут `{ action: 'verify-otp', email, otp }` — email позначається pre-verified.
3. Форма викликає звичайний `signUp.email` Better Auth (`/api/auth/sign-up/email`).
4. `databaseHooks.user.create.before` знаходить pre-verified позначку, споживає її і пропускає створення вже з `emailVerified: true`.

## Роут: `POST /api/auth/verify-registration`

`src/app/api/auth/verify-registration/route.ts`; дії розрізняються полем `action` у body.

### `action: 'send-otp'`

1. Email нормалізується (`toLowerCase().trim()`) і валідується regex'ом → інакше 400.
2. **Ліміти ДО будь-якої роботи** — кожен виклик шле реальний лист через Resend:
   - per-IP `otp-send:ip:<ip>` — 20/600 с (щедро: шкільні класи сидять за одним NAT); якщо `getClientIp` повернув `null` — IP-перевірка пропускається;
   - per-email `otp-send:email:<email>` — **3/300 с** (суворий: рівно стільки надсилань, скільки живе один OTP; зупиняє бомбардування чужої скриньки).
   - Перевищення → 429 + заголовок `Retry-After`.
3. **Існуючий користувач → 409** `Email already taken` (реєстрація, не логін).
4. Код створюється **внутрішнім** `payload.betterAuth.api.createVerificationOTP({ body: { email, type: 'email-verification' } })` — на відміну від публічного send-ендпоінта він не перевіряє існування юзера (юзера ще нема!).
5. Лист — напряму `new Resend(...)` (не через `payload.sendEmail`), subject `Код підтвердження: <otp>`, HTML з `src/lib/email/verification-otp.ts`. Без `RESEND_API_KEY` лист не шлеться (dev: код можна дістати з таблиці `verifications`).

### `action: 'verify-otp'`

1. Ліміти: `otp-verify:ip:<ip>` 30/600 с, `otp-verify:email:<email>` 10/600 с. Це критично: вбудований кап «3 спроби» живе **в записі** verification і скидається кожним новим OTP — сам по собі він дозволяє необмежений перебір через цикл «замовив код → 3 спроби → замовив новий». Зовнішні вікна обмежують сумарний темп вгадування.
2. Запис шукається по `identifier = email-verification-otp-<email>` у колекції `verifications`; нема → 400 `Invalid OTP`.
3. **Expiry**: `expiresAt` у минулому → запис видаляється + 400 `OTP expired` (життя коду — 5 хв, з конфігу `emailOTP`).
4. **Формат value — `"otp:attempts"`**, і split робиться по **останньому** `:` (`value.lastIndexOf(':')`) — сам OTP числовий, але формат не має права зламатися, якби він містив двокрапку.
5. `attempts >= 3` → запис видаляється + 403 `Too many attempts` (рядок, який форма реєстрації вже перекладає).
6. Неспівпадіння → `attempts + 1` пишеться назад + 400 `Invalid OTP`.
7. Збіг → `markPreVerified(email)`, запис видаляється, відповідь `{ verified: true }`.

Ключовий фрагмент лічильника спроб:

```ts
const value = record.value as string          // "otp:attempts"
const lastColon = value.lastIndexOf(':')
const storedOtp = value.substring(0, lastColon)
const attempts = parseInt(value.substring(lastColon + 1), 10)

if (attempts >= 3) { /* delete + 403 */ }
if (storedOtp !== otp) {
  await payload.update({ collection: 'verifications', id: record.id,
    data: { value: `${storedOtp}:${attempts + 1}` } })
  return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
}
```

### Зведення відповідей роуту

| Дія | Умова | Статус, body |
| --- | --- | --- |
| будь-яка | невідомий `action` | 400 `Invalid action` |
| send-otp | невалідний email | 400 `Invalid email` |
| send-otp | перевищено ip/email ліміт | 429 + `Retry-After` |
| send-otp | юзер існує | 409 `Email already taken` |
| send-otp | успіх | 200 `{ success: true }` |
| verify-otp | немає email/otp | 400 `Email and OTP required` |
| verify-otp | ліміти | 429 `Too many attempts` + `Retry-After` |
| verify-otp | запису немає / код не збігся | 400 `Invalid OTP` |
| verify-otp | протух | 400 `OTP expired` |
| verify-otp | ≥3 спроби | 403 `Too many attempts` |
| verify-otp | успіх | 200 `{ verified: true }` |

## Pre-verified: in-memory Map на `globalThis`

`src/lib/auth/pre-verified.ts`:

```ts
const globalStore = globalThis as unknown as { __preVerifiedEmails?: Map<string, number> }

export function markPreVerified(email: string): void {
  store.set(email.toLowerCase(), Date.now() + 10 * 60 * 1000)
}

export function consumePreVerified(email: string): boolean {
  const expiry = store.get(email.toLowerCase())
  if (!expiry || expiry < Date.now()) { store.delete(key); return false }
  store.delete(key)
  return true
}
```

- TTL **10 хв** — юзер має завершити sign-up за 10 хв після коду.
- **Single-use**: `consumePreVerified` видаляє запис і при успіху, і при протуханні.
- На `globalThis`, щоб пережити HMR-перезавантаження в dev.

:::danger Відома вада: не шариться між лямбдами
Map живе в пам'яті **одного** процесу. На Vercel `verify-otp` і подальший `sign-up` можуть приземлитися в різні serverless-інстанси — тоді `consumePreVerified` поверне `false` і реєстрацію буде відхилено, попри валідний код. Це прийнятий компроміс (трафік малий, обидва запити йдуть підряд і зазвичай гріють один інстанс); правильний фікс — тримати позначку в БД (наприклад, у `verifications`). Якщо користувачі скаржаться «код прийнято, а реєстрація падає» — це воно.
:::

## Гейт створення: `databaseHooks.user.create.before`

У `src/lib/auth/options.ts` — останній рубіж, через який проходить **будь-яке** створення юзера Better Auth'ом:

```ts
before: async (user, ctx) => {
  if (user.emailVerified) return                    // 1. вже верифікований (Google OAuth)
  const inviteToken = /* 2. чотири джерела */
    ctx?.headers?.get('x-admin-invite-token') ??
    ctx?.query?.adminInviteToken ??
    ctx?.body?.adminInviteToken ??
    ctx?.body?.additionalData?.adminInviteToken
  if (валідний inviteToken існує в admin-invitations) return   // інвайт замість OTP
  if (!consumePreVerified(user.email)) return false // 3. відхилити реєстрацію
  return { data: { ...user, emailVerified: true } } // 4. пропустити і позначити
}
```

1. `emailVerified` вже `true` (Google дає верифікований email) — пропуск.
2. **Admin-invite** (`/admin/signup?token=…`) не проходить публічний OTP-потік — валідний токен з колекції `admin-invitations` авторизує створення. Чотири джерела токена дзеркалять власний invite-middleware payload-auth (header, query, body, `body.additionalData`).
3. Інакше — `consumePreVerified(email)`; фейл → `return false` — Better Auth **відхиляє** створення користувача.
4. Успіх → юзер створюється одразу з `emailVerified: true`.

## Конфіг плагіна `emailOTP`

```ts
emailOTP({
  otpLength: 6,
  expiresIn: 300,        // 5 хв
  allowedAttempts: 3,
  sendVerificationOnSignUp: false,   // наш потік шле код ДО sign-up
  async sendVerificationOTP({ email, otp, type }) {
    if (type !== 'email-verification' && type !== 'forget-password') return
    if (!process.env.RESEND_API_KEY) return   // no-op без ключа
    // Resend: subject «Код підтвердження: …» або «Код для скидання пароля: …»
  },
})
```

## Forgot password

Скидання пароля йде **стандартними** ендпоінтами плагіна emailOTP (`/forget-password/email-otp` → лист «Код для скидання пароля», далі `/email-otp/reset-password`), без кастомного роуту — тут юзер уже існує, тож вбудований потік підходить. Ліміти: 3/60 с на надсилання, 10/60 с на скидання (customRules Better Auth — [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting)). Встановлення **першого** пароля для Google-акаунта — окремий action `setInitialPassword` (див. [Аватари та налаштування профілю](/admin/docs/technical/autentyfikatsiya/avatary-i-profil)).

## Пов'язане

- Загальний конфіг Better Auth: [Better Auth: інтеграція](/admin/docs/technical/autentyfikatsiya/better-auth)
- Ліміти OTP у зведеній таблиці: [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting)
- Колекція `verifications`: [users та auth-колекції](/admin/docs/technical/model-danykh/users-i-auth)
- Шаблони листів: [Email — Resend](/admin/docs/technical/infrastruktura/email)
