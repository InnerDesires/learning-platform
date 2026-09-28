---
title: Сертифікати
description: HMAC-токени, гейтинг PDF-роуту, пайплайн @react-pdf/renderer з QR-кодом та сторінки верифікації — включно з відомими недоліками
---

## Огляд

Сертифікат — це PDF, який генерується **на льоту** при кожному завантаженні (нічого не зберігається) і несе QR-код на публічну сторінку верифікації. Компоненти:

| Файл | Роль |
| --- | --- |
| `src/utilities/certificateToken.ts` | Генерація/перевірка HMAC-токена |
| `src/app/(frontend)/[locale]/courses/[slug]/certificate/route.ts` | GET-роут, що віддає PDF |
| `.../certificate/pdf.tsx` | Рендер PDF через `@react-pdf/renderer` |
| `.../certificate/certificate-bg.ts` | Фонове зображення як data-URI |
| `src/app/(frontend)/[locale]/verify/page.tsx` + `[token]/page.tsx` | Сторінки верифікації |

Менеджерський опис — [Сертифікати](/admin/docs/manager/kursy/sertyfikaty).

## Токен: `generateCertificateToken` / `verifyCertificateToken`

Формат: `base64url("enrollmentId:userId:courseId") ~ hex(HMAC-SHA256(secret, "certificate-v1:e:u:c"))`, розділювач — перший `~`.

```ts
export function generateCertificateToken(enrollmentId, userId, courseId): string {
  const payload = `certificate-v1:${enrollmentId}:${userId}:${courseId}`
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex')
  const data = Buffer.from(`${enrollmentId}:${userId}:${courseId}`).toString('base64url')
  return `${data}~${signature}`
}
```

Секрет — `process.env.PAYLOAD_SECRET` (без нього — throw). Зверніть увагу: у HMAC підписується рядок **з префіксом версії** `certificate-v1:`, а в base64url-частину префікс не входить — токен коротший, а стара версія формату ніколи не зверифікується новим кодом як своя.

`verifyCertificateToken` — послідовність відмов:

```ts
const sepIndex = token.indexOf('~')          // split по ПЕРШОМУ ~
if (sepIndex === -1) return { valid: false } // 1. немає розділювача
// 2. битий base64url → catch → invalid
// 3. decoded.split(':').length !== 3 → invalid
// 4. будь-який id: !Number.isFinite(n) || n <= 0 → invalid
// 5. signaturePart !== expectedSignature → invalid
return { valid: true, enrollmentId, userId, courseId }
```

Валідний токен повертає розібрані id — верифікація підпису відбувається **до** будь-якого запиту в БД, тож сторінка `/verify/[token]` не дає безкоштовного oracle для перебору enrollment id.

### Відомі недоліки (свідомі компроміси)

:::warning
- **Не constant-time порівняння**: `if (signaturePart !== expectedSignature)` — звичайний `!==`, а не `crypto.timingSafeEqual`. Теоретично відкриває timing-атаку на підпис; практична експлуатованість через мережеві шуми низька, але при доопрацюванні перше, що варто замінити.
- **Stateless і безстрокові**: токен не має expiry і не зберігається в БД — його неможливо відкликати як токен. Ротація `PAYLOAD_SECRET` інвалідує **всі** видані QR одразу.
- **Єдиний механізм відклику** — стан enrollment: сторінка верифікації перевіряє `status === 'completed'` наживо, тож переведення enrollment з `completed` (вручну адміном) або його видалення робить токен «недійсним» фактично, хоча підпис лишається валідним.
:::

## Гейтинг роуту

`GET /[locale]/courses/[slug]/certificate` (роут **не** покритий middleware-matcher'ом — self-guard):

| Крок | Перевірка | Відповідь |
| --- | --- | --- |
| 1 | `getSession()` відсутня/фейл | **401** `Unauthorized` |
| 2 | курс по slug серед `_status: 'published'` (з локаллю, `depth: 0`) не знайдено | **404** `Course not found` |
| 3 | enrollment `user × course × status: 'completed'` не знайдено | **403** `No completed enrollment found` |

PDF завжди генерується для **поточного** користувача сесії — у роуті немає параметра «чий сертифікат», тож скачати чужий неможливо в принципі.

Роут **не** перевіряє тест чи кроки окремо — вимоги успадковуються через `status` (див. [Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu)). Далі:

- `userName = userRecord.name || session.user.name || session.user.email || 'Unknown'`;
- `completedAt = enrollment.completedAt ?? enrollment.updatedAt`, формат `toLocaleDateString('uk-UA' | 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })`;
- відповідь: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="certificate-<slug>.pdf"`, `Cache-Control: no-store`.

### Деривація CERT-ID

```ts
const certId = token.slice(0, token.indexOf('~')).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase()
// на PDF і сторінці верифікації: `CERT-${certId}`
```

Тобто CERT-ID — це перші 12 алфанумериків **data-частини** токена (не підпису), uppercase. Він детермінований: той самий enrollment завжди дає той самий номер, і сторінка верифікації обчислює його з токена так само — числа збігаються без жодного збереження.

## PDF-пайплайн — `pdf.tsx`

- **Рендерер**: `@react-pdf/renderer`, `renderToBuffer(<CertificateDocument/>)`.
- **Сторінка**: фіксовані `595.5 × 419.25 pt` (альбомний A5-подібний макет, розміри дзеркалять мокап).
- **Шрифт**: PT Serif (400 + 700) реєструється з **jsDelivr у рантаймі**:

  ```ts
  Font.register({
    family: 'PT Serif',
    fonts: [{ src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptserif/PT_Serif-Web-Regular.ttf', ... }],
  })
  ```

  `Font.registerHyphenationCallback((word) => [word])` вимикає переноси.
- **Статика**: весь макет (титул, лейбли, логотипи партнерів) запечений у фонове зображення `certificateBgDataUri` (data-URI у `certificate-bg.ts`) — PDF-код накладає лише динаміку на виміряні з мокапа координати.
- **Динаміка**: ім'я (бокс 463.4×41.3 pt), назва курсу (uppercase, може перенестись на 2 рядки — тому в `fitFontSize` передається подвійна ширина 930), дата, CERT-ID.
- **`fitFontSize(text, maxWidth, maxSize, minSize, emFactor)`** — оцінка ширини по середній ширині гліфа (0.62 em для кирилиці PT Serif Bold, 0.85 для uppercase з letter-spacing) і кламп у діапазон. Ім'я: 20→12 pt; курс: 14→11 pt.
- **QR**: **вручну** — `QRCode.create(url, { errorCorrectionLevel: 'M' })` з пакета `qrcode`, далі матриця модулів рендериться `<Rect>`-ами в `<Svg>` 37 pt (бібліотека не вміє React-PDF-примітиви, тому DIY):

  ```tsx
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const cellSize = size / qr.modules.size
  // подвійний цикл по modules.get(row, col) → <Rect x={col*cellSize} y={row*cellSize} ... fill={NAVY} />
  ```

  Сидить у білому боксі 52×52 pt, обгорнутому `<Link src={verifyUrl}>` — QR і клікабельний, і сканований. `verifyUrl = ${getServerSideURL()}/verify/${token}`.

:::danger Зовнішня рантайм-залежність
Перше завантаження сертифіката на холодній лямбді тягне TTF з CDN. Недоступність jsDelivr = неможливість згенерувати PDF. Це відомий компроміс (шрифт не роздуває бандл); при hardening — запекти шрифт локально, як фон.
:::

## Верифікація

- **`/verify`** — публічна лендинг-сторінка з формою ручного вводу токена (`VerifyForm`).
- **`/verify/[token]`** — server component без автентифікації:
  1. `verifyCertificateToken(token)` невалідний → червона картка «недійсний».
  2. Enrollment фетчиться `findByID` у `try/catch`; відсутній **або** `status !== 'completed'` → та сама червона картка (одна відповідь на обидва випадки — не розкриваємо, існує запис чи ні).
  3. Курс і користувач фетчаться **незалежно**, кожен у своєму `try/catch`, з fallback `'Unknown Course'` / `'Unknown'` — видалений курс не ламає верифікацію факту завершення.
  4. Зелена картка: ім'я, курс, дата (`completedAt ?? updatedAt`), `CERT-` + той самий 12-символьний дериват.

:::info Лінки без locale-префікса
Сторінка `/[locale]/certificates` (гейт `requireSession`; completed enrollments, `sort: '-completedAt'`, `limit: 100`) генерує download-лінки **без** префікса локалі — middleware сам переписує їх на `uk`. Так само `verifyUrl` в QR не містить локалі.
:::

## Сторінка «Мої сертифікати»

`/[locale]/certificates` — у matcher middleware (захищений префікс), плюс `requireSession` у коді. Логіка: completed enrollments поточного юзера, `sort: '-completedAt'`, `depth: 1` (щоб мати назви курсів), `limit: 100`; кожен рядок — лінк на `/courses/<slug>/certificate`.

## Гострі кути одним списком

1. Курс без кроків і без тесту ніколи не завершується → сертифіката не існуватиме (див. [Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu)).
2. `quizPassed` липкий: провал ретейку сертифікат не відкликає.
3. Токени безстрокові; ротація `PAYLOAD_SECRET` = масова інвалідизація QR.
4. Порівняння підпису не constant-time.
5. PDF залежить від jsDelivr у рантаймі.
6. `completedAt ?? updatedAt` — якщо адмін вручну виставив `completed` без дати, датою сертифіката стане останнє оновлення enrollment.

## Пов'язане

- Правило `status === 'completed'` і promote-only синхронізація: [Завершення курсу](/admin/docs/technical/biznes-logika/zavershennia-kursu)
- Липкий `quizPassed` (провал ретейку не відкликає сертифікат): [Тести: оцінювання та спроби](/admin/docs/technical/biznes-logika/kvizy)
- Middleware і захищені шляхи: [Маршрути та middleware](/admin/docs/technical/arkhitektura/marshruty-i-middleware)
- Для адміністраторів і менеджерів: [Сертифікати](/admin/docs/manager/kursy/sertyfikaty)
