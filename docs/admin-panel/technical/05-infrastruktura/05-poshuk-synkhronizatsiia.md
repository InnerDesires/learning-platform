---
title: Пошук — синхронізація локалей
description: Чому plugin-search породжує «привидні» картки в мультилокальному сетапі, як їх лікують backfill-плагін і read-side hack, і як безпечно реіндексувати.
---

Повнотекстовий пошук побудований на `@payloadcms/plugin-search`: плагін тримає окрему колекцію `search`, куди afterChange-хуком синхронізує документи чотирьох колекцій — `searchIndexedCollections = ['posts', 'courses', 'course-categories', 'pages']` (`src/search/localeSync.ts`). Ця стаття — розбір головної болячки плагіна в мультилокальному проєкті і трьох шарів обходу, які тут напрацьовані.

## Структура search-рядка

Понад стандартні поля плагіна (`title`, `doc` — polymorphic relationship на джерело, `priority`) `src/search/fieldOverrides.ts` додає:

| Поле | Тип | Навіщо |
| --- | --- | --- |
| `slug` | text | побудова URL картки без depth-запиту |
| `collectionType` | text, indexed, readOnly | тип джерела для роутингу картки і dedupe |
| `meta` | group: `title`, `description`, `image` (upload→media) | сніпет і превʼю у видачі |
| `categories` | array `{ relationTo, categoryID, title }` | бейджі категорій без join-ів |

Шлях запису при кожному сейві індексованого документа:

```
save doc (req.locale = X)
  → plugin-search sync hook: upsert search-рядка, localized-поля ЛИШЕ в локалі X
  → beforeSyncWithSearch: мапінг колекційних полів у meta/categories
  → backfillSearchTitleLocales (наш): дозапис title у решту локалей
```

## Проблема: односторонній запис локалей

Контент локалізований (uk — дефолт, en — друга локаль, `fallback: true`). Але sync-хук plugin-search пише localized-поля search-документа **лише для локалі запиту, який зберіг документ** (`req.locale`). А Payload при читанні **не фолбечить з дефолтної локалі на інші** для search-рядків.

Наслідок: документ, збережений редактором з en-локалі адмінки, отримує search-рядок, у якого `title` заповнений лише в en. Пошук з uk-локалі бачить рядок із порожнім `title` — у видачі зʼявляється **«привидна» картка** без назви (або документ узагалі невидимий для uk-запиту по title). Саме такий ghost зʼявився на проді 2026-07-24.

### Статус upstream

Save-path **не виправлений** у plugin-search навіть у 4.0-canary — хук досі пише лише `req.locale`. Що виправлено: з версії **3.61.1** реіндекс з адмінки (кнопка **ReindexButton** плагіна на списку колекції `search`, `dist/Search/ui/ReindexButton`) проходить **по всіх локалях**. Тобто разова санація можлива кнопкою, але кожен наступний сейв документа знову створює однолокальний рядок — тому потрібні власні шари нижче.

## Шар 1: searchLocaleSync (write-side backfill)

Кастомний плагін `searchLocaleSync` (`src/search/localeSync.ts`) реєструється в `src/plugins/index.ts` **одразу після** `searchPlugin` — порядок критичний, бо його хук `backfillSearchTitleLocales` має опинитися в `afterChange` **після** власного sync-хука плагіна (хуки виконуються в порядку реєстрації, а бекфілити можна лише той рядок, який sync уже створив/оновив):

```ts
// src/plugins/index.ts — фрагмент масиву plugins
searchPlugin({ collections: searchIndexedCollections, beforeSync: beforeSyncWithSearch, ... }),
searchLocaleSync,   // ← ОДРАЗУ після; не пересувати
```

Сам плагін — чиста трансформація конфіга: для кожної колекції зі `searchIndexedCollections` доклеює `backfillSearchTitleLocales` в кінець її `afterChange`.

Механіка `backfillSearchTitleLocales`:

1. **Skip** для `_status === 'draft'` і `deletedAt` (чернетки плагін не синхронізує, trashed — видаляє).
2. Skip, якщо в конфізі немає `localization`.
3. `syncedLocale = req.locale || defaultLocale`; missing locales = решта `localeCodes`.
4. Знаходить search-рядок по `doc.relationTo` + `doc.value` (= колекція + id джерела).
5. **Перечитує джерело з `locale: 'all'`** і `select: { title: true }` — отримує обʼєкт `{ uk: ..., en: ... }` (або plain string, якщо поле нелокалізоване — тоді той самий рядок для всіх локалей).
6. Для кожної відсутньої локалі, де в джерела є title, — `payload.update` search-рядка з цією `locale`.

:::warning Бекфілиться лише title
`meta.title`, `meta.description`, `meta.image` і `categories` у search-рядку **залишаються однолокальними** — їх backfill не чіпає. Для видачі це прийнятно (title — головне), але памʼятайте про це, читаючи search-дані напряму.
:::

## Шар 2: read-side hack на сторінці пошуку

`src/app/(frontend)/[locale]/search/page.tsx` страхується від рядків, які backfill ще/вже не покрив:

- запит до `search` виконується з **`fallbackLocale: locale === 'uk' ? 'en' : 'uk'`** — протилежна локаль як фолбек, щоб рядок з title лише в іншій локалі не рендерився порожнім;
- результати **дедуплікуються** по ключу `` `${collectionType}:${originalDocId}` `` — застарілі рядки можуть дублювати той самий документ.

Сам запит: limit 12, `or` по `title`, `meta.description`, `meta.title`, `slug` (`like`), без ранжування і пагінації.

## Свідомі обмеження реалізації

Щоб не будувати зайвого, зафіксовано межі поточного пошуку:

- **Без ранжування** — порядок результатів визначає БД, не релевантність; `priority`-поле плагіна не використовується.
- **Без пагінації** — рівно 12 результатів; для поточного обсягу контенту достатньо.
- **`like`-матчинг, не повнотекстовий** — немає стемінгу/морфології; українські словоформи матчаться лише префіксно.
- **Однолокальні `meta` і `categories`** у search-рядках — сніпет може показатись мовою збереження документа.

Якщо контенту стане суттєво більше, наступний крок — Postgres FTS або зовнішній рушій, але це окремий проєкт, не твік поточного.

## beforeSync: що потрапляє в індекс

`beforeSyncWithSearch` (`src/search/beforeSync.ts`) мапить документ у search-рядок; додаткові поля індексу оголошені в `src/search/fieldOverrides.ts` (`slug`, `collectionType` indexed/readOnly, група `meta`, масив `categories`).

| Колекція | Мапінг |
| --- | --- |
| `courses` | `meta` з `title`/`description`/`heroImage`; категорія — `findByID` до `course-categories` з `disableErrors` + `select: title`; відсутня → `console.error` і `categories: []` |
| `course-categories` | аналогічно курсам |
| `pages` | `meta.title = meta?.title \|\| title` |
| `posts` (default-гілка) | spread SEO-`meta`; категорії по одній через `findByID` |

## Реіндекс

### Кастомний endpoint

`POST /api/reindex-search` (`src/app/api/reindex-search/route.ts`), автентифікація — хедер `x-reindex-secret`, який має дорівнювати `CRON_SECRET` (інакше 401). Алгоритм:

1. Видаляє **всі** search-документи (limit 10000).
2. Re-save (`payload.update` з `data: {}`) кожного документа джерельних колекцій, щоб тригернути sync-хуки: `posts`/`courses`/`pages` — **лише published** і завжди з **`draft: false`**; `course-categories` — всі (вони без drafts).
3. Повертає `{ ok, deleted, reindexed: { posts, courses, courseCategories, pages } }`.

:::danger Чому draft: false обовʼязковий
Re-save документа, у якого є новіший pending draft, **без** `draft: false` промоутнув би статус цього драфта — документ **тихо розпублікувався б**. Саме тому endpoint перебирає лише published-доки і явно фіксує `draft: false` на кожному update.
:::

Re-saves ідуть без явної `locale` → sync пише дефолтну (uk), а en доїжджає через `backfillSearchTitleLocales` (знову ж — лише title).

Виклик endpoint-а:

```bash
curl -X POST -H "x-reindex-secret: $CRON_SECRET" \
  https://<домен>/api/reindex-search
```

### Кнопка в адмінці

Альтернатива для разової санації (наприклад, лікування ghost-карток на проді): вбудований **ReindexButton** плагіна на списку колекції `search` в адмінці — з 3.61.1 він реіндексує по всіх локалях. Кастомний endpoint лишається для автоматизації (cron/CLI) і дає контроль над draft-семантикою.

## Тести і видалення документів

Поведінка backfill-а зафіксована інтеграційним тестом `tests/int/search-locale-sync.int.spec.ts` — при зміні логіки синхронізації починайте з нього.

Видалення і trash обробляє сам plugin-search: search-рядок видаляється разом із джерелом; unpublish (перехід у draft) теж прибирає рядок — тому «зник з пошуку після редагування» найчастіше означає, що документ ненавмисно розпублікували.

## Шпаргалка діагностики

| Симптом | Причина | Лікування |
| --- | --- | --- |
| Картка без назви у видачі | search-рядок з title лише в іншій локалі | кнопка Reindex або `POST /api/reindex-search`; перевірити, що `searchLocaleSync` стоїть одразу після `searchPlugin` |
| Документ дублюється у видачі | застарілі search-рядки | dedupe на сторінці вже ховає; реіндекс чистить базу |
| Опис/категорія порожні в одній локалі | backfill покриває лише title | очікувано; за потреби — реіндекс кнопкою (all-locale) |
| Документ зник з пошуку після реіндексу | він не published | очікувано: endpoint індексує лише published |

## Повʼязані статті

- [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi) — де живе `CRON_SECRET`
- [payload.config.ts і плагіни](/admin/docs/technical/arkhitektura/payload-config) — порядок плагінів у `src/plugins/index.ts`
