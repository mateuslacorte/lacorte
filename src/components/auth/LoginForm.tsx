'use client';

import { useState } from 'react';
import { SITE_URL } from '@/lib/site';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return '/admin';
  }
  return next;
}

/** Canonical origin for magic-link redirects (avoid apex / preview hosts). */
function authOrigin(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin;
    }
  }
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, '');
  return configured || 'https://www.lacorte.dev';
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      const supabase = createSupabaseBrowserClient();

      const next = safeNextPath(new URLSearchParams(window.location.search).get('next'));
      const emailRedirectTo = `${authOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
      if (error) throw error;

      setStatus('sent');
      setMessage('Check your email for the magic link.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to send magic link.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 outline-none focus:border-primary-500"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-xl bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {message && (
        <p
          className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
