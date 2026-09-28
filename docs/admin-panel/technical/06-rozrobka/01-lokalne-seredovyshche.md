---
title: Локальне середовище
description: Від клону до працюючого dev-сервера — вимоги, worktrees, Neon-бранч на сесію, dev-login і шпаргалка команд.
---

## Вимоги

| Інструмент | Версія | Звідки |
| --- | --- | --- |
| Node.js | `22.x` | `engines` у `package.json` |
| pnpm | `^10` (зафіксовано `pnpm@10.30.2` у `packageManager`) | `corepack enable` підхопить сам |

## Клон і встановлення

```bash
git clone <repo> && cd learning-platform
pnpm ii        # аліас: pnpm --ignore-workspace install
```

`pnpm ii` — канонічна команда встановлення: прапорець `--ignore-workspace` ізолює проєкт від будь-якого батьківського pnpm-workspace.

Далі потрібні `.env` (секрети + `DATABASE_URL`) і `.env.local` — скопіюйте з робочої копії або візьміть у мейнтейнера. Мінімальний набір для повноцінної локальної роботи:

| Змінна | Без неї |
| --- | --- |
| `DATABASE_URL` | нічого не працює (тільки в `.env`, ніколи в `.env.local`) |
| `PAYLOAD_SECRET` | Payload не стартує |
| `BETTER_AUTH_SECRET` | автентифікація не працює; падає production-білд |
| `BLOB_READ_WRITE_TOKEN` | аплоади йдуть на локальний диск (для більшості задач — ок), але падають `pnpm build` і `generate:importmap` у worktree-сценаріях |
| `PREVIEW_SECRET` | не працює draft-превʼю з адмінки |
| `RESEND_API_KEY` (опц.) | листи не шляться — очікувано в dev (див. [Email — Resend](/admin/docs/technical/infrastruktura/email)) |
| `CRON_SECRET` (опц.) | недоступний `POST /api/reindex-search` |

Повний довідник змінних із місцями читання: [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi).

## Git worktrees

Паралельні задачі живуть у git worktrees (`.claude/worktrees/...`). Worktree — це окремий чекаут, і **env-файли в нього не переїжджають самі**:

:::warning Скопіюйте .env і .env.local у кожен worktree
Без них ламаються неочевидні речі: production-білд (`pnpm build`) і `pnpm generate:importmap` падають через відсутні `BETTER_AUTH_SECRET` і `BLOB_READ_WRITE_TOKEN`. Симптоми виглядають як зламаний код, хоча це просто порожнє оточення.
:::

```bash
cp ../learning-platform/.env ../learning-platform/.env.local .
```

## Neon-бранч на сесію

Кожна сесія розробки отримує власний бранч бази, названий як git-гілка, з парентом `dev` — повні команди та пояснення (unpooled-правило, заборона `DATABASE_URL` у `.env.local`, авто-cleanup) у [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh). Коротко:

```bash
pnpm exec neonctl branches create --name <git-branch> --parent dev \
  --project-id ancient-cell-80589995 --output json
pnpm exec neonctl connection-string <BRANCH_ID> --project-id ancient-cell-80589995
# → DATABASE_URL у .env (директний рядок, БЕЗ -pooler)
```

Бранч успадковує від `dev` сід-дані: акаунт dev-адміна, демо-курси, коментарі.

## Dev-сервер

```bash
pnpm dev    # next dev --turbopack, порт 3000
```

Правила:

- **Один сервер на worktree.** Кілька одночасно — лише з різних worktree, кожен зі своїм Neon-бранчем у власному `.env`. Ніколи два сервери проти одного бранча.
- **Порт 3000 — дефолт.** Якщо зайнятий сервером іншого worktree — не вбивайте його, стартуйте на вільному порту: `.claude/launch.json` має `autoPort: true`, вручну — `PORT=3001 pnpm dev`.
- На нестандартному порту Google OAuth і формовий sign-in можуть падати (`NEXT_PUBLIC_SERVER_URL` і `trustedOrigins` очікують `localhost:3000`) — використовуйте dev-login, він працює на будь-якому порту.

## Вхід: dev-login

Один перехід у браузері — і ви залогінені адміном:

```
http://localhost:3000/api/dev-login              # → сесія + redirect на /
http://localhost:3000/api/dev-login?redirect=/admin
```

```bash
curl -si -c cookies.txt http://localhost:3000/api/dev-login   # CLI-сесія
```

Креденшали: `dev-admin@example.com` / `dev-admin-password` (`src/lib/auth/dev-credentials.ts`). Маршрут самовиліковний — якщо акаунта немає (несідований бранч, стерта база), він сідить і повторює вхід. На Vercel вимкнений безумовно. Деталі й сід-дані: [Dev-login та сідінг](/admin/docs/technical/autentyfikatsiya/dev-login-i-sid).

## Шпаргалка команд

```bash
pnpm dev                  # dev-сервер (Turbopack, :3000)
pnpm build                # production-білд
pnpm start                # запуск production-білда
pnpm generate:types       # регенерація src/payload-types.ts після зміни схеми
pnpm generate:importmap   # регенерація import map після нового admin-компонента
pnpm test:int             # інтеграційні тести (Vitest)
pnpm test:e2e             # E2E (Playwright, білдить і стартує на :3100)
pnpm lint                 # ESLint
pnpm seed:dev-admin       # РЕСЕТ даних dev-адміна до канонічного стану
pnpm dev:prod             # локальний production-прогін: rm -rf .next && build && start
pnpm ii                   # встановлення залежностей (--ignore-workspace)
```

Нюанси окремих команд:

- `pnpm generate:types` — після **кожної** зміни схеми; результат `src/payload-types.ts` комітиться.
- `pnpm generate:importmap` — після додавання будь-якого кастомного admin-компонента (рядкові шляхи `@/components/...` в конфізі резолвляться через згенерований `src/app/(payload)/admin/importMap.js`).
- `pnpm dev:prod` — production-білд локально; `/api/dev-login` у ньому вимкнений, поверніть його через `ALLOW_DEV_LOGIN=1`.
- Довільні скрипти запускайте як `tsx --env-file=.env <script>` — `payload run` у проєкті зламаний.

## Порядок першого запуску (стисло)

```bash
git clone <repo> && cd learning-platform
pnpm ii
cp <звідкись>/.env <звідкись>/.env.local .
git checkout -b feat/my-task main
pnpm exec neonctl branches create --name feat/my-task --parent dev \
  --project-id ancient-cell-80589995 --output json
pnpm exec neonctl connection-string <BRANCH_ID> --project-id ancient-cell-80589995
# → DATABASE_URL у .env
pnpm dev
# браузер: http://localhost:3000/api/dev-login?redirect=/admin
```

Після входу: фронтенд на `http://localhost:3000` (укр. локаль без префікса, англійська під `/en`), адмінка на `/admin`. Dev-адмін має роль `admin`, тож бачить і адмін-панель, і всі колекції. Сід-дані dev-адміна включають завершений курс із пройденим квізом — сертифікат, XP і прогрес доступні для тестування одразу, без ручного проходження курсів.

## Типові фейли

| Симптом | Причина | Що робити |
| --- | --- | --- |
| `42P01 relation "..." does not exist` на існуючих таблицях, плаваюче | `-pooler` у хості `DATABASE_URL` — drizzle push отруїв search_path пулера | Директний connection string, перезапуск сервера. Механізм: [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh) |
| `relation does not exist` стабільно на всьому | `DATABASE_URL` дивиться не на той бранч (порожній/чужий) | Перевірити бранч у `.env`; памʼятати, що `.env.local` НЕ місце для `DATABASE_URL` |
| Сервер не відповідає / висить | Neon-бранч видалений або суспендований | Перевірити бранч у `.env`, перестворити за потреби |
| `pnpm build` / `generate:importmap` падає у worktree | не скопійовані `.env`/`.env.local` | Скопіювати обидва файли |
| Push пропонує видалити колонки при старті | чекаут старішого коду проти новішої схеми бранча | Відмовитись, зупиняти сервер ПЕРЕД перемиканням git-гілок |
| Дані dev-адміна поламані тестами | деструктивне тестування | `pnpm seed:dev-admin` — ідемпотентний ресет |

## Повʼязані статті

- [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh) — усе про Neon-бранчі
- [Тестування](/admin/docs/technical/rozrobka/testuvannia) — запуск тестів локально і в CI
- [Цикл розробки фічі](/admin/docs/technical/rozrobka/tsykl-rozrobky-fichi) — сесія в контексті повного циклу
- [Dev-login та сідінг](/admin/docs/technical/autentyfikatsiya/dev-login-i-sid) — механіка dev-login і сідингу
