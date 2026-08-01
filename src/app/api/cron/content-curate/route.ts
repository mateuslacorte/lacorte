import { NextResponse, after } from 'next/server';
import { loadUnusedRecentArticles } from '@/lib/content-curation/articles';
import {
  createCurationJob,
  findActiveCurationJob,
  kickCurationWorker,
  shouldResumeCurationJob,
} from '@/lib/content-curation/jobs';
import { canRunCuration } from '@/lib/content-curation/quota';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export const maxDuration = 60;

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
    const origin = new URL(request.url).origin;

    const active = await findActiveCurationJob(supabase);
    if (active) {
      const willResume = shouldResumeCurationJob(active);
      if (willResume) {
        after(async () => {
          try {
            await kickCurationWorker(origin, active.id);
          } catch (err) {
            console.error('[cron/content-curate] resume kick failed', err);
          }
        });
      }
      return NextResponse.json({
        ok: true,
        queued: true,
        resumed: willResume,
        skipped: !willResume,
        jobId: active.id,
        status: active.status,
        progress: active.progress,
      });
    }

    const quota = await canRunCuration(supabase);
    if (!quota.allowed) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: quota.reason ?? 'Quota blocked',
        stats: quota.stats,
      });
    }

    const articles = await loadUnusedRecentArticles(supabase);
    if (articles.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'No new RSS articles to curate.',
        stats: quota.stats,
      });
    }

    const job = await createCurationJob(supabase, 'cron', articles);
    after(async () => {
      try {
        await kickCurationWorker(origin, job.id);
      } catch (err) {
        console.error('[cron/content-curate] start kick failed', err);
      }
    });

    return NextResponse.json({
      ok: true,
      queued: true,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      stats: quota.stats,
    });
  } catch (err) {
    console.error('[cron/content-curate]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
