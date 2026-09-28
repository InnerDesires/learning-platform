---
title: Dev-login та сідінг
description: GET /api/dev-login з жорстким блоком на Vercel, лінивий авто-сід dev-адміна з канонічним набором даних і pnpm seed:dev-admin як ресет
---

## Навіщо

Кожна dev-сесія працює на власній Neon-гілці БД (гілка на git-гілку — [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh)), і щоразу створювати адміна руками — марна праця. Тому будь-яка dev-база має гарантованого адміна з наповненим профілем і активністю, а вхід — одна навігація: `http://localhost:3000/api/dev-login`.

### Чому не звичайна форма логіну

Форма йде через клієнтський виклик `/api/auth/sign-in/email`, і Better Auth перевіряє origin проти `trustedOrigins`, які зав'язані на `localhost:3000` — на будь-якому іншому порті (другий worktree, `PORT=3001`) форма і Google OAuth ламаються. `/api/dev-login` логінить **server-side** (`payload.betterAuth.api.signInEmail`), тож origin-перевірки не стосується і працює на будь-якому порті. Деталі trustedOrigins — [Better Auth: інтеграція](/admin/docs/technical/autentyfikatsiya/better-auth); повний довідник — `docs/dev-admin-login.md`.

## `devLoginEnabled()`: подвійний запобіжник

`src/app/api/dev-login/route.ts`:

```ts
function devLoginEnabled(): boolean {
  if (process.env.VERCEL) return false
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_LOGIN === '1'
}
```

- **Жорсткий блок на Vercel**: будь-який деплой (production, превʼю) → роут відповідає 404, і жодна змінна це не переможе. Ендпоінт, що видає адмін-сесію без пароля, не має права існувати в хмарі.
- Поза Vercel: дозволено в не-production, а для локального production-білда (E2E через `next start`) — опт-ін `ALLOW_DEV_LOGIN=1`.

| Оточення | `VERCEL` | `NODE_ENV` | `ALLOW_DEV_LOGIN` | Роут |
| --- | --- | --- | --- | --- |
| Vercel production / превʼю | set | будь-який | будь-який | **404** |
| локальний `pnpm dev` | — | development | — | працює |
| локальний `next start` (E2E) | — | production | не задано | 404 |
| локальний `next start` (E2E) | — | production | `1` | працює |

## Креденшли — `src/lib/auth/dev-credentials.ts`

```ts
export const DEV_ADMIN = {
  email: 'dev-admin@example.com',
  password: 'dev-admin-password',
  name: 'Дев Адмін',
} as const
```

Один модуль ділять сід-скрипт і роут — вони фізично не можуть розійтися.

## Потік запиту

1. `signInEmail` через `payload.betterAuth.api` з `asResponse: true` (потрібна повна `Response` — з неї переносяться куки):

   ```ts
   payload.betterAuth.api.signInEmail({
     body: { email: DEV_ADMIN.email, password: DEV_ADMIN.password },
     asResponse: true,
   })
   ```

2. **Фейл → лінивий сід**: `seedDevAdmin(payload)` і повторний `signIn`. Конкурентні спроби (дві вкладки на свіжій базі) колапсуються module-level промісом:

   ```ts
   pendingSeed ??= seedDevAdmin(payload).finally(() => { pendingSeed = null })
   await pendingSeed
   ```

3. Фейл сіду або повторного входу → 500 з підказкою про `pnpm seed:dev-admin`.
4. Успіх → **303** редірект + перенесення всіх `Set-Cookie` з відповіді Better Auth:

   ```ts
   const response = NextResponse.redirect(new URL(redirectTo, url.origin), 303)
   for (const cookie of authResponse.headers.getSetCookie()) {
     response.headers.append('set-cookie', cookie)
   }
   ```

5. **`?redirect=` гард**: приймається лише значення, що `startsWith('/')`, інакше — `/`. Приклад: `/api/dev-login?redirect=/admin`.

CLI-варіант (сесія для curl-тестів):

```bash
curl -si -c cookies.txt http://localhost:3000/api/dev-login
curl -s -b cookies.txt http://localhost:3000/api/users/me
```

## Сід-канон — `src/lib/auth/seed-dev-admin.ts`

`seedDevAdmin` ідемпотентно приводить базу до канонічного стану:

- **Адмін-користувач** (`ensureAdminUser`): якщо акаунт з email dev-адміна існує, але пароль не працює — акаунт **перестворюється** (спершу зачистка enrollments/attempts/comments/likes/sessions/accounts, потім delete) — фіксовані креденшли і є сенсом акаунта. Створення йде через `markPreVerified` + звичайний `signUpEmail` (тобто через той самий OTP-гейт, що й реальні юзери — [Реєстрація через OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp)), далі `payload.update`: `role: ['admin']`, `emailVerified: true`, заповнені `about` і три `socialLinks` (telegram, youtube, website).
- **Курси** (`ensureCourses`): беруться published-курси з кроками; якщо їх менше двох — досоздаються демо-курси («Демо-курс: перша допомога» — з тестом на 2 питання, passingScore 70; «Демо-курс: тактична підготовка» — без тесту), обидва published, slug з унікальним суфіксом.
- **Активність** (щоразу з нуля — `resetAdminActivity` видаляє попередню):
  - **Завершений курс**: enrollment на перший курс — усі кроки в `completedSteps`, `status: 'completed'`, `enrolledAt` = −14 днів, `completedAt` = −7 днів; якщо курс з тестом — `quizPassed: true`, `bestQuizScore: 100`, `quizAttempts: 1` + запис у `quiz-attempts` на 100% (форма `answers` дзеркалить те, що пише `submitQuizAttempt`). Отже сертифікат одразу доступний.
  - **Курс у процесі**: другий курс, `doneCount = min(max(1, floor(steps/2)), steps.length - 1)` — щонайменше один крок пройдено, але ніколи всі; `status: 'in_progress'`, `enrolledAt` = −3 дні.
  - **Коментарі**: 2 на курси + 1 на перший published-пост (якщо є).

Повертає `SeedDevAdminSummary`:

```ts
export interface SeedDevAdminSummary {
  userId: number
  completedCourse: string
  completedCourseHasQuiz: boolean
  inProgressCourse: string
  comments: number
}
```

### Канон одним поглядом

| Об'єкт | Стан після сіду |
| --- | --- |
| Користувач | `Дев Адмін`, `role: ['admin']`, `emailVerified`, about + 3 соцлінки |
| Enrollment №1 | completed: всі кроки, −14д/−7д; з тестом → `quizPassed`, best 100, спроба на 100% |
| Enrollment №2 | in_progress: `floor(steps/2)` кроків, clamp [1, len−1], −3д |
| Коментарі | 2 на курси + 1 на пост (якщо є published-пост) |
| Курси | існуючі published або 2 демо-курси (перший — з тестом) |

## `pnpm seed:dev-admin` = ресет

Сідінг **автоматичний** — окремо запускати нічого не треба: свіжа гілка чи стерта база сама засіється при першому `/api/dev-login`. Скрипт `pnpm seed:dev-admin` існує для іншого: **повернути** зіпсовані під час тестування дані до канону (він викликає той самий `seedDevAdmin`, який зачищає активність адміна і накатує її заново).

:::tip Типові сценарії
- Зайти в адмінку: відкрити `http://localhost:3000/api/dev-login?redirect=/admin`.
- Тестувати сертифікат: dev-адмін уже має завершений курс — одразу `/courses/<slug>/certificate`.
- Розламали enrollment у тестах: `pnpm seed:dev-admin` і все як було.
- Дев-сервер на іншому порті: `http://localhost:3001/api/dev-login` — працює, бо логін server-side.
:::

## Взаємодія з рештою системи

- Сід створює юзера через **штатний** `signUpEmail` + `markPreVerified`, а не прямий `payload.create` — тому в `accounts` з'являється коректний credential-запис, і пароль реально працює у формі логіну теж.
- Демо-курс з тестом проходить ті самі валідації колекції `courses` (minRows, isCorrect), що й курси з адмінки — сід не може створити «неможливий» курс.
- Completed-enrollment сіда — легальна ціль для всіх фіч: сертифікат (PDF + QR-верифікація), XP (derived покаже 3×30 + 100), історія спроб тесту.

## Пов'язане

- Better Auth і trustedOrigins (чому форма логіну не працює на порті ≠ 3000): [Better Auth: інтеграція](/admin/docs/technical/autentyfikatsiya/better-auth)
- Neon-гілки та локальне середовище: [Локальне середовище](/admin/docs/technical/rozrobka/lokalne-seredovyshche)
- Довідник у репо: `docs/dev-admin-login.md`
