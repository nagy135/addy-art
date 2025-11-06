import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

console.log('Middleware loaded - Secret:', secret ? 'SET' : 'NOT SET');

export async function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute) {
    // Log all cookies to see what's available
    const cookies = request.cookies.getSetCookie();
    const allCookies = Array.from(request.cookies);
    console.log('Available cookies:', allCookies.map(([k, v]) => `${k}=${v.substring(0, 50)}...`));
    
    const token = await getToken({
      req: request,
      secret,
    });
    console.log('Token from getToken:', token ? 'FOUND' : 'NOT FOUND', 'Secret:', secret ? 'SET' : 'NOT SET');
    if (!token) {
      console.log('Cookie entries:', allCookies);
    }

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


