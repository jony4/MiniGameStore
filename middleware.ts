import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 管理员页面访问控制
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 在生产环境中，这里应该实现更严格的认证检查
    // 目前简化为检查特定的header或cookie
    const adminAuth = request.headers.get('x-admin-auth') || request.cookies.get('admin-auth')?.value;
    
    // 如果没有认证信息，重定向到登录页面或返回401
    if (!adminAuth && process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 为游戏页面添加安全headers
  if (request.nextUrl.pathname.startsWith('/game/')) {
    // Content Security Policy for game pages
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' blob:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }

  // 为API路由添加基础安全headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/game/:path*',
    '/api/:path*',
  ],
};