---
title: Медіа та Vercel Blob
description: Умовне підключення blob-сховища, роздача з CDN без access control, легасі-редіректи /api/media/file/* і next/image remotePatterns.
---

Завантажені файли (колекції `media` та `course-files`) зберігаються у Vercel Blob і роздаються напряму з CDN. Локально без токена все падає назад на диск (`public/media`, `public/course-files`).

## Умовне підключення плагіна

`src/plugins/index.ts`:

```ts
const vercelBlobPlugin = process.env.BLOB_READ_WRITE_TOKEN
  ? vercelBlobStorage({
      collections: {
        [Media.slug]: { disablePayloadAccessControl: true },
        [CourseFiles.slug]: { disablePayloadAccessControl: true },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
  : null
```

Плагін реєструється **лише** коли задано `BLOB_READ_WRITE_TOKEN`. Без нього (свіжий клон, CI) аплоади йдуть на локальний диск — це штатний режим, а не помилка.

## Дві upload-колекції

| | `media` (`src/collections/Media.ts`) | `course-files` (`src/collections/CourseFiles.ts`) |
| --- | --- | --- |
| Призначення | зображення контенту, обкладинки, OG | вкладення кроків курсів |
| Поля | `alt` text (localized, не required), `caption` richText (localized) | `title` text (localized, опційний) |
| mimeTypes | будь-які зображення | `application/pdf`, PPT, PPTX |
| Варіанти розмірів | 7 (див. нижче) | немає |
| Особливості | `folders: true` (payload-folders), `focalPoint: true` | — |
| staticDir (фолбек без токена) | `public/media` | `public/course-files` |

Access в обох: create/update/delete — `admin`, read — `anyone`. Саме публічний read і робить безпечним наступний блок.

### Чому disablePayloadAccessControl: true

За замовчуванням Payload проксіює кожен файл через свій маршрут `/api/<collection>/file/<filename>`, щоб застосувати access control. Тут обидві колекції мають `read: anyone` — перевіряти нічого, тож проксі лише додає serverless-виклик на кожен файл. `disablePayloadAccessControl: true` змушує Payload зберігати в документі **прямий CDN-URL** блоба: жодної лямбди на роздачу, кешування на edge.

:::warning
Це безпечно **тільки** тому, що read публічний. URL блобів «unguessable-only» — вони не автентифікуються; якщо колись зʼявиться приватне медіа, цю опцію доведеться зняти для нього. Blob keys — це чисте імʼя файлу.
:::

## Стори

| Оточення | Store ID | Base URL |
| --- | --- | --- |
| Production | `u3oxntmyhu0z5gqa` | `https://u3oxntmyhu0z5gqa.public.blob.vercel-storage.com` |
| Dev/Preview | `1kbvjtajlddub6ss` | `https://1kbvjtajlddub6ss.public.blob.vercel-storage.com` |

Стор визначається токеном: base URL деривується з `BLOB_READ_WRITE_TOKEN` регекспом `^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$` (store id — перша група), або задається явно через `STORAGE_VERCEL_BLOB_BASE_URL`.

## Легасі-редіректи /api/*/file/*

Медіа переїхало на Blob CDN у коміті `e353834`, після чого `/api/media/file/*` і `/api/course-files/file/*` лишилися вказувати на local-disk static handler Payload — він логує "missing on the disk" і нічого не віддає, бо аплоади більше не торкаються файлової системи. Дві лінії захисту:

1. **Міграція `src/migrations/20260724_200000_backfill_blob_urls.ts`** — переписала URL, збережені в базі.
2. **Редіректи в `redirects.js`** — покривають посилання, до яких міграція дотягнутися не може: закешований браузером HTML, ISR-сторінки з попередніх деплоїв, зовнішні лінки, вже розшарені OG-зображення:

```js
const legacyFileRedirects = blobBaseUrl
  ? ['media', 'course-files'].map((collection) => ({
      source: `/api/${collection}/file/:filename`,
      destination: `${blobBaseUrl}/:filename`,
      permanent: false,
    }))
  : []
```

`redirects.js` **дублює** деривацію `blobBaseUrl` з адаптера (замість імпорту) свідомо: файл завантажується `next.config.js`-ом **до** того, як резолвляться path aliases. Дублікат тримається в синхроні з міграцією backfill — при зміні логіки адаптера оновлюйте всі три місця.

:::danger Відома вада: users.image
`users.image` — це **plain-text URL-снапшот**, а не relationship на `media`. Аватари, збережені до PR #67, зафіксували URL виду `/api/media/file/*`, які тепер 404-лять (редірект рятує лише поки живий той самий стор). Детальніше: [Аватари та налаштування профілю](/admin/docs/technical/autentyfikatsiya/avatary-i-profil).
:::

## next/image remotePatterns

`next.config.js` дозволяє `next/image` оптимізувати зображення з:

- `*.public.blob.vercel-storage.com` (https) — сам CDN;
- усіх **self-origins**: `NEXT_PUBLIC_SERVER_URL`, `https://VERCEL_PROJECT_PRODUCTION_URL`, `__NEXT_PRIVATE_ORIGIN` (дедупліковані; фолбек `http://localhost:3000`).

`NEXT_PUBLIC_SERVER_URL` стоїть **поруч** із `VERCEL_PROJECT_PRODUCTION_URL`, а не замість нього: Vercel резолвить останній у *найкоротший* production-домен, тобто під час міграції домену це старий домен — **обидва мають лишатися дозволеними**, інакше картинки одного з доменів зламаються.

## Розміри зображень і focal point

Колекція `media` (`src/collections/Media.ts`) генерує варіанти через sharp:

| Розмір | Габарити |
| --- | --- |
| `thumbnail` | 300 w (адмін-превʼю) |
| `square` | 500×500 (використовується для аватарів) |
| `small` | 600 w |
| `medium` | 900 w |
| `large` | 1400 w |
| `xlarge` | 1920 w |
| `og` | 1200×630, crop center |

Увімкнено **`focalPoint: true`** — редактор в адмінці задає точку фокусу, і кропи (`square`, `og`) центруються на ній, а не на геометричному центрі. `course-files` (PDF/PPT/PPTX) варіантів не має.

Хелпер `src/utilities/getMediaUrl.ts` пропускає абсолютні URL як є (додаючи cache tag) і докладає `getClientSideURL()` до відносних — код компонентів не мусить знати, диск це чи CDN. Адмін-превʼю використовує розмір `thumbnail` (`adminThumbnail: 'thumbnail'`).

## Як медіа потрапляє на сторінку

Шлях зображення від адмінки до браузера:

1. Редактор завантажує файл у `media` → sharp генерує варіанти → blob-адаптер кладе оригінал і варіанти в стор, у документі зберігаються **абсолютні CDN-URL**.
2. Компонент бере потрібний розмір (`sizes.medium?.url` тощо) через `getMediaUrl`.
3. `next/image` оптимізує/ресайзить на льоту — саме тому CDN-хост мусить бути в `remotePatterns`, інакше рантайм-помилка «hostname not configured».
4. OG-зображення для соцмереж — розмір `og` (1200×630), який `generateMeta`/`mergeOpenGraph` підставляють у метатеги.

Оскільки URL абсолютні і стабільні, ISR-сторінки кешують їх у HTML — зміна стора без backfill-міграції лишає старі URL у кеші до наступної ревалідації (див. чеклист нижче).

## Аватари — окремий випадок

Аватари користувачів проходять через `media` (server action `updateAvatar` зберігає `sizes.square?.url ?? url`), але в `users.image` лягає **текстовий снапшот** URL, не relationship. Ліміти: `AVATAR_MAX_BYTES` 5 MiB, MIME jpeg/png/webp/gif; `serverActions.bodySizeLimit: '5mb'` у `next.config.js` (дефолтний 1 MB мовчки різав телефонні фото); реальна прод-стеля — 4.5 MB (ліміт тіла запиту Vercel). Google-аватари — це зовнішні `googleusercontent`-URL, рендеряться сирим `<img referrerPolicy="no-referrer">`. Повний розбір: [Аватари та налаштування профілю](/admin/docs/technical/autentyfikatsiya/avatary-i-profil).

## Дрібниці, які варто знати

- **Папки в медіатеці**: `media` має `folders: true` (payload-folders) — редактори організують бібліотеку в папки; на URL файлів це не впливає.
- **MCP-доступ**: mcpPlugin відкриває `media` для AI-інструментів лише частково — `find` і `update` дозволені, `create`/`delete` — ні (`src/plugins/index.ts`).
- **Лексикал і зображення**: rich-text використовує UploadFeature — картинки в контенті це relationship на `media`, тож переносяться разом із документом і не дублюються.
- **`alt` не обовʼязковий** — поле localized, але без `required`; порожній alt у контентних зображеннях легальний (декоративні картинки).

## Чеклист при міграції домену або стора

1. Новий домен → додати в `NEXT_PUBLIC_SERVER_URL`, **не** прибираючи старий з remotePatterns (він лишається через `VERCEL_PROJECT_PRODUCTION_URL`).
2. Новий блоб-стор → новий `BLOB_READ_WRITE_TOKEN`; якщо URL-схема нестандартна — явний `STORAGE_VERCEL_BLOB_BASE_URL`.
3. Старі URL у базі → нова backfill-міграція за зразком `20260724_200000_backfill_blob_urls.ts`.
4. Памʼятати про `users.image`-снапшоти — їх backfill теж має переписати.

## Повʼязані статті

- [Деплой на Vercel](/admin/docs/technical/infrastruktura/deploi) — де живуть `BLOB_READ_WRITE_TOKEN` та інші змінні
- [posts, pages, media](/admin/docs/technical/model-danykh/posts-pages-media) — колекції `media` і `course-files`
- [Аватари та налаштування профілю](/admin/docs/technical/autentyfikatsiya/avatary-i-profil) — снапшоти аватарів і їхні наслідки
