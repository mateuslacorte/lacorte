import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { getPostBySlug } from '@/lib/blog';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function mapComment(row: {
  id: string;
  post_slug: string;
  author_name: string;
  body: string;
  created_at: string;
}) {
  return {
    id: row.id,
    postSlug: row.post_slug,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!getPostBySlug(slug)) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('blog_comments')
      .select('id, post_slug, author_name, body, created_at')
      .eq('post_slug', slug)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[blog/comments] list failed:', error.message);
      return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
    }

    return NextResponse.json({ comments: (data ?? []).map(mapComment) });
  } catch (err) {
    console.error('[blog/comments] list', err);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!getPostBySlug(slug)) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  let payload: { authorName?: string; body?: string };
  try {
    payload = (await request.json()) as { authorName?: string; body?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const authorName = (payload.authorName ?? '').trim();
  const body = (payload.body ?? '').trim();
  if (authorName.length < 1 || authorName.length > 80) {
    return NextResponse.json({ error: 'Name must be 1–80 characters.' }, { status: 400 });
  }
  if (body.length < 1 || body.length > 4000) {
    return NextResponse.json({ error: 'Comment must be 1–4000 characters.' }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    let userId = userData.user?.id ?? null;

    // Prefer the visitor session; fall back to service-role insert with null user if needed.
    if (!userId) {
      const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously();
      if (anonErr) {
        console.warn('[blog/comments] anon sign-in failed:', anonErr.message);
      }
      userId = anon?.user?.id ?? null;
    }

    const writer = userId ? supabase : createSupabaseServiceClient();
    const { data, error } = await writer
      .from('blog_comments')
      .insert({
        post_slug: slug,
        user_id: userId,
        author_name: authorName,
        body,
      })
      .select('id, post_slug, author_name, body, created_at')
      .single();

    if (error) {
      console.error('[blog/comments] insert failed:', error.message);
      return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }

    return NextResponse.json({ comment: mapComment(data) }, { status: 201 });
  } catch (err) {
    console.error('[blog/comments] post', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
