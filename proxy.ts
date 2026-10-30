import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('viq-session')?.value;

  const isAuthRoute = path.startsWith('/login');
  const isProtectedRoute =
    path.startsWith('/admin') ||
    path.startsWith('/center') ||
    path.startsWith('/student') ||
    path.startsWith('/teacher') ||
    path.startsWith('/dashboard');

  // 1. Unauthenticated user trying to access protected areas
  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Token verification & role checking
  if (token) {
    try {
      const secret = new TextEncoder().encode(getJwtSecret());
      const { payload } = await jwtVerify(token, secret);
      const role = typeof payload.role === 'string' ? payload.role.toUpperCase() : '';

      // If already logged in and visiting login page, send to designated dashboard
      if (isAuthRoute) {
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
        if (role === 'CENTER_ADMIN') {
          return NextResponse.redirect(new URL('/center', req.url));
        }
        if (role === 'TEACHER') {
          return NextResponse.redirect(new URL('/dashboard/teacher/tasks', req.url));
        }
        if (role === 'STUDENT') {
          return NextResponse.redirect(new URL('/student', req.url));
        }
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Role authorization enforcement on protected routes
      if (
        (path.startsWith('/admin') || path.startsWith('/dashboard/admin')) &&
        role !== 'SUPER_ADMIN' &&
        role !== 'ADMIN'
      ) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      if (
        (path.startsWith('/center') || path.startsWith('/dashboard/center')) &&
        role !== 'CENTER_ADMIN'
      ) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      if (
        (path.startsWith('/teacher') || path.startsWith('/dashboard/teacher')) &&
        role !== 'TEACHER'
      ) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      if (
        (path.startsWith('/student') || path.startsWith('/dashboard/student')) &&
        role !== 'STUDENT'
      ) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch {
      // Invalid/expired token cleanup
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('viq-session');
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/center/:path*',
    '/student/:path*',
    '/teacher/:path*',
    '/dashboard/:path*',
    '/login',
  ],
};