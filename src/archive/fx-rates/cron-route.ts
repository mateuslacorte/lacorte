/** Archived — not routed. Former cron at /api/cron/fx-rates. Kept for reference. */
import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { fetchUsdBaseRates } from '@/lib/exchange-rates';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rates = await fetchUsdBaseRates();
    const supabase = createSupabaseServiceClient();
    const fetchedAt = new Date().toISOString();

    const rows = [
      { base: 'USD', quote: 'EUR', rate: rates.usdEur, fetched_at: fetchedAt },
      { base: 'USD', quote: 'JPY', rate: rates.usdJpy, fetched_at: fetchedAt },
      { base: 'USD', quote: 'GBP', rate: rates.usdGbp, fetched_at: fetchedAt },
    ];

    const { error } = await supabase.from('fx_rates').insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true, inserted: rows.length, fetchedAt });
  } catch (err) {
    console.error('[cron/fx-rates]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
