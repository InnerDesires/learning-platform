---
title: Push vs міграції
description: Drizzle push для локальної ітерації, міграції як схемний контракт, CI-репетиція та production-gated запуск на Vercel.
---

Схема бази живе у двох режимах: **push** (авто-синхронізація для локальної ітерації) і **міграції** (контракт, яким схема доїжджає до CI та продакшну). Плутати їх не можна — у кожного своя територія.

## Push: локальна ітерація

У `src/payload.config.ts` адаптер налаштовано як `push: !process.env.CI`. На старті dev-сервера (і при HMR) Drizzle порівнює схему коду зі схемою підключеного Neon-бранча і мовчки досинхронізовує різницю. Ви міняєте поле в колекції — таблиця оновлюється сама, без жодного файлу міграції.

Push працює **тільки** на dev- і сесійних бранчах. У CI (`CI=1`) і на проді push вимкнений — там правлять файли міграцій.

:::warning
Побічний ефект push — запис `batch=-1` у `payload_migrations` на push-керованих бранчах. Саме через нього **ніколи не запускайте `payload migrate` на dev/сесійних бранчах**: команда зависне на інтерактивному промпті. Міграції там і не потрібні — push уже все синхронізував.
:::

### Як влаштований bookkeeping

Payload веде облік застосованих міграцій у таблиці `payload_migrations`: імʼя файлу + номер батча. `payload migrate` порівнює файли в `src/migrations/` із записами таблиці і застосовує відсутні. Drizzle push пише туди спеціальний запис із `batch=-1` («схемою керує push») — натрапивши на нього, `payload migrate` питає підтвердження інтерактивно, що в неінтерактивному контексті виглядає як вічний hang. Це і є фізична причина правила «жодних migrate на push-керованих бранчах».

## Залізне правило: кожна схемна зміна = міграція в тому ж PR

Push ніде, крім вашої машини, не запускається. Тому **кожен PR зі зміною схеми зобовʼязаний містити міграцію** в `src/migrations/` (плюс реєстрацію в `src/migrations/index.ts`). Без неї CI впаде на репетиції, а якщо якимось дивом доїде до merge — впаде production-білд.

### Створення міграції

```bash
pnpm payload migrate:create my_change_name
```

`migrate:create` порівнює код зі станом бази і генерує diff — але **diff забруднений**: він підбирає сторонній шум (косметичні розбіжності push-керованої бази, чужі дрейфи). Згенерований файл — це чернетка, яку **редагують вручну** до рівно вашої зміни:

1. Видаліть усе, що не стосується вашої фічі.
2. Захистіть DDL від повторного запуску: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` — міграція має бути **ідемпотентною** (безпечний rerun поверх бази, де push уже створив обʼєкти).
3. Напишіть чесний `down()`.

Скелет міграції:

```ts
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "about" varchar(500);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "about";
  `)
}
```

Приклади канону в репо — `src/migrations/20260724_140000_xp_events.ts` (нова таблиця + FK), `20260724_190000_rate_limit.ts`, `20260729_100000_backfill_user_roles.ts` (data-міграція). Не забудьте додати міграцію в `src/migrations/index.ts` — незареєстрований файл просто не виконається.

### Чому ідемпотентність — не формальність

Той самий DDL може виконуватися проти баз у різному стані: `ci-base`-форк (обʼєкта ще немає), прод (обʼєкт міг бути створений push-ем в ранню епоху проєкту), повторний прогін після часткового фейлу. Історичний факт: прод-схема спершу була створена push-ем, і guarded-міграції застосувалися поверх неї без конфліктів саме завдяки `IF NOT EXISTS` — реконсиляцію решти дрейфу зробила `20260721_233000_reconcile_schema_drift.ts`.

:::tip
`payload run` для довільних скриптів зламаний у цьому проєкті — запускайте скрипти через `tsx --env-file=.env script.ts` (так працює і `pnpm seed:dev-admin`).
:::

## CI-репетиція міграцій

PR-воркфлоу (`ci.yml` для Vitest, `e2e.yml` для Playwright) виконують однакову схему:

1. Форкають ефемерний бранч `ci/<run_id>` від **`ci-base`** у dev-проєкті Neon.
2. Запускають `pnpm payload migrate` — застосовуються міграції, змерджені після останнього рефрешу `ci-base`, **плюс міграція самого PR-а**. Це і є пре-мерджева репетиція: зламана чи відсутня міграція валить CI, а не production-деплой.
3. Ганяють тести (E2E додатково сідить дані і білдить застосунок — prerender білда теж валідує, що код і схема узгоджені).
4. Видаляють бранч завжди — і на успіху, і на фейлі.

`ci-base` тримається актуальним воркфлоу `.github/workflows/refresh-ci-base.yml`: на кожен push у `main` він запускає `pnpm payload migrate` проти `ci-base`, тож змерджені міграції пропагуються автоматично. Чому CI не форкає від `dev` — через той самий `batch=-1` (див. вище і [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh)).

Локальна репетиція CI-поведінки: `CI=1` вимикає push, тож `CI=1 pnpm payload migrate` проти свіжого форку `ci-base` відтворює те, що зробить воркфлоу.

## Продакшн: migrate-on-vercel.mjs

Прод отримує міграції рівно один раз — під час **production**-білда Vercel, через скрипт у `package.json`:

```jsonc
"vercel-build": "node scripts/migrate-on-vercel.mjs && pnpm build"
```

Повний вміст `scripts/migrate-on-vercel.mjs`:

```js
import { spawnSync } from 'node:child_process'

const env = process.env.VERCEL_ENV ?? '(unset)'

if (env !== 'production') {
  console.log(`[migrate-on-vercel] VERCEL_ENV=${env} — skipping migrations.`)
  process.exit(0)
}

if (!process.env.DATABASE_URL) {
  console.error('[migrate-on-vercel] VERCEL_ENV=production but DATABASE_URL is not set — refusing to build.')
  process.exit(1)
}

console.log('[migrate-on-vercel] VERCEL_ENV=production — running payload migrate…')

const result = spawnSync('pnpm', ['payload', 'migrate'], { stdio: 'inherit' })

if (result.status !== 0) {
  console.error('[migrate-on-vercel] migration failed — aborting build so the previous deployment keeps serving.')
  process.exit(result.status ?? 1)
}

console.log('[migrate-on-vercel] migrations applied.')
```

Три гарантії скрипта:

| Умова | Дія | Навіщо |
| --- | --- | --- |
| `VERCEL_ENV !== 'production'` | `exit 0`, міграції пропущено | Превʼю дивляться на бранч `preview` у dev-проєкті і **ніколи** не мутують схему |
| production без `DATABASE_URL` | `exit 1`, білд відмовлено | Краще не задеплоїти, ніж білдити прод без бази |
| `payload migrate` впав | `exit` з кодом помилки → **білд перерваний** | Попередній деплой продовжує обслуговувати трафік — зламана міграція не кладе прод |

Міграції виконуються один раз, у детермінований момент, одним раннером, **до** того, як новий код почне приймати трафік — а не на холодних стартах serverless-функцій, де були б function-timeout і гонки конкурентності.

## Чому НЕ prodMigrations адаптера

Payload має вбудований механізм `prodMigrations` (міграції на ініціалізації). Тут він свідомо **не** використовується: Payload ініціалізується під час prerender-фази `next build`, тобто startup-керовані міграції виконувалися б **усередині кожного білда** — включно з превʼю — проти тієї бази, яку бачить конкретне оточення. Зовнішній production-gated скрипт дає контроль, якого адаптер дати не може.

Історична примітка: раніше Build Command у дашборді Vercel був перевизначений на `payload migrate && pnpm build` — він ганяв міграції без гейта в кожному оточенні і тінив би `vercel-build`. Перевизначення знято; поведінка білда тепер повністю контролюється репозиторієм.

## Чеклист перед відкриттям PR зі схемною зміною

1. Міграція в `src/migrations/` створена, відредагована до вашої зміни, ідемпотентна, з `down()`.
2. Зареєстрована в `src/migrations/index.ts`.
3. `pnpm generate:types` виконано, `src/payload-types.ts` у коміті.
4. Локально все працює (push уже синхронізував ваш бранч — це не перевірка міграції, а перевірка коду).
5. Довірте перевірку самої міграції CI — крок «Run migrations» проти форку `ci-base` і є її першим чесним прогоном.

## Шпаргалка «де що запускається»

| Середовище | Push | `payload migrate` |
| --- | --- | --- |
| Локальний dev (сесійний бранч) | ✅ на старті сервера | ❌ ніколи (зависне на `batch=-1`) |
| CI (`ci/*` від `ci-base`) | ❌ (`CI=1`) | ✅ перед тестами |
| `ci-base` | ❌ | ✅ на кожен push у `main` |
| Preview-деплой | ❌ | ❌ (гейт `VERCEL_ENV`) |
| Production-деплой | ❌ | ✅ один раз у `vercel-build` |

## Повʼязані статті

- [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh) — топологія бранчів, unpooled-правило
- [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi) — решта production-білда
- [Цикл розробки фічі](/admin/docs/technical/rozrobka/tsykl-rozrobky-fichi) — місце міграції в чеклісті PR-а
- [Тестування](/admin/docs/technical/rozrobka/testuvannia) — що саме ганяє CI
