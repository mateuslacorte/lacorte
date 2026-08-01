import type { SupabaseClient } from '@supabase/supabase-js';
import {
  HOUR_BUDGET,
  MAX_RPD,
  MAX_RPM,
  type CurationQuotaResult,
  type CurationQuotaStats,
} from '@/lib/content-curation/types';

type CallRow = { called_at: string; success: boolean };

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcHour(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()),
  );
}

export function evaluateCurationQuota(
  calls: CallRow[],
  now: Date = new Date(),
  _options: { ignoreSpacing?: boolean } = {},
): CurationQuotaResult {
  const dayStart = startOfUtcDay(now);
  const hourStart = startOfUtcHour(now);
  const minuteAgo = new Date(now.getTime() - 60_000);

  const dailyCalls = calls.filter((c) => new Date(c.called_at) >= dayStart);
  const hourlyCalls = dailyCalls.filter((c) => new Date(c.called_at) >= hourStart);
  const minuteCalls = calls.filter((c) => {
    const at = new Date(c.called_at).getTime();
    return at >= minuteAgo.getTime() && at <= now.getTime();
  });

  // Spacing between single-call jobs is obsolete: one post is many OpenRouter calls.
  // Hard caps (daily / hourly / rpm) still apply; lease prevents concurrent spam.
  const stats: CurationQuotaStats = {
    dailyUsed: dailyCalls.length,
    dailyLimit: MAX_RPD,
    hourlyUsed: hourlyCalls.length,
    hourlyLimit: HOUR_BUDGET,
    minuteUsed: minuteCalls.length,
    minuteLimit: MAX_RPM,
    nextEligibleAt: null,
  };

  if (dailyCalls.length >= MAX_RPD) {
    return { allowed: false, reason: 'Daily limit reached (1000 requests).', stats };
  }
  if (minuteCalls.length >= MAX_RPM) {
    return { allowed: false, reason: 'Rate limit: max 20 requests per minute.', stats };
  }
  if (hourlyCalls.length >= HOUR_BUDGET) {
    return { allowed: false, reason: 'Hourly budget reached. Try again next hour.', stats };
  }

  return { allowed: true, reason: null, stats };
}

export async function canRunCuration(
  supabase: SupabaseClient,
  options: { ignoreSpacing?: boolean } = {},
): Promise<CurationQuotaResult> {
  const since = startOfUtcDay(new Date()).toISOString();
  const { data, error } = await supabase
    .from('ai_curation_calls')
    .select('called_at, success')
    .gte('called_at', since)
    .order('called_at', { ascending: false });

  if (error) {
    console.error('[curation/quota] load failed:', error.message);
    return {
      allowed: false,
      reason: 'Could not read quota ledger.',
      stats: {
        dailyUsed: 0,
        dailyLimit: MAX_RPD,
        hourlyUsed: 0,
        hourlyLimit: HOUR_BUDGET,
        minuteUsed: 0,
        minuteLimit: MAX_RPM,
        nextEligibleAt: null,
      },
    };
  }

  return evaluateCurationQuota(data ?? [], new Date(), options);
}

export async function logCurationCall(
  supabase: SupabaseClient,
  input: { trigger: 'cron' | 'manual'; success: boolean; error?: string },
): Promise<void> {
  const { error } = await supabase.from('ai_curation_calls').insert({
    trigger: input.trigger,
    success: input.success,
    error: input.error ?? null,
  });
  if (error) {
    console.error('[curation/quota] log failed:', error.message);
  }
}
