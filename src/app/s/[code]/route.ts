import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site';
import { isValidShortCode } from '@/lib/shortLinks';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { code: raw } = await context.params;
  const code = decodeURIComponent(raw ?? '').trim();

  if (!isValidShortCode(code)) {
    return NextResponse.redirect(new URL('/', SITE_URL), 302);
  }

  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch {
    return new NextResponse('Shortener is not configured.', { status: 503 });
  }

  const { data, error } = await supabase
    .from('short_links')
    .select('code, target_url, click_count')
    .ilike('code', code)
    .maybeSingle();

  if (error || !data?.target_url) {
    return new NextResponse('Short link not found.', { status: 404 });
  }

  void supabase
    .from('short_links')
    .update({
      click_count: (data.click_count ?? 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('code', data.code);

  return NextResponse.redirect(data.target_url, 302);
}
