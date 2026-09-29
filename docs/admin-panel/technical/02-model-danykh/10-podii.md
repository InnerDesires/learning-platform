---
title: Події (events, event-enrollments)
description: Колекції events і event-enrollments — поля, access, індекси, каскади видалення та як вони підключені до коментарів, пошуку й блоків
---

Функціонал подій складається з двох колекцій у групі адмінки «Події». Бізнес-правила реєстрації, час, календар і кешування розібрані окремо — [Логіка подій](/admin/docs/technical/biznes-logika/podii).

## events (`src/collections/Events.ts`)

Заходи з датою. `useAsTitle: 'title'`, колонки списку `[title, startDate, locationType, _status]`, `lockDocuments: false`.

### Access

| Операція | Правило |
| --- | --- |
| create / update / delete | `admin` |
| read | `authenticatedOrPublished` — анонім бачить лише `_status = 'published'` |

### Версії

`versions.drafts` з `autosave.interval = 10000`, `schedulePublish: true`, `maxPerDoc: 50` — як у `courses`. Slug через core `slugField({ slugify: cyrillicSlugify, position: undefined })` (дивись [Огляд моделі даних](/admin/docs/technical/model-danykh/ohliad) про `undefined` замість `''`).

### Поля

| Поле | Тип | Нотатки |
| --- | --- | --- |
| `title` | text | required, **localized** |
| `slug` | slugField | unique, з `title` |
| `description` | textarea | **localized** |
| `cover` | upload → `media` | картка/hero/OG-зображення |
| `startDate` | date | required, **index** (upcoming/past-запити); dayAndTime |
| `endDate` | date | необовʼязкове; `validate`: строго пізніше за `startDate` |
| `locationType` | select | `local` \| `virtual`, required, default `local` |
| `address` | text | **localized**; `admin.condition` лише для `local`; `validate` вимагає значення при `local` |
| `mapLink` | text | лише `local`; http(s)-валідація |
| `meetingLink` | text | лише `virtual`; `validate` вимагає значення при `virtual`; **field access `read: admin`** |
| `capacity` | number | `min: 1`, sidebar; порожньо = без ліміту |
| `registrations` | **join** → `event-enrollments` (`on: 'event'`) | віртуальне (без колонки/міграції); `defaultLimit: 50`, `defaultSort: '-enrolledAt'` |
| `publishedAt` | date | sidebar; field-`beforeChange` ставить `new Date()` при першій публікації |

Валідатори `address` і `meetingLink` — це `validate`, який Payload **не запускає для чернеток**, тож чернетку можна зберегти неповною, а от опублікувати без обовʼязкових полів формату — ні.

:::warning meetingLink — лише адміністратору через REST
Раніше поле читав будь-який залогінений користувач, але акаунт може створити кожен, тож це було фактично публічним. Тепер `access.read = admin`. Сторінки читають подію з `overrideAccess: false` (поле не потрапляє ні в JSON, ні в статичний HTML), а зареєстрованому учаснику посилання віддає server action `getEventJoinInfo` — див. [Логіка подій](/admin/docs/technical/biznes-logika/podii).
:::

### Join-поле `registrations`

Показує реєстрації на сторінці події в адмінці (з кнопкою «Додати новий» для ручного запису). Це reverse-relationship, тож читається за правилами `event-enrollments.read` (`adminOrOwn`): адміністратор бачить усе, анонім — нічого, звичайний користувач — лише свій рядок. Тест `events.int.spec.ts` фіксує, що публічне читання події не віддає чужих реєстрацій.

### Хуки

- `afterChange: [revalidateEvent]`, `afterDelete: [revalidateEventDelete]` — `src/hooks/revalidateEvent.ts`.
- `beforeDelete` — ручний каскад (див. нижче).

### Каскад при видаленні події

`event_enrollments.event_id` — `NOT NULL` з FK `ON DELETE SET NULL`, тож Postgres упав би на видаленні події. `beforeDelete` чистить у такому порядку (усе з `req` — в одній транзакції):

1. `event-enrollments` де `event = id`;
2. **лайки коментарів події** — сторінками по 1000 коментарів (`select: {}`), щоб не обрізатись на великих обсягах: `likes` де `targetCollection = 'comments'` і `targetId ∈ commentIds`;
3. `likes` де `targetCollection = 'events'` і `targetId = id`;
4. `comments` де `targetCollection = 'events'` і `targetId = id`.

Лайки/коментарі поліморфні (без FK), тому цю чистку ніхто, крім хука, не зробить.

## event-enrollments (`src/collections/EventEnrollments.ts`)

Реєстрація користувача на подію. `useAsTitle: 'id'`, колонки `[user, event, enrolledAt]`.

### Access

| Операція | Правило |
| --- | --- |
| create | `authenticated` (правила — у `beforeValidate`) |
| read | `adminOrOwn` |
| update | `admin` |
| delete | `adminOrOwn` — власник може **скасувати** свою реєстрацію напряму |

На відміну від `enrollments` тут немає прогресу, який можна підробити, тому owner-delete безпечний (як у `likes`).

### Поля та індекси

| Поле | Тип | Нотатки |
| --- | --- | --- |
| `user` | rel → `users` | required, index, **field `access.update: () => false`** |
| `event` | rel → `events` | required, index, **field `access.update: () => false`** |
| `enrolledAt` | date | readOnly; штампується в `beforeChange` при create |

`indexes: [{ fields: ['user', 'event'], unique: true }]` — у БД індекс має імʼя `user_event_idx` (адаптер не додає префікс таблиці до складених індексів).

`user` і `event` **редагуються лише при створенні** (адмін вибирає учасника вручну в drawer-і join-поля), а існуючий запис перепризначити не можна — field access `update` це блокує навіть для адміністратора. Раніше поля були `admin.readOnly`, через що ручний запис з адмінки був неможливий.

### Хуки (`beforeValidate`, порядок важливий)

1. `rateLimitCreate({ prefix: 'event-enroll-create', windowSeconds: 600, max: 30 })`.
2. Привʼязка `data.user = req.user.id` для не-адмінів + перевірка дубліката (`409`).
3. Бізнес-правила для не-адмінів (`404` не опублікована, `400` завершилась, `409` немає місць з advisory lock) — [Логіка подій](/admin/docs/technical/biznes-logika/podii).

`beforeChange` штампує `enrolledAt` при `create`.

## Звʼязки з іншими колекціями

| Що | Як подія підключена |
| --- | --- |
| `comments`, `likes` | `targetCollection` має опцію `events`; міграція `20260928_120000_event_interactions` додає значення в enum-и `enum_comments_target_collection` і `enum_likes_target_collection`; `down()` навмисно лишає значення, щоб не втратити контент |
| `users` | `Users.beforeDelete` тепер чистить і `event-enrollments` (обидві FK `NOT NULL`) |
| `search` | `events` у `searchIndexedCollections` (`src/search/localeSync.ts`) + гілка `collection === 'events'` у `beforeSync.ts` (`meta.image` = `cover`) |
| `pages`, `posts` | блок `eventsBlock` — у `layout` сторінок і в `BlocksFeature` постів |
| MCP | `events` та `event-enrollments` **не** експоновані в MCP; описи `comments`/`likes` згадують події |

## Схема БД

Міграція `20260815_120000_events`: таблиці `events`, `events_locales`, `_events_v`, `_events_v_locales`, `event_enrollments`, блокові `pages_blocks_events_block` / `_pages_v_blocks_events_block`, колонки `events_id` у `pages_rels`, `_pages_v_rels`, `search_rels`, пʼять enum-типів. `lockDocuments: false` — тож колонок у `payload_locked_documents_rels` не потрібно. Join-поле `registrations` віртуальне й нічого в схемі не додає. Про те, як міграції потрапляють у прод і чому previews їх не отримують — [Міграції](/admin/docs/technical/infrastruktura/mihratsii).

## Повʼязані статті

- [Логіка подій](/admin/docs/technical/biznes-logika/podii) — реєстрація, час, календар, кеш.
- [Comments та likes](/admin/docs/technical/model-danykh/comments-likes) — поліморфні цілі.
- [Ролі та доступ](/admin/docs/technical/autentyfikatsiya/roli-i-dostup) — зведена матриця access.
