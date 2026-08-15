---
title: "Коментарі та лайки: server actions"
description: Усі actions з commentsAndLikes.ts — bulk-лайки, валідації addComment, однорівневий каскад deleteComment, toggleLike і кешовані лічильники
---

## Модель у двох словах

`comments`: `body` (maxLength 2000), `author` → users, `targetCollection` (`posts` | `courses`), `targetId` (number), `parent` → comments (тредінг). `likes`: `user`, `targetCollection` (`posts` | `courses` | **`comments`**), `targetId`, унікальний індекс (user, targetCollection, targetId). Повні схеми — [comments та likes](/admin/docs/technical/model-danykh/comments-likes).

**Модерації немає взагалі** — коментар публікується одразу, read — `anyone`. Захист складається з rate limits (10 коментарів/хв, 60 лайків/хв — [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting)), `maxLength`, і права видалення (автор або адмін).

Усі користувацькі шляхи — server actions у `src/actions/commentsAndLikes.ts`; REST-мутації обмежені access-правилами колекцій (див. [Ролі та контроль доступу](/admin/docs/technical/autentyfikatsiya/roli-i-dostup)).

## `getComments(targetCollection, targetId)`

- `find` comments по target: `sort: 'createdAt'` (asc), `limit: 500`, `depth: 1` (щоб мати автора).
- **Bulk-запит лайків**: замість N запитів на коментар — один:

  ```ts
  const allCommentLikes = await payload.find({
    collection: 'likes',
    where: {
      and: [
        { targetCollection: { equals: 'comments' } },
        { targetId: { in: commentIds } },
      ],
    },
    limit: 10000,
    depth: 0,
  })
  // один прохід: likeCounts[tid]++ та userLikes.add(tid) якщо like.user === поточний userId
  ```

- Автор, якого не вдалося розгорнути (видалений юзер), мапиться в `{ id: 0, name: '' }` — UI показує «порожнього» автора, а не падає.
- Повертає `CommentWithMeta[]`: `{ id, body, author: { id, name, image }, parent, likesCount, userLiked, createdAt }` + `total: result.totalDocs`.

Дія доступна і анонімам (read — `anyone`); `userLiked` для них завжди `false`.

## `addComment(targetCollection, targetId, body, parentId?)`

Валідації по черзі, коди помилок — стабільні рядки, які клієнт перекладає:

1. Сесія → `AUTH_REQUIRED`.
2. `body.trim()` непорожній і ≤ 2000 → інакше `INVALID_BODY`.
3. **Target існує і published**: `find` по цільовій колекції з `{ id }, { _status: { equals: 'published' } }` → інакше `INVALID_TARGET`. Не можна коментувати чернетки чи неіснуючі документи.
4. **Parent у тому ж target**: якщо передано `parentId` — parent мусить існувати **і** мати ті самі `targetCollection` + `targetId` → інакше `INVALID_TARGET`. Блокує «пересадку» відповіді під чужий пост.
5. `payload.create` — 429 з хука колекції (`rateLimitCreate`, 10/60 с) мапиться в `RATE_LIMITED`.

Після створення — `revalidateCounts('comments', targetCollection)` і повернення готового `CommentWithMeta` (з fallback на дані сесії, якщо `depth` не розгорнув автора).

Примітка: хук колекції `comments` на create примусово ставить `author = req.user.id` для не-адмінів — навіть якби хтось викликав REST напряму, авторство не підробити.

## `deleteComment(commentId)`

1. Сесія → `AUTH_REQUIRED`; коментар не знайдено → `NOT_FOUND`.
2. Право: `authorId === userId` **або** юзер має роль `admin` (перевірка по **свіжому** `findByID` користувача, не по даних сесії — cookie cache може відставати) → інакше `FORBIDDEN`.
3. Каскад — три послідовні операції:

   ```ts
   await payload.delete({
     collection: 'likes',
     where: { and: [{ targetCollection: { equals: 'comments' } }, { targetId: { equals: commentId } }] },
   })
   await payload.delete({ collection: 'comments', where: { parent: { equals: commentId } } })
   await payload.delete({ collection: 'comments', id: commentId })
   ```

   Тобто: лайки самого коментаря → **прямі діти (один рівень)** → сам коментар.

:::warning Онуки осиротіють
Каскад не рекурсивний: відповіді на відповіді (онуки) залишаються в БД з `parent`, що вказує на видалений документ, — і їхні лайки теж. UI, що будує тред від кореня, їх не покаже, але рядки живуть. Практично тредінг у UI неглибокий, тож це прийнято свідомо; при чистці даних варто пам'ятати.
:::

## `toggleLike(targetCollection, targetId)` і `getLikeInfo`

`toggleLike` — сесія (інакше `AUTH_REQUIRED`), далі toggle:

```ts
const existing = await payload.find({ collection: 'likes', where: { and: [user, targetCollection, targetId] }, limit: 1 })

if (existing.totalDocs > 0) {
  await payload.delete({ collection: 'likes', id: existing.docs[0]!.id })   // unlike
} else {
  await payload.create({ collection: 'likes', data: { user: userId, targetCollection, targetId } })
  // APIError 429 з rateLimitCreate → RATE_LIMITED
}

const { totalDocs: count } = await payload.count({ ... })   // recount після мутації
return { success: true, liked: existing.totalDocs === 0, count }
```

`liked` — «лайкнуто тепер», якщо **до** кліку лайка не було. Дубль-create додатково блокує унікальний індекс (user, targetCollection, targetId) з APIError `'Already liked'` 409. `targetCollection` тут ширший, ніж у коментарів: `posts | courses | comments`.

`getLikeInfo` — паралельно `count` (всього) + `find limit 1` (чи лайкнув поточний юзер); для анонімів другий запит не робиться.

### Коди помилок actions

| Код | Означає | Де виникає |
| --- | --- | --- |
| `AUTH_REQUIRED` | немає сесії | addComment, deleteComment, toggleLike |
| `INVALID_BODY` | порожній або > 2000 символів | addComment |
| `INVALID_TARGET` | target не published/не існує, або parent з іншого target | addComment |
| `RATE_LIMITED` | 429 з хука колекції | addComment (10/60 с), toggleLike (60/60 с) |
| `NOT_FOUND` | коментар не існує | deleteComment |
| `FORBIDDEN` | не автор і не адмін | deleteComment |

## `revalidateCounts`: пропуск для comments

```ts
function revalidateCounts(kind: 'likes' | 'comments', targetCollection: LikeTargetCollection) {
  if (targetCollection === 'posts' || targetCollection === 'courses') {
    revalidateTag(`${kind}-counts-${targetCollection}`)
  }
}
```

Теги існують лише для posts/courses — лайки **коментарів** не мають кешованих лічильників (вони завжди читаються наживо через `getComments`), тож ревалідовувати нічого; виклик мовчки пропускається.

## Кешовані лічильники — `src/utilities/contentCounts.ts`

Для списків (каталог курсів, стрічка постів) поштучні `count` були б дорогими, тому є `getCachedLikesCounts(targetCollection)` / `getCachedCommentsCounts(targetCollection)` — один raw SQL на **всю** колекцію:

```sql
SELECT target_id, COUNT(*) AS count
FROM likes           -- або comments
WHERE target_collection::text = ${targetCollection}
GROUP BY target_id
```

Результат — мапа `Record<targetId, count>`, загорнута в `unstable_cache` з `revalidate: 120` і тегами `likes-counts-<coll>` / `comments-counts-<coll>` (саме їх смикає `revalidateCounts`). Поруч — `getCachedEnrollmentStats()` (enrolled/completed по курсах, 60 с, тег `course-enrollment-stats`). Хелпер `runRows` нормалізує відповідь драйвера (масив або `{ rows }`).

:::info Display-only
Кешовані лічильники можуть відставати до 120 с (або до найближчого `revalidateTag` після мутації). Живий стан «лайкнув я чи ні» **завжди** тягнеться клієнтськи через actions — тому кнопка лайка коректна навіть при застарілому числі поруч.
:::

## А що з REST?

Server actions працюють через Local API (за замовчуванням обходить access control — тому кожен action несе власні перевірки), але REST-поверхня колекцій теж жива, і її обмежують access-правила: `comments.update` — admin-only (юзер не може відредагувати навіть свій коментар — лише видалити), `likes.update` — `() => false` для всіх. На create обидві колекції мають хуки, що для не-адмінів примусово ставлять `author`/`user = req.user.id`, тож REST-шлях не дає підробити авторство. Деталі — [Ролі та контроль доступу](/admin/docs/technical/autentyfikatsiya/roli-i-dostup).

## Рендеринг: `InteractionSection`

Ланцюжок компонентів: `InteractionSection` (server) → `InteractionClient` → `LikeButton` / `CommentsSection` / `CommentForm` / `CommentItem`. Секція монтується на сторінці курсу (overview) і сторінках постів. На профілі користувача останні коментарі показує `ProfileLatestComments` — якщо юзер не увімкнув `hideProfileComments` (див. [Аватари та налаштування профілю](/admin/docs/technical/autentyfikatsiya/avatary-i-profil)).

## Пов'язане

- Схеми колекцій та access: [comments та likes](/admin/docs/technical/model-danykh/comments-likes)
- Ліміти 10/60 і 60/60: [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting)
- Форсування `author`/`user` у хуках колекцій: [Ролі та контроль доступу](/admin/docs/technical/autentyfikatsiya/roli-i-dostup)
