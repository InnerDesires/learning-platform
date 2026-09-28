---
title: Деплой на Vercel
description: Production-білд із міграціями, on-demand превʼю через [preview], змінні оточення та ISR-стратегія з таблицею cache tags.
---

Платформа деплоїться на Vercel (Hobby-план, регіон `fra1`). Головні принципи: міграції запускаються лише в production-білді, превʼю будуються лише на явний запит, і жоден автоматичний процес із PR-а не може дотягнутися до prod-бази.

## vercel.json

```jsonc
{
  "regions": ["fra1"],
  "ignoreCommand": "if [ \"$VERCEL_ENV\" = \"production\" ]; then exit 1; elif printf '%s' \"$VERCEL_GIT_COMMIT_MESSAGE\" | grep -qF '[preview]'; then exit 1; else exit 0; fi"
}
```

- **`regions: ["fra1"]`** — функції у Франкфурті, поруч із Neon-базою (мінімізує латентність кожного запиту до БД).
- **`ignoreCommand`** — у семантиці Vercel `exit 1` = «білдити», `exit 0` = «пропустити». Отже: production завжди білдиться; превʼю білдиться **лише** якщо commit message містить `[preview]`; усе інше скасовується («Canceled by Ignored Build Step»).

### Превʼю on-demand

Hobby-план автоматично білдив би превʼю на **кожен** push у PR — з одним конкурентним білдом і спільною квотою хвилин це редундантно, бо GitHub Actions і так тестує кожен PR. Тому превʼю опційні:

```bash
# превʼю без кодових змін
git commit --allow-empty -m "chore: preview [preview]" && git push

# ad-hoc превʼю поточного чекаута (CLI-деплої не консультуються з ignoreCommand)
vercel deploy
```

Превʼю дивляться на довгоживучий бранч `preview` у **dev**-проєкті Neon (форк від `dev`, тож із сід-контентом) і **ніколи не запускають міграції** — превʼю схемозмінного PR-а може рендерити помилки проти старішої схеми, це прийнято й очікувано. Neon↔Vercel інтеграція **відʼєднана** (2026-07-22): раніше вона форкала `preview/*` бранчі у prod-проєкті на кожен push, навіть для скасованих білдів.

## Production-білд

```jsonc
"vercel-build": "node scripts/migrate-on-vercel.mjs && pnpm build",
"postbuild": "next-sitemap --config next-sitemap.config.cjs"
```

Мердж у `main` → Vercel запускає `vercel-build`: спершу міграції (production-only, фейл = перерваний білд, попередній деплой лишається живим — повний розбір у [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii)), потім `next build`, потім `postbuild` генерує sitemap.

Sitemap-нюанси: `siteUrl` береться з `NEXT_PUBLIC_SERVER_URL` → `https://VERCEL_PROJECT_PRODUCTION_URL` → `https://example.com`; `robots.txt` забороняє `/admin/*`; дві динамічні sitemap-и віддають лише published-документи (`overrideAccess: false`, `draft: false`, limit 1000). Sitemap-и **лише uk, без hreflang** — відома вада.

### Білд торкається бази

`next build` ініціалізує Payload під час prerender-фази (`generateStaticParams` тягне published-курси і сторінки), тож **кожен білд читає базу** того оточення, в якому виконується. Це фундаментальний факт, з якого випливає половина рішень тут: чому міграції не можна вішати на ініціалізацію Payload (виконувались би в кожному білді, включно з превʼю), чому превʼю потребують робочого `DATABASE_URL` (бранч `preview` dev-проєкту), і чому у worktree без `.env` падає навіть простий `pnpm build`.

### Rollback

Зламаний деплой відкочується штатними засобами Vercel (Promote попереднього деплою). Зламані **дані/схема** — це Neon point-in-time restore прод-проєкту плюс `down()` відповідної міграції. Найчастіший сценарій «зламаної міграції» не вимагає нічого: білд перервався, прод так і лишився на попередній версії — виправте міграцію наступним PR-ом.

## Типові сценарії

### Викотити фічу на прод

```bash
gh pr merge <number> --squash     # merge у main
# Vercel сам: migrate-on-vercel → next build → postbuild sitemap → deploy
```

Слідкувати за білдом — у дашборді Vercel; рядки `[migrate-on-vercel]` у лозі білда показують, чи бігли міграції і як завершились.

### Подивитись превʼю схемобезпечної зміни

```bash
git commit --allow-empty -m "chore: preview [preview]" && git push
```

Превʼю отримає URL виду `<project>-<hash>.vercel.app` і дані бранча `preview` (сід-контент з `dev`). Памʼятайте: схема превʼю може відставати — це не баг.

### Відкотити невдалий деплой

Код: Promote попереднього деплою в дашборді Vercel (миттєво). Дані: Neon point-in-time restore прод-проєкту + `down()` міграції — але найчастіше нічого відкочувати не треба, бо зламана міграція просто перервала білд і прод не змінився.

## Змінні оточення

| Змінна | Призначення | Де читається |
| --- | --- | --- |
| `DATABASE_URL` | Neon connection string (Production-scoped → prod-проєкт; Preview-scoped → бранч `preview`) | `src/payload.config.ts` (адаптер), `scripts/migrate-on-vercel.mjs` |
| `PAYLOAD_SECRET` | Секрет Payload; також ключ HMAC сертифікатних токенів | `src/payload.config.ts`, `src/utilities/certificateToken.ts` |
| `BETTER_AUTH_SECRET` | Підпис сесій Better Auth | `src/lib/auth/options.ts` |
| `BLOB_READ_WRITE_TOKEN` | Токен Vercel Blob; його наявність вмикає blob-storage-плагін | `src/plugins/index.ts`, `redirects.js` (витягує store id регекспом) |
| `STORAGE_VERCEL_BLOB_BASE_URL` | Явний base URL блоб-стора (перекриває деривацію з токена) | `redirects.js`, `src/migrations/20260724_200000_backfill_blob_urls.ts` |
| `RESEND_API_KEY` | Вмикає відправку email; без нього — консольний адаптер/no-op | `src/payload.config.ts`, `src/lib/auth/options.ts`, `src/app/api/auth/verify-registration/route.ts` |
| `EMAIL_FROM` | Адреса відправника (дефолт `onboarding@resend.dev`) | ті самі три файли |
| `CRON_SECRET` | Bearer-токен для jobs runner і хедер `x-reindex-secret` реіндексу пошуку | `src/payload.config.ts` (jobs.access.run), `src/app/api/reindex-search/route.ts` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth; провайдер реєструється лише коли обидві задані | `src/lib/auth/options.ts` |
| `NEXT_PUBLIC_SERVER_URL` | Канонічний origin: server URL Payload, `remotePatterns`, sitemap `siteUrl` | `src/utilities/getURL.ts`, `next.config.js`, `next-sitemap.config.cjs` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Найвищий пріоритет у `resolveBaseURL` Better Auth (важливо при міграції домену) | `src/lib/auth/options.ts` |
| `PREVIEW_SECRET` | Спільний секрет draft-превʼю: лінк з адмінки → `/next/preview` | `src/utilities/generatePreviewPath.ts`, `src/app/(frontend)/next/preview/route.ts` |
| `RATE_LIMIT` | `'false'` вимикає / `'true'` вмикає rate limiting; інакше — увімкнено лише в production | `src/lib/rate-limit.ts` |
| `ALLOW_DEV_LOGIN` | `'1'` дозволяє `/api/dev-login` у локальному production-білді; на Vercel маршрут вимкнений безумовно (`process.env.VERCEL`) | `src/app/api/dev-login/route.ts` |

:::warning
`NEXT_PUBLIC_SERVER_URL` на проді наразі **не задано** — origin резолвиться через `VERCEL_PROJECT_PRODUCTION_URL`, який Vercel обчислює як *найкоротший* production-домен. Під час міграції домену це старий домен — спершу задайте env-перекриття (`NEXT_PUBLIC_BETTER_AUTH_URL`, `NEXT_PUBLIC_SERVER_URL`), потім міняйте домени.
:::

## ISR-стратегія

Публічні сторінки — статичні з інкрементальною ревалідацією; сторінки кроків курсу та квізів рендеряться per-request (вони залежать від прогресу користувача). `generateStaticParams` пререндерить published-сторінки і курси в обох локалях (uk без префікса, `/en`), тож перший відвідувач після деплою вже отримує статику.

Два залізні правила продуктивності (закріплені з PR #67): у компонентах публічних сторінок **немає `getSession`** (зробило б сторінку динамічною і зламало б спільний ISR-кеш — прогрес користувача добирається клієнтськи) і **немає `useSearchParams`** у серверному дереві. Джерело істини про те, що реально пререндериться, — `prerender-manifest` білда.

| Сторінка | `revalidate` |
| --- | --- |
| Головна | 300 с |
| Каталог курсів, сторінка курсу, категорія курсів | 300 с |
| Лідерборд | 300 с |
| Пости | 600 с |

### Cache tags

| Тег | Що інвалідує | Хто бʼє |
| --- | --- | --- |
| `pages-sitemap`, `posts-sitemap` | динамічні sitemap-и | `revalidatePage` / `revalidatePost` |
| `redirects` | кеш редіректів plugin-redirects | `revalidateRedirects` |
| `global_header`, `global_footer`, `global_home-calendar` | глобали | afterChange-хуки глобалів |
| `xp-leaderboard` | all-time лідерборд (unstable_cache 300 с) | `logXpEvent` після успішного запису |
| `course-enrollment-stats` | стрічка останніх завершень (60 с) | `revalidateCoursePages` |
| `likes-counts-<coll>`, `comments-counts-<coll>` | кешовані лічильники (120 с) | `revalidateCounts` (skip для лайків коментарів) |
| `pages_<slug>`, `posts_<slug>` | конкретні документи | відповідні afterChange-хуки |

### revalidateCourse і scheduled publish

`src/hooks/revalidateCourse.ts` бʼє всі ISR-поверхні курсу: обидва локальні префікси (`''`, `'/en'`) × `/courses/<slug>`, `/courses`, `/courses/category/[slug]`, `/`; при rename/unpublish — додатково старий slug. Увесь блок обгорнутий у `try/catch`: **відкладена публікація (schedulePublish) виконується поза HTTP-запитом, де `revalidatePath` кидає виняток** — пропущений bust компенсується часовим вікном `revalidate`, а сейв документа ніколи не фейлиться через ревалідацію.

### Draft preview (PREVIEW_SECRET)

Кнопка Preview в адмінці веде на `/next/preview?slug&collection&path&previewSecret=$PREVIEW_SECRET` (генерується `src/utilities/generatePreviewPath.ts`; мапа префіксів: posts → `/posts`, pages → `''`; **курси live preview не мають**). Маршрут перевіряє: `previewSecret === PREVIEW_SECRET` (інакше 403), наявність трьох параметрів (404), `path` починається з `/` (500), `payload.auth()` повертає користувача (403) — і лише тоді вмикає `draftMode` та редіректить. `/next/exit-preview` вимикає. Секрет має бути заданий і в оточенні білда, і в рантаймі — розсинхрон між адмінкою та фронтендом дає постійні 403.

## Перевірка проду

:::warning Vercel Security Checkpoint
`curl` до продакшн-домену впирається у Vercel Security Checkpoint (JS-челендж) і не покаже реальної відповіді. Перевіряйте прод **браузером**, а програмні перевірки робіть same-origin `fetch`-ем зі сторінки, відкритої в браузері (наприклад, через DevTools-консоль).
:::

## Повʼязані статті

- [Push vs міграції](/admin/docs/technical/infrastruktura/mihratsii) — механіка `migrate-on-vercel.mjs`
- [База даних Neon](/admin/docs/technical/infrastruktura/baza-danykh) — чому превʼю живуть у dev-проєкті Neon
- [Медіа та Vercel Blob](/admin/docs/technical/infrastruktura/media-blob) — блоб-стори і редіректи легасі-URL
- [Маршрути та middleware](/admin/docs/technical/arkhitektura/marshruty-i-middleware) — маршрути, які все це обслуговують
