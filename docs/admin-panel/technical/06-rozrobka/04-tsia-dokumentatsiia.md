---
title: Як влаштована ця документація
description: Архітектура вбудованого docs-viewer-а — файлова структура контенту, рендеринг, пошук, і як додати нову статтю.
---

Документація, яку ви зараз читаєте, — це кастомний viewer всередині адмін-панелі Payload. Контент — звичайні markdown-файли в репозиторії; рендеринг, навігація і пошук — власний код у `src/lib/admin-docs/` та `src/components/admin/Docs/`.

## Файлова структура контенту

```
docs/admin-panel/
├── manager/                     # трек для менеджерів контенту
│   └── NN-<категорія>/
│       ├── _category.json
│       └── NN-<стаття>.md
└── technical/                   # трек для розробників
    └── NN-<категорія>/
        ├── _category.json
        └── NN-<стаття>.md
```

- Числовий префікс `NN-` задає **порядок** у сайдбарі і **не входить у URL**: `05-infrastruktura/02-mihratsii.md` → `/admin/docs/technical/infrastruktura/mihratsii`. Імена без префікса сортуються після префіксованих (order 1000).
- `_category.json` — `{ "label": "...", "description": "..." }`; зламаний JSON не валить сторінку, лейбл фолбечиться на slug.
- Frontmatter статті обовʼязковий: `title` (рендериться як h1 — тому h1 у тілі не пишемо) і `description` (підзаголовок + пошук).

## Рендеринг: src/lib/admin-docs/

### loader.ts

Читає дерево з файлової системи (`CONTENT_ROOT = docs/admin-panel`): парсить `NN-` префікси, frontmatter (власний мінімальний парсер `key: value`), рекурсивно збирає категорії/статті і сортує по `order`, потім по локалі `uk`. Ключова деталь кешування:

```ts
export const getDocsTree = (track: DocsTrack): DocsTree => {
  if (process.env.NODE_ENV !== 'production') return loadTree(track)
  if (!cache[track]) cache[track] = loadTree(track)
  return cache[track]!
}
```

У **dev** дерево перечитується на кожен запит — редагуєте `.md`, оновлюєте сторінку, бачите зміни одразу. У **production** — module-level кеш на весь лайфтайм інстанса (контент іммутабельний у межах деплою). Також звідси: пошуковий індекс (`getSearchIndex`, plain-text обрізаний до 4000 символів на статтю), хлібні крихти, prev/next-навігація (`getAdjacentArticles`).

### markdown.ts

Рендерер на `marked` (`gfm: true`) з чотирма кастомними шматками:

1. **Заголовки** — id генерується транслітерацією через `slugify(text, { lower: true, strict: true, locale: 'uk' })` (кирилиця → латиниця, «Розділ» → `rozdil`), дублікати отримують суфікс `-2`, `-3`...; h2/h3 збираються в масив для «Змісту»; до кожного заголовка додається якір-лінк `#`.
2. **Колаути** — препроцесор перетворює блоки `:::info|tip|warning|danger [заголовок]` ... `:::` на `<div class="admin-docs-callout admin-docs-callout--<kind>">` з дефолтними заголовками (Примітка/Порада/Увага/Небезпека); внутрішній markdown лишається markdown-ом.
3. **Код-блоки** — обгортка `.admin-docs-code` з бейджем мови.
4. **Таблиці** — загорнуті в `<div class="admin-docs-table">` зі скролом, щоб широка таблиця не ламала лейаут.
5. **Лінки** — `https?://` отримують `target="_blank" rel="noopener noreferrer"`; внутрішні (`/admin/docs/...`) — звичайні.

### types.ts

Типи домену: `DocsTrack` (`'manager' | 'technical'` + type guard `isDocsTrack`), `DocArticle` (включно з `headings`, `html`, `plainText`, `filePath`), `DocCategory`, `DocsNavCategory` (полегшена версія для сайдбара — лише `url`/`title`), `SearchDoc`, `DocHeading`.

## Вʼюха: src/components/admin/Docs/

Viewer зареєстрований у `src/payload.config.ts` як кастомна admin-view:

```ts
views: {
  docs: {
    Component: '@/components/admin/Docs/DocsView',
    exact: false,        // одна вʼюха ловить /docs і все під ним
    path: '/docs',
  },
},
afterNavLinks: ['@/components/admin/Docs/DocsNavLinks'],
```

`DocsView` рендериться всередині `DefaultTemplate` Payload (рідний сайдбар адмінки лишається), сам робить **auth-redirect**: без `req.user` → `/admin/login?redirect=/docs`. Сегменти URL диспатчаться на `DocsHome` (корінь), `TrackHome` (трек), `ArticleView` (стаття) або `NotFoundView`. `DocsNavLinks` (`afterNavLinks`) — блок «Документація» з двома лінками під списком колекцій у навігації адмінки.

`ArticleView` — server component: знаходить статтю через `findArticle`, рендерить хлібні крихти (`findBreadcrumbs` — лейбли категорій на шляху), заголовок і description із frontmatter, тіло, праву колонку `DocsToc` і низ сторінки з prev/next-навігацією (`getAdjacentArticles` — сусіди в порядку сайдбара **всього** треку, тобто перехід працює і через межу категорій).

Тіло вставляє `DocsContent.client.tsx`: `dangerouslySetInnerHTML` (безпечно — контент є власними файлами репозиторію, не user input) плюс делегований click-хендлер, який перехоплює кліки по внутрішніх `/admin/...`-лінках і веде їх через `router.push` — перехід між статтями не перезавантажує адмінку (модифікатори Cmd/Ctrl/Shift/Alt поважаються — відкриття в новій вкладці працює).

### Сайдбар

`DocsSidebar.client.tsx` рендерить дерево треку (з `getNavTree` — полегшена структура без HTML статей), підсвічує активну статтю по `activeUrl` і містить поле пошуку. `DocsHome` — вибір треку («Посібник менеджера» / «Технічна документація»), `TrackHome` — картки категорій треку з описами з `_category.json`.

### Пошук

- Індекс: `GET /api/admin-docs/search-index` — **session-gated** (401 без сесії), віддає `getSearchIndex()` з `Cache-Control: private, max-age=300`; plain-text кожної статті обрізаний до 4000 символів (`SEARCH_TEXT_LIMIT`).
- Скоринг — **клієнтський**, у `DocsSidebar.client.tsx`: токенізований збіг по title/description/категорії/заголовках/тексту, топ-12 результатів зі сніпетами. Жодного серверного пошукового рушія — індекс маленький, це свідомо.

### Зміст і прогрес читання

`DocsToc.client.tsx` («На цій сторінці»): scrollspy на `IntersectionObserver` з `rootMargin: '-80px 0px -70% 0px'` — активним вважається верхній видимий заголовок у верхній третині вʼюпорта; плюс progress bar читання, порахований від `getBoundingClientRect()` контейнера `#admin-docs-article` на пасивному scroll-лісенері.

## Як додати статтю

1. Створіть `docs/admin-panel/<track>/<NN-категорія>/<NN-slug>.md` із frontmatter `title` + `description`.
2. Dev-сервер підхопить **одразу** (кеш вимкнений у dev) — без рестарту і без реєстрації будь-де.
3. Нова категорія = нова папка `NN-slug/` з `_category.json`.
4. Крос-посилання — **абсолютними** шляхами без `NN-` префіксів: `/admin/docs/technical/infrastruktura/mihratsii`. Відносні лінки зламаються, бо URL статті не збігається з файловим шляхом.

### Конвенції змісту

- **h1 у тілі не пишеться** — `title` із frontmatter рендериться як h1; тіло починається з тексту або h2.
- **h2/h3 — щедро**: лише вони потрапляють у «На цій сторінці».
- Технічні терміни, назви полів/колекцій/файлів — в оригіналі в бектиках: `enrollments`, `quizPassed`, `src/utilities/xp.ts`.
- Посилання на файли коду — просто інлайновий код без лінка; зовнішні `https://`-посилання відкриються в новій вкладці автоматично.
- Кожна стаття самодостатня, але не дублює сусідні — замість дублю ставиться крос-посилання.
- Manager-трек — без коду і простою мовою; technical-трек — точні шляхи, значення, фрагменти коду.

:::warning outputFileTracingIncludes — не видаляти
Viewer читає `.md` з файлової системи **в рантаймі** через динамічні `fs`-шляхи, які невидимі для file tracing Vercel. `next.config.js` тому явно включає дерево в серверний бандл:

```js
outputFileTracingIncludes: {
  '/admin/[[...segments]]': ['./docs/admin-panel/**/*'],
  '/api/admin-docs/search-index': ['./docs/admin-panel/**/*'],
},
```

Приберіть це — і на Vercel уся документація стане 404 (локально при цьому все працюватиме, бо файли на диску є).
:::

## Тести

`tests/int/admin-docs.int.spec.ts` покриває loader і рендерер (порядок, URL без префіксів, frontmatter, генерацію id заголовків). Ламаєте конвенцію іменування чи markdown-обробку — цей тест скаже перший.

## Шпаргалка «де що лежить»

| Шар | Файли |
| --- | --- |
| Контент | `docs/admin-panel/{manager,technical}/NN-*/NN-*.md` + `_category.json` |
| Завантаження/кеш/індекс | `src/lib/admin-docs/loader.ts`, `types.ts` |
| Markdown → HTML | `src/lib/admin-docs/markdown.ts` |
| Вʼюха і стилі | `src/components/admin/Docs/DocsView/` (+ `index.scss`) |
| Сайдбар + пошук | `src/components/admin/Docs/DocsSidebar.client.tsx` |
| Зміст/scrollspy | `src/components/admin/Docs/DocsToc.client.tsx` |
| Лінки в навігації адмінки | `src/components/admin/Docs/DocsNavLinks/` |
| API індексу пошуку | `src/app/api/admin-docs/search-index/route.ts` |
| Реєстрація вʼюхи | `src/payload.config.ts` (`admin.components.views.docs`) |
| Vercel tracing | `next.config.js` (`outputFileTracingIncludes`) |

## Повʼязані статті

- [Кастомізації адмін-панелі](/admin/docs/technical/arkhitektura/admin-kastomizatsii) — інші кастомні компоненти адмінки
- [payload.config.ts і плагіни](/admin/docs/technical/arkhitektura/payload-config) — конфіг, у якому все це зареєстровано
- [Цикл розробки фічі](/admin/docs/technical/rozrobka/tsykl-rozrobky-fichi) — не забудьте `generate:importmap` для нових admin-компонентів
