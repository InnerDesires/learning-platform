---
title: quiz-attempts та xp-events
description: Дві службові колекції прогресу — журнал спроб тесту з server-side оцінюванням і append-only лог XP
---

Обидві колекції — «журнали», які наповнює виключно сервер. Користувач їх у
кращому разі читає (quiz-attempts — свої), в адмінці всі поля readOnly.

## quiz-attempts

Файл: `src/collections/QuizAttempts.ts`. Ярлики «Спроба тесту»/«Спроби
тестів», група «Курси», колонки `[user, course, score, passed, createdAt]`,
`timestamps: true`, `lockDocuments: false`.

### Поля

Усі з `admin.readOnly: true`.

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `user` | rel → `users` | required, index |
| `course` | rel → `courses` | required, index |
| `score` | number | required, 0–100, «Результат (%)» |
| `passed` | checkbox | «Складено» |
| `totalQuestions` | number | required |
| `correctAnswers` | number | required |
| `answers` | json | `gradedAnswers`: `{questionIndex, selectedAnswerIndices, correct}[]` |
| `attemptNumber` | number | required, ставиться хуком |

### Access: чому create — admin-only

```ts
access: {
  create: admin,
  read: adminOrOwn,
  update: admin,
  delete: admin,
},
```

Оцінювання відбувається **на сервері**: server action `submitQuizAttempt`
(`src/app/(frontend)/[locale]/courses/actions.ts`) сам звіряє відповіді з
правильними (exact-set match по конфігу курсу), рахує `score` і лише тоді
створює документ через Local API (де діють адмін-права). Відкритий REST-create
дозволив би будь-кому надіслати `score: 100, passed: true` і зробити собі
сертифікат. `read: adminOrOwn` — користувач бачить лише власні спроби
(історію на сторінці квіза віддає `getQuizAttempts`, sort `-createdAt`,
limit 100).

Правила оцінювання, rate limit `quiz-submit` (30/год) і необмежені ретейки —
у [Квізах](/admin/docs/technical/biznes-logika/kvizy).

### beforeValidate: attemptNumber

```ts
beforeValidate: [
  async ({ data, operation, req }) => {
    if (operation === 'create' && data?.user && data?.course) {
      const existing = await req.payload.count({
        collection: 'quiz-attempts',
        where: { and: [{ user: { equals: data.user } }, { course: { equals: data.course } }] },
        req,
      })
      data.attemptNumber = existing.totalDocs + 1
    }
    return data
  },
],
```

Rationale вибору фази: `attemptNumber` — **required**, тож він мусить існувати
до запуску валідації. `beforeValidate` (а не `beforeChange`) гарантує це і
звільняє викликача від обчислення номера — `submitQuizAttempt` передає що
завгодно, хук перезапише коректним `count + 1`.

## xp-events

Файл: `src/collections/XpEvents.ts`. Ярлики «Подія XP»/«Події XP», група
«Курси», колонки `[user, course, kind, amount, createdAt]`,
`timestamps: true`.

### Поля

Усі readOnly в адмінці.

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `user` | rel → `users` | required, index |
| `course` | rel → `courses` | required, index |
| `kind` | select | required; `step` («Крок») \| `quiz` («Тест») |
| `amount` | number | required (фактично `STEP_XP = 30` або `QUIZ_XP = 100`) |

### Access: адмін × 4

```ts
access: { create: admin, read: admin, update: admin, delete: admin },
```

Навіть read закритий: фронтенд ніколи не читає цю колекцію напряму — сумарний
XP користувача деривується з enrollments, а періодні лідерборди рахує
серверний SQL. Пише сюди лише `logXpEvent` через Local API.

### Призначення: append-only лог для періодних лідербордів

XP існує у **двох представленнях**, і це принципово:

1. **Сумарний XP деривується з enrollments**:
   `Σ completedSteps.length × 30 + (quizPassed ? 100 : 0)` — так рахують
   `getMyXp` (`src/actions/xp.ts`), all-time лідерборд (raw SQL у
   `src/utilities/leaderboard.ts`) і сторінка профілю. Джерело правди —
   enrollment, лог не потрібен.
2. **`xp-events` — лише для періодів**: enrollment знає, *які* кроки пройдені,
   але не *коли*. Лідерборди «за день/тиждень/місяць» (1/7/30 днів) сумують
   `amount` з `xp_events` за вікно.

Записи створює `logXpEvent` (`courses/actions.ts`): `completeStep` →
`{kind: 'step', amount: 30}` на кожен уперше зарахований крок;
`submitQuizAttempt` → `{kind: 'quiz', amount: 100}` **лише на першій**
успішній спробі (`passed && !enrollmentDoc.quizPassed`).

### Best-effort запис

```ts
try {
  await payload.create({ collection: 'xp-events', data: { /* … */ } })
  revalidateTag('xp-leaderboard')
} catch (err) {
  // лог не має завалити мутацію прогресу
}
```

Провал запису логовується і **ковтається**: втратити рядок періодного
лідерборду прийнятніше, ніж відкотити зарахований крок. Наслідок — `xp_events`
може дрейфувати від деривованого сумарного XP; це відома і прийнята
властивість.

:::warning Каскади стирають історію
`beforeDelete` у `users` і `courses` видаляє й `xp-events` — періодні
лідерборди втрачають внесок видаленого курсу/користувача заднім числом.
Період покривається лише з моменту міграції `20260724_140000_xp_events`.
:::

Формули рівнів (`levelSpan`, `levelForXp`), кеш `xp-leaderboard`
(revalidate 300) і клієнтський `myXpCache` — у статті
[XP](/admin/docs/technical/biznes-logika/xp).
