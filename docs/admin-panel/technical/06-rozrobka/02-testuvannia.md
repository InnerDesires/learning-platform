---
title: Тестування
description: Інтеграційні тести Vitest, E2E на Playwright зі снапшотами, CI-конвеєр із репетицією міграцій і браузерна перевірка адмінки.
---

Два рівні тестів: інтеграційні (Vitest, проти реальної бази) та E2E (Playwright, проти production-білда). Обидва ганяються в CI на кожен PR проти свіжого форку бази.

## Інтеграційні тести (Vitest)

```bash
pnpm test:int
```

Конфіг `vitest.config.mts`:

- `include: ['tests/int/**/*.int.spec.ts']` — тести живуть у `tests/int/`;
- `environment: 'node'`, `pool: 'forks'` із `singleFork: true` — всі тести в одному форку, послідовно (вони ділять одну базу);
- `hookTimeout: 60000`, `testTimeout: 30000`;
- `server.deps.inline: ['payload-auth']`.

Тести працюють проти бази з `DATABASE_URL` — тобто локально проти **вашого сесійного Neon-бранча**, тієї самої, що й dev-сервер.

Поточний набір у `tests/int/` покриває: access control (`access-control`, `user-default-role`), доменну логіку курсів (`course-completion`, `complete-step`, `quiz-attempts`, `quiz-answer-validation`, `courses`, `enrollments`, `courseJsonImport`), каскадні видалення (`courses-cascade-delete`, `users-cascade-delete`), взаємодію (`comments`, `likes`), інфраструктурні механізми (`rate-limit`, `search-locale-sync`, `certificate-token`, `cyrillicSlugify`, `media-block`, `admin-docs`, `api`). Новій фічі — новий `*.int.spec.ts` поруч.

### vitest.setup.ts і заборона DATABASE_URL у .env.local

```ts
import { config } from 'dotenv'

config({ path: '.env.local', override: true })
config({ path: '.env' })
```

`override: true` означає: значення з `.env.local` **перебивають усе**, включно зі змінними, вже присутніми в оточенні процесу. Саме тому `DATABASE_URL` у `.env.local` заборонений залізно: він мовчки переспрямує тести (і не тільки) на інший бранч, навіть якщо ви явно передали `DATABASE_URL=... pnpm test:int`. Історія питання: [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh).

## E2E (Playwright)

```bash
pnpm test:e2e             # повний прогін
pnpm test:e2e:snapshots   # перезапис візуальних базлайнів (лише smoke-locale-content)
```

Ключове з `playwright.config.ts` і `package.json`:

- `webServer`: `pnpm build && pnpm start --port 3100` — E2E тестує **production-білд**, не dev-сервер; `baseURL: http://localhost:3100`;
- env вебсервера фіксує `NEXT_PUBLIC_SERVER_URL` і `NEXT_PUBLIC_BETTER_AUTH_URL` на `http://localhost:3100`;
- **`RATE_LIMIT: 'false'`** — всі E2E-запити летять з одного IP, без цього прапорця rate limiting (який інакше вмикається у production-білді) почав би віддавати 429 (див. [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting));
- запуск через `NODE_OPTIONS="--import=tsx/esm"` — тестові хелпери на TypeScript імпортуються в ESM-режимі;
- сід/клінап тестових користувачів — `tests/helpers/seedUser.ts`;
- CI ставить лише chromium: `pnpm exec playwright install chromium --with-deps`.

Сьютні файли в `tests/e2e/`: `admin.e2e.spec.ts` (адмінка), `frontend.e2e.spec.ts`, `registration.e2e.spec.ts` (OTP-флоу), `smoke-locale-content.e2e.spec.ts` (+ директорія `*-snapshots` з візуальними базлайнами).

### Візуальні снапшоти

Смоук `tests/e2e/smoke-locale-content.e2e.spec.ts` порівнює скриншоти зі збереженими базлайнами. Базлайни **платформо-суфіксовані**: локально записуються `*-chromium-darwin.png` (`pnpm test:e2e:snapshots`), а CI порівнює з `*-chromium-linux.png`. Linux-базлайни можна записати лише на linux-раннері — якщо їх немає, крок «Bootstrap missing Linux visual baselines» у `e2e.yml` записує їх і **пушить коміт у PR-гілку**, що тригерить свіжий прогін уже з enforcement-ом.

## Що саме ганяє CI на кожен PR

| Воркфлоу | Джоби | Кроки навколо тестів |
| --- | --- | --- |
| `ci.yml` | Integration tests + окремий Lint | sweep протухлих Neon-бранчів → форк `ci/<run_id>` → migrate → `pnpm test:int` → delete branch |
| `e2e.yml` | Playwright E2E | те саме + `playwright install chromium` → seed (`tests/helpers/seedUser.ts`) → bootstrap linux-базлайнів за потреби → `pnpm test:e2e` → cleanup → delete branch |

Обидва воркфлоу мають `concurrency` з `cancel-in-progress: true` — швидкі повторні пуші скасовують попередні прогони, а їхні `always()`-кроки видалення бранчів усе одно виконуються, тож Neon-ліміт бранчів не забивається.

## CI-конвеєр

Обидва воркфлоу (`.github/workflows/ci.yml` — інтеграційні + lint, `.github/workflows/e2e.yml` — Playwright) на кожен PR:

1. Замітають протухлі Neon-бранчі (`ci/*` > 2 год; інші > 24 год без відкритого PR).
2. Форкають `ci/<run_id>` від **`ci-base`** (migration-managed, з чистим `payload_migrations`).
3. **`pnpm payload migrate`** — репетиція міграцій PR-а до мерджу. Зламана або відсутня міграція валить CI тут, а не production-деплой.
4. Ганяють тести (E2E перед цим сідить дані і білдить застосунок — prerender білда додатково валідує узгодженість коду і схеми).
5. Видаляють бранч `always()` — і на успіху, і на фейлі.

`ci-base` оновлюється воркфлоу `refresh-ci-base.yml` на кожен push у `main`. Повна механіка і причини (чому не форк від `dev`): [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii).

Фейл E2E деплоїть Playwright-репорт на GitHub Pages і апсертить коментар зі статусом у PR.

### Локальна репетиція CI

Push вимкнено умовою `push: !process.env.CI`, тому відтворити CI-поведінку локально можна так:

```bash
CI=1 pnpm payload migrate    # проти свіжого форку ci-base, не проти сесійного бранча!
```

:::danger
Ніколи не запускайте `payload migrate` проти свого **сесійного** бранча або `dev` — їхній `payload_migrations` містить `batch=-1` від drizzle push, і команда зависне на інтерактивному промпті.
:::

## Практичні поради

- **Прогнати один файл**: `pnpm vitest run --config ./vitest.config.mts tests/int/<file>.int.spec.ts` — швидше за повний сьют, коли ітеруєтесь над однією фічею.
- **Тести проти окремої бази**: створіть додатковий Neon-бранч і передайте його явно — але памʼятайте, що значення з `.env.local` перебʼє ваш override (тому там і заборонено `DATABASE_URL`).
- **Пишіть тести самодостатніми**: сьют працює `singleFork` послідовно проти спільної бази — фікстури створюйте і прибирайте у своєму ж файлі, не покладайтесь на залишки інших тестів.
- **Оновлення візуальних базлайнів**: після навмисної зміни UI — `pnpm test:e2e:snapshots` локально (перезапише darwin), а linux-версії CI перезапише сам після видалення старих `*-chromium-linux.png`.

## Коли тести фейлять дивно

| Симптом | Найімовірніша причина |
| --- | --- |
| Інтеграційні тести бачать «чужі» дані або порожню базу | `DATABASE_URL` у `.env.local` перебив ваш (`override: true`) — приберіть його звідти |
| Плаваючі `relation does not exist` | `-pooler` у хості connection string (див. [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh)) |
| E2E отримують 429 | забули `RATE_LIMIT=false` при ручному запуску production-білда |
| Візуальний тест падає лише в CI | немає/застарілі `*-chromium-linux.png` базлайни — bootstrap-крок запише їх сам |
| `payload migrate` завис у локальній репетиції | запустили проти push-керованого бранча (`batch=-1`), а не форку `ci-base` |
| E2E-сервер не стартує | порт 3100 зайнятий, або у worktree не скопійовані env-файли |

## Браузерна перевірка адмінки

Для ручної/агентної перевірки UI (браузерна панель, автоматизація):

- вхід — одна навігація на `http://localhost:3000/api/dev-login?redirect=/admin` (див. [Dev-login та сідінг](/admin/docs/technical/autentyfikatsiya/dev-login-i-sid));
- **синтетичні кліки координатами не тригерять React-обробники** в адмін-панелі Payload — емуляція миші на рівні ОС/скриншотів промахується повз синтетичну подієву систему React. Робочий обхід: виконати `element.click()` через JavaScript у контексті сторінки;
- тестовим користувачам, створюваним у скриптах, ставте pre-verified email (як робить `tests/helpers/seedUser.ts`), інакше впретеся в OTP-гейт реєстрації.

## Шпаргалка

| Що | Команда | База |
| --- | --- | --- |
| Інтеграційні локально | `pnpm test:int` | сесійний Neon-бранч (`.env`) |
| E2E локально | `pnpm test:e2e` | сесійний Neon-бранч; сервер на :3100 |
| Перезапис снапшотів | `pnpm test:e2e:snapshots` | там само (darwin-базлайни) |
| CI | автоматично на PR | ефемерний `ci/<run_id>` від `ci-base` |

## Повʼязані статті

- [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii) — що саме репетирує CI
- [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh) — бранчі, `.env.local`-правило
- [Цикл розробки фічі](/admin/docs/technical/rozrobka/tsykl-rozrobky-fichi) — тести в чеклісті фічі
