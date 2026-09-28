---
title: Аватари та налаштування профілю
description: users.image як URL-снапшот, асиметрія updateAvatar/removeAvatar навколо примх better-auth, реальні ліміти розміру і решта actions профілю
---

## `users.image` — рядок-снапшот, не relationship

Поле `image` на `users` створює better-auth, і це **plain text колонка з URL**, а не upload-relationship на `media`. Наслідок: значення — знімок URL на момент збереження, який **не** слідує за змінами способу роздачі медіа.

Історія, чому це важливо: після переходу на роздачу з Blob CDN (вимкнення Payload access control на media) старі аватари зі снапшотами виду `/api/media/file/...` почали б віддавати 404 — їх довелося переписати міграцією `src/migrations/20260724_200000_backfill_blob_urls.ts` прямо в БД. Кожна майбутня зміна схеми URL медіа означає такий самий бекфіл по `users.image`.

Всі actions нижче — `src/actions/accountSettings.ts`, кожен починається з `getSession()` → `AUTH_REQUIRED`.

## `updateAvatar(formData)`

1. Валідації файлу: `file instanceof File` (→ `INVALID_FILE`); MIME з мапи `image/jpeg | png | webp | gif` (→ `INVALID_TYPE`); розмір ≤ `AVATAR_MAX_BYTES` = **5 MiB** (→ `TOO_LARGE`).
2. Upload у `media` — аватар стає звичайним медіа-документом з усіма imageSizes:

   ```ts
   const media = await payload.create({
     collection: 'media',
     data: { alt: session.user.name || session.user.email },
     file: {
       data: buffer,
       mimetype: file.type,
       name: `avatar-${session.user.id}-${Date.now()}.${ext}`,
       size: buffer.length,
     },
   })
   ```

3. Снапшот URL: `getMediaUrl(media.sizes?.square?.url ?? media.url)` — береться квадратний варіант 500×500, fallback на оригінал; порожній результат → `UPLOAD_FAILED`.
4. Запис — через **`payload.betterAuth.api.updateUser({ body: { image: url }, headers })`**, а не `payload.update`: updateUser перевипускає session-куку, тож хедер одразу показує новий аватар (без 5-хвилинного stale cookie cache — [Better Auth: інтеграція](/admin/docs/technical/autentyfikatsiya/better-auth)).

Старі media-документи попередніх аватарів не видаляються — вони лишаються в медіатеці.

### Ліміти розміру: чотири шари

| Шар | Значення | Що дає |
| --- | --- | --- |
| `AVATAR_MAX_BYTES` | 5 MiB | явна валідація в action |
| MIME-мапа | jpeg/png/webp/gif | інші типи → `INVALID_TYPE` |
| `serverActions.bodySizeLimit` | `5mb` (next.config) | дефолтний 1 MB **тихо різав** фото ще до нашого коду |
| Vercel request body | ~4.5 MB | **реальний прод-кап** — менший за наш номінальний ліміт |

Тобто в production фото між 4.5 і 5 MB відхилить платформа, а не наша валідація — з менш зрозумілою помилкою.

### Куди дивиться `getMediaUrl`

`getMediaUrl` (`src/utilities/getMediaUrl.ts`) пропускає абсолютні URL як є (з cache-tag) і доклеює `getClientSideURL` до відносних. З Blob-сховищем (`disablePayloadAccessControl: true` на media) `media.sizes.square.url` — вже абсолютний CDN-URL, тож у `users.image` лягає прямий лінк на Blob. Деталі роздачі — [Медіа та Vercel Blob](/admin/docs/technical/infrastruktura/media-blob).

## `removeAvatar()` — чому НЕ через Better Auth

```ts
// better-auth's updateUser drops null fields, so clear the image via Payload;
// the client refreshes the session cookie cache afterwards.
await payload.update({ collection: 'users', id: Number(session.user.id), data: { image: null } })
```

`betterAuth.api.updateUser` **мовчки відкидає null-поля** — «видалити аватар» через нього неможливо. Тому запис іде повз Better Auth, через `payload.update`. Ціна обхідного шляху: session-кука не перевипускається, отже **клієнт після успіху сам освіжає cookie cache** — інакше хедер ще до 5 хв показував би видалений аватар.

## Google-аватари

Вхід через Google кладе в `image` URL виду `lh3.googleusercontent.com/...` (Better Auth копіює його з профілю провайдера). Ці URL не в `remotePatterns` next/image (там лише `*.public.blob.vercel-storage.com` і self-origins), тож пропустити їх через `next/image` не можна — на профілі вони рендеряться сирим `<img referrerPolicy="no-referrer">`. `no-referrer` важливий: із заголовком referrer стороннього сайту Google інколи відповідає 403 на аватар.

Дві категорії значень `users.image` співіснують у базі:

| Джерело | Вигляд URL | Через що рендериться |
| --- | --- | --- |
| `updateAvatar` | `https://<store>.public.blob.vercel-storage.com/...-500x500.<ext>` | `next/image` (у remotePatterns) |
| Google OAuth | `https://lh3.googleusercontent.com/...` | сирий `<img referrerPolicy="no-referrer">` |

## Решта actions профілю

| Action | Валідації | Запис |
| --- | --- | --- |
| `updateAbout(about)` | string, trim, ≤ 500 (`TOO_LONG`); порожній рядок → `null` | `payload.update` `about` |
| `updateHideProfileComments(hide)` | strict boolean (`INVALID_VALUE`) | `payload.update`; вмикає приховання блоку коментарів на публічному профілі (див. [Коментарі та лайки: server actions](/admin/docs/technical/biznes-logika/komentari-laiky)) |
| `updateSocialLinks(links)` | масив ≤ 8; platform з білого списку; url непорожній, ≤ 300 символів, парситься `new URL`, протокол лише `http:`/`https:` — інакше `INVALID_LINKS`/`INVALID_URL` (вся операція атомарно відхиляється) | `payload.update` `socialLinks` |
| `setInitialPassword(newPassword)` | довжина **8–128** (`INVALID_PASSWORD`) | див. нижче |

Білий список платформ дзеркалить select-опції поля `socialLinks` колекції `users`:

```ts
const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'telegram', 'youtube',
  'tiktok', 'linkedin', 'x', 'website']
const MAX_SOCIAL_LINKS = 8
const MAX_URL_LENGTH = 300
```

Всі ці записи йдуть через `payload.update`, тобто **повз** Better Auth — а отже підпадають під stale cookie cache: дані в сесійній куці можуть відставати до 5 хв. Для about/соцлінок це неважливо (їх читають зі свіжого документа users), для аватара — важливо, тому там окремі шляхи (див. вище).

### `setInitialPassword`: лише перший пароль

Для Google-акаунтів без пароля. Спершу перевірка, що credential-акаунта ще немає:

```ts
const credential = await payload.find({
  collection: 'accounts',
  where: { and: [{ user: { equals: userId } }, { providerId: { equals: 'credential' } }] },
  limit: 1, depth: 0,
})
if (credential.totalDocs > 0) return { success: false, error: 'HAS_PASSWORD' }

await payload.betterAuth.api.setPassword({ body: { newPassword }, headers: await headers() })
```

`setPassword` призначений тільки для акаунтів без credential-провайдера; **зміна** існуючого пароля мусить іти через `changePassword` з поточним паролем — інакше викрадена сесія дозволяла б перехопити акаунт, просто переписавши пароль. `HAS_PASSWORD` — відмова, яку UI показує як «у вас уже є пароль».

## Зведення кодів помилок

| Код | Action | Причина |
| --- | --- | --- |
| `AUTH_REQUIRED` | всі | немає сесії |
| `INVALID_FILE` | updateAvatar | у formData немає `File` |
| `INVALID_TYPE` | updateAvatar | MIME поза jpeg/png/webp/gif |
| `TOO_LARGE` | updateAvatar | > 5 MiB |
| `UPLOAD_FAILED` | updateAvatar | media створено, але URL не зібрався |
| `INVALID_ABOUT` / `TOO_LONG` | updateAbout | не рядок / > 500 символів |
| `INVALID_VALUE` | updateHideProfileComments | не boolean |
| `INVALID_LINKS` | updateSocialLinks | > 8 елементів, невідома платформа, порожній/задовгий url |
| `INVALID_URL` | updateSocialLinks | не парситься `new URL` або протокол ≠ http(s) |
| `INVALID_PASSWORD` | setInitialPassword | довжина поза 8–128 |
| `HAS_PASSWORD` | setInitialPassword | credential-акаунт уже існує |

Усі коди — стабільні рядки; переклад у людські повідомлення живе на клієнті (`src/utilities/i18n.ts`).

:::info Чому actions, а не REST
`users.update` для не-адміна обрізаний до `allowedFields: ['name']` (див. [Ролі та контроль доступу](/admin/docs/technical/autentyfikatsiya/roli-i-dostup)), тож поля профілю через REST не редагуються в принципі. Server actions — єдиний шлях, і кожен несе власну валідацію замість довіри до клієнта.
:::

## Пов'язане

- Cookie cache і його протухання: [Better Auth: інтеграція](/admin/docs/technical/autentyfikatsiya/better-auth)
- Медіа, imageSizes і Blob CDN: [posts, pages, media](/admin/docs/technical/model-danykh/posts-pages-media), [Медіа та Vercel Blob](/admin/docs/technical/infrastruktura/media-blob)
- Схема `users`: [users та auth-колекції](/admin/docs/technical/model-danykh/users-i-auth)
