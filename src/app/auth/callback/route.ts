import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/site';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Only allow same-origin relative paths (block open redirects). */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return '/admin';
  }
  return next;
}

/** Always land on the canonical production host (or local origin in dev). */
function redirectOrigin(request: Request): string {
  const requestOrigin = new URL(request.url).origin;
  if (process.env.NODE_ENV === 'development') {
    return requestOrigin;
  }
  const configured = SITE_URL.replace(/\/$/, '');
  // Prefer configured www; fall back to forwarded host only if it already is www
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim().toLowerCase();
  if (forwarded === 'www.lacorte.dev') {
    return 'https://www.lacorte.dev';
  }
  return configured || requestOrigin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'signup' | 'magiclink' | 'recovery' | null;
  const next = safeNextPath(searchParams.get('next'));
  const origin = redirectOrigin(request);

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth&next=${encodeURIComponent(next)}`);
}
