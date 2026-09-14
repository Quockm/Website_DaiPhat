import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/auth';

// Add the routes that do NOT require authentication here
const publicRoutes = ['/login', '/api/login', '/_next', '/favicon.ico'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isPublicRoute = publicRoutes.some(r => path.startsWith(r));
  
  if (path === '/login') {
    // Nếu đã đăng nhập mà vào /login thì chuyển về / (chỉ áp dụng GET)
    const session = await updateSession(request);
    if (session && request.method === 'GET') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Update session
  const res = await updateSession(request);
  
  if (!res) {
    // No session found, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- Kiểm tra bảo mật phân hệ Kế toán ---
  if (path.startsWith('/accounting/') && !path.startsWith('/accounting/auth')) {
    const accountingSession = request.cookies.get('accounting_session')?.value;
    if (accountingSession !== 'authenticated') {
      const redirectRes = NextResponse.redirect(new URL('/accounting/auth', request.url));
      // Sao chép lại các cookie đã được updateSession set (nếu có) sang redirectRes
      res.cookies.getAll().forEach(cookie => {
        redirectRes.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectRes;
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
