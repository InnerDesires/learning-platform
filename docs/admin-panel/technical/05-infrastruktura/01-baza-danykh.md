---
title: База даних Neon
description: Топологія Neon-бранчів, бранч на git-гілку, команди neonctl і чому dev-сесіям потрібен саме unpooled connection string.
---

Платформа працює на PostgreSQL у [Neon](https://neon.tech) — serverless-Postgres із гілкуванням бази даних (branch = миттєва copy-on-write копія схеми та даних). Гілкування — основа всього робочого процесу: кожна dev-сесія, кожен CI-прогін і превʼю-деплой отримують власну ізольовану копію бази.

## Два проєкти, один напрям довіри

| Проєкт | ID | Що містить |
| --- | --- | --- |
| **Dev** | `ancient-cell-80589995` | Все ефемерне: сесійні бранчі, CI-бранчі, превʼю-дані |
| **Prod** | `sweet-night-33633526` (назва `production-1`) | Рівно одну гілку `production` з бойовими даними |

Ніщо в dev-проєкті ніколи не вказує на prod-проєкт, і жоден автоматичний процес не пише в prod, окрім самого production-деплою (див. [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi)). Раніше Neon↔Vercel інтеграція порушувала цей інваріант, створюючи `preview/*` бранчі у prod-проєкті на кожен push у PR — її відʼєднано 2026-07-22.

## Топологія бранчів dev-проєкту

```
Dev project (ancient-cell-80589995)
├── dev        спільний парент: сід-дані (dev-admin, демо-курси),
│              схему тримає актуальною drizzle push із dev-серверів
├── ci-base    migration-managed базлайн із чистим payload_migrations;
│              парент усіх ci/* бранчів
├── preview    довгоживучий бранч для Vercel preview-деплоїв
├── feat/*     один на dev-сесію, названий ЯК git-гілка, форк від dev
└── ci/*       ефемерні, один на CI-прогін (ci/<run_id>), форк від ci-base
```

Чому `ci-base` існує окремо від `dev`: `dev` керується drizzle push, тому його таблиця `payload_migrations` містить запис із `batch=-1`, через який `payload migrate` зависає на інтерактивному промпті. `ci-base` побудований *з міграцій* — його bookkeeping чистий, і CI може неінтерактивно репетирувати міграції PR-а. Деталі: [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii).

## Бранч на git-гілку

Кожна dev-сесія створює власний Neon-бранч, названий **точно як git-гілка**. Це не конвенція заради краси — від імені залежить автоматичне прибирання: `.github/workflows/neon-cleanup.yml` при закритті PR видаляє Neon-бранч за іменем `github.head_ref` (через `neondatabase/delete-branch-action@v3`), а додатковий крок замітає «сирітські» бранчі з тим самим стемом, але іншим 6-символьним суфіксом (буває, коли сесія створила Neon-бранч під одним random-суфіксом, а git-гілку запушила під іншим). Захищені імена `dev`, `ci-base`, `preview`, `main`, `production` ніколи не видаляються.

Додатково обидва CI-воркфлоу (`ci.yml`, `e2e.yml`) на кожному прогоні замітають протухлі бранчі: `ci/*` старші за 2 години — завжди сміття; інші незахищені бранчі видаляються лише якщо їм понад 24 години і жоден відкритий PR їх не використовує.

## Команди сесії

```bash
# 1. Створити бранч, названий як git-гілка, від парента dev
pnpm exec neonctl branches create --name feat/my-feature --parent dev \
  --project-id ancient-cell-80589995 --output json

# 2. Отримати ДИРЕКТНИЙ (unpooled) connection string за branch.id з відповіді
pnpm exec neonctl connection-string <BRANCH_ID> \
  --project-id ancient-cell-80589995

# 3. Прописати в .env (НЕ в .env.local!)
# DATABASE_URL=postgresql://...

# Наприкінці сесії (або довіритись neon-cleanup.yml при закритті PR)
pnpm exec neonctl branches delete <BRANCH_ID> --project-id ancient-cell-80589995
```

:::tip
`neonctl` автентифікований локально. Якщо CLI пропонує інтерактивний вибір організації — додайте `--org-id org-misty-credit-72207517`.
:::

## Анатомія connection string

Директний і pooled рядки відрізняються лише хостом:

```
# директний (для dev-сесій)
postgresql://user:pass@ep-xxx-yyy.eu-central-1.aws.neon.tech/neondb?sslmode=require

# pooled (для проду/превʼю; НЕ для dev)
postgresql://user:pass@ep-xxx-yyy-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

`src/payload.config.ts` перед передачею в адаптер нормалізує SSL-режим:

```ts
const normalizeDatabaseURL = (url: string): string =>
  url.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/i, '$1verify-full')
```

`sslmode=require` (який видає neonctl) шифрує, але не верифікує сертифікат сервера; `pg` сьогодні фактично поводиться як `verify-full`, однак попереджає, що pg v9 це змінить — тому режим робиться явним. Neon віддає публічно-довірений сертифікат, тож `verify-full` працює без додаткових CA-файлів. Також конфіг логує хост `DATABASE_URL` при завантаженні (`[payload] DATABASE_URL host: ...`) — перший рядок, на який варто дивитися при «не та база».

Оскільки сесійні бранчі форкаються від засідженого `dev`, кожен із них одразу містить акаунт `dev-admin@example.com` з даними — жодного пер-бранчевого сідингу (див. [Dev-login та сідінг](/admin/docs/technical/autentyfikatsiya/dev-login-i-sid)).

## ⚠️ Директний (unpooled) connection string для dev

Для dev-сесій використовуйте **лише директний** connection string: без прапорця `--pooled` у neonctl і без суфікса `-pooler` у хості URL.

### Механізм поломки

Neon надає pooled-endpoint через **pgbouncer у transaction-режимі**: одне фізичне зʼєднання з Postgres по черзі обслуговує транзакції різних клієнтів. Drizzle push (який запускається на старті dev-сервера і при HMR, бо в конфізі `push: !process.env.CI`) під час інтроспекції виконує `SET search_path` — **session-level** команду, яку pgbouncer не відкочує між транзакціями. Далі:

1. Push «отруює» зʼєднання зміненим `search_path` і повертає його в пул.
2. Інший клієнт (Better Auth, фронтенд-запит) отримує це саме зʼєднання.
3. Некваліфіковані імена таблиць перестають резолвитись → **рандомні** помилки `42P01 relation "..." does not exist` на таблицях, які точно існують.

Симптоми плаваючі, бо залежать від того, кому дістанеться отруєне зʼєднання: спостерігалося (2026-07-24) як падіння sign-in при робочому фронтенді, потім випадкові 500-ки на сторінках.

:::danger Діагностика
Якщо dev-сервер кидає `relation "..." does not exist` на таблицях, що існують, — перевірте `DATABASE_URL` на `-pooler` у хості, замініть на директний рядок і перезапустіть сервер.
:::

Продакшн і превʼю **лишаються pooled** — вони ніколи не запускають drizzle push, тож механізм не спрацьовує, а pooling потрібен serverless-функціям. Один локальний dev-сервер чудово живе без пулера.

## ⚠️ .env.local ніколи не містить DATABASE_URL

`vitest.setup.ts` завантажує `.env.local` з `override: true`:

```ts
config({ path: '.env.local', override: true })
config({ path: '.env' })
```

Значення `DATABASE_URL` у `.env.local` мовчки переб'є і `.env`, і навіть явно передані змінні оточення — dev-сервер та Vitest непомітно підключаться до чужого бранча. Це вже призводило до багатогодинного дебагу; правило залізне: `DATABASE_URL` живе **тільки в `.env`**. Деталі про сетап тестів: [Тестування](/admin/docs/technical/rozrobka/testuvannia).

## Життєвий цикл бранчів

| Бранч | Створюється | Живе | Видаляється |
| --- | --- | --- | --- |
| `feat/*` (сесійний) | вручну на старті сесії | одну сесію/PR | `neon-cleanup.yml` при закритті PR, або вручну |
| `ci/<run_id>` | `neondatabase/create-branch-action` у CI | один прогін | крок `always()` того ж воркфлоу; страховка — sweep (> 2 год) |
| `preview` | вручну, форк від `dev` | довго | не видаляється; при протуханні схеми — перефоркується від `dev` вручну |
| `dev` | — | завжди | ніколи (захищений у всіх sweep-ах) |
| `ci-base` | — | завжди | ніколи; при забрудненні перебудовується з міграцій |

Якщо `preview` відстав від схеми або дані замусорені: видалити бранч, форкнути від `dev` заново і оновити Preview-scoped `DATABASE_URL` у Vercel, якщо endpoint змінився.

## Гострі кути

- **Зупиняйте dev-сервер перед перемиканням git-гілок.** Якщо схема у щойно вичекнутому коді старіша за схему підключеного бранча, `push` інтерактивно запропонує **видалити новіші колонки разом із даними**.
- Один dev-сервер на worktree; кілька серверів одночасно — лише з різних worktree і кожен зі своїм Neon-бранчем у `.env` (див. [Локальне середовище](/admin/docs/technical/rozrobka/lokalne-seredovyshche)).
- Якщо сервер «не відповідає» — перш за все перевірте, на який Neon-бранч дивиться `DATABASE_URL` у `.env`.
- Rollback на проді: Neon point-in-time restore прод-проєкту + `down()` кожної міграції.

## Міні-FAQ

**Чи можна працювати двом сесіям на одному бранчі?** Ні. Push двох серверів із різними версіями коду проти однієї схеми — гарантований конфлікт. Бранч на сесію коштує секунди.

**Чи можна форкнути сесійний бранч від прод-даних?** Ні — сесійні бранчі живуть у dev-проєкті і форкаються від `dev`. Прод-проєкт для відлагодження недоторканний; для відтворення прод-багів використовуйте сід-дані або відтворіть стан вручну.

**Бранч видалили, а `.env` ще вказує на нього?** Сервер почне падати на підключенні. Створіть новий бранч і оновіть `DATABASE_URL` — дані сесії були ефемерними за визначенням.

**Скільки живуть невикористані бранчі?** До першого sweep-а: сесійні без відкритого PR — 24 години, `ci/*` — 2 години. Не тримайте на сесійному бранчі нічого цінного.

## Повʼязані статті

- [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii) — push vs міграції, CI-репетиція
- [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi) — як prod-база отримує міграції
- [Локальне середовище](/admin/docs/technical/rozrobka/lokalne-seredovyshche) — повний сетап сесії
- [Цикл розробки фічі](/admin/docs/technical/rozrobka/tsykl-rozrobky-fichi) — місце Neon-бранча в циклі фічі
