---
title: Маршрути та middleware
description: Повна карта App Router-маршрутів, логіка src/middleware.ts, ISR-часи, cache tags і generateStaticParams
---

## src/middleware.ts

Middleware робить дві речі: нормалізує локаль у URL і перекриває приватні
маршрути до рендера. Повний код:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const defaultLocale = 'uk'
const locales = ['uk', 'en']

const protectedPrefixes = ['/profile', '/certificates']
const protectedPatterns = [/^\/courses\/[^/]+\/steps/]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/next') ||
    pathname.includes('.') ||
    pathname.includes('-sitemap')
  ) {
    return NextResponse.next()
  }

  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (pathnameLocale === defaultLocale) {
    const newPathname = pathname.replace(`/${defaultLocale}`, '') || '/'
    return NextResponse.redirect(new URL(newPathname, request.url))
  }

  const cleanPath = pathnameLocale
    ? pathname.replace(`/${pathnameLocale}`, '') || '/'
    : pathname

  const isProtected =
    protectedPrefixes.some((p) => cleanPath.startsWith(p)) ||
    protectedPatterns.some((p) => p.test(cleanPath))

  if (isProtected) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
      const locale = pathnameLocale || defaultLocale
      const loginPath = locale === defaultLocale ? '/login' : `/${locale}/login`
      const redirectParam = encodeURIComponent(pathname)
      return NextResponse.redirect(
        new URL(`${loginPath}?redirect=${redirectParam}`, request.url),
      )
    }
  }

  if (pathnameLocale) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', pathnameLocale)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', defaultLocale)
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next|admin|api|favicon|media/|.*\\..*).*)'],
}
```

### Правила по порядку

1. **Bypass**: `/admin`, `/api`, `/_next`, `/next` (preview-роути), будь-який
   шлях із крапкою (статичні файли), шляхи з `-sitemap` — пропускаються без
   обробки.
2. **uk без префікса**: `/uk/...` → 307-redirect на шлях без префікса. Канонічні
   українські URL не мають `/uk`.
3. **en passthrough**: `/en/...` проходить як є, з заголовком `x-locale: en`.
4. **Захист**: для `cleanPath` (шлях без локалі), що починається з `/profile`,
   `/certificates` або матчить `^/courses/[^/]+/steps`, перевіряється наявність
   session cookie Better Auth (`getSessionCookie` — лише наявність, без
   валідації). Немає cookie → redirect на `/login?redirect=<оригінальний шлях>`
   (з локальним префіксом для en).
5. **Rewrite**: шлях без локалі переписується на `/uk${pathname}` — App Router
   завжди бачить сегмент `[locale]`, але користувач префікса не бачить.

:::warning Quiz і certificate — поза matcher-ом
`/courses/:slug/quiz` і `/courses/:slug/certificate` middleware НЕ захищає —
вони мають self-guard: quiz-сторінка сама редіректить неавтентифікованих на
логін, certificate-route повертає 401/403/404. Ще нюанс: `/certificate`
містить крапку-вільний шлях, але посилання на завантаження сертифіката
генеруються **без** locale-префікса й покладаються на rewrite middleware.
:::

## Карта маршрутів App Router

### Frontend — `src/app/(frontend)/[locale]/`

| Маршрут | Файл | Захист | Рендеринг |
| --- | --- | --- | --- |
| `/` | `page.tsx` | — | ISR 300 |
| `/[slug]` | `[slug]/page.tsx` (CMS-сторінки `pages`) | — | статика + draft mode |
| `/courses` | `courses/page.tsx` | — | ISR 300 |
| `/courses/category/[slug]` | `courses/category/[slug]/page.tsx` | — | ISR 300 |
| `/courses/[slug]` | `courses/[slug]/page.tsx` | — | ISR 300 |
| `/courses/[slug]/steps/[stepIndex]` | `.../steps/[stepIndex]/page.tsx` | middleware | per-request |
| `/courses/[slug]/quiz` | `.../quiz/page.tsx` | self-guard | per-request |
| `/courses/[slug]/certificate` | `.../certificate/route.ts` (GET, PDF) | self-guard (401/403/404) | per-request, `no-store` |
| `/posts`, `/posts/page/[n]` | `posts/page.tsx`, `posts/page/[pageNumber]/page.tsx` | — | ISR 600 |
| `/posts/[slug]` | `posts/[slug]/page.tsx` | — | ISR 600 |
| `/leaderboard` | `leaderboard/page.tsx` | — | ISR 300 |
| `/search` | `search/page.tsx` | — | per-request |
| `/profile`, `/profile/settings` | `profile/…` | middleware | per-request |
| `/certificates` | `certificates/page.tsx` | middleware + `requireSession` | per-request |
| `/users/[id]` | `users/[id]/page.tsx` (публічний профіль) | — | per-request |
| `/login`, `/register`, `/forgot-password` | відповідні `page.tsx` | — | — |
| `/verify`, `/verify/[token]` | перевірка сертифіката | — | per-request |

### Службові frontend-маршрути

| Маршрут | Файл | Призначення |
| --- | --- | --- |
| `/next/preview` | `(frontend)/next/preview/route.ts` | Вхід у draft mode (перевіряє `previewSecret === PREVIEW_SECRET`, `payload.auth()`) |
| `/next/exit-preview` | `(frontend)/next/exit-preview/route.ts` | Вихід із draft mode |
| `/pages-sitemap.xml`, `/posts-sitemap.xml` | `(frontend)/(sitemaps)/…/route.ts` | Динамічні sitemap-и (published only, uk-only, кеш по тегах) |

### API — `src/app/api/`

| Маршрут | Метод | Призначення |
| --- | --- | --- |
| `/api/auth/[...all]` | * | Better Auth (sign-in, sign-up, OAuth, session, …) |
| `/api/auth/verify-registration` | POST | OTP-гейт реєстрації (`send-otp` / `verify-otp`) |
| `/api/dev-login` | GET | Дев-логін адміном (жорстко вимкнений на Vercel), див. [Dev-login і сід](/admin/docs/technical/autentyfikatsiya/dev-login-i-sid) |
| `/api/reindex-search` | POST | Повний реіндекс пошуку (заголовок `x-reindex-secret === CRON_SECRET`) |
| `/api/courses/[id]/completions` | GET | Публічна проєкція завершень курсу (`s-maxage=60`, swr 300) |
| `/api/admin-docs/search-index` | GET | Пошуковий індекс цієї документації |

### Payload — `src/app/(payload)/`

| Маршрут | Призначення |
| --- | --- |
| `/admin/[[...segments]]` | Адмін-панель (включно з кастомним view `/admin/docs`) |
| `/api/[...slug]` | Payload REST API |
| `/api/graphql`, `/api/graphql-playground` | GraphQL |

## ISR і generateStaticParams

### Часи revalidate

| Значення | Маршрути |
| --- | --- |
| 300 с | `/`, `/courses`, `/courses/[slug]`, `/courses/category/[slug]`, `/leaderboard` |
| 600 с | `/posts`, `/posts/page/[n]`, `/posts/[slug]` |
| per-request | степи, квіз, сертифікат, профіль, пошук, verify, публічні профілі |

`getCatalogData` (`src/lib/courses/getCatalogData.ts`) свідомо session-free:
ISR-кеш спільний для всіх, а прогрес конкретного користувача дофетчується
клієнтськи (`useMyCourseStatuses` → server action `getMyCourseStatuses`).
Не додавайте `getSession` чи `useSearchParams` у компоненти публічних
сторінок — це вимикає ISR.

### generateStaticParams

Пребілд на `next build`: `pages` (всі не-home slugs × 2 локалі), `courses`
(published × 2), `/leaderboard` (× 2), плюс списки постів. Решта сторінок
генерується на першому запиті.

## Cache tags: повна таблиця

| Тег | Хто бустить | Хто споживає |
| --- | --- | --- |
| `pages-sitemap` | `revalidatePage` / `revalidateDelete` (Pages) | `pages-sitemap.xml` |
| `posts-sitemap` | `revalidatePost` / `revalidateDelete` (Posts) | `posts-sitemap.xml` |
| `redirects` | `revalidateRedirects` (afterChange redirects) | `getRedirects` (`src/utilities/getRedirects.ts`) |
| `global_header` | `revalidateHeader` | `getCachedGlobal` (`src/utilities/getGlobals.ts`) |
| `global_footer` | `revalidateFooter` | те саме |
| `global_home-calendar` | `revalidateHomeCalendar` | те саме |
| `xp-leaderboard` | `logXpEvent` після успішного запису XP (`courses/actions.ts`) | лідерборд-запити в `src/utilities/leaderboard.ts` (revalidate 300) |
| `course-enrollment-stats` | `revalidateCoursePages` (server action) | `getCachedCourseCompletions` (revalidate 60) |
| `likes-counts-<collection>` | `revalidateCounts` у `src/actions/commentsAndLikes.ts` | `src/utilities/contentCounts.ts` (revalidate 120) |
| `comments-counts-<collection>` | те саме | те саме |
| `pages_<slug>`, `posts_<slug>` | — (лише часовий фолбек) | `getDocument` (`src/utilities/getDocument.ts`, тег `${collection}_${slug}`) |

Нюанс: `revalidateCounts` пропускає `targetCollection === 'comments'` — лайки
коментарів рахуються без кешу в `getComments`.

### revalidatePath у хуках курсів

`revalidateCourse` (`src/hooks/revalidateCourse.ts`) бустить для обох префіксів
`''` та `/en`: `/courses/<slug>`, `/courses`,
`/courses/category/[slug]` (як page-паттерн) і головну. При rename/unpublish
бустить і старий slug. Усе загорнуто у `try/catch`: відкладена публікація
(`schedulePublish`) виконується поза request-контекстом, де `revalidatePath`
кидає — пропущений буст компенсується часовим вікном ISR, тож збереження не
падає. Server action `revalidateCoursePages` додатково бустить
`steps/[stepIndex]`, `quiz` і тег `course-enrollment-stats`.
