import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('viq-session')?.value;

  const isAuthRoute = path.startsWith('/login');
  const isProtectedRoute =
    path.startsWith('/admin') ||
    path.startsWith('/center') ||
    path.startsWith('/student') ||
    path.startsWith('/teacher') ||
    path.startsWith('/dashboard');

  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(getJwtSecret()),
      );
      const role = typeof payload.role === 'string' ? payload.role.toUpperCase() : '';

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
      }

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