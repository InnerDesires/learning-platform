---
title: posts, pages, media
description: Контентні колекції — схеми, SEO-таби, денормалізовані автори, revalidate-хуки та конфіг завантажень
---

## posts

Файл: `src/collections/Posts/index.ts`. Ярлики «Публікація»/«Публікації»,
`useAsTitle: 'title'`, live preview + preview через `generatePreviewPath`,
`defaultPopulate: {title, slug, categories, meta.image, meta.description}`.

### Поля

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `title` | text | required, localized |
| `heroImage` | upload → `media` | localized |
| `content` | richText | required, localized; lexical з h1–h4, `BlocksFeature([Banner, Code, MediaBlock, Archive])`, обидва тулбари, HR |
| `relatedPosts` | rel → `posts` hasMany | sidebar; `filterOptions` виключає сам документ |
| `categories` | rel → `categories` hasMany | sidebar |
| `meta` (таб SEO) | group | `OverviewField`, `MetaTitleField` (hasGenerateFn), `MetaImageField` → media, `MetaDescriptionField`, `PreviewField` |
| `publishedAt` | date | sidebar, `dayAndTime`; field-hook ставить now при першій публікації |
| `authors` | rel → `users` hasMany | sidebar |
| `populatedAuthors` | array `{id, name}` | `access.update: () => false`, `admin.disabled`, readOnly |
| `slug` | slugField | `cyrillicSlugify` |

Access: create/update/delete `admin`; read `authenticatedOrPublished`.
Versions: drafts + autosave **2000 мс** (найагресивніший у проєкті),
schedulePublish, maxPerDoc 50.

### populatedAuthors: чому денормалізовано

Колекція `users` закрита на читання (admin-or-self), тож анонімний фронтенд не
може populate-нути `authors` — depth-запит поверне порожньо. Хук `afterRead`
`populateAuthors` (`src/collections/Posts/hooks/populateAuthors.ts`) на
кожному читанні дофетчує документи авторів **через Local API** (обходячи
access) і переписує `populatedAuthors` проєкцією `{id, name}` — рівно тим, що
можна показати публічно. Поле недоступне для запису (`update: () => false`) і
сховане з форми (`admin.disabled`) — це кеш, а не дані.

### revalidatePost: нюанс з previousDoc

`src/collections/Posts/hooks/revalidatePost.ts` бустить `/posts/{slug}` + тег
`posts-sitemap` при публікації і старий шлях при unpublish. Зверніть увагу:

```ts
if (previousDoc._status === 'published' && doc._status !== 'published') {
```

`previousDoc` тут розіменовується **без guard-а** (на відміну від
`revalidateCourse`, де `previousDoc?._status`). У стандартному
afterChange-флоу Payload завжди передає previousDoc, тож на практиці не
падає, — але якщо викликатимете update у нетиповому контексті або
скопіюєте цей хук для нової колекції, додайте `?.`. Хук шанує
`req.context.disableRevalidate`.

## pages

Файл: `src/collections/Pages/index.ts`. Ярлики «Сторінка»/«Сторінки»,
`defaultPopulate: {title, slug}`, live preview + preview.

### Поля

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `title` | text | required, localized |
| таб «Герой» | group `hero` | з `src/heros/config.ts`: `type` select (`none`/`highImpact`/`mediumImpact`/`lowImpact`, default `lowImpact`, required), `richText` (h1–h4), `links` (linkGroup, maxRows 2), `media` upload → media (required лише для high/mediumImpact) |
| таб «Контент» | blocks `layout` | required, localized; блоки: `cta`, `content`, `mediaBlock`, `archive`, `formBlock` (з `src/blocks/*`) |
| таб «SEO» | group `meta` | ті самі 5 полів seo-плагіна, що й у posts |
| `publishedAt` | date | sidebar + auto-set hook |
| `slug` | slugField | `cyrillicSlugify`, unique |

Access: як у posts. Versions: drafts + autosave 10000 мс, schedulePublish,
maxPerDoc 50.

Хуки: afterChange `revalidatePage` — slug `home` бустить `/`, інший —
`/{slug}`, плюс тег `pages-sitemap`; при unpublish бустить старий шлях;
шанує `disableRevalidate`. afterDelete `revalidateDelete`. Обом контентним
колекціям плагін `searchLocaleSync` дописує `backfillSearchTitleLocales`.

:::info Сторінки пласкі
nestedDocsPlugin підключений **лише до categories** — у pages немає
parent/child і URL завжди одно-сегментний. Ілюзія «/батько/дитина» — поширена
помилка.
:::

## media

Файл: `src/collections/Media.ts`. Ярлик «Медіа», **`folders: true`**
(payload-folders — папки в медіатеці), `lockDocuments: false`.

Поля: `alt` text (localized, **не** required), `caption` richText (localized,
lexical з тулбарами).

Access: create/update/delete `admin`; read `anyone` — саме це робить безпечним
`disablePayloadAccessControl: true` у Vercel Blob (роздача з CDN без
serverless-виклику; URL-и unguessable, але не автентифіковані).

### upload

```ts
upload: {
  staticDir: path.resolve(dirname, '../../public/media'),
  adminThumbnail: 'thumbnail',
  focalPoint: true,
  imageSizes: [ /* … */ ],
},
```

`staticDir: public/media` — діє лише без `BLOB_READ_WRITE_TOKEN` (локальний
дев без Blob). `focalPoint: true` — редактор задає фокусну точку кропів.

| imageSize | Розміри |
| --- | --- |
| `thumbnail` | 300w |
| `square` | 500×500 |
| `small` | 600w |
| `medium` | 900w |
| `large` | 1400w |
| `xlarge` | 1920w |
| `og` | 1200×630, crop center |

Роздача, redirects зі старих `/api/media/file/...` URL-ів і бекфіл БД —
[Медіа і Blob](/admin/docs/technical/infrastruktura/media-blob).

## categories

`src/collections/Categories.ts`. «Категорія»/«Категорії»: `title` (required,
localized) + slugField. Access: cud `admin`, read `anyone`. Єдина колекція з
nestedDocsPlugin — отримує `parent` і `breadcrumbs`.

## course-categories

`src/collections/CourseCategories.ts`. «Категорія курсів»: `title` (required,
localized), `description` textarea (localized), `image` upload → media,
slugField. Access: cud `admin`, read `anyone`. Група «Курси». Індексується
пошуком (+ `backfillSearchTitleLocales`).

## course-files

`src/collections/CourseFiles.ts`. «Файл курсу»/«Файли курсів», група «Курси».
Єдине поле — `title` (text, localized, опційне). Access: cud `admin`, read
`anyone`.

```ts
upload: {
  staticDir: path.resolve(dirname, '../../public/course-files'),
  mimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ],
},
```

Тільки PDF, PPTX і PPT; без imageSizes (це не зображення). Використовується
виключно блоком `fileStep` курсів
(див. [Колекція courses](/admin/docs/technical/model-danykh/courses)).
