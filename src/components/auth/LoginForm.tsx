'use client';

import { useState, type FormEvent } from 'react';
import { Recaptcha, getRecaptchaToken } from '@/lib/auth/recaptcha';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const captchaToken = await getRecaptchaToken();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      const requested = new URLSearchParams(window.location.search).get('next');
      const next = requested && requested.startsWith('/') && !requested.startsWith('//') && !/[\\\x00-\x20]/.test(requested) ? requested : '/admin';
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={signIn} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email address</span>
        <input type="email" name="email" autoComplete="username" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 outline-none focus:border-primary-500" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Password</span>
        <input type="password" name="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 outline-none focus:border-primary-500" />
      </label>
      <Recaptcha onReady={setCaptchaReady} />
      <button type="submit" disabled={busy || !captchaReady} className="w-full rounded-xl bg-primary-600 px-4 py-3 font-medium text-primary-950 disabled:opacity-60">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {error && <p className="text-sm text-red-500 auth-error" role="alert">{error}</p>}
      <p className="text-sm auth-footnote">Use the same email and password for Lacorte Blog and Membership.</p>
    </form>
  );
}
