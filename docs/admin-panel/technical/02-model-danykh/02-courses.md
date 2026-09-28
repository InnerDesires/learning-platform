---
title: Колекція courses
description: Поля курсу, три блоки кроків, quiz-група, три валідаційні воркараунди та хуки життєвого циклу
---

Файл: `src/collections/Courses.ts`. Ярлики «Курс»/«Курси», група «Курси»,
`useAsTitle: 'title'`, колонки списку `[title, category, _status, createdAt]`,
`lockDocuments: false`.

## Access

| Операція | Правило |
| --- | --- |
| create / update / delete | `admin` |
| read | `authenticatedOrPublished` — анонім бачить лише `_status: published`; **будь-який** залогінений (у т.ч. learner) бачить і чернетки через API |

## Поля

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `title` | text | required, localized |
| `slug` (+ `generateSlug`) | core `slugField` | `slugify: cyrillicSlugify`, unique |
| `description` | textarea | localized |
| `heroImage` | upload → `media` | «Обкладинка» |
| `category` | rel → `course-categories` | — |
| `stepsJsonImport` | ui | `CourseJsonImport` з `clientProps: { target: 'steps' }` |
| `steps` | blocks | **required: true, minRows: 1** — 3 типи блоків |
| `quiz` | group | див. нижче |
| `publishedAt` | date | sidebar; field-hook ставить `new Date()` при першій публікації |
| `deleteConfirmation` | ui | sidebar, `CourseDeleteConfirmation` |

### Блоки кроків

Спільне поле `duration` (number, 1–600, «Тривалість (хв)»).

| Блок | Ярлик | Поля |
| --- | --- | --- |
| `richTextStep` | Текстовий крок | `title` (req, localized), `content` richText (req, localized), `duration` |
| `youtubeVideoStep` | Відео крок | `title` (req, localized), `description` (localized), `youtubeUrl` (req, валідація `YOUTUBE_URL_REGEX` з `src/utilities/courseJsonImport.ts` → «Введіть коректне YouTube посилання»), `duration` |
| `fileStep` | Файловий крок | `title` (req, localized), `description` (localized), `file` upload → `course-files` (req), `duration` |

**Id блока кроку — це одиниця прогресу**: `enrollments.completedSteps` зберігає
масив цих id, а `getStepIds`/`isCourseComplete`
(`src/utilities/courseCompletion.ts`) порівнюють саме їх. Видалення кроку і
створення «такого самого» заново — це новий id, прогрес по старому не
зарахується.

### Група quiz

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `enabled` | checkbox | default `false` |
| `quizJsonImport` | ui | `CourseJsonImport`, `target: 'quiz'` |
| `title`, `description` | text / textarea | localized, `condition: quiz.enabled === true` |
| `passingScore` | number | 0–100, **default 70**, видиме лише при enabled |
| `questions` | array | minRows 1, кастомний validate (нижче), видиме лише при enabled |
| `questions[].question` | text | required, localized |
| `questions[].answers` | array | **required, minRows 2**, кастомний validate (нижче) |
| `answers[].text` | text | required, localized |
| `answers[].isCorrect` | checkbox | default `false` |

## Три валідаційні воркараунди

Усі три обходять одну й ту саму поведінку Payload: **`minRows` взагалі не
перевіряється на порожньому опційному масиві**. Порожній масив + не-required
поле = валідація мовчки пропущена.

### 1. `steps.required: true`

```ts
// required is what actually blocks publishing a course with zero steps:
// Payload skips minRows validation entirely when the array is empty and
// the field is not required.
required: true,
minRows: 1,
```

Саме `required`, а не `minRows`, блокує публікацію курсу без кроків. Чернетки
при цьому зберігаються порожніми — на draft/autosave-збереженнях валідація
пропускається, тож робочий процес адмінки не ламається.

### 2. `questions.validate`: required лише коли quiz увімкнено

Безумовний `required: true` (як у steps) зламав би курси **без** квіза — тому
воркараунд повторно запускає стокову валідацію масиву, вмикаючи `required`
лише коли `enabled === true`:

```ts
validate: (value, options) => {
  const quizEnabled =
    (options.siblingData as { enabled?: boolean } | null | undefined)?.enabled === true
  return validations.array(value, { ...options, required: quizEnabled })
},
```

Без цього увімкнений квіз публікувався б із нулем питань.

### 3. `answers.validate`: ≥1 правильна відповідь

Питання без жодної `isCorrect` — без відповіді: кожна спроба отримує на ньому
нуль, і курс стає незавершуваним. Ніщо інше цього не ловить, тому validate
спершу проганяє стокову перевірку довжини (тут `required: true` безумовний —
питання завжди потребує відповідей), а потім рядки:

```ts
validate: (value, options) => {
  const lengthResult = validations.array(value, options)
  if (lengthResult !== true) return lengthResult

  const quizEnabled =
    (options.data as { quiz?: { enabled?: boolean } } | undefined)?.quiz?.enabled === true
  if (!quizEnabled || !Array.isArray(value)) return true

  const hasCorrect = value.some(
    (answer) => (answer as { isCorrect?: boolean } | null)?.isCorrect === true,
  )
  if (!hasCorrect) return 'Позначте щонайменше одну правильну відповідь.'
  return true
},
```

Перевірка `isCorrect` свідомо пропускається при вимкненому квізі — «застарілі»
питання не мають блокувати збереження курсу без тесту.

## Versions / autosave / schedulePublish

```ts
versions: {
  drafts: { autosave: { interval: 10000 }, schedulePublish: true },
  maxPerDoc: 50,
},
```

Autosave кожні 10 с (не ставте <2000 мс — старі версії Payload мали баг зі
stale-модалкою на власному autosave), відкладена публікація через
`payload-jobs`, до 50 версій на документ. **Live preview у курсів немає** — на
відміну від pages/posts.

## Хуки

### afterChange: `syncCourseCompletions` + `revalidateCourse`

`syncCourseCompletions` (`src/hooks/syncCourseCompletions.ts`) — редагування
курсу змінює визначення «завершено», тож хук промоутить enrollments, які
задовольняють нову форму (видалили крок/квіз → хтось міг «доїхати»). Працює
лише на `_status === 'published'`; short-circuit по сигнатурі
`${quiz.enabled === true}|${stepIds.join(',')}` — якщо склад кроків і квіз не
змінились, жодних запитів. **Promote-only**: завершення ніколи не знімається,
зароблений сертифікат переживає пізніше додавання квіза. Повна логіка —
[Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu).

`revalidateCourse` (`src/hooks/revalidateCourse.ts`) бустить ISR-кеш обох
локалей (`/courses/<slug>`, `/courses`, категорії, головна) і старий slug при
rename/unpublish. Увесь блок revalidatePath — у `try/catch`: відкладена
публікація (schedulePublish) виконується поза request-контекстом, де
`revalidatePath` кидає виняток; пропущений буст компенсує 300-секундне вікно
ISR, а збереження курсу не має падати через кеш.

### beforeDelete: ручний каскад

`xp_events.course_id` (та інші) — `NOT NULL` колонки з FK `ON DELETE SET
NULL`, тож без попереднього зачищення delete падає на рівні БД. Хук видаляє по
черзі: `xp-events`, `quiz-attempts`, `enrollments`, `comments`
(`targetCollection='courses'`), `likes` (те саме) — усі з `req` для
атомарності. Карта каскадів — в
[Огляді моделі даних](/admin/docs/technical/model-danykh/ohliad).

### afterDelete / плагінні

`revalidateCourseDelete` — той самий буст шляхів. `backfillSearchTitleLocales`
(доданий плагіном `searchLocaleSync`) — дозаповнення локалей пошукового
індексу.

## Slug: чому `undefined`, а не `''`

`cyrillicSlugify` (`src/utilities/cyrillicSlugify.ts`) обгортає `slugify` з
`{ lower: true, strict: true, locale: 'uk' }` і повертає:

```ts
return slug || undefined
```

Генератор слага Payload ставить `slug = ''` при створенні autosave-чернетки ще
до вводу назви. Postgres вважає кілька `''` порушенням unique-індексу
(`valueMustBeUnique`), а кілька `NULL` — ні. Повернення `undefined` (→ NULL у
БД) дозволяє мати скільки завгодно свіжостворених чернеток одночасно.
