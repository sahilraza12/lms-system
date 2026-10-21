import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth status check failed:', error);
    return NextResponse.json({ error: 'Failed to get auth status' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body ?? {};

    if (action === 'refresh') {
      const user = await getCurrentUser();

      if (!user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          email: user.email,
          role: user.role,
        },
      });
    }

    return NextResponse.json({ message: 'Auth route is available' });
  } catch (error) {
    console.error('Auth route error:', error);
    return NextResponse.json({ error: 'Auth route failed' }, { status: 500 });
  }
}
