import { describe, expect, it } from 'vitest';
import { evaluateCurationQuota } from '@/lib/content-curation/quota';
import { MAX_RPD, MAX_RPM, HOUR_BUDGET } from '@/lib/content-curation/types';

const base = new Date('2026-07-27T12:00:00.000Z');

function callAt(offsetMs: number, success = true) {
  return { called_at: new Date(base.getTime() + offsetMs).toISOString(), success };
}

describe('evaluateCurationQuota', () => {
  it('allows when under all limits', () => {
    const result = evaluateCurationQuota([], base);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('blocks when daily limit reached', () => {
    const calls = Array.from({ length: MAX_RPD }, (_, i) => callAt(i * 1000));
    const result = evaluateCurationQuota(calls, base);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Daily limit');
  });

  it('blocks when rpm exceeded', () => {
    const calls = Array.from({ length: MAX_RPM }, (_, i) => callAt(-(i + 1) * 1000));
    const result = evaluateCurationQuota(calls, base);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit');
  });

  it('blocks when hourly budget exceeded', () => {
    const noonThirty = new Date('2026-07-27T12:30:00.000Z');
    // 42 calls in the current hour, spaced so fewer than MAX_RPM fall in the last minute.
    const calls = Array.from({ length: HOUR_BUDGET }, (_, i) => ({
      called_at: new Date(noonThirty.getTime() - (i + 2) * 30_000).toISOString(),
      success: true,
    }));
    const result = evaluateCurationQuota(calls, noonThirty);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Hourly budget');
  });

  it('does not block on recent success (spacing removed for multi-call jobs)', () => {
    const calls = [callAt(-1000)];
    const result = evaluateCurationQuota(calls, base);
    expect(result.allowed).toBe(true);
    expect(result.stats.nextEligibleAt).toBeNull();
    expect(result.stats.dailyUsed).toBe(1);
  });

  it('allows mid-job follow-ups when ignoreSpacing is set', () => {
    const calls = [callAt(-1000)];
    const result = evaluateCurationQuota(calls, base, { ignoreSpacing: true });
    expect(result.allowed).toBe(true);
    expect(result.stats.dailyUsed).toBe(1);
    expect(result.stats.nextEligibleAt).toBeNull();
  });
});
