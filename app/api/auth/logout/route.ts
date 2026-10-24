import { NextResponse } from 'next/server';

function clearSession(response: NextResponse) {
  response.cookies.delete('viq-session');
  response.cookies.delete('token');
  return response;
}

export async function POST() {
  return clearSession(NextResponse.json({ success: true }));
}

export async function GET(request: Request) {
  return clearSession(
    NextResponse.redirect(new URL('/login', request.url)),
  );
}