import { NextResponse } from 'next/server';
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { consumeLoginAttempt } from '@/lib/auth/rate-limit';


export function resetOrigin(request: Request) {
  return new URL(process.env.NODE_ENV === 'development' ? request.url : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lacorte.dev').origin;
}
export function resetNext(value: string | null, origin: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return '/admin';
  try { const url = new URL(value, origin); return url.origin === origin ? url.pathname + url.search + url.hash : '/admin'; }
  catch { return '/admin'; }
}
function json(body: object, status = 200, retryAfter?: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) } });
}

export async function requestPasswordReset(request: Request) {
  const origin = resetOrigin(request);
  if (request.headers.get('origin') !== origin) return json({ error: 'Invalid request origin.' }, 403);
  if (!process.env.RECAPTCHA_SECRET_KEY || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return json({ error: 'Password recovery is unavailable.' }, 503);
  try {
    const raw = await request.text();
    if (raw.length > 16_384) return json({ error: 'Invalid request.' }, 400);
    const body = JSON.parse(raw);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const token = typeof body.captchaToken === 'string' ? body.captchaToken : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !token || token.length > 8192) return json({ error: 'Enter a valid email and complete reCAPTCHA.' }, 400);
    const ip = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'unknown' : 'local-or-untrusted-proxy';
    const retry = consumeLoginAttempt('reset:' + email, ip);
    if (retry) return json({ error: 'Too many requests. Please try again later.' }, 429, retry);
    const verification = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: token }),
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!verification.ok) return json({ error: 'Unable to verify reCAPTCHA.' }, 503);
    const captcha = await verification.json();
    if (!captcha.success || captcha.hostname !== new URL(origin).hostname || captcha.action !== 'password_reset' || typeof captcha.score !== 'number' || captcha.score < 0.5) return json({ error: 'reCAPTCHA verification failed.' }, 400);
    const callback = new URL('/auth/recovery', origin);
    callback.searchParams.set('locale', body.locale === 'pt' ? 'pt' : 'en');
    callback.searchParams.set('next', resetNext(typeof body.next === 'string' ? body.next : null, origin));
    const client = await createClient();
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
    // Never reveal whether an address exists or was throttled by the provider.
    if (error && (error.status || 0) >= 500) return json({ error: 'Email recovery is temporarily unavailable.' }, 503);
    return json({ success: true });
  } catch { return json({ error: 'Unable to request a reset. Please try again.' }, 400); }
}

export async function recoverPassword(request: Request) {
  const url = new URL(request.url);
  const origin = resetOrigin(request);
  const prefix = '';
  const next = resetNext(url.searchParams.get('next'), origin);
  const code = url.searchParams.get('code');
  let valid = false;
  if (code && code.length <= 4096) {
    try { const client = await createClient(); const { error } = await client.auth.exchangeCodeForSession(code); valid = !error; }
    catch { /* Expired links and missing PKCE verifier return to the request form. */ }
  }
  const destination = new URL(prefix + (valid ? '/reset-password' : '/forgot-password'), origin);
  destination.searchParams.set('next', next);
  if (!valid) destination.searchParams.set('error', 'recovery');
  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function updatePassword(request: Request) {
  if (request.headers.get('origin') !== resetOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 8192) return json({ error: 'Invalid password request.' }, 400);
    const body = JSON.parse(raw);
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 1024 || body.password !== body.confirmation) return json({ error: 'Use matching passwords with at least 12 characters.' }, 400);
    const client = await createClient();
    const { data, error: userError } = await client.auth.getUser();
    if (userError || !data.user || data.user.is_anonymous || !data.user.email) return json({ error: 'Your recovery session expired. Request a new link.' }, 401);
    const { error } = await client.auth.updateUser({ password: body.password });
    if (error) return json({ error: 'The password could not be updated. Try a different password or request a new link.' }, error.status === 429 ? 429 : 400);
    await client.auth.signOut({ scope: 'global' });
    return json({ success: true });
  } catch { return json({ error: 'Unable to update the password. Please try again.' }, 400); }
}
