import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });

    // If on login page and already authenticated, redirect to admin dashboard
    if (isLoginPage && token && token.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // If not on login page, check authentication
    if (!isLoginPage) {
      if (!token) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

