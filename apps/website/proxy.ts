import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function isCheckoutPath(pathname: string) {
  return /^\/shop\/[^/]+\/checkout$/.test(pathname);
}

function needsAuth(pathname: string) {
  if (pathname.startsWith('/admin')) return true;
  if (pathname.startsWith('/games')) return true;
  if (/^\/game\//.test(pathname)) return true;
  if (pathname.startsWith('/checkout')) return true;
  if (isCheckoutPath(pathname)) return true;
  return false;
}

// /games and /game/* are player pages since Phase 4 — login required (see
// needsAuth) but ownership is enforced by the pages + RLS, not by role here.
function needsAdminRole(pathname: string) {
  return pathname.startsWith('/admin');
}

const publicAuthPaths = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

export async function proxy(request: NextRequest) {
  const { supabaseResponse, supabase, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/webhooks/stripe')) {
    return supabaseResponse;
  }

  if (publicAuthPaths.has(pathname) || pathname.startsWith('/auth/')) {
    if (
      user &&
      (pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/forgot-password')
    ) {
      const next = request.nextUrl.searchParams.get('next');
      const dest =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : '/shop';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return supabaseResponse;
  }

  if (!needsAuth(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set(
      'next',
      pathname + (request.nextUrl.search || '')
    );
    return NextResponse.redirect(url);
  }

  if (needsAdminRole(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
