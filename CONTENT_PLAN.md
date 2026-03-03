# Content Population Plan

This document describes all content to be created in the CMS to populate the production website, migrating content from ironsquad.org.ua and adding new learning platform features.

## Prerequisites

- Lexical `defaultLexical` editor extended with: UploadFeature, UnorderedListFeature, OrderedListFeature, AlignFeature, BlockquoteFeature, HorizontalRuleFeature, IndentFeature, StrikethroughFeature, ChecklistFeature
- Media assets uploaded to the Media collection
- Forms created via Form Builder

## Execution Order

1. Upload media assets
2. Create forms (Contact, Registration)
3. Create post categories
4. Create news posts
5. Create pages (About, Contact, Registration, Homepage)
6. Update Header and Footer globals

---

## 1. Media Assets

Upload these to the Media collection (via Admin Panel or REST API).

### Essential

| Ref | Description | Used in |
|-----|-------------|---------|
| `hero-main` | Main project hero photo (kids at camp, high energy) | Homepage hero |
| `news-1-hero` | Carpathian trip photo | Post 1 hero |
| `news-2-hero` | Carpathian University visit photo | Post 2 hero |
| `news-3-hero` | Railway Worker's Day image | Post 3 hero |

### Team Photos

| Ref | Description |
|-----|-------------|
| `team-yegorov` | Єгоров Олександр |
| `team-trofymyuk` | Трофимюк Тетяна |
| `team-barkova` | Баркова Олена |
| `team-kosheliev` | Кошелєв Ілля |
| `team-rushtyna` | Руштина Дар'я |

### Partner Logos

| Ref | Description |
|-----|-------------|
| `partner-uz` | Укрзалізниця logo |
| `partner-buffett` | Howard G. Buffett Foundation logo |
| `partner-multiplex` | Multiplex logo |
| `partner-ajax` | Ajax logo |
| `partner-sense` | Sense Bank logo |
| `partner-aurora` | Аврора logo |

### Gallery (select 5-10 best event photos)

| Ref | Description |
|-----|-------------|
| `gallery-1` through `gallery-10` | Best photos from recent events (Карпати, Міжнародний саміт, etc.) |

---

## 2. Forms

### 2.1 Contact Form

- **title:** "Зворотній зв'язок"
- **fields:**
  - `text` — name: `full-name`, label (uk): "Повне ім'я", label (en): "Full Name", required
  - `email` — name: `email`, label: "Email", required
  - `number` — name: `phone`, label (uk): "Телефон", label (en): "Phone"
  - `textarea` — name: `message`, label (uk): "Повідомлення", label (en): "Message", required
- **submitButtonLabel:** "Надіслати" / "Send"
- **confirmationType:** `message`
- **confirmationMessage (uk):** "Дякуємо! Ми зв'яжемося з вами найближчим часом."
- **confirmationMessage (en):** "Thank you! We'll get back to you soon."

### 2.2 Registration Form

- **title:** "Анкета учасника"
- **fields:**
  - `text` — name: `child-name`, label (uk): "Ім'я дитини", label (en): "Child's Name", required
  - `number` — name: `age`, label (uk): "Вік", label (en): "Age", required
  - `text` — name: `parent-name`, label (uk): "Ім'я батька/матері", label (en): "Parent Name", required
  - `email` — name: `email`, label: "Email", required
  - `number` — name: `phone`, label (uk): "Телефон", label (en): "Phone", required
  - `select` — name: `shift`, label (uk): "Бажана зміна", label (en): "Preferred Shift", options: [Довга зміна / Long Shift, Коротка зміна / Short Shift], required
  - `textarea` — name: `about`, label (uk): "Розкажіть про дитину", label (en): "Tell us about the child"
- **submitButtonLabel:** "Подати анкету" / "Submit Application"
- **confirmationType:** `message`
- **confirmationMessage (uk):** "Анкету отримано! Ми зв'яжемося з вами для підтвердження."
- **confirmationMessage (en):** "Application received! We'll contact you for confirmation."

---

## 3. Categories

| title (uk) | title (en) | slug |
|------------|------------|------|
| Новини | News | novyny |
| Проєкт | Project | proekt |

---

## 4. Posts (News)

### Post 1

- **title (uk):** "Залізна зміна знову в дорозі — Наша нова подорож у Карпати"
- **title (en):** "Iron Squad is on the road again — Our new trip to the Carpathians"
- **heroImage:** `news-1-hero`
- **categories:** [Новини]
- **publishedAt:** 2025-11-15
- **_status:** published
- **content (uk):** Describe the Carpathian trip — journey, activities, nature, team bonding. Use rich text with headings, paragraphs, and inline images where available.
- **content (en):** English translation.
- **meta.title (uk):** "Залізна зміна — подорож у Карпати"
- **meta.description (uk):** "Залізна зміна вирушила у нову подорож до Карпат — активності, пригоди та розвиток."

### Post 2

- **title (uk):** "Залізна зміна у Карпатському університеті!"
- **title (en):** "Iron Squad at the Carpathian University!"
- **heroImage:** `news-2-hero`
- **categories:** [Новини]
- **publishedAt:** 2025-11-08
- **_status:** published
- **content (uk):** Describe the university visit — educational activities, collaboration, what kids learned.
- **content (en):** English translation.

### Post 3

- **title (uk):** "З Днем залізничника України!"
- **title (en):** "Happy Railway Worker's Day of Ukraine!"
- **heroImage:** `news-3-hero`
- **categories:** [Новини]
- **publishedAt:** 2025-11-04
- **_status:** published
- **content (uk):** Congratulatory text about Railway Worker's Day, connection to Укрзалізниця partnership, project gratitude.
- **content (en):** English translation.

---

## 5. Pages

### 5.1 Homepage (slug: `home`)

#### Hero

- **type:** `highImpact`
- **media:** `hero-main`
- **richText (uk):** h1 "ЗАЛІЗНА ЗМІНА" + paragraph "Унікальний проєкт розвитку талановитої молоді України"
- **richText (en):** h1 "IRON SQUAD" + paragraph "A unique project for developing talented Ukrainian youth"
- **links:**
  - Link 1: reference to page `anketa`, label "Заповнити анкету" / "Apply Now", appearance: `default`
  - Link 2: reference to page `pro-nas`, label "Дізнатися більше" / "Learn More", appearance: `outline`

#### Layout Blocks

**Block 1 — Latest News** (`archive`)
- introContent (uk): h2 "Новини" + paragraph "Останні новини проєкту"
- introContent (en): h2 "News" + paragraph "Latest project news"
- populateBy: `collection`
- relationTo: `posts`
- limit: 3

**Block 2 — About Us** (`content`)
- 1 column, size: `full`
- richText (uk):
  - h2 "Про нас"
  - paragraph: "Мета проєкту - створення багатоступеневої сучасної системи підготовки молоді та дітей до життя, навчання, праці та розвитку в умовах воєнного часу. Учасники проєкту - талановиті підлітки з визначними здобутками у навчанні, спорті, мистецтві і творчості, які внаслідок російської агресії втратили можливість розвивати свій потенціал, але не втратили бажання робити свій вклад у розвиток країни."
  - paragraph: "Назва проєкту найкраще відповідає завданням, які стоять перед українською молоддю – «Залізна зміна» – сильна, згуртована, розумна, спортивна, мужня, патріотична нація, яка зробить європейську Україну процвітаючою, прогресуючою, щасливою державою."
- richText (en): English translations of above
- enableLink: true
- link: reference to page `pro-nas`, label "Детальніше" / "Read More"

**Block 3 — Achievements** (`content`)
- 3 columns, each size: `oneThird`
- Column 1 richText (uk): h2 (centered) "5000" + paragraph (centered) "дітей"
- Column 2 richText (uk): h2 (centered) "38" + paragraph (centered) "змін"
- Column 3 richText (uk): h2 (centered) "210" + paragraph (centered) "тренінгів"
- (en): "children", "shifts", "trainings"

> **Lexical feature used:** AlignFeature for centered text

**Block 4 — Team** (`content`)
- 5 columns, each size: `oneThird` (wraps to 2 rows)
- Each column richText (uk):
  - Inline upload: team member photo (via UploadFeature)
  - h3 (centered): member name
  - paragraph (centered): member role
- Members:
  1. Єгоров Олександр — Керівник проєкту / Project Lead
  2. Трофимюк Тетяна — Куратор проєкту / Project Curator
  3. Баркова Олена — Проджект менеджер / Project Manager
  4. Кошелєв Ілля — Тімлідер / Team Lead
  5. Руштина Дарʼя — Медіалідер / Media Lead

> **Lexical features used:** UploadFeature for inline photos, AlignFeature for centering

**Block 5 — Partners** (`content`)
- 1 column, size: `full`
- richText (uk):
  - h2 (centered) "Партнери"
  - Inline uploads: 6 partner logos side by side (via UploadFeature)
  - paragraph: "Над створенням проєкту працювали потужні компанії: АТ «Укрзалізниця» та фонд Говарда Баффетта. За весь час співпраці ми заручилися підтримкою: Multiplex, Ajax, Sense Bank та Аврора."
- richText (en): English translation

> **Lexical features used:** UploadFeature for logos, AlignFeature for centering

**Block 6 — Calendar / Upcoming Events** (`cta`)
- richText (uk): h2 "Календар" + paragraph "Квітень 2026 — Довга зміна та Коротка зміна. Приєднуйтесь до нашого проєкту!"
- richText (en): h2 "Calendar" + paragraph "April 2026 — Long Shift and Short Shift. Join our project!"
- links:
  - Link 1: reference to page `anketa`, label "Заповнити анкету" / "Apply Now", appearance: `default`

**Block 7 — Gallery** (`content`)
- 1 column, size: `full`
- richText (uk):
  - h2 (centered) "Галерея"
  - Inline uploads: 6-10 best event photos (via UploadFeature)
- richText (en): h2 (centered) "Gallery" + same photos

> **Lexical features used:** UploadFeature for gallery images

**Block 8 — FAQ** (`content`)
- 1 column, size: `full`
- richText (uk):
  - h2 "Часті запитання"
  - horizontal rule
  - h3 "Які речі дати з собою дитині?"
  - unordered list:
    - засоби особистої гігієни (шампунь, гель д/д, зубна паста, зубна щітка, щітка для волосся)
    - гумові тапочки, плавки/купальник
    - нижня білизна, піжама
    - зручний одяг (спортивний костюм, футболки, шорти)
    - головний убір
    - теплі речі (толстовка, фліска)
    - зручне спортивне взуття
    - вітровка з капюшоном або дощовик
    - індивідуальна аптечка, якщо є така необхідність
  - horizontal rule
  - h3 "Багато активних ігор, як з травмами?"
  - paragraph: "Наш проєкт – це справжня арена для пригод і змагань, де діти завжди намагаються перевершити один одного в усьому. Часто через велику конкурентність деякі подряпини можуть траплятися. Але не хвилюйтеся, наш лікар завжди готовий надати допомогу та підтримку!"
  - horizontal rule
  - h3 "Ми відправляємо дитину вперше"
  - paragraph: "Ми повністю розуміємо, що перша поїздка може бути хвилюючою для батьків і дітей. Радимо зазирнути в наш Instagram, де ви зможете побачити фото і відео з попередніх таборів. Кваліфіковані супроводжуючі знайдуть підхід до кожної дитини."
  - horizontal rule
  - h3 "Коли і де можна подивитися фотографії з проєкту?"
  - paragraph: "Наш фотограф фіксує найяскравіші моменти в реальному часі. Фото та відео надсилаються до групи в Telegram по мірі їх обробки."
  - horizontal rule
  - h3 "Коли відбій?"
  - paragraph: "Відбій о 22:00. Перед тим супроводжуючі допомагають дітям з підготовкою до сну."
  - horizontal rule
  - h3 "Повітряна тривога?"
  - paragraph: "Як тільки приходить сповіщення про тривогу, активності припиняються і всі прямують в надійне укриття на території."
- richText (en): English translations of all Q&A pairs

> **Lexical features used:** UnorderedListFeature for packing list, HorizontalRuleFeature for separators

**Block 9 — Contact** (`cta`)
- richText (uk):
  - h2 "Задайте своє питання"
  - paragraph: "Телефон: +380 67 305 67 67"
  - paragraph: "Email: zaliznazmina@gmail.com"
  - paragraph: "Офіс: Стадіонний провулок, 10/2, Київ, 03049"
- richText (en): English labels, same data
- links:
  - Link 1: custom URL `https://t.me/manager_zaliznazmina`, label "Telegram", newTab: true, appearance: `default`
  - Link 2: reference to page `kontakty`, label "Написати нам" / "Contact Us", appearance: `outline`

**Block 10 — Online Courses** (`cta`)
- richText (uk): h2 "Онлайн навчання" + paragraph "Розвивайте свої навички з нашими онлайн-курсами. Відеоуроки, матеріали та тести для учасників проєкту."
- richText (en): h2 "Online Learning" + paragraph "Develop your skills with our online courses. Video lessons, materials, and quizzes for project participants."
- links:
  - Link 1: custom URL `/courses`, label "Переглянути курси" / "Browse Courses", appearance: `default`

---

### 5.2 About Page (slug: `pro-nas`)

#### Hero
- **type:** `mediumImpact`
- **media:** `about-photo` (reuse `hero-main` or a different project photo)
- **richText (uk):** h1 "Про нас"
- **richText (en):** h1 "About Us"

#### Layout Blocks

**Block 1 — Mission** (`content`, full)
- richText (uk):
  - blockquote: "«Залізна зміна» – сильна, згуртована, розумна, спортивна, мужня, патріотична нація, яка зробить європейську Україну процвітаючою, прогресуючою, щасливою державою."
  - paragraph: Full mission text (both paragraphs from old site)
  - paragraph: "Над створенням проєкту працювали потужні компанії: АТ «Укрзалізниця» та фонд Говарда Баффетта. За весь час співпраці ми заручилися підтримкою таких партнерів: Multiplex, Ajax, Sense Bank та Аврора."
- richText (en): English translations

> **Lexical feature used:** BlockquoteFeature for mission quote

**Block 2 — Achievements** (`content`, 3x oneThird)
- Same as homepage Block 3 (5000/38/210 centered stats)

**Block 3 — Team** (`content`)
- Same as homepage Block 4 (5 team members with photos)

**Block 4 — Partners** (`content`)
- Same as homepage Block 5 (logos + description)

**Block 5 — Apply CTA** (`cta`)
- richText (uk): h2 "Приєднуйтесь" + paragraph "Заповніть анкету та станьте учасником проєкту «Залізна зміна»."
- richText (en): h2 "Join Us" + paragraph "Fill out the application and become a participant of the Iron Squad project."
- links: reference to page `anketa`, label "Заповнити анкету" / "Apply Now"

---

### 5.3 Contact Page (slug: `kontakty`)

#### Hero
- **type:** `lowImpact`
- **richText (uk):** h1 "Контакти"
- **richText (en):** h1 "Contact"

#### Layout Blocks

**Block 1 — Contact Info** (`content`, full)
- richText (uk):
  - h3 "Телефон" + paragraph "+380 67 305 67 67"
  - h3 "Email" + paragraph "zaliznazmina@gmail.com"
  - h3 "Офіс" + paragraph "Стадіонний провулок, 10/2, Київ, 03049"
  - h3 "Соціальні мережі"
  - unordered list:
    - link to https://t.me/manager_zaliznazmina — "Telegram"
    - link to https://www.instagram.com/zaliznazmina.uz — "Instagram"
- richText (en): English labels

> **Lexical features used:** UnorderedListFeature for social links

**Block 2 — Contact Form** (`formBlock`)
- form: reference to "Зворотній зв'язок" form
- enableIntro: true
- introContent (uk): h2 "Задайте своє питання"
- introContent (en): h2 "Ask Your Question"

---

### 5.4 Registration Page (slug: `anketa`)

#### Hero
- **type:** `lowImpact`
- **richText (uk):** h1 "Заповнити анкету" + paragraph "Заповніть форму нижче, щоб подати заявку на участь у проєкті «Залізна зміна»."
- **richText (en):** h1 "Application Form" + paragraph "Fill out the form below to apply for the Iron Squad project."

#### Layout Blocks

**Block 1 — Registration Form** (`formBlock`)
- form: reference to "Анкета учасника" form
- enableIntro: false

---

## 6. Header Global

| Order | label (uk) | label (en) | Link type | Target |
|-------|-----------|-----------|-----------|--------|
| 1 | Про нас | About | reference | page `pro-nas` |
| 2 | Курси | Courses | custom | `/courses` |
| 3 | Новини | News | custom | `/posts` |
| 4 | Анкета | Apply | reference | page `anketa` |
| 5 | Контакти | Contact | reference | page `kontakty` |

## 7. Footer Global

| Order | label (uk) | label (en) | Link type | Target |
|-------|-----------|-----------|-----------|--------|
| 1 | Telegram | Telegram | custom (newTab) | `https://t.me/manager_zaliznazmina` |
| 2 | Instagram | Instagram | custom (newTab) | `https://www.instagram.com/zaliznazmina.uz` |
| 3 | Контакти | Contact | reference | page `kontakty` |
| 4 | Про нас | About | reference | page `pro-nas` |

---

## Lexical Features Summary

Features added to `defaultLexical` that enable this content plan:

| Feature | Content that uses it |
|---------|---------------------|
| `UploadFeature` | Team photos, partner logos, gallery images inline in rich text |
| `UnorderedListFeature` | FAQ packing list, social media links list |
| `OrderedListFeature` | Course step instructions, numbered content |
| `AlignFeature` | Centered stats counters, centered headings |
| `BlockquoteFeature` | Mission statement quote on About page |
| `HorizontalRuleFeature` | FAQ section dividers |
| `IndentFeature` | Nested/indented content in posts and courses |
| `StrikethroughFeature` | General text formatting in posts |
| `ChecklistFeature` | Interactive checklists in course content |
