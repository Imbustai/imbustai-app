import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >['data']['user'] = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
    }
  } catch {
    // Edge fetch can fail when NEXT_PUBLIC_SUPABASE_URL is wrong/unreachable
    // (DNS NXDOMAIN, offline, etc.). Treat as signed out instead of throwing.
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login';
  const isCallbackRoute = pathname.startsWith('/auth/callback');
  const isApiRoute = pathname.startsWith('/api');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isCallbackRoute || isApiRoute) {
    return supabaseResponse;
  }

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute) {
    const isAdmin = user.app_metadata?.role === 'admin';
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/game';
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/game';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
