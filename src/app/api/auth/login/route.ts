import { NextResponse } from 'next/server';
import { consumeLoginAttempt } from '@/lib/auth/rate-limit';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function failure(error: string, status: number, retryAfter?: number) {
  return NextResponse.json({ error }, {
    status,
    headers: { 'Cache-Control': 'no-store', ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const expectedOrigin = new URL(process.env.NODE_ENV === 'development' ? request.url : process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  if (origin !== expectedOrigin) return failure('Invalid request origin.', 403);
  if (!process.env.RECAPTCHA_SECRET_KEY || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    return failure('Sign-in is unavailable until reCAPTCHA is configured.', 503);
  }
  try {
    const raw = await request.text();
    if (raw.length > 16_384) return failure('Invalid sign-in request.', 400);
    const body = JSON.parse(raw);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const token = typeof body.captchaToken === 'string' ? body.captchaToken : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password || password.length > 1024 || !token || token.length > 8192) {
      return failure('Enter your email, password, and complete reCAPTCHA.', 400);
    }
    // Only trust the IP header overwritten by our deployment platform.
    const ip = process.env.VERCEL === '1'
      ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'unknown'
      : 'local-or-untrusted-proxy';
    const retryAfter = consumeLoginAttempt(email, ip);
    if (retryAfter) return failure('Too many sign-in attempts. Please try again later.', 429, retryAfter);
    const verification = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!verification.ok) return failure('Unable to verify reCAPTCHA. Please try again.', 503);
    const captcha = await verification.json();
    if (!captcha.success || captcha.hostname !== new URL(expectedOrigin).hostname || captcha.action !== 'login' || typeof captcha.score !== 'number' || captcha.score < 0.5) {
      return failure('reCAPTCHA verification failed. Please complete it again.', 400);
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) return failure('Too many sign-in attempts. Please try again later.', 429, 60);
      return failure('Invalid email or password.', 401);
    }
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return failure('Unable to sign in. Please try again.', 400);
  }
}
