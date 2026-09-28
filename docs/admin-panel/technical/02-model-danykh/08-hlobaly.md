---
title: Глобали
description: header, footer і home-calendar — поля, revalidate-теги та відома діра в update-доступі календаря
---

У проєкті три глобали, зареєстровані в `payload.config.ts`:
`globals: [Header, Footer, HomeCalendar]`. Кожен живе у власній директорії
разом із RowLabel-компонентом і revalidate-хуком.

## header

Файл: `src/Header/config.ts`. Ярлик «Хедер сайту».

### Поля

Єдине поле — `navItems`:

| Атрибут | Значення |
| --- | --- |
| Тип | array, localized |
| maxRows | **6** |
| RowLabel | `@/Header/RowLabel#RowLabel` (показує label посилання замість «Item N») |
| initCollapsed | true |

Кожен рядок — одне `link({ appearances: false })` поле
(`src/fields/link.ts`):

- `type` radio: `reference` (внутрішній документ) / `custom` (URL);
- `reference` rel → `pages` \| `posts` (при type=reference);
- `url` text (при type=custom);
- `newTab` checkbox;
- `label` text — required, localized.

### Access і хук

```ts
access: {
  read: () => true,
  update: admin,
},
hooks: { afterChange: [revalidateHeader] },
```

`revalidateHeader` (`src/Header/hooks/revalidateHeader.ts`) →
`revalidateTag('global_header')`. Фронтенд читає глобал через `getCachedGlobal`
(`src/utilities/getGlobals.ts`, `unstable_cache` з тегом `global_<slug>`), тож
зміна навігації підхоплюється одразу після збереження.

## footer

Файл: `src/Footer/config.ts`. Ярлик «Футер сайту». Конфіг **ідентичний**
header-у: те саме `navItems` (localized, maxRows 6, той самий link-філд,
власний `@/Footer/RowLabel#RowLabel`), той самий access (read public, update
admin). Хук `revalidateFooter` → тег `global_footer`.

## home-calendar

Файл: `src/HomeCalendar/config.ts`. Ярлик «Календар змін» — секція «Найближчі
зміни» на головній сторінці. `admin.description` попереджає редактора:
зберігайте **обидві** локалізації, інакше англійська версія показуватиме
український текст.

### Поля

Усі поля localized, а `defaultValue` кожного підтягується з
`getHomeContent(locale)` (`src/components/Home/content.ts`) — тобто порожній
глобал рендерить той самий текст, що зашитий у код головної:

| Поле | Тип | Атрибути |
| --- | --- | --- |
| `tag` | text | «Надзаголовок» |
| `title` | text | «Заголовок» |
| `description` | textarea | «Опис» |
| `events` | array | «Зміни», RowLabel `@/HomeCalendar/RowLabel#RowLabel`, initCollapsed |
| `events[].month` + `events[].year` | text + text | row 50/50; місяць скорочено, напр. «ВЕР»; обидва required |
| `events[].range` | text | required, напр. «1–7 вересня 2026» |
| `events[].title` | text | required |
| `events[].description` | textarea | — |
| `events[].formUrl` | text | **required** — посилання на анкету |
| `cta` | text | «Текст кнопки»; опис: «Кнопка веде на анкету першої зміни у списку.» |

### ⚠️ Update-доступ не заданий — відоме обмеження

```ts
access: {
  read: () => true,
},
```

На відміну від header/footer, тут задано **лише** `read`. Для незаданих
операцій глобала Payload застосовує дефолт — **будь-який автентифікований
користувач**. Тобто формально кожен залогінений learner може через REST
(`POST /api/globals/home-calendar`) переписати календар на головній сторінці.

:::warning Відома діра, задокументовано свідомо
Ризик обмежений (дефейс однієї секції головної, без даних користувачів), але
реальний. Правильний фікс — один рядок: `update: admin` за прикладом
`src/Header/config.ts`. Якщо додаєте новий глобал — **завжди** задавайте
`update` явно; цей випадок показує, як легко його загубити.
:::

### Хук

`revalidateHomeCalendar` (`src/HomeCalendar/hooks/revalidateHomeCalendar.ts`)
→ `revalidateTag('global_home-calendar')`.

## Зведення revalidate-тегів

| Глобал | Тег | Хто читає |
| --- | --- | --- |
| `header` | `global_header` | `getCachedGlobal('header')` у layout |
| `footer` | `global_footer` | `getCachedGlobal('footer')` у layout |
| `home-calendar` | `global_home-calendar` | головна сторінка |

Тег формується як `global_${slug}` і в хуках, і в `getGlobals.ts` — при
додаванні нового глобала дотримуйтесь цієї конвенції, інакше кеш не
інвалідується. Загальна карта тегів —
[Маршрути та middleware](/admin/docs/technical/arkhitektura/marshruty-i-middleware).

## Як фронтенд читає глобали

`src/utilities/getGlobals.ts`:

```ts
const getGlobal = unstable_cache(
  async () => payload.findGlobal({ slug, depth }),
  [slug],
  { tags: [`global_${slug}`] },
)
```

Кеш безстроковий і інвалідується **лише тегом** — тому afterChange-хук
обовʼязковий для кожного глобала. Layout читає header/footer на кожен рендер,
але фактичний запит до БД відбувається тільки після збереження в адмінці.

## Відмінності від колекцій

- Глобали **не мають versions/drafts** у цьому проєкті — збереження одразу
  live (після ревалідації тега). Помилка редактора на головній видима
  негайно; історії версій, куди можна відкотитись, немає.
- Локалізовані поля зберігаються по локалях одного документа: перемикач
  локалі вгорі форми змінює, яку мову ви редагуєте. Для `home-calendar` це
  критично — заповнюйте en окремо (fallback підставить uk, але це виглядає як
  «недороблена» англійська версія).

## MCP

Глобали `header` і `footer` доступні MCP-клієнтам з увімкненим доступом (див.
[Колекції плагінів](/admin/docs/technical/model-danykh/plahinni-kolektsii));
`home-calendar` в MCP не експонований.
