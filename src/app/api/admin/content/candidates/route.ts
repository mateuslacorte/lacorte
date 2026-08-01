import { NextResponse } from 'next/server';
import { loadContentCandidates } from '@/lib/content-curation/curate';
import { AdminAuthError, createSupabaseServerClient, requireAdminUser } from '@/lib/supabase/server';

export async function GET() {
  try {
    await requireAdminUser();
    const supabase = await createSupabaseServerClient();
    const candidates = await loadContentCandidates(supabase);
    return NextResponse.json({ candidates });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
