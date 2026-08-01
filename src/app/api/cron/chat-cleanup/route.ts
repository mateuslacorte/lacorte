import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const now = Date.now();
    const { data, error } = await supabase
      .from('chat_rooms')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (error) throw error;
    return NextResponse.json({ ok: true, deleted: data?.length ?? 0 });
  } catch (err) {
    console.error('[cron/chat-cleanup]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
