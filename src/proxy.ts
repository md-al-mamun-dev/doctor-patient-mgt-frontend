import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy Convention (replaces deprecated middleware.ts).
 * Docs: https://nextjs.org/docs/messages/middleware-to-proxy
 *       https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export function proxy(req: NextRequest) {
  const sessionVal = req.cookies.get('dt_session')?.value;
  const accessVal = req.cookies.get('dt_access')?.value || req.cookies.get('__Host-dt_access')?.value;
  const refreshVal = req.cookies.get('dt_refresh')?.value || req.cookies.get('__Secure-dt_refresh')?.value;

  const signedIn = Boolean(sessionVal || accessVal || refreshVal);
  const { pathname, search } = req.nextUrl;

  // Unauthenticated user trying to access protected routes
  if (!signedIn && pathname !== '/login') {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  // Already authenticated user visiting login page
  if (signedIn && pathname === '/login') {
    const nextParam = req.nextUrl.searchParams.get('next');
    const destination =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
        ? nextParam
        : '/dashboard';
    return NextResponse.redirect(new URL(destination, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
