---
title: comments та likes
description: Колекції взаємодії — поліморфний таргетинг без FK, unique-індекси, binding-хуки та rate limits
---

Обидві колекції — у групі «Взаємодія», обидві з `lockDocuments: false` і
`timestamps: true`. Спільна риса: ціль задається парою
`targetCollection` + `targetId`, а не relationship.

## comments

Файл: `src/collections/Comments.ts`. Ярлики «Коментар»/«Коментарі»,
`useAsTitle: 'body'`, колонки `[body, author, targetCollection, createdAt]`.

### Поля

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `body` | textarea | required, **maxLength 2000** |
| `author` | rel → `users` | required, index, readOnly в адмінці |
| `targetCollection` | select | required, index; options: `posts` («Публікації»), `courses` («Курси») |
| `targetId` | number | required, index |
| `parent` | rel → `comments` | index — тред-відповіді |

### Access

| Операція | Правило | Обґрунтування |
| --- | --- | --- |
| create | `authenticated` | будь-який залогінений |
| read | `anyone` | коментарі публічні, **модерації/апрувів немає взагалі** |
| update | інлайн: лише admin | **автори НЕ редагують власні коментарі** — свідоме рішення: немає «edited»-історії, немає підміни змісту після відповідей; користувачу доступне лише видалення |
| delete | `adminOrAuthor` | автор або адмін |

### Хуки

- `beforeValidate`: `rateLimitCreate({ prefix: 'comment-create',
  userField: 'author', windowSeconds: 60, max: 10 })` — коментарі — єдина
  необмежена за кількістю користувацька колекція (лайки й enrollments
  дедуплікуються), тож 10/хв на автора проти спам-флуду.
- `beforeChange`: не-адмінський create примусово отримує
  `data.author = req.user.id` — клієнтський `author` дозволив би імперсонацію.
  Local API-виклики без user (server actions) передають автора явно.

## likes

Файл: `src/collections/Likes.ts`. Ярлики «Лайк»/«Лайки», без `useAsTitle`,
колонки `[user, targetCollection, targetId, createdAt]`.

### Поля

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `user` | rel → `users` | required, index |
| `targetCollection` | select | required, index; options: `posts`, `courses`, **`comments`** (лайкати можна й коментарі — на відміну від самих comments) |
| `targetId` | number | required, index |

### Unique-індекс

```ts
indexes: [{ fields: ['user', 'targetCollection', 'targetId'], unique: true }],
```

Один лайк на користувача на ціль — гарантія БД поверх duplicate-перевірки.

### Access

| Операція | Правило |
| --- | --- |
| create | `authenticated` |
| read | `anyone` |
| update | **`() => false`** — ніхто, навіть адмін: лайк або існує, або ні; «редагувати» його безглуздо, дозволений update лише відкрив би перевішування лайків на інші цілі |
| delete | `adminOrOwn` — анлайк собі, адмін — будь-кому |

### Хуки

- `beforeValidate[0]`: `rateLimitCreate({ prefix: 'like-create',
  windowSeconds: 60, max: 60 })` — дублікати й так відкинуться, але кожен
  цикл like/unlike коштує запис + ревалідацію кешу.
- `beforeValidate[1]`: binding (`data.user = req.user.id` для не-адмінів, до
  duplicate-перевірки) + пошук наявного лайка → `APIError('Already liked', 409)`.

## Поліморфізм без FK: цілісність на server actions

`targetCollection` + `targetId` — не relationship, тож **БД не перевіряє, що
ціль існує**, і не каскадить від неї. Цілісність тримають server actions
(`src/actions/commentsAndLikes.ts`):

- `addComment`: сесія → `body` trim, непорожній, ≤2000 (`INVALID_BODY`) →
  **ціль існує і `_status: published`** (`INVALID_TARGET`) → `parent` існує і
  належить тому самому таргету → rate limit (429 → `RATE_LIMITED`).
- `toggleLike`: видаляє наявний лайк або створює новий, потім recount
  (`liked = totalDocs === 0` після delete).
- `deleteComment`: автор або адмін (`FORBIDDEN`); каскад: лайки коментаря →
  прямі відповіді (`parent = commentId`) → сам коментар. Каскад **одного
  рівня** — відповіді на відповіді осиротіють.
- `getComments`: sort `createdAt` asc, limit 500, depth 1; лайки всіх
  коментарів одним bulk-запитом (`targetId in ids`, limit 10000) →
  `likesCount` + `userLiked`; видалений автор → `{id: 0, name: ''}`.

Зворотні каскади від контенту: `courses.beforeDelete` зачищає
comments/likes з `targetCollection='courses'`; `users.beforeDelete` — усі
коментарі/лайки користувача. **Пости каскаду не мають** — їхні
коментарі/лайки після видалення поста лишаються сиротами (див.
[Огляд моделі даних](/admin/docs/technical/model-danykh/ohliad)).

## Кеші лічильників

Публічні лічильники на картках — `src/utilities/contentCounts.ts`: raw SQL
`GROUP BY`, `unstable_cache` revalidate 120 с, теги `likes-counts-<coll>` /
`comments-counts-<coll>`, які бустить `revalidateCounts` після мутацій
(**окрім** `targetCollection='comments'` — лайки коментарів рахуються без
кешу в `getComments`). Лічильники display-only і можуть відставати — не
використовуйте їх у бізнес-логіці.

## Рендер-ланцюжок на фронтенді

```
InteractionSection (RSC)
└── InteractionClient
    ├── LikeButton
    └── CommentsSection
        ├── CommentForm
        └── CommentItem (рекурсивно для parent-тредів)
```

Секція підключена на сторінці курсу (overview) і на сторінках постів. У
публічному профілі (`/users/[id]`) останні коментарі користувача рендерить
`ProfileLatestComments` — якщо той не увімкнув `users.hideProfileComments`.

## Модерація: її немає

Grep по `approved|moderat` не знаходить нічого — коментарі публікуються
одразу, без черги апрувів, і читаються анонімами (`read: anyone`). Захисні
шари, які це компенсують:

1. rate limit створення (10/хв на автора);
2. `maxLength: 2000` на тіло;
3. перевірка server action-ом, що ціль published;
4. адмін може редагувати й видаляти будь-який коментар з адмінки
   (група «Взаємодія», `useAsTitle: body` — список читабельний);
5. автор може видалити свій.

Якщо колись знадобиться premoderation — додавайте окреме поле статусу і
фільтр у `getComments`, а не перекручуйте access.

Поведінкові деталі й відомі гострі кути (сирітство «онуків» при каскаді,
відставання кешованих лічильників) —
[Коментарі та лайки](/admin/docs/technical/biznes-logika/komentari-laiky);
механізм лімітів — [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting).
