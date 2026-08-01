import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isLocaleExcludedPath, isStaticAssetPath, stripLocalePrefix } from '@/i18n/urlUtils';

const CANONICAL_HOST = 'www.lacorte.dev';
const APEX_HOST = 'lacorte.dev';

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();
}

function hostnameOf(hostHeader: string): string {
  return hostHeader.toLowerCase().split(':')[0];
}

/** Permanent redirect to the canonical www host, preserving path + query. */
function redirectToWww(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  return NextResponse.redirect(url, 308);
}

function isLocalDevHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1';
}

/** Preview / alternate deployment hosts should not be indexed. */
function isPreviewHost(host: string): boolean {
  if (isLocalDevHost(host)) return false;
  if (host === CANONICAL_HOST || host === APEX_HOST) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = hostnameOf(request.headers.get('host') ?? '');

  // Apex (and any accidental non-www production hit) → www
  if (host === APEX_HOST) {
    return redirectToWww(request);
  }

  // Never locale-rewrite files from /public
  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (isLocaleExcludedPath(pathname)) {
    const response = NextResponse.next({ request: { headers: request.headers } });
    if (isPreviewHost(host)) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    await refreshSupabaseSession(request, response);
    return response;
  }

  // Redirect explicit /en/... → unprefixed public URL
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const url = request.nextUrl.clone();
    url.pathname = stripLocalePrefix(pathname);
    if (host === CANONICAL_HOST || isLocalDevHost(host)) {
      const response = NextResponse.redirect(url, 308);
      response.headers.set('X-Robots-Tag', 'noindex');
      await refreshSupabaseSession(request, response);
      return response;
    }
    // On preview hosts, still strip /en then noindex
    const response = NextResponse.redirect(url, 308);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    await refreshSupabaseSession(request, response);
    return response;
  }

  // Portuguese is already under /pt → app/[locale]
  if (pathname === '/pt' || pathname.startsWith('/pt/')) {
    const response = NextResponse.next({ request: { headers: request.headers } });
    response.headers.set('x-locale', 'pt');
    if (isPreviewHost(host)) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    await refreshSupabaseSession(request, response);
    return response;
  }

  // Unprefixed public path → rewrite to /en/...
  const rewritePath = pathname === '/' ? '/en' : `/en${pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = rewritePath;
  const response = NextResponse.rewrite(url);
  response.headers.set('x-locale', 'en');
  if (isPreviewHost(host)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  await refreshSupabaseSession(request, response);
  return response;
}

export const config = {
  matcher: [
    // Skip Next internals and common static file extensions under /public
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)',
  ],
};
