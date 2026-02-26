import { NextRequest, NextResponse } from 'next/server'

const defaultLocale = 'uk'
const locales = ['uk', 'en']

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

  if (pathnameLocale) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', pathnameLocale)
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', defaultLocale)
  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next|admin|api|favicon|media|.*\\..*).*)'],
}
