---
title: Цикл розробки фічі
description: Покроковий чекліст від чистого git status до змердженого PR, критичні правила безпеки коду і конвенції PR-ів.
---

Канонічний шлях фічі від ідеї до продакшну. Кожен крок має причину — пропуски вилазять або в CI, або (гірше) в production-білді.

## Чекліст

### 1. Чистий старт

```bash
git status
```

**Завжди перед новою роботою.** Брудне дерево або чужа гілка — спершу розберіться (stash/commit), не змішуйте незвʼязані зміни в одному коміті. Кожна задача — окрема гілка від `main`: `feat/<slug>`, `fix/<slug>`, `test/<slug>`, `chore/<slug>`.

```bash
git checkout main && git pull && git checkout -b feat/my-feature
```

### 2. Neon-бранч сесії

Створіть бранч бази, названий **як git-гілка** (авто-cleanup при закритті PR), пропишіть **директний** connection string у `.env` — команди і правила в [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh).

### 3. Зміни схеми → типи → push

Змінили колекцію/поле в `src/collections/*`:

```bash
pnpm generate:types   # регенерує src/payload-types.ts — комітиться разом зі зміною
```

Dev-сервер на старті сам синхронізує базу через drizzle push — міграція для локальної роботи не потрібна.

### 4. Міграція вручну — в тому ж PR

Залізне правило: **схемна зміна без міграції в тому ж PR не мерджиться.** `pnpm payload migrate:create <name>` генерує забруднений diff — відредагуйте його до рівно вашої зміни і зробіть ідемпотентним (`IF NOT EXISTS`). Повний розбір: [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii).

### 5. Тести

```bash
pnpm test:int   # проти вашого сесійного бранча
pnpm lint
```

Нова доменна логіка отримує власний `tests/int/*.int.spec.ts`; зміни UI, критичні для користувача, — покриття в `tests/e2e/`. Схемні зміни варто «прокрутити» і через `pnpm build` локально — prerender зловить розсинхрон коду і типів раніше за CI.

Що і як тестується (включно з E2E): [Тестування](/admin/docs/technical/rozrobka/testuvannia).

### 6. PR

- Опис PR-а покриває **весь** набір змін. Докидаєте коміти в існуючий PR — оновіть опис: спершу `gh pr view <number>`, щоб прочитати поточний, потім редагуйте.
- CI сам форкне `ci/*` від `ci-base` і **прорепетирує вашу міграцію** перед тестами — червоний крок «Run migrations» означає, що міграція зламана або відсутня.

### 7. Merge → прод

Мердж у `main` запускає production-білд Vercel: `vercel-build` спершу застосовує міграції до prod-бази, потім білдить; фейл міграції перериває білд, попередній деплой лишається жити. Деталі: [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi). Neon-бранч сесії видалиться автоматично (`neon-cleanup.yml`).

## Критичні правила безпеки коду

Три правила з CLAUDE.md, які рецензенти перевіряють у кожному PR.

### 1. overrideAccess: false разом із user

Local API за замовчуванням **обходить** access control — передати `user` недостатньо:

```ts
// НЕПРАВИЛЬНО — user переданий, але його права проігноровані
await payload.find({ collection: 'posts', user: someUser })

// ПРАВИЛЬНО — права користувача застосовуються
await payload.find({ collection: 'posts', user: someUser, overrideAccess: false })
```

### 2. req у вкладені операції хуків

Без `req` вкладена операція виконується **поза транзакцією** батьківської — при відкаті лишиться сміття:

```ts
// НЕПРАВИЛЬНО — ламає атомарність транзакції
async ({ doc, req }) => {
  await req.payload.create({ collection: 'audit-log', data: { docId: doc.id } })
}

// ПРАВИЛЬНО — та сама транзакція
async ({ doc, req }) => {
  await req.payload.create({ collection: 'audit-log', data: { docId: doc.id }, req })
}
```

### 3. Context-прапорці проти hook loops

`update` зсередини `afterChange` без запобіжника → нескінченна рекурсія:

```ts
// НЕПРАВИЛЬНО — update знову тригерить afterChange
async ({ doc, req }) => {
  await req.payload.update({ collection: 'posts', id: doc.id, data: { views: doc.views + 1 }, req })
}

// ПРАВИЛЬНО — прапорець у context
async ({ doc, req, context }) => {
  if (context.skipHooks) return
  await req.payload.update({
    collection: 'posts', id: doc.id,
    data: { views: doc.views + 1 },
    context: { skipHooks: true }, req,
  })
}
```

Живий приклад патерну — `context.disableRevalidate` у `src/hooks/revalidateCourse.ts`.

## Додаткові конвенції

:::warning Коміти
Без `Co-Authored-By: Claude` (і будь-яких Claude-co-author рядків) у commit message — заборонено конвенцією проєкту.
:::

- **Новий admin-компонент** (custom field/view/кнопка в адмінці) → `pnpm generate:importmap`, інакше адмінка не знайде компонент за строковим шляхом. Згенерований import map комітиться.
- Типи Payload імпортуйте з `payload` (`CollectionConfig`, `Access`, `FieldHook`), власні — з `@/payload-types`.
- Тримайте робоче дерево чистим; stash або commit перед перемиканням контексту. І зупиняйте dev-сервер перед перемиканням гілок — push проти новішої схеми запропонує дропнути колонки.
- Паралельні задачі — через git worktrees, кожен зі своїми `.env`/`.env.local` (скопіювати!) і власним Neon-бранчем; ніколи два dev-сервери проти однієї бази (див. [Локальне середовище](/admin/docs/technical/rozrobka/lokalne-seredovyshche)).
- Превʼю-деплой потрібен рідко (CI покриває тести); коли таки потрібен — коміт із `[preview]` у повідомленні (див. [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi)).

## Міні-шпаргалка потоку

```bash
git status                                   # чисто?
git checkout -b feat/my-feature main
pnpm exec neonctl branches create --name feat/my-feature --parent dev \
  --project-id ancient-cell-80589995 --output json    # + connection-string → .env
pnpm dev                                     # push синхронізує схему
# ...код, зміни схеми...
pnpm generate:types
pnpm payload migrate:create my_feature       # відредагувати diff вручну!
pnpm test:int && pnpm lint
gh pr create                                 # CI репетирує міграцію
# merge → vercel-build мігрує прод → задеплоєно
```

## Повʼязані статті

- [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh) — сесійні бранчі Neon
- [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii) — як писати міграції
- [Тестування](/admin/docs/technical/rozrobka/testuvannia) — тести і CI
- [Кастомізації адмін-панелі](/admin/docs/technical/arkhitektura/admin-kastomizatsii) — admin-компоненти та import map
