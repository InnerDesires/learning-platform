---
title: Завершення курсу
description: Єдине правило завершення в isCourseComplete, життєвий цикл enrollment, guards у completeStep і promote-only синхронізація syncCourseCompletions
---

## Єдине джерело правди: `isCourseComplete()`

Правило «курс завершено» живе в одному місці — `src/utilities/courseCompletion.ts`. Усі споживачі (server actions, хук `syncCourseCompletions`, гейт сертифіката — опосередковано через `status`) викликають `isCourseComplete()` замість того, щоб виводити правило самостійно. Це принципово: якщо колись зміниться визначення завершення, зміна відбудеться в одній функції.

```ts
import type { Course } from '@/payload-types'

type CourseShape = Pick<Course, 'steps' | 'quiz'>

export const getStepIds = (course: Pick<Course, 'steps'>): string[] =>
  (course.steps ?? []).map((step) => step.id).filter((id): id is string => Boolean(id))

export function isCourseComplete({
  course,
  completedSteps,
  quizPassed,
}: {
  course: CourseShape
  completedSteps: string[]
  quizPassed?: boolean | null
}): boolean {
  const stepIds = getStepIds(course)
  const quizEnabled = course.quiz?.enabled === true

  if (stepIds.length === 0 && !quizEnabled) return false
  if (!stepIds.every((id) => completedSteps.includes(id))) return false

  return !quizEnabled || quizPassed === true
}
```

Словами: enrollment досягає завершення тоді й лише тоді, коли **кожен поточний** id кроку курсу є в `completedSteps`, **і** — якщо на курсі увімкнено тест (`quiz.enabled === true`) — `quizPassed === true`.

### Порівняння по block id, не по кількості

`completedSteps` — це `json`-масив **id блоків** кроків (Payload генерує стабільний `id` для кожного блока в масиві `steps`). Порівняння йде через `stepIds.every((id) => completedSteps.includes(id))`, а не через `completedSteps.length >= stepIds.length`.

Причина: у `completedSteps` можуть залишатися **застарілі id видалених кроків**. Якби порівнювали лічильники, юзер, що пройшов 3 кроки зі старої версії курсу, «завершив» би нову версію з 3 інших кроків, не відкривши жодного з них. Порівняння по id гарантує, що зараховуються лише актуальні кроки.

### Edge cases

| Конфігурація курсу | Результат |
| --- | --- |
| 0 кроків, тест вимкнено | **Ніколи** не завершується (`return false` явно) — і сертифіката не буде |
| 0 кроків, тест увімкнено | Завершення визначає лише `quizPassed` (`every` на порожньому масиві — `true`) |
| Кроки є, тест вимкнено | Всі stepIds у `completedSteps` |
| Кроки є, тест увімкнено | Всі stepIds + `quizPassed === true` |

:::warning
Чернетка курсу може існувати з 0 кроків (у Courses `steps` має `required: true`, що блокує лише **публікацію** порожнього курсу). Але якщо опублікований курс якимось чином опиниться без кроків і без тесту — жоден учасник його не завершить. Це навмисний запобіжник, а не помилка.
:::

### Хто викликає `isCourseComplete()`

| Споживач | Файл | Момент |
| --- | --- | --- |
| `completeStep` | `src/app/(frontend)/[locale]/courses/actions.ts` | після додавання кроку — вирішує `in_progress` vs `completed` |
| `submitQuizAttempt` | там само | після оцінювання — з `quizPassed: passed \|\| enrollmentDoc.quizPassed` |
| `syncCourseCompletions` | `src/hooks/syncCourseCompletions.ts` | після публікації зміненого курсу — для кожного незавершеного enrollment |

Сертифікатний роут і сторінка верифікації функцію **не** викликають — вони читають лише `status === 'completed'`, тобто результат, а не правило.

## Запис на курс: `enrollInCourse`

Перед завершенням курс треба почати. `enrollInCourse(courseId)` у тому ж `actions.ts`:

- без сесії → `«Необхідно увійти в акаунт»`;
- **ідемпотентний**: якщо enrollment (user × course) вже існує — `{ success: true, enrollment }` без create; дубль на рівні БД додатково блокує унікальний індекс (user, course) і хук колекції з APIError 409 `«Ви вже записані на цей курс»`;
- `payload.create` може кинути 429 з хука `rateLimitCreate` (`enroll-create`, 30/600 с) → `«Забагато запитів. Спробуйте пізніше.»`;
- хуки колекції на create: не-адміну примусово ставиться `data.user = req.user.id` (не можна записати когось іншого), `beforeChange` ініціалізує `enrolledAt = now`, `completedSteps = []`, `status = 'enrolled'`;
- наприкінці — `revalidateCoursePages(course.slug)`.

## Життєвий цикл enrollment

Статуси: `enrolled` → `in_progress` → `completed`. **Переходів «вниз» не існує ніде в коді** — жоден шлях не демоутить enrollment.

| Статус | Хто ставить |
| --- | --- |
| `enrolled` | `beforeChange`-хук колекції `enrollments` при create (разом з `enrolledAt = now`, `completedSteps = []`) |
| `in_progress` | `completeStep`, коли після додавання кроку курс ще не завершено |
| `completed` | `completeStep` / `submitQuizAttempt` / `syncCourseCompletions` — усі три додатково пишуть `completedAt` |

Поля enrollment описано в [Колекція enrollments](/admin/docs/technical/model-danykh/enrollments); тут важливо, що всі вони `admin.readOnly`, а `update` на колекції — admin-only: прогрес пишеться виключно server actions через Local API (відкритий REST-update дозволив би підробку завершень).

## `completeStep`: п'ять guards

`completeStep(enrollmentId, stepBlockId, courseId)` у `src/app/(frontend)/[locale]/courses/actions.ts` — єдиний шлях позначити крок пройденим. Перед записом виконуються перевірки, кожна з rationale:

1. **Сесія**: `getSession()`; без неї — `«Необхідно увійти в акаунт»`. Анонім не має до чого писати.
2. **Enrollment існує**: `payload.findByID({ collection: 'enrollments', id: enrollmentId })`; інакше `«Запис не знайдено»`.
3. **Власник**: `String(enrollmentUserId) !== String(session.user.id)` → `«Немає доступу»`. Клієнт передає `enrollmentId` — без цієї перевірки можна було б писати в чужі enrollments.
4. **Курс enrollment = курс клієнта**: найтонший guard. Джерело правди — `enrollment.course`, а не `courseId` з клієнта:

   ```ts
   const enrollmentCourseId =
     typeof enrollment.course === 'object' ? enrollment.course.id : enrollment.course
   if (Number(enrollmentCourseId) !== Number(courseId)) {
     return { success: false, error: 'Немає доступу' }
   }
   ```

   Якби сервер довіряв клієнтському `courseId`, юзер міг би «закривати» кроки короткого курсу проти enrollment іншого (довгого) курсу: id кроків беруться з курсу за `courseId`, а пишуться в enrollment. Далі по коду курс фетчиться саме по `enrollmentCourseId`.
5. **Ідемпотентність**: якщо `enrollment.status === 'completed'` — early return `success: true` без запису (і без подвійного XP); якщо `completedSteps.includes(stepBlockId)` — так само.

Після guards: `stepBlockId` мусить бути в `getStepIds(course)` (інакше `«Крок не знайдено»` — відсікає вигадані та видалені id). Потім атомарно за змістом: append id у `completedSteps`, статус `completed` або `in_progress` за результатом `isCourseComplete()` (з поточним `quizPassed` — на курсі з тестом останній крок не є фінішем, промоут робить `submitQuizAttempt`), `completedAt` лише при завершенні, `logXpEvent` (+30 XP, див. [Система XP](/admin/docs/technical/biznes-logika/xp)) і ревалідація сторінок курсу.

## `syncCourseCompletions`: редагування курсу змінює визначення завершення

Хук `afterChange` колекції `courses` — `src/hooks/syncCourseCompletions.ts`:

```ts
export const syncCourseCompletions: CollectionAfterChangeHook<Course> = async ({
  doc,
  previousDoc,
  req,
}) => { /* ... */ }
```

Механіка:

- Працює лише коли `doc._status === 'published'` — чернетки не змінюють, що означає «завершено».
- **Short-circuit по сигнатурі**: `completionSignature(course)` = `` `${course.quiz?.enabled === true}|${getStepIds(course).join(',')}` ``. Якщо сигнатури `previousDoc` і `doc` збігаються (правили лише тексти, назви, SEO) — хук виходить одразу, без запиту enrollments.
- Інакше — `find` усіх enrollments курсу зі `status != completed` (`depth: 0`, `pagination: false`, з передачею `req` для транзакційності), і кожен, що тепер задовольняє `isCourseComplete()`, отримує `{ status: 'completed', completedAt }`.
- `completedAt` — **один спільний ISO timestamp** на весь прогін (`new Date().toISOString()` обчислюється до циклу): всі промоутнуті одним редагуванням отримують однакову дату, що чесно відображає причину завершення.

### Promote-only, ніколи demote

Хук шукає лише незавершені enrollments і лише підвищує їх. Сценарії:

- **Видалили крок або вимкнули тест** → планка знизилась → учасники, що вже виконали решту, автоматично стають `completed`.
- **Додали крок або увімкнули тест** → планка піднялась → уже завершені enrollments **не чіпаються**. Сертифікат, виданий раніше, лишається валідним — і PDF, і сторінка верифікації гейтяться саме на `status === 'completed'` (див. [Сертифікати](/admin/docs/technical/biznes-logika/sertyfikaty)).

:::info Чому не демоутити
Сертифікат — це факт про минуле («завершив курс у такому вигляді»), а не жива відповідність поточній програмі. Демоушн зробив би видані PDF брехнею заднім числом і зламав би QR-верифікацію вже надрукованих сертифікатів.
:::

## Зв'язок із сертифікатами

Сертифікат **не перевіряє** тест чи кроки окремо — route гейтиться на єдиній умові: існує enrollment користувача на цей курс зі `status === 'completed'`. Отже вимога тесту успадковується через `isCourseComplete()`, а не дублюється. Єдиний спосіб «відкликати» сертифікат — щоб enrollment покинув статус `completed`, чого код ніколи не робить автоматично (лише адмін вручну). Деталі токенів і PDF — [Сертифікати](/admin/docs/technical/biznes-logika/sertyfikaty), менеджерський погляд — [Сертифікати](/admin/docs/manager/kursy/sertyfikaty).

## Пов'язане

- Тести й оцінювання: [Тести: оцінювання та спроби](/admin/docs/technical/biznes-logika/kvizy)
- Нарахування XP за кроки: [Система XP](/admin/docs/technical/biznes-logika/xp)
- Схема колекції: [Колекція enrollments](/admin/docs/technical/model-danykh/enrollments)
- Ліміт на створення enrollments (30/10 хв): [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting)
