---
title: Логіка подій
description: Правила реєстрації, захист від перевищення місць, доступ до посилання на зустріч, час і календар, кешування та інтеграції подій
---

Модель даних — у статті [Події (events, event-enrollments)](/admin/docs/technical/model-danykh/podii). Тут — поведінка: як обробляється реєстрація, що приховано від публіки, як рахується час і як сторінки залишаються статичними.

## Server actions (`src/app/(frontend)/[locale]/events/actions.ts`)

Усі дії — `'use server'`, авторизація через `getSession()`, доступ до даних через Local API. Клієнт ніколи не пише в `event-enrollments` напряму.

| Дія | Що робить |
| --- | --- |
| `getMyEventEnrollments()` | id усіх подій, на які зареєстрований користувач (для бейджів у каталозі). Для гостя — `[]` |
| `getEventEnrollment(eventId)` | реєстрація користувача на подію або `null` |
| `enrollInEvent(eventId)` | створює реєстрацію; **ідемпотентна** — якщо вже є, повертає її без помилки. `APIError` зі статусом `< 500` перетворює на `{ success: false, error }` (текст правила з хука), `429` — на «Забагато запитів». Після успіху ревалідує сторінки події |
| `unenrollFromEvent(eventId)` | видаляє власну реєстрацію; якщо її немає — успіх (ідемпотентно) |
| `getEventJoinInfo(eventId)` | `{ enrolled, meetingLink }` — посилання віддається **лише** зареєстрованому, лише для опублікованої `virtual`-події |

Усі правила (опублікована, не завершена, є місце, немає дубліката) живуть у `beforeValidate` колекції, а не в actions — тому діють однаково для server actions, REST і Local API; винятком є адміністратор.

## Правила реєстрації та перевищення місць

Для не-адмінів `event-enrollments.beforeValidate` перевіряє:

1. подія існує й `_status === 'published'` → інакше `404`;
2. подія не завершилась: `endDate ?? startDate` не в минулому → інакше `400`. Тобто реєструватись можна **під час** події;
3. є вільне місце (`count(event-enrollments) < capacity`) → інакше `409`.

Адміністратор ці перевірки обходить (ручні записи), але дублікат `user × event` не пройде ніколи (`409` + unique-індекс `user_event_idx`).

### Advisory lock проти гонки

Перевірка «порахували → створили» сама по собі не атомарна: двоє одночасних запитів на останнє місце обидва бачили б `count = capacity - 1`. Тому перед підрахунком береться **transaction-scoped advisory lock**:

```ts
select pg_advisory_xact_lock(7301, <eventId>)
```

`lockEventSeats(req, eventId)` дістає drizzle-сесію поточної транзакції (`req.payload.db.sessions[transactionID].db`) і виконує `pg_advisory_xact_lock`. Ключ — пара `(7301, eventId)`, тож серіалізуються лише реєстрації **на ту саму подію**; лок знімається сам при коміті/роллбеку. Без відкритої транзакції лок відпустився б одразу, тому в цьому разі крок пропускається.

Тест `event-enrollments.int.spec.ts › never exceeds capacity when registrations arrive concurrently` запускає два create паралельно на подію з `capacity: 1` і очікує рівно один успіх; без виклику `lockEventSeats` він стабільно падає.

## Посилання на зустріч: три шари захисту

`meetingLink` — «перепустка» на онлайн-подію, тому приховується так:

1. **Field access** `read: admin` — REST/GraphQL віддають поле лише адміністраторам.
2. **Публічні запити** (`/events`, `/events/[slug]`, `.ics`, блок) читають подію з `overrideAccess: false` без користувача — поле не потрапляє в дані сторінки, отже й у спільний ISR-кеш.
3. **Зареєстрований учасник** отримує посилання після гідрації через `getEventJoinInfo` (Local API, тому field access його не блокує, а перевірка реєстрації робиться в самій дії).

Календарні файли (`.ics` та посилання Google) для віртуальної події містять адресу **сторінки події** як `LOCATION`, а не саме посилання на зустріч.

### Чому без вбудованого Zoom

Вбудувати Zoom-клієнт можна лише через Meeting SDK: окремий застосунок у Zoom Marketplace, ендпоінт підпису JWT на бекенді (Client ID/Secret) і, з березня 2026, авторизація застосунків для зустрічей поза власним акаунтом (ZAK/OBF-токени). Це важка інфраструктура й відповідальність за секрети заради мінімального виграшу. Тому посилання — звичайне поле, а картка `EventJoinCard` визначає платформу за хостом (`detectMeetingPlatform` у `src/utilities/eventTime.ts`: Zoom / Google Meet / YouTube / інше) і підбирає акцент. Додати нову платформу — один запис у `PLATFORM_ACCENTS` та `MEETING_PLATFORM_LABELS`.

## Час

Усі події показуються за **`Europe/Kyiv`** (`EVENT_TIME_ZONE`), незалежно від часового поясу сервера чи відвідувача. Форматери в `src/utilities/eventTime.ts` (`formatEventDate`, `formatEventTime`, `formatEventRange`, `formatEventMonthShort`, `formatEventDayNumber`, `isSameEventDay`) завжди передають `timeZone`, а порівняння «той самий день» роблять за київським ключем дня — інакше подія о 00:30 за Києвом зʼїжджала б на попередній день на UTC-сервері.

У БД дати зберігаються як `timestamptz` (UTC). Файл `.ics` і посилання Google Calendar використовують UTC-моменти. Подія без `endDate` у календарі отримує тривалість **1 година** (обовʼязкова вимога обох форматів).

## Рендер і кеш

| Сторінка | Стратегія |
| --- | --- |
| `/events` | ISR `revalidate = 300`; клієнтський `EventsExplorer` ділить події на «Майбутні / Минулі» за **живим годинником** (початковий стан бере `serverNow` з рендера, щоб гідрація збігалась), а відлік оновлюється щохвилини |
| `/events/[slug]` | ISR `revalidate = 300`, `generateStaticParams` по опублікованих; запит події обгорнуто в `cache()`, щоб `generateMetadata` і сторінка ділили один SELECT |
| `/api/events/[id]/calendar.ics` | функція з `Cache-Control: public, s-maxage=300` |

Персональний стан (зареєстрований чи ні, посилання на зустріч) підвантажується **на клієнті**: `EventUserStateProvider` викликає `getEventJoinInfo`, `useMyEventEnrollments` — `getMyEventEnrollments`. У публічних компонентах немає `getSession()` і `useSearchParams()` — див. правила продуктивності в [Огляді архітектури](/admin/docs/technical/arkhitektura/ohliad). Після (від)реєстрації `EventActionBar` викликає `refresh()` провайдера (оновлює бейдж і кнопку «Приєднатися»), а лічильник місць оновлює сам Next: server action викликає `revalidatePath`, тож поточний маршрут перерендерюється — явний `router.refresh()` не потрібен.

### Ревалідація

`revalidateEvent` / `revalidateEventDelete` (`src/hooks/revalidateEvent.ts`) для кожного префікса локалі (`''` і `/en`) скидають:

- `/events/<slug>` та `/events`;
- `/` (головна), `/[slug]` і `/posts/[slug]` — бо блок «Події» може бути вбудований у головну, CMS-сторінки й пости.

Слаг-зміна чи зняття з публікації скидає і **попередній** slug. Виклик обгорнуто в `try/catch`: планові публікації (`schedulePublish`) виконуються поза запитом, де `revalidatePath` кидає — тоді це лише попередження в лозі. Прапорець `context.disableRevalidate` вимикає ревалідацію (потрібен у vitest).

## Інтеграції

- **Блок `eventsBlock`** (`src/blocks/EventsBlock/`): у `Pages.layout` і `Posts` (Lexical `BlocksFeature`); рендер — `RenderBlocks.tsx` для сторінок і серверний конвертер у `src/components/RichText/WithArchive.tsx` для постів (потрібен Local API, тому не в клієнтському бандлі). Обидва режими читають події з `overrideAccess: false`, `draft: false` і `_status = published`. **`populateBy: 'selection'` ніколи не переходить на запит «найближчих»** — порожній вибір дає порожній блок; вибрані події зберігають порядок вибору. «Найближчі» = `endDate ≥ now` **або** (`endDate` порожнє й `startDate ≥ now`), `sort: startDate`.
- **Профіль** (`profile/page.tsx`): `event-enrollments` користувача з `depth: 1`, відфільтровані до опублікованих і не завершених, за зростанням `startDate`.
- **Коментарі та лайки**: `InteractionSection targetCollection="events"`; `ProfileLatestComments` резолвить назви й посилання подій (лише опублікованих).
- **Пошук**: `beforeSync` мапить подію в search-документ; на сторінці пошуку мітка типу — `searchTypeEvent`, тип картки `CardRelationTo` містить `'events'`.
- **SEO**: `generateMetadata` (title, canonical + `hreflang`-alternates, OpenGraph, Twitter), JSON-LD `Event` (`eventAttendanceMode`, `VirtualLocation` без посилання на зустріч). Абсолютні URL будує `getPreviewAwareServerURL()` (`src/utilities/getURL.ts`) — на preview-деплої це alias гілки, `robots: noindex`.

## Адмін-поверхня

- **Меню**: група «Події» (`events`, `event-enrollments`).
- **Дашборд** (`BeforeDashboard`): лічильники «Події» і «Реєстрації на події», швидка дія «Нова подія».
- **Панель адміністратора на сайті** (`src/components/AdminBar`): посилання «Події» (і «Календар змін» — глобал `home-calendar`), без кнопок «+ створити».
- **Ручна реєстрація**: join-поле `registrations` на сторінці події → «Додати новий».
- **Документація**: цей розділ і [менеджерська категорія «Події»](/admin/docs/manager/podii/stvorennia-podii).

## Тести

| Файл | Що покриває |
| --- | --- |
| `tests/int/events.int.spec.ts` | валідація публікації (адреса / посилання / `endDate > startDate`), видимість чернеток, `meetingLink` лише для адміна, заборона create/update не-адмінам, join `registrations` (адмін бачить, анонім — ні), каскад видалення (реєстрації, коментарі, лайки), форматери часу |
| `tests/int/event-enrollments.int.spec.ts` | дублікат, чернетка, завершена, ongoing, місткість + override адміна, **гонка за останнє місце**, привʼязка `user`, матриця read, owner-delete, заборона owner-update, ручний запис адміном і незмінність `user`/`event` |
| `tests/e2e/events.e2e.spec.ts` | заголовки uk/en, сторінка події (час за Києвом, SEO, JSON-LD, коментарі), запрошення увійти, `.ics` |
| `tests/e2e/admin.e2e.spec.ts` | дашборд подій, розділи «Події» / «Реєстрації», панель адміністратора на сайті |

## Повʼязані статті

- [Rate limiting](/admin/docs/technical/biznes-logika/rate-limiting) — ліміт `event-enroll-create`.
- [Comments та likes](/admin/docs/technical/biznes-logika/komentari-laiky) — спільна логіка взаємодії.
- [Міграції](/admin/docs/technical/infrastruktura/mihratsii) — схема подій і preview-база.
