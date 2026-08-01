import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/** Touch job_sites updated_at so the directory stays fresh (link-only sites). */
export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('job_sites')
      .update({ updated_at: new Date().toISOString() })
      .neq('id', '')
      .select('id');

    if (error) throw error;
    return NextResponse.json({ ok: true, refreshed: data?.length ?? 0 });
  } catch (err) {
    console.error('[cron/jobs]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
