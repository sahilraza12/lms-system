import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/jwt-secret';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('token')?.value;

  const isAuthRoute = path.startsWith('/login');
  const isDashboardRoute =
    path.startsWith('/admin') ||
    path.startsWith('/center') ||
    path.startsWith('/student');

  if (!token && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      const role = payload.role;

      // Agar already logged in hai aur login page khol raha hai -> redirect to role dashboard
      if (isAuthRoute) {
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin', req.url));
        } else if (role === 'CENTER') {
          return NextResponse.redirect(new URL('/center', req.url));
        } else if (role === 'STUDENT') {
          return NextResponse.redirect(new URL('/student', req.url));
        }
      }

      // Role isolation check
      if (path.startsWith('/admin') && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      if (path.startsWith('/center') && role !== 'CENTER') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      if (path.startsWith('/student') && role !== 'STUDENT') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch {
      // Invalid/Expired token -> clear cookie & force login
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/center/:path*', '/student/:path*', '/login'],
};