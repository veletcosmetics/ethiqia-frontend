import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const previewPass = process.env.NEXT_PUBLIC_PREVIEW_PASSWORD;
  if (!previewPass) return NextResponse.next(); // sin protección si no hay clave

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/_next') || pathname.startsWith('/robots.txt')) {
    return NextResponse.next();
  }

  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) {
    return new NextResponse('Auth required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Ethiqia Preview"' } });
  }
  const base64 = header.split(' ')[1] || '';
  const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');

  if (pass !== previewPass) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Ethiqia Preview"' } });
  }
  return NextResponse.next();
}

export const config = { matcher: ['/:path*'] };
