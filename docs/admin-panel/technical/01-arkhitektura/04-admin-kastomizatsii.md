---
title: Кастомізації адмін-панелі
description: Кастомні admin-компоненти, importmap-воркфлоу, JSON-імпорт курсів, безпечне видалення, запрошення користувачів
---

## admin.components у payload.config.ts

```ts
admin: {
  components: {
    beforeLogin: ['@/components/BeforeLogin'],
    beforeDashboard: ['@/components/BeforeDashboard'],
    afterNavLinks: ['@/components/admin/Docs/DocsNavLinks'],
    graphics: {
      Icon: '@/components/admin/graphics/Icon',
      Logo: '@/components/admin/graphics/Logo',
    },
    views: {
      docs: {
        Component: '@/components/admin/Docs/DocsView',
        exact: false,
        path: '/docs',
      },
    },
  },
  // …
}
```

| Слот | Компонент | Що робить |
| --- | --- | --- |
| `beforeLogin` | `src/components/BeforeLogin` | Українське привітання над формою входу |
| `beforeDashboard` | `src/components/BeforeDashboard` | Лого, привітання по імені, 4 quick actions (новий курс / публікація / сторінка, медіатека) і лічильники courses/users/posts/enrollments/comments |
| `afterNavLinks` | `src/components/admin/Docs/DocsNavLinks` | Посилання на цю документацію в боковому меню |
| `graphics.Icon` / `graphics.Logo` | `src/components/admin/graphics/*` | Лого «Залізна Зміна» замість Payload |
| `views.docs` | `src/components/admin/Docs/DocsView` | Кастомний view `/admin/docs` — рендерер цієї документації (`exact: false` → підхоплює всі підшляхи `/admin/docs/...`) |

Компоненти документації: `DocsView/` (DocsShell, DocsHome, TrackHome,
ArticleView, NotFoundView) + клієнтські `DocsSidebar.client.tsx` /
`DocsToc.client.tsx`; пошуковий індекс віддає `/api/admin-docs/search-index`.
Як влаштований рендерер — [Ця документація](/admin/docs/technical/rozrobka/tsia-dokumentatsiia).

## Importmap: обовʼязковий крок

Адмінка Payload — клієнтський бандл, який не може динамічно резолвити рядкові
шляхи компонентів. Тому всі вони збираються в
`src/app/(payload)/admin/importMap.js`.

**Після додавання чи перейменування будь-якого admin-компонента:**

```bash
pnpm generate:importmap
```

Без цього кроку адмінка падає з «component not found in import map». Файл
генерований — не редагуйте вручну.

## CourseJsonImport

`src/components/admin/CourseJsonImport/index.tsx` — ui-поле, вбудоване у форму
курсу **двічі** з різними `clientProps`:

- `stepsJsonImport` (`clientProps: { target: 'steps' }`) — над полем кроків;
- `quiz.quizJsonImport` (`clientProps: { target: 'quiz' }`) — у групі тесту.

Призначення: контент курсу генерує LLM, редактор вставляє отриманий JSON.

### Механіка

1. Кнопка «Скопіювати промпт для AI» кладе в буфер `STEPS_PROMPT` або
   `QUIZ_PROMPT` (з `src/utilities/courseJsonImport.ts`) — з фолбеком на
   `document.execCommand('copy')` для не-secure контекстів.
2. Вставлений JSON парситься наживо через `parseStepsJson` / `parseQuizJson`
   (той самий файл, 523 рядки). Парсер **ліберальний до форми** (обгортка чи
   голий масив, аліаси полів, plain text замість Lexical — `textToLexical`
   перетворює порожній рядок на новий параграф, markdown не підтримується) і
   **строгий до валідності** (крок без title, некоректний `YOUTUBE_URL_REGEX`,
   питання без правильної відповіді, `duration` > 600). Помилки — українською,
   показуються списком (перші 10).
3. «Додати за допомогою JSON» — append до наявних рядків; «Замінити…» — з
   модальним підтвердженням, якщо є що втрачати. Імпорт квіза примусово
   ставить `quiz.enabled: true`.
4. Застосування йде через `reset(nextData)` форми (єдиний надійний спосіб
   додати richText/blocks-рядки) + `setModified(true)`, щоб кнопка збереження
   лишилась активною.

Валідація на цьому етапі свідомо дублює валідацію колекції: помилка тут — це
читабельне повідомлення, помилка на save — field error на три рівні вглиб форми.

## CourseDeleteConfirmation

`src/components/admin/CourseDeleteConfirmation/index.tsx` — ui-поле в сайдбарі
курсу (`deleteConfirmation`). Стандартне видалення Payload не показує масштаб
каскаду, тому компонент:

1. Через REST рахує повʼязані записи (`limit=0`, лише `totalDocs`):
   `enrollments`, `quiz-attempts`, `comments` і `likes` з
   `targetCollection=courses`.
2. Якщо щось є — показує попередження зі списком кількостей.
3. Кнопка «Видалити курс» відкриває модалку з підсумком «буде безповоротно
   видалено: N записів, M спроб…» і робить `DELETE /api/courses/{id}`, після
   успіху — redirect на список курсів.

Сам каскад виконує `beforeDelete`-хук колекції (див.
[Колекція courses](/admin/docs/technical/model-danykh/courses)) — компонент
лише робить його видимим для адміністратора.

## InviteUserButton

`src/components/admin/InviteUserButton/index.tsx`. payload-auth ставить власну
кнопку `AdminInviteButton` як `Description` колекції users; плагін
`ukrainianAdmin` (останній у ланцюжку) підміняє її шлях на цей компонент.

- Рендериться лише на `/admin/collections/users` (перевірка `pathname`).
- Модалка: вибір ролі (ярлики «Адміністратор»/«Учасник»), email.
- Використовує ендпоінти payload-auth на колекції users:
  `POST /api/users/generate-invite-url` (потрібен повний обʼєкт `{ role }`, не
  рядок) і `POST /api/users/send-invite`.
- «Скопіювати посилання» працює без email; «Надіслати» шле лист через
  `sendInviteEmail` → `payload.sendEmail` (без Resend-адаптера ендпоінт
  віддасть 500 — див. [Email](/admin/docs/technical/infrastruktura/email)).

Токен запрошення дозволяє реєстрацію в обхід OTP-гейта:
[Реєстрація і OTP](/admin/docs/technical/autentyfikatsiya/reiestratsiia-otp).

## RowLabel × 3

Масиви з однотипними рядками отримують читабельні ярлики рядків замість
«Item 1»:

| Файл | Де використовується |
| --- | --- |
| `src/Header/RowLabel.tsx` | `header.navItems` |
| `src/Footer/RowLabel.tsx` | `footer.navItems` |
| `src/HomeCalendar/RowLabel.tsx` | `home-calendar.events` |

Підключаються через `admin.components.RowLabel` відповідного array-поля,
наприклад `'@/Header/RowLabel#RowLabel'`.

## custom.scss: хак «або продовжте через»

`src/app/(payload)/custom.scss`. payload-auth хардкодить англійський розділювач
«Or login with» / «Or sign up with» на екранах входу і реєстрації без API
перекладу. Обхід — чистий CSS:

```scss
.login-form-methods__divider span {
  font-size: 0;

  &::after {
    content: 'або продовжте через';
    font-size: 12px;
  }
}
```

Оригінальний текст стискається до нуля, псевдоелемент малює нейтральну
українську фразу, що покриває обидва екрани.

## admin.meta і livePreview

```ts
meta: {
  titleSuffix: '— Залізна Зміна',
  description: 'Панель адміністратора навчальної платформи «Залізна Зміна»',
  icons: [
    { type: 'image/png', rel: 'icon', url: '/favicon-192.png' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
  ],
  openGraph: { images: [{ url: '/og-image.webp', width: 1200, height: 630 }], /* … */ },
},
```

`livePreview.breakpoints`: Mobile 375×667, Tablet 768×1024, Desktop 1440×900.
Live preview підключений у `pages` і `posts` через `generatePreviewPath`;
**курси live preview не мають** — їхні сторінки збираються з багатьох джерел і
переглядаються через звичайний publish.

## Навігаційні групи

Колекції згруповано через `admin.group`:

- **Курси**: courses, course-categories, course-files, enrollments,
  quiz-attempts, xp-events;
- **Взаємодія**: comments, likes;
- **Автентифікація**: users, sessions, accounts, verifications,
  admin-invitations (групу auth-колекціям простaвляє `ukrainianAdmin`);
- поза групами: Pages, Posts, Media, Categories.
