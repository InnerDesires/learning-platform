---
title: Колекція enrollments
description: Запис на курс і весь прогрес користувача — поля, unique-індекс, access-філософія та хуки
---

Файл: `src/collections/Enrollments.ts`. Ярлики «Запис на курс»/«Записи на
курси», група «Курси», колонки `[user, course, status, enrolledAt]`,
`lockDocuments: false`.

Це найважливіша колекція бізнес-логіки: з неї деривуються сумарний XP,
сертифікати та статуси в каталозі.

## Unique-індекс

```ts
indexes: [{ fields: ['user', 'course'], unique: true }],
```

Один enrollment на пару користувач×курс — гарантія БД, а не лише
duplicate-перевірки в хуку (перевірка дає читабельний 409, індекс страхує від
гонок).

## Поля

Усі поля мають `admin.readOnly: true`.

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `user` | rel → `users` | required, index |
| `course` | rel → `courses` | required, index |
| `completedSteps` | json | default `[]`; опис в адмінці: «Масив ID завершених блоків кроків» |
| `status` | select | default `enrolled`; options: `enrolled` («Записаний»), `in_progress` («В процесі»), `completed` («Завершено») |
| `enrolledAt` | date | sidebar |
| `completedAt` | date | sidebar, видиме лише при `status === 'completed'` |
| `quizPassed` | checkbox | default `false` |
| `bestQuizScore` | number | 0–100 |
| `quizAttempts` | number | default `0` |

### Філософія: усе readOnly

Прогрес пишуть **лише server actions** через Local API
(`enrollInCourse`, `completeStep`, `submitQuizAttempt` у
`src/app/(frontend)/[locale]/courses/actions.ts`) та хук
`syncCourseCompletions`. Адмінка показує стан, але не редагує його: readOnly
прибирає спокусу «поправити руками» дані, з яких виводяться сертифікати. Якщо
дані треба виправити — робіть це усвідомлено через Local API/скрипт, а не через
форму.

`completedSteps` — json-масив **id блоків кроків** (рядки). Server action
додає id по одному з dedupe через `includes`; читачі завжди роблять
`Array.isArray`-guard. Порівняння завершеності — по конкретних id, не по
кількості: застарілі id видалених кроків не завершать курс достроково.

## Access

| Операція | Правило | Обґрунтування |
| --- | --- | --- |
| create | `authenticated` | Записатися може будь-який залогінений (хуки привʼязують його до себе) |
| read | `adminOrOwn` | Адмін бачить усі; користувач — лише свої (`user = req.user.id`); анонім — нічого |
| update | **`admin`** | Ключове рішення: поля прогресу — основа сертифікатів і XP. Усі легітимні записи йдуть через server actions (Local API, який має адмін-права); update власником через REST дав би лише підробку `completedSteps`/`status`/`quizPassed` |
| delete | `admin` | — |

Це «server actions або ніяк» — той самий принцип, що в `quiz-attempts.create`
(див. [Огляд архітектури](/admin/docs/technical/arkhitektura/ohliad)).

## Хуки

### beforeValidate[0]: rate limit

```ts
rateLimitCreate({ prefix: 'enroll-create', windowSeconds: 600, max: 30 })
```

30 створень за 10 хвилин на користувача. Дублікати й так відкидаються, але
кожна спроба коштує lookup-ів і ревалідації сторінок — ліміт зрізає скриптові
enroll-цикли. Адміни і записи без user id (сідинг) проходять без ліміту.
Перевищення → `APIError` «Забагато запитів. Спробуйте пізніше.» зі статусом
429. Деталі механізму — [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting).

### beforeValidate[1]: binding + дублікат 409

```ts
if (operation === 'create' && data && req.user &&
    !('role' in req.user && req.user.role?.includes('admin'))) {
  data.user = req.user.id
}
```

Не-адмінський API-запит може записати **лише себе** — `data.user`
перезаписується до перевірки дубліката, тож підставлений чужий id не обійде
її. Local API-виклики без `req.user` (server actions) передають id явно.

Далі — пошук наявного enrollment по парі user×course; знайдено →
`APIError('Ви вже записані на цей курс', 409)`.

### beforeChange: дефолти create

```ts
if (operation === 'create') {
  data.enrolledAt = new Date().toISOString()
  data.completedSteps = []
  data.status = 'enrolled'
}
```

Клієнт не може створити enrollment «одразу завершеним» — стартові значення
примусові.

## Життєвий цикл статусів

```
enrolled ──► in_progress ──► completed
```

Переходів «назад» немає.

| Перехід | Хто виконує |
| --- | --- |
| → `enrolled` | `beforeChange` при create (+`enrolledAt`, порожній `completedSteps`) |
| → `in_progress` | `completeStep` після першого зарахованого кроку |
| → `completed` | `completeStep` або `submitQuizAttempt`, коли `isCourseComplete()` каже true (+`completedAt`); або `syncCourseCompletions` після редагування курсу |

Правило завершеності одне — `isCourseComplete()` у
`src/utilities/courseCompletion.ts`: усі поточні step id ∈ `completedSteps`
**і** (якщо квіз увімкнено) `quizPassed === true`. Не редеривуйте його. Курс
без кроків і без квіза не завершується ніколи. Сертифікати гейтяться лише на
`status === 'completed'` і успадковують квіз-вимогу звідти. Подробиці:
[Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu),
[Сертифікати](/admin/docs/technical/biznes-logika/sertyfikaty).

`quizPassed` — «липкий»: ставиться true на першій успішній спробі й ніколи не
скидається (пізніший провал ретейку не чіпає ні його, ні сертифікат).
`bestQuizScore` оновлюється лише вгору, `quizAttempts` інкрементується на
кожну спробу — усе в `submitQuizAttempt`
(див. [Квізи](/admin/docs/technical/biznes-logika/kvizy)).

## Повʼязані server actions

| Action | Гарди |
| --- | --- |
| `enrollInCourse` | сесія; ідемпотентний (наявний запис → success без create); 429 → «Забагато запитів. Спробуйте пізніше.» |
| `completeStep(enrollmentId, stepBlockId, courseId)` | сесія → enrollment існує → `enrollment.user === session.user` → **`enrollment.course === courseId`** (інакше можна закривати кроки короткого курсу проти чужого enrollment) → уже completed / крок уже зарахований → early success (без подвійного XP) → `stepBlockId ∈ getStepIds(course)` інакше «Крок не знайдено» |
| `getMyCourseStatuses` | клієнтський дофетч статусів для ISR-каталогу (`{completed[], inProgress[]}`, ≤1000 enrollments) |

Каскади: enrollment видаляється разом із користувачем або курсом
(`beforeDelete`-хуки відповідних колекцій, див.
[Огляд моделі даних](/admin/docs/technical/model-danykh/ohliad)).
