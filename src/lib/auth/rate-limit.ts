import { createHmac } from 'node:crypto';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_BUCKETS = 10_000;
const buckets = new Map<string, { count: number; expires: number }>();

/** Per-process defense in depth; Supabase also rate-limits its token endpoint. */
export function consumeLoginAttempt(email: string, ip: string): number {
  const now = Date.now();
  for (const [key, value] of buckets) {
    if (value.expires <= now) buckets.delete(key);
  }
  const secret = process.env.RECAPTCHA_SECRET_KEY!;
  const hash = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  const limits = [[`email:${hash(email)}`, 5], [`ip:${hash(ip)}`, 20]] as const;
  let retryAfter = 0;
  for (const [key, limit] of limits) {
    const bucket = buckets.get(key);
    if (bucket && bucket.count >= limit) retryAfter = Math.max(retryAfter, Math.ceil((bucket.expires - now) / 1000));
  }
  if (retryAfter) return retryAfter;
  // Fail closed if an attacker exhausts the bounded store.
  if (buckets.size + 2 > MAX_BUCKETS) return 900;
  for (const [key] of limits) {
    const bucket = buckets.get(key) ?? { count: 0, expires: now + WINDOW_MS };
    bucket.count++;
    buckets.set(key, bucket);
  }
  return 0;
}
