---
title: "Тести: оцінювання та спроби"
description: submitQuizAttempt покроково, exact-set grading без часткового заліку, нумерація спроб, клієнтська QuizForm і гейтинг сторінки тесту
---

## Де що лежить

- Server action `submitQuizAttempt` — `src/app/(frontend)/[locale]/courses/actions.ts`. Це **єдиний** користувацький шлях створення спроби: `quiz-attempts.create` у REST — admin-only, інакше можна було б підробити результат (див. [quiz-attempts та xp-events](/admin/docs/technical/model-danykh/quiz-attempts-xp-events)).
- Конфіг тесту — група `quiz` у колекції `courses`: `enabled` (default `false`), `passingScore` 0–100 (default **70**), `questions` (minRows 1, required лише коли `enabled`), у питанні `answers` (minRows 2, щонайменше одна `isCorrect`). Деталі — [Колекція courses](/admin/docs/technical/model-danykh/courses).
- Клієнт — `src/components/Courses/QuizForm.tsx`, сторінка — `src/app/(frontend)/[locale]/courses/[slug]/quiz/page.tsx`.

## `submitQuizAttempt`: 11 кроків

Сигнатура: `submitQuizAttempt(courseId, answers: Array<{ questionId: string; selectedAnswerIds: string[] }>)`.

1. **Сесія.** `getSession()`; без неї — `«Необхідно увійти в акаунт»`.
2. **Rate limit.** `checkRateLimit` з ключем `quiz-submit:${session.user.id}`, вікно 3600 с, max **30** → `«Забагато спроб. Спробуйте пізніше.»`. 30/год ніколи не зачепить людину, що перескладає тест, — лише скриптовані потоки (спроби — необмежені рядки в БД + серверне оцінювання). Див. [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting).
3. **Enrollment.** `find` по user × course, `totalDocs === 0` → `«Ви не записані на цей курс»`.
4. **Тест увімкнено.** Курс фетчиться `findByID` (`depth: 0`); `!course.quiz?.enabled` → `«Тест не активовано для цього курсу»`.
5. **Оцінювання** (exact-set match):

   ```ts
   const selectedSet = new Set(submittedAnswer.selectedAnswerIds)
   const correctSet = new Set(correctAnswerIds)

   const isCorrect =
     selectedSet.size === correctSet.size &&
     [...selectedSet].every((id) => correctSet.has(id))
   ```

   Матчинг питання — по `q.id` (`questions.findIndex`); відповіді з невідомим `questionId` **мовчки пропускаються** (`continue`). Часткового заліку немає: на мультивибірковому питанні треба вибрати **точно** множину правильних — зайва або пропущена відповідь обнуляє питання. Пропущене питання (клієнт такого не шле, але API дозволяє) = неправильне, бо `correctCount` за нього не інкрементується, а `totalQuestions` рахується з курсу. У `gradedAnswers` пишуться `{ questionIndex, selectedAnswerIndices, correct }` — індекси, не id, щоб знімок був читабельним навіть після редагування курсу.
6. **Score.** `score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0`.
7. **Passed.** `passed = score >= (course.quiz.passingScore ?? 70)`. Наслідок: `passingScore: 0` означає, що проходить будь-яка спроба, включно з 0%.
8. **Створення спроби.** `payload.create({ collection: 'quiz-attempts', ... , attemptNumber: 0 })` — нуль лише задовольняє required-поле; реальне значення перезаписує хук колекції (нижче).
9. **Оновлення enrollment** одним `update`:
   - `quizAttempts: currentAttempts + 1` — завжди;
   - `bestQuizScore` — лише якщо `score > currentBest` (строго більше);
   - `quizPassed: true` — лише якщо `passed`; **ніколи не скидається** — пізніший провал не чіпає поле (липкий прапорець; сертифікат не відкликається ретейком);
   - `status: 'completed'` + `completedAt` — лише якщо `nowComplete`: статус ще не `completed` і `isCourseComplete({ course, completedSteps, quizPassed: passed || enrollmentDoc.quizPassed })` тепер істинний.
10. **XP рівно раз.** `if (passed && !enrollmentDoc.quizPassed)` — тобто на **першій** успішній спробі (перевірка по стану enrollment *до* оновлення) — `logXpEvent(..., { kind: 'quiz', amount: QUIZ_XP })` (+100). Повторні успішні спроби XP не дають.
11. **Ревалідація.** `revalidateCoursePages(course.slug)`: `revalidatePath` для `/courses/<slug>`, `steps/[stepIndex]`, `quiz` у обох локальних префіксах (`''`, `'/en'`) + `revalidateTag('course-enrollment-stats')`.

Повертається `{ success: true, attempt: { score, passed, correctAnswers, totalQuestions, attemptNumber } }`.

### Форма даних

Вхід від клієнта і збережений знімок відповіді навмисно різні:

```ts
// вхід (id-центричний — стабільний проти shuffle на клієнті)
answers: Array<{ questionId: string; selectedAnswerIds: string[] }>

// збережений знімок у quiz-attempts.answers (індекс-центричний — читабельний в адмінці)
gradedAnswers: Array<{ questionIndex: number; selectedAnswerIndices: number[]; correct: boolean }>
```

`selectedAnswerIndices` будується мапінгом id → індекс у поточному порядку відповідей курсу; невідомі id відфільтровуються (`filter((i) => i !== -1)`).

### Помилки та edge cases

| Умова | Результат |
| --- | --- |
| Немає сесії | `«Необхідно увійти в акаунт»` |
| > 30 сабмітів/год | `«Забагато спроб. Спробуйте пізніше.»` |
| Немає enrollment | `«Ви не записані на цей курс»` |
| `quiz.enabled !== true` | `«Тест не активовано для цього курсу»` |
| `totalQuestions === 0` | `score = 0`; `passed = 0 >= passingScore` — при дефолтних 70 провал |
| `passingScore = 0` | будь-яка спроба passed, навіть 0% |
| Невідомий `questionId` | мовчки ігнорується (не зараховується ні туди, ні туди) |
| Відповідь не надіслано на питання | питання неправильне (correctCount не росте) |

## Валідація конфігу тесту в адмінці

Правила на колекції `courses`, які гарантують, що оцінювачу є що оцінювати:

- поля `title`/`description`/`passingScore`/`questions` групи `quiz` видимі лише коли `enabled`;
- `questions` — `minRows: 1`, але кастомний validate робить їх required **лише коли** `enabled` (курс без тесту зберігається без питань);
- `answers` у питанні — required, `minRows: 2`, кастомний validate вимагає ≥1 `isCorrect` з повідомленням `«Позначте щонайменше одну правильну відповідь.»`;
- `steps` курсу — `required: true`: саме це блокує публікацію курсу без кроків (Payload пропускає minRows на порожньому опційному масиві; чернетки зберігаються порожніми).

## `attemptNumber`: хук колекції

У `src/collections/QuizAttempts.ts` — `beforeValidate`-хук (саме `beforeValidate`, а не `beforeChange`, щоб required-поле існувало **до** валідації):

```ts
if (operation === 'create' && data?.user && data?.course) {
  const existing = await req.payload.count({
    collection: 'quiz-attempts',
    where: { and: [{ user: { equals: data.user } }, { course: { equals: data.course } }] },
    req,
  })
  data.attemptNumber = existing.totalDocs + 1
}
```

Нумерація per user × course; викликачам не треба її рахувати.

## Клієнт: `QuizForm.tsx`

- **Shuffle.** І питання, і відповіді всередині кожного питання перемішуються Fisher–Yates на кожну спробу:

  ```ts
  const shuffledQuestions = useMemo(() => {
    void seed
    return fisherYatesShuffle(questions).map((q) => ({
      ...q,
      answers: fisherYatesShuffle(q.answers ?? []),
    }))
  }, [questions, seed])
  ```

  `seed` ініціалізується `Date.now()`; кнопка «Спробувати ще» (`handleTryAgain`) скидає вибір і робить `setSeed(Date.now())` — новий порядок на кожну спробу.
- **Витік мультивибору.** Тип інпута визначає `hasMultipleCorrect(question)`: чекбокси, коли правильних відповідей > 1, інакше радіо. Для цього сторінка передає `isCorrect` у клієнтські пропси — тобто правильні відповіді **присутні в HTML/JS-пейлоаді сторінки тесту**. Сам факт «тут чекбокси» вже підказує, що правильних кілька. Це усвідомлений компроміс (тест — навчальний інструмент, не екзамен із проктором); чесність результату все одно гарантує лише серверне оцінювання.
- **Submit-блокування.** Кнопка `disabled`, поки не `allAnswered` — кожне питання має ≥1 вибрану відповідь (а також під час `isPending`). Тому «пропущене питання» — суто API-шлях, не UI.
- Після успіху — `clearMyXpCache()` (скидає sessionStorage-кеш XP, див. [Система XP](/admin/docs/technical/biznes-logika/xp)) і рендер `QuizResults`.

Сторінка також показує бейджі: прохідний бал, кількість питань, використані спроби (або «№1»), нагороду `+100 XP` (`QUIZ_XP`).

## Гейтинг сторінки тесту

`/courses/[slug]/quiz` **не входить** у matcher захищених шляхів middleware (`src/middleware.ts` захищає `/profile`, `/certificates`, `^/courses/[^/]+/steps`) — сторінка захищає себе сама, послідовно:

1. Немає сесії → `redirect('/login?redirect=<quiz-url>')` (з локальним префіксом).
2. Курс не знайдено серед published → `notFound()`.
3. `!course.quiz?.enabled` → redirect на сторінку курсу.
4. Немає enrollment (`getEnrollment(course.id)`) → redirect на сторінку курсу.
5. Є незавершений крок → redirect на **перший незавершений**: `steps.findIndex((step) => !completedSteps.includes(step.id ?? ''))`, редірект на `steps/${firstIncompleteIndex + 1}` (індекси кроків у URL — 1-based). Для enrollment зі `status === 'completed'` перевірка пропускається (`firstIncompleteIndex = -1`), тож завершені учасники завжди можуть відкрити тест.

Тест відкривається лише після всіх кроків — «відстаючих» ведуть до місця зупинки, а не мовчки викидають на сторінку курсу.

## Ретейки

Кількість спроб **не обмежена** — ні cooldown, ні max-attempts; єдине стримування — rate limit 30/год. Історія: `getQuizAttempts(courseId)` повертає спроби юзера по курсу, `sort: '-createdAt'`, `limit: 100`; рендериться в `QuizAttemptHistory` під формою (з лінком на сертифікат для passed-спроб).

### Два лічильники спроб

Не плутати:

- `quiz-attempts.attemptNumber` — порядковий номер конкретної спроби, рахує хук колекції по фактичних записах;
- `enrollments.quizAttempts` — денормалізований лічильник на enrollment, інкрементується в `submitQuizAttempt`.

Вони можуть розійтися, якщо адмін видалить записи спроб (лічильник на enrollment не перераховується) — це нормально, лічильник enrollment відображає «скільки разів складав», а не «скільки записів існує».

:::tip Наслідки для контенту
Оскільки exact-set match не дає часткового заліку, мультивибіркові питання значно «дорожчі» за одиночні. Якщо `passingScore` високий, а питань мало — одне мультивибіркове питання може коштувати проходження. Автору курсу варто це враховувати.
:::

## Пов'язане

- Що означає «завершено» і липкість `quizPassed`: [Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu)
- +100 XP за перший passing: [Система XP](/admin/docs/technical/biznes-logika/xp)
- Схеми `quiz-attempts` і `xp-events`: [quiz-attempts та xp-events](/admin/docs/technical/model-danykh/quiz-attempts-xp-events)
- Конфіг групи `quiz` на курсі: [Колекція courses](/admin/docs/technical/model-danykh/courses)
