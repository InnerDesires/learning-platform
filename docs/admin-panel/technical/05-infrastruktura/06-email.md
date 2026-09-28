---
title: Email — Resend
description: Два шляхи відправки через Resend, повна таблиця листів, шаблони та поведінка системи без RESEND_API_KEY.
---

Уся пошта йде через [Resend](https://resend.com). У кодовій базі є **два незалежні шляхи** відправки — це важливо розуміти при дебагу «чому лист не прийшов».

## Шлях 1: resendAdapter → payload.sendEmail

`src/payload.config.ts`:

```ts
email: process.env.RESEND_API_KEY
  ? resendAdapter({
      defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      defaultFromName: 'Learning Platform',
      apiKey: process.env.RESEND_API_KEY,
    })
  : undefined
```

Через цей адаптер (`payload.sendEmail`) ідуть: **лист-запрошення адміністратора** (`sendInviteEmail` у `src/lib/auth/options.ts`) і **листи form-builder-плагіна**. `defaultFromName` — «Learning Platform».

## Шлях 2: прямий new Resend

Два місця створюють клієнт Resend напряму, повз адаптер Payload:

- `src/lib/auth/options.ts` — `sendVerificationOTP` плагіна emailOTP (типи `email-verification` і `forget-password`);
- `src/app/api/auth/verify-registration/route.ts` — OTP реєстрації (action `send-otp`).

Обидва читають ті самі `RESEND_API_KEY` та `EMAIL_FROM || 'onboarding@resend.dev'`, але **не** залежать від того, чи сконфігурований email-адаптер Payload.

## Таблиця всіх листів

| Лист | Тригер | Subject | Шаблон |
| --- | --- | --- | --- |
| OTP реєстрації | `POST /api/auth/verify-registration` (action `send-otp`) | `Код підтвердження: <otp>` | `buildOtpEmailHtml(otp, 'email-verification')` |
| OTP підтвердження email | emailOTP-плагін, type `email-verification` | той самий | той самий |
| OTP скидання пароля | emailOTP-плагін, type `forget-password` | `Код для скидання пароля: <otp>` | `buildOtpEmailHtml(otp, 'forget-password')` |
| Запрошення адміністратора | кнопка «Надіслати лист» у invite-модалці (InviteUserButton) | `Запрошення до панелі адміністратора — Залізна Зміна` | `buildInviteEmailHtml(url)` |
| Листи форм | formBuilderPlugin, конфігуруються автором форми в адмінці | задає редактор | тіло з плейсхолдерами `{{fieldName}}`, `{{*}}`, `{{*:table}}` |

:::info Транзакційних листів про навчання НЕМАЄ
Записався на курс, завершив курс, отримав сертифікат — **жоден** із цих подій не породжує листа. Lifecycle-email-и — відома прогалина (P0 у беклозі), а не забутий баг конфігурації.
:::

## Параметри OTP

Обидва OTP-шляхи оперують однаковими константами (emailOTP-плагін у `src/lib/auth/options.ts` і власна реалізація у `verify-registration`):

| Параметр | Значення |
| --- | --- |
| Довжина коду | 6 цифр (`otpLength: 6`) |
| Термін дії | 300 с = 5 хвилин (`expiresIn: 300`) — саме про це футер листа |
| Спроби вводу | 3 на один код (`allowedAttempts: 3`; у verify-registration — лічильник `attempts` у value) |
| Формат value у `verifications` | `otp:attempts`, split по **останньому** `:` |

Прострочений код видаляється при спробі верифікації (400); вичерпані спроби — видалення + 403; новий `send-otp` завжди створює свіжий код зі свіжим лічильником. Повний флоу з rate-limit-ами: [Реєстрація через OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp).

## Шаблони

`src/lib/email/verification-otp.ts` і `src/lib/email/admin-invite.ts` — функції, що повертають повний HTML-документ:

- inline-styled HTML (email-клієнти не вміють зовнішні стилі), `<html lang="uk">`, табличний лейаут;
- картка max-width 420px на фоні `#f4f4f5`;
- бренд-акцент: CTA-кнопка запрошення — помаранчева `#f98c1f` з текстом `#04122e`;
- OTP-шаблон параметризований типом (`email-verification` | `forget-password`) — різні підзаголовок і футер; футер нагадує: «Код дійсний 5 хвилин»;
- обидва мають фолбек-рядок «якщо ви не очікували цього листа — ігноруйте».

Правити вигляд листів = правити ці два файли; жодних MJML/React Email тут немає.

## Поведінка без RESEND_API_KEY

Локальна розробка зазвичай іде без ключа — система деградує передбачувано:

| Компонент | Без ключа |
| --- | --- |
| Email-адаптер Payload | `email: undefined` → Payload використовує консольний транспорт: «листи» логуються в stdout dev-сервера |
| `sendVerificationOTP` (emailOTP) | ранній `return` — **no-op**, лист не шлеться і не логується |
| OTP реєстрації (`verify-registration`) | гілка `if (process.env.RESEND_API_KEY)` пропускається — відповідь успішна, листа немає |

:::tip Як дістати OTP локально
Без ключа код не приходить ніде, але він лежить у базі: колекція `verifications`, identifier `email-verification-otp-<email>`, value у форматі `otp:attempts`. Для браузерного тестування простіше обійти реєстрацію взагалі через [Dev-login та сідінг](/admin/docs/technical/autentyfikatsiya/dev-login-i-sid).
:::

## Листи form-builder

formBuilderPlugin (payment вимкнено) дозволяє редактору форми сконфігурувати листи прямо в адмінці: одержувачі, subject і тіло з плейсхолдерами — `{{fieldName}}` підставляє значення поля сабміту, `{{*}}` — усі поля списком, `{{*:table}}` — таблицею. Відправка йде через email-адаптер Payload, тобто без `RESEND_API_KEY` листи форм потраплять лише в консоль dev-сервера.

## sendInviteEmail — обовʼязковий

`betterAuthPlugin` конфігурує `adminInvitations.sendInviteEmail` (`src/lib/auth/options.ts`). Якщо цю функцію не задати, ендпоінт send-invite **відповідає 500** — тому вона визначена завжди і йде через `payload.sendEmail`. Коли відправка фейлиться (немає адаптера, помилка Resend), функція повертає `{ success: false }` з повідомленням «Не вдалося надіслати лист із запрошенням» — модалка показує його редакторові, а invite-лінк усе одно можна скопіювати вручну.

## Запрошення адміністратора: повний флоу

Лист-запрошення — частина ланцюжка, який дозволяє реєстрацію в обхід OTP-гейта:

1. Адмін у списку користувачів натискає кнопку запрошення (`InviteUserButton`, кастомний компонент у Description колекції `users`) — обирає роль, отримує invite-URL і може натиснути «Надіслати лист».
2. Кнопка створює запис в `admin-invitations` (колекція payload-auth) з токеном; відправка йде через `sendInviteEmail` → `payload.sendEmail` → resendAdapter.
3. Запрошений відкриває URL і реєструється. Гейт реєстрації (`databaseHooks.user.create.before` у `src/lib/auth/options.ts`) пропускає створення користувача, якщо invite-токен (header `x-admin-invite-token`, query, body або additionalData) збігається з активним записом `admin-invitations` — OTP-верифікація email у цьому флоу не потрібна, `emailVerified` ставиться одразу.

Без валідного токена і без pre-verified email реєстрація **відхиляється** — тому «зламаний» лист запрошення реально блокує онбординг адміна; запасний вихід — скопіювати invite-URL з модалки і передати іншим каналом.

## Локальне тестування листів

Рецепти для dev-середовища:

1. **Подивитись адаптерний лист без відправки** — не задавайте `RESEND_API_KEY`: `payload.sendEmail` виведе вміст у stdout dev-сервера (invite-лист, листи форм).
2. **Реальна відправка з dev** — задайте `RESEND_API_KEY` тестового акаунта Resend; `EMAIL_FROM` можна лишити дефолтним `onboarding@resend.dev` (Resend приймає його для тестових відправок на власну адресу).
3. **Пройти OTP-флоу без пошти** — дістати код із колекції `verifications` в адмінці (identifier `email-verification-otp-<email>`, у value до першого `:`), або взагалі оминути реєстрацію через dev-login.
4. **Перевірити верстку шаблону** — функції `buildOtpEmailHtml`/`buildInviteEmailHtml` чисті: викличте в скрипті через `tsx` і збережіть результат в `.html`, відкрийте в браузері.

## Куди дивитись у коді

| Що | Файл |
| --- | --- |
| Адаптер Resend | `src/payload.config.ts` (ключ `email`) |
| OTP-відправка (emailOTP) і invite | `src/lib/auth/options.ts` |
| OTP реєстрації (прямий Resend) | `src/app/api/auth/verify-registration/route.ts` |
| HTML-шаблони | `src/lib/email/verification-otp.ts`, `src/lib/email/admin-invite.ts` |
| Кнопка запрошення | `src/components/admin/InviteUserButton` |

## Чеклист дебагу «лист не прийшов»

1. `RESEND_API_KEY` задано в цьому оточенні? (Прод/превʼю мають різні env-скоупи — див. [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi).)
2. Який шлях у цього листа — адаптер чи прямий Resend? Консольний лог dev-сервера покриває лише адаптерний шлях.
3. Для OTP: чи не зʼїв запит rate limit? `otp-send:email` — 3 листи / 300 с на адресу, `otp-send:ip` — 20 / 600 с (див. [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting)).
4. `EMAIL_FROM` верифікований у Resend? Дефолтний `onboarding@resend.dev` працює лише для тестів.

## Повʼязані статті

- [Реєстрація через OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp) — повний флоу OTP-реєстрації
- [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting) — ліміти на відправку кодів
- [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi) — змінні `RESEND_API_KEY`, `EMAIL_FROM`
