---
title: Rate limiting
description: Fixed-window лімітер на спільній таблиці rate_limit — атомарний upsert, fail-open, фабрика rateLimitCreate і повна таблиця всіх лімітів
---

## Архітектура

Один Postgres-бекенд, два споживачі:

1. **Better Auth** — лімітує `/api/auth/*` власним механізмом зі `storage: 'database'`.
2. **`checkRateLimit`** (`src/lib/rate-limit.ts`) — усе інше: server actions, кастомні роути, `beforeValidate`-хуки колекцій.

Обидва пишуть в **одну таблицю `rate_limit`** (створена міграцією `20260724_190000`; колекцію `rateLimit` будує payload-auth — прихована, admin-only). Префікси ключів (`enroll-create:`, `otp-send:ip:`, шляхи Better Auth) тримають простори імен неперетинними. Vercel-лямбди не ділять пам'ять, тому in-memory лічильники не працюють — лише БД.

## `checkRateLimit`: атомарний fixed-window

```ts
export async function checkRateLimit(
  payload: BasePayload,
  { key, windowSeconds, max }: { key: string; windowSeconds: number; max: number },
): Promise<RateLimitResult> // { ok: true } | { ok: false; retryAfter: number }
```

Серце — один SQL-стейтмент:

```sql
INSERT INTO rate_limit ("key", "count", "last_request", "updated_at", "created_at")
VALUES (${key}, 1, ${now}, now(), now())
ON CONFLICT ("key") DO UPDATE SET
  "count" = CASE WHEN rate_limit."last_request" <= ${windowStartCutoff}
            THEN 1 ELSE rate_limit."count" + 1 END,
  "last_request" = CASE WHEN rate_limit."last_request" <= ${windowStartCutoff}
                   THEN ${now} ELSE rate_limit."last_request" END,
  "updated_at" = now()
RETURNING "count", "last_request"
```

Ключові рішення:

- **Атомарність**: upsert одночасно і рахує запит, і скидає протухле вікно. Дві конкурентні лямбди не подвоюють лічильник і не гублять скидання — все вирішує БД.
- **`last_request` = початок вікна** (epoch ms), а не час останнього запиту. Тому `retryAfter = ceil((windowStart + windowMs - now) / 1000)` (мінімум 1 с) обчислюється точно; віддається в HTTP як `Retry-After` там, де ліміт перевіряють роути.
- **Перевищення**: `count > max` → `{ ok: false, retryAfter }`.
- **GC**: з імовірністю 1% після успішної перевірки — `DELETE FROM rate_limit WHERE last_request <= now - 30 днів`. Інакше IP-ключі накопичувалися б вічно; рідко і дешево, тому інлайн.
- **FAILS OPEN**: увесь блок у `try/catch` — будь-яка помилка БД логується і повертає `{ ok: true }`.

:::info Чому fail open
Лімітер захищає ендпоінти — він не має права їх класти. Якщо таблиця недоступна, гірший сценарій «пропустили зайвий запит» кращий за «увесь сайт віддає 429/500 через допоміжну підсистему».
:::

## Вмикання: `isRateLimitEnabled()`

```ts
if (process.env.RATE_LIMIT === 'false') return false
if (process.env.RATE_LIMIT === 'true') return true
return process.env.NODE_ENV === 'production'
```

Єдиний перемикач для **обох** лімітерів (Better Auth читає його в `options.ts` як `rateLimit.enabled`). Дефолт: увімкнено лише в production. `RATE_LIMIT=true` — опт-ін для dev-сесії; `RATE_LIMIT=false` — опт-аут навіть для production-білда (E2E ганяє `next start` з одного IP раннера і без цього миттєво впирається в ліміти). Читається при кожному виклику, тож тести можуть перемикати per-process.

## `getClientIp`: null означає «пропусти», не «спільний bucket»

```ts
const forwarded = request.headers.get('x-forwarded-for')
const first = forwarded?.split(',')[0]?.trim()
if (first) return first
return request.headers.get('x-real-ip')
```

На Vercel проксі ставить `x-forwarded-for`. Якщо заголовків немає (прямі локальні з'єднання) — повертається `null`, і викликач **пропускає IP-ліміт** замість того, щоб звалити всіх у один bucket з ключем `ip:null` (де один клієнт вичерпував би ліміт для всіх). Так роблять OTP-роути: `if (ip) { перевірка } ...`.

## `rateLimitCreate`: фабрика для хуків колекцій

`src/hooks/rateLimitCreate.ts` — `beforeValidate`-фабрика, що вішається на колекцію, аби **обидва** шляхи запису (REST з `req.user` і server actions через Local API з user id у `data`) проходили один чокпоінт:

```ts
rateLimitCreate({ prefix, userField = 'user', windowSeconds, max })
```

Поведінка:

- лише `operation === 'create'`;
- **адмін-байпас**: `req.user.role?.includes('admin')` → пропуск (сідінг, ручні операції в адмінці);
- `userId = req.user?.id ?? data[userField]`; **немає user id — пропуск** (системні записи, хуки, seeds);
- перевищення → `throw new APIError('Забагато запитів. Спробуйте пізніше.', 429)` — server actions ловлять і маплять у свої коди (`RATE_LIMITED` тощо).

## Як користуватись у власному коді

Роут з IP-лімітом і коректним `Retry-After` (патерн з `verify-registration`):

```ts
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const ip = getClientIp(request)
if (ip) {
  const perIp = await checkRateLimit(payload, { key: `my-feature:ip:${ip}`, windowSeconds: 600, max: 20 })
  if (!perIp.ok) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(perIp.retryAfter) },
    })
  }
}
```

Server action з per-user лімітом (патерн з `submitQuizAttempt`):

```ts
const limit = await checkRateLimit(payload, {
  key: `my-action:${session.user.id}`,
  windowSeconds: 3600,
  max: 30,
})
if (!limit.ok) return { success: false, error: 'Забагато спроб. Спробуйте пізніше.' }
```

Правила іменування ключів: `<prefix>:<userId>` для per-user, `<prefix>:ip:<ip>` / `<prefix>:email:<email>` для анонімних потоків. Префікс має бути унікальним у кодовій базі — таблиця спільна з Better Auth.

## Повна таблиця лімітів

| Ключ / шлях | Вікно | Max | Де застосовано |
| --- | --- | --- | --- |
| `enroll-create:<userId>` | 600 с | 30 | хук `enrollments` (`rateLimitCreate`) |
| `comment-create:<userId>` | 60 с | 10 | хук `comments` (`userField: 'author'`) |
| `like-create:<userId>` | 60 с | 60 | хук `likes` |
| `quiz-submit:<userId>` | 3600 с | 30 | `submitQuizAttempt` (server action) |
| `otp-send:ip:<ip>` | 600 с | 20 | `/api/auth/verify-registration` send-otp |
| `otp-send:email:<email>` | 300 с | 3 | там само (страхує від бомбардування чужої скриньки) |
| `otp-verify:ip:<ip>` | 600 с | 30 | verify-otp |
| `otp-verify:email:<email>` | 600 с | 10 | verify-otp (обмежує перебір кодів) |
| Better Auth глобально | 60 с | 60 | всі `/api/auth/*` |
| `/sign-in/email` | 60 с | 10 | Better Auth customRules |
| `/sign-up/email` | 60 с | 5 | — « — |
| `/email-otp/send-verification-otp` | 60 с | 3 | — « — (кожен виклик = реальний лист Resend) |
| `/forget-password/email-otp` | 60 с | 3 | — « — |
| `/sign-in/email-otp` | 60 с | 10 | — « — |
| `/email-otp/verify-email` | 60 с | 10 | — « — |
| `/email-otp/reset-password` | 60 с | 10 | — « — |
| `/get-session` | — | **вимкнено** (`false`) | сесія политься часто й read-only; запис рядка на кожну перевірку — чистий оверхед |

Логіка вибору чисел: per-IP OTP-ліміти щедрі (шкільні комп'ютерні класи сидять за одним NAT), per-email — суворі; `quiz-submit` 30/год не зачіпає людину, лише скрипти; `like-create` 60/60 — фактично «не частіше кліку на секунду».

Тести — `tests/int/rate-limit.int.spec.ts`. Про локальне ввімкнення лімітів під час розробки — [Локальне середовище](/admin/docs/technical/rozrobka/lokalne-seredovyshche).

:::tip Дебаг «звідки 429»
Ключі в таблиці `rate_limit` людиночитні (`comment-create:42`, `otp-send:email:x@y.z`, `/sign-in/email…`) — `SELECT key, count, to_timestamp(last_request/1000) FROM rate_limit ORDER BY updated_at DESC` одразу показує, який ліміт спрацював і коли відкриється вікно.
:::

## Пов'язане

- OTP-потік, який ці ліміти охороняють: [Реєстрація через OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp)
- Хуки колекцій enrollments/comments/likes: [Колекція enrollments](/admin/docs/technical/model-danykh/enrollments), [comments та likes](/admin/docs/technical/model-danykh/comments-likes)
- Конфіг Better Auth: [Better Auth: інтеграція](/admin/docs/technical/autentyfikatsiya/better-auth)
