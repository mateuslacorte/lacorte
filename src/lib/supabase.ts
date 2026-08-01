'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/** Shared browser Supabase client (cookie session from magic-link login). */
export function getSupabase(): SupabaseClient {
  return createSupabaseBrowserClient();
}

/**
 * Ensure the visitor has a Supabase session, creating an anonymous one if
 * needed. Prefer an existing authenticated (magic-link) session so we never
 * overwrite admin login with anonymous.
 */
export async function ensureSession(): Promise<string | null> {
  const supabase = getSupabase();

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (!userErr && userData.user) return userData.user.id;
  } catch {
    // Fall through to anonymous.
  }

  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('[supabase] anonymous sign-in failed:', error.message);
    return null;
  }
  return anon.user?.id ?? null;
}
